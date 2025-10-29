#!/usr/bin/env node

/**
 * Reconfigure granular rules outside of initial setup
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { spawnSync } from 'child_process';
import os from 'os';

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
 * Edit rule content using user's editor
 * Opens a temporary file in the user's default editor
 */
async function editRuleContent(initialContent, ruleName) {
  const tmpDir = os.tmpdir();
  const tmpFile = join(tmpDir, `rule-edit-${Date.now()}-${ruleName.replace(/\//g, '-')}.mdc`);
  
  // Write initial content to temp file
  writeFileSync(tmpFile, initialContent);
  
  // Determine editor (use $EDITOR, or common defaults)
  const editor = process.env.EDITOR || process.env.VISUAL || (process.platform === 'win32' ? 'notepad' : 'nano');
  
  console.log(`  📝 Opening ${ruleName} in ${editor}...`);
  console.log(`  💡 Save and close the editor to continue, or Ctrl+C to cancel`);
  
  // Open editor
  const result = spawnSync(editor, [tmpFile], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  
  if (result.error) {
    throw new Error(`Failed to open editor: ${result.error.message}`);
  }
  
  if (result.signal === 'SIGINT' || result.status === 130) {
    // User cancelled (Ctrl+C)
    try {
      if (existsSync(tmpFile)) {
        unlinkSync(tmpFile);
      }
    } catch (err) {
      // Ignore cleanup errors
    }
    return null;
  }
  
  // Read edited content
  if (!existsSync(tmpFile)) {
    throw new Error('Temporary file was deleted during editing');
  }
  
  const editedContent = readFileSync(tmpFile, 'utf8');
  
  // Clean up temp file
  try {
    if (existsSync(tmpFile)) {
      unlinkSync(tmpFile);
    }
  } catch (err) {
    // Ignore cleanup errors (file may be locked on Windows)
  }
  
  return editedContent;
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
          
          let updatedBody = localBody;
          
          if (actionLower === 'm' || actionLower === 'modify') {
            // Ask what to modify
            const modifyType = await question(rl, `  Modify [M]etadata, [C]ontent, or [B]oth? [M]: `);
            const modifyTypeLower = modifyType.trim().toLowerCase() || 'm';
            
            if (modifyTypeLower === 'c' || modifyTypeLower === 'content' || modifyTypeLower === 'b' || modifyTypeLower === 'both') {
              // Edit rule content
              try {
                const editedBody = await editRuleContent(localBody, fileName);
                if (editedBody !== null) {
                  updatedBody = editedBody;
                  console.log(`  ✅ Content modified`);
                } else {
                  console.log(`  ⏭️  Content editing cancelled`);
                }
              } catch (error) {
                console.log(`  ⚠️  Failed to edit content: ${error.message}`);
                const continueEdit = await question(rl, `  Continue with metadata editing? [Y/n]: `);
                if (continueEdit.trim().toLowerCase() === 'n') {
                  continue;
                }
              }
            }
            
            if (modifyTypeLower === 'm' || modifyTypeLower === 'metadata' || modifyTypeLower === 'b' || modifyTypeLower === 'both') {
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
              
              // Allow modification of additional properties
              const moreProps = await question(rl, `  Modify more properties? (name, type, category, etc.) [y/N]: `);
              if (moreProps.trim().toLowerCase() === 'y') {
                const propName = await question(rl, `  Property name: `);
                const propValue = await question(rl, `  Property value: `);
                if (propName.trim() && propValue.trim()) {
                  localMetadata[propName.trim()] = propValue.trim();
                }
              }
              
              console.log(`  ✅ Metadata modified`);
            }
          }
          
          // Save the rule
          const finalContent = generateFrontmatter(localMetadata) + updatedBody;
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

