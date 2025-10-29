#!/usr/bin/env node

/**
 * Reconfigure granular rules outside of initial setup
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRAMEWORK_URL = process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev';

// Parse command-line arguments
const args = process.argv.slice(2);
const purpose = args.find(arg => arg.startsWith('--purpose='))?.split('=')[1];

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
 * Generate YAML frontmatter
 */
function generateFrontmatter(metadata) {
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      const arrayStr = value.map(item => `"${item}"`).join(', ');
      lines.push(`${key}: [${arrayStr}]`);
    } else {
      lines.push(`${key}: "${value}"`);
    }
  }
  
  lines.push('---');
  return lines.join('\n') + '\n';
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
 * Parse array input
 */
function parseArrayInput(input) {
  if (!input || input.trim() === '') return [];
  return input.split(/[,\s]+/).map(s => s.trim()).filter(s => s);
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Rules Reconfiguration');
  console.log('========================\n');

  const projectPath = process.cwd();
  const rulesDir = join(projectPath, '.cursor', 'rules');
  
  if (!existsSync(rulesDir)) {
    console.error('❌ Rules directory not found. Run setup first.');
    process.exit(1);
  }

  try {
    // Fetch available rules from framework API
    const response = await fetch(`${FRAMEWORK_URL}/api/rules`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiRules = await response.json();
    
    // Filter by purpose if specified
    const purposesToProcess = purpose 
      ? apiRules.filter(r => r.name === purpose)
      : apiRules;

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      for (const rulePurpose of purposesToProcess) {
        const purposeName = rulePurpose.name;
        const purposeDir = join(rulesDir, purposeName);
        
        if (!existsSync(purposeDir)) {
          console.log(`\n⚠️  Purpose directory not found: ${purposeName}`);
          continue;
        }

        console.log(`\n📁 Purpose: ${purposeName}`);
        console.log('─'.repeat(60));

        for (const fileName of rulePurpose.files || []) {
          const rulePath = join(purposeDir, fileName);
          
          if (!existsSync(rulePath)) {
            console.log(`\n  ⚠️  Rule not found: ${fileName}`);
            continue;
          }

          // Fetch server version
          const serverResponse = await fetch(`${FRAMEWORK_URL}/rules/${purposeName}/${fileName}`);
          if (!serverResponse.ok) {
            console.log(`\n  ⚠️  Failed to fetch server version: ${fileName}`);
            continue;
          }

          const serverContent = await serverResponse.text();
          const localContent = readFileSync(rulePath, 'utf8');
          
          const { metadata: localMetadata, body: localBody } = parseFrontmatter(localContent);
          const { metadata: serverMetadata } = parseFrontmatter(serverContent);
          
          console.log(`\n  📄 Rule: ${fileName}`);
          console.log(`     Description: ${localMetadata.description || serverMetadata.description || 'No description'}`);
          console.log(`     Always Apply: ${localMetadata.alwaysApply || false}`);
          console.log(`     Globs: ${localMetadata.globs ? JSON.stringify(localMetadata.globs) : 'None'}`);
          
          // Prompt for action
          const action = await question(rl, `\n  [I]nclude  [M]odify  [S]kip: `);
          const actionLower = action.trim().toLowerCase();
          
          if (actionLower === 's' || actionLower === 'skip') {
            continue;
          }
          
          if (actionLower === 'm' || actionLower === 'modify') {
            // Modify rule properties
            const newDesc = await question(rl, `  Description [${localMetadata.description || ''}]: `);
            if (newDesc.trim()) {
              localMetadata.description = newDesc.trim();
            }
            
            const currentAlwaysApply = localMetadata.alwaysApply || false;
            const newAlwaysApply = await question(rl, `  Always Apply [${currentAlwaysApply}] (true/false): `);
            if (newAlwaysApply.trim()) {
              localMetadata.alwaysApply = newAlwaysApply.trim().toLowerCase() === 'true';
            }
            
            const currentGlobs = localMetadata.globs ? JSON.stringify(localMetadata.globs) : '[]';
            const newGlobs = await question(rl, `  Globs [${currentGlobs}] (comma-separated patterns): `);
            if (newGlobs.trim() !== '') {
              const parsedGlobs = parseArrayInput(newGlobs);
              localMetadata.globs = parsedGlobs.length > 0 ? parsedGlobs : undefined;
            }
          }
          
          // Save the rule
          const finalContent = generateFrontmatter(localMetadata) + localBody;
          writeFileSync(rulePath, finalContent);
          console.log(`  ✅ Updated ${fileName}`);
        }
      }

      console.log('\n✅ Reconfiguration complete!');
    } finally {
      rl.close();
    }
  } catch (error) {
    console.error('❌ Reconfiguration failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);

