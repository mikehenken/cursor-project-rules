#!/usr/bin/env node

/**
 * Sync rules from server with conflict detection
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRAMEWORK_URL = process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev';
const AUTO_RESOLVE = process.env.AUTO_RESOLVE || 'none';

/**
 * Parse YAML frontmatter
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const yamlContent = match[1];
  const body = match[2];
  const metadata = {};
  
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();
    
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      value = arrayContent.split(',').map(item => {
        const trimmedItem = item.trim();
        if (trimmedItem.startsWith('"') && trimmedItem.endsWith('"')) {
          return trimmedItem.slice(1, -1);
        }
        return trimmedItem;
      });
    } else if ((value.startsWith('"') && value.endsWith('"')) || 
               (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    metadata[key] = value;
  }
  
  return { metadata, body };
}

/**
 * Prompt user for input
 */
function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🔄 Syncing Rules from Server');
  console.log('============================\n');
  console.log(`Framework URL: ${FRAMEWORK_URL}`);
  console.log(`Auto-resolve: ${AUTO_RESOLVE}\n`);

  const projectPath = process.cwd();
  const rulesDir = join(projectPath, '.cursor', 'rules');
  
  if (!existsSync(rulesDir)) {
    mkdirSync(rulesDir, { recursive: true });
  }

  const conflicts = [];
  const synced = [];
  const errors = [];

  try {
    // Fetch rules from server
    const response = await fetch(`${FRAMEWORK_URL}/api/rules`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiRules = await response.json();
    
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      for (const rulePurpose of apiRules) {
        const purposeName = rulePurpose.name;
        const purposeDir = join(rulesDir, purposeName);
        mkdirSync(purposeDir, { recursive: true });

        for (const fileName of rulePurpose.files || []) {
          const rulePath = join(purposeDir, fileName);
          const ruleExists = existsSync(rulePath);
          
          try {
            // Fetch server version
            const serverResponse = await fetch(`${FRAMEWORK_URL}/rules/${purposeName}/${fileName}`);
            if (!serverResponse.ok) {
              errors.push({
                purpose: purposeName,
                file: fileName,
                error: `Server returned ${serverResponse.status}`
              });
              continue;
            }

            const serverContent = await serverResponse.text();
            
            if (ruleExists) {
              // Check for conflicts
              const localContent = readFileSync(rulePath, 'utf8');
              
              if (localContent !== serverContent) {
                const { metadata: localMetadata, body: localBody } = parseFrontmatter(localContent);
                const { metadata: serverMetadata, body: serverBody } = parseFrontmatter(serverContent);
                
                // Check if it's a real conflict
                if (localBody !== serverBody || JSON.stringify(localMetadata) !== JSON.stringify(serverMetadata)) {
                  conflicts.push({
                    purpose: purposeName,
                    file: fileName,
                    local: { metadata: localMetadata, body: localBody.substring(0, 200) },
                    server: { metadata: serverMetadata, body: serverBody.substring(0, 200) }
                  });

                  // Auto-resolve if requested
                  if (AUTO_RESOLVE === 'server') {
                    writeFileSync(rulePath, serverContent);
                    synced.push({ purpose: purposeName, file: fileName, action: 'updated_from_server' });
                    console.log(`✅ Updated ${purposeName}/${fileName} from server`);
                  } else if (AUTO_RESOLVE === 'local') {
                    synced.push({ purpose: purposeName, file: fileName, action: 'kept_local' });
                    console.log(`ℹ️  Kept local version of ${purposeName}/${fileName}`);
                  } else {
                    // Prompt user
                    console.log(`\n⚠️  Conflict detected: ${purposeName}/${fileName}`);
                    console.log('   Local:  ' + localBody.substring(0, 100) + '...');
                    console.log('   Server: ' + serverBody.substring(0, 100) + '...');
                    const resolution = await question(rl, '   [S]erver  [L]ocal  [Skip]: ');
                    
                    if (resolution.toLowerCase() === 's') {
                      writeFileSync(rulePath, serverContent);
                      synced.push({ purpose: purposeName, file: fileName, action: 'updated_from_server' });
                      console.log(`✅ Updated from server`);
                    } else if (resolution.toLowerCase() === 'l') {
                      synced.push({ purpose: purposeName, file: fileName, action: 'kept_local' });
                      console.log(`ℹ️  Kept local version`);
                    } else {
                      synced.push({ purpose: purposeName, file: fileName, action: 'skipped' });
                      console.log(`⏭️  Skipped`);
                    }
                  }
                } else {
                  synced.push({ purpose: purposeName, file: fileName, action: 'unchanged' });
                }
              } else {
                synced.push({ purpose: purposeName, file: fileName, action: 'unchanged' });
              }
            } else {
              // New file, just sync it
              writeFileSync(rulePath, serverContent);
              synced.push({ purpose: purposeName, file: fileName, action: 'added' });
              console.log(`✅ Added ${purposeName}/${fileName}`);
            }
          } catch (error) {
            errors.push({
              purpose: purposeName,
              file: fileName,
              error: error.message
            });
            console.error(`❌ Error syncing ${purposeName}/${fileName}: ${error.message}`);
          }
        }
      }
    } finally {
      rl.close();
    }

    // Summary
    console.log('\n📊 Sync Summary:');
    console.log('================\n');
    console.log(`✅ Synced: ${synced.length}`);
    console.log(`⚠️  Conflicts: ${conflicts.length}`);
    console.log(`❌ Errors: ${errors.length}`);

    if (conflicts.length > 0 && AUTO_RESOLVE === 'none') {
      console.log('\n⚠️  Conflicts detected. Re-run with --resolve=server or --resolve=local to auto-resolve.');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

