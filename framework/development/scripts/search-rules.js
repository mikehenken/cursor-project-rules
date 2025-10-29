#!/usr/bin/env node

/**
 * Search for rules by keyword, purpose, or content
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FRAMEWORK_URL = process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev';

// Parse command-line arguments
const args = process.argv.slice(2);
const query = args.find(arg => !arg.startsWith('--')) || args[0];
const purpose = args.find(arg => arg.startsWith('--purpose='))?.split('=')[1];
const noContent = args.includes('--no-content');

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
 * Main function
 */
async function main() {
  if (!query) {
    console.error('❌ Search query required');
    console.log('Usage: node search-rules.js <query> [--purpose=<purpose>] [--no-content]');
    process.exit(1);
  }

  console.log('🔍 Searching Rules');
  console.log('==================\n');
  console.log(`Query: "${query}"`);
  if (purpose) console.log(`Purpose filter: ${purpose}`);
  if (noContent) console.log(`Searching metadata only (no content)`);
  console.log('');

  const results = [];
  
  try {
    // Fetch rules from API
    const response = await fetch(`${FRAMEWORK_URL}/api/rules`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiRules = await response.json();
    
    // Filter by purpose if specified
    const purposesToSearch = purpose 
      ? apiRules.filter(r => r.name === purpose)
      : apiRules;

    for (const rulePurpose of purposesToSearch) {
      const purposeName = rulePurpose.name;
      
      // Search in purpose name/description
      if (purposeName.toLowerCase().includes(query.toLowerCase()) ||
          (rulePurpose.description && rulePurpose.description.toLowerCase().includes(query.toLowerCase()))) {
        results.push({
          type: 'purpose',
          purpose: purposeName,
          description: rulePurpose.description,
          match: 'purpose_name_or_description'
        });
      }

      // Search in rule files
      for (const fileName of rulePurpose.files || []) {
        // Search in filename
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: 'file',
            purpose: purposeName,
            file: fileName,
            match: 'filename'
          });
        }

        // Search in content if requested
        if (!noContent) {
          try {
            const ruleResponse = await fetch(`${FRAMEWORK_URL}/rules/${purposeName}/${fileName}`);
            if (ruleResponse.ok) {
              const content = await ruleResponse.text();
              const { metadata, body } = parseFrontmatter(content);
              
              // Search in metadata
              const metadataStr = JSON.stringify(metadata).toLowerCase();
              if (metadataStr.includes(query.toLowerCase())) {
                results.push({
                  type: 'file',
                  purpose: purposeName,
                  file: fileName,
                  match: 'metadata',
                  metadata: metadata
                });
              }
              
              // Search in body
              if (body.toLowerCase().includes(query.toLowerCase())) {
                const matchIndex = body.toLowerCase().indexOf(query.toLowerCase());
                const contextStart = Math.max(0, matchIndex - 50);
                const contextEnd = Math.min(body.length, matchIndex + query.length + 50);
                const context = body.substring(contextStart, contextEnd);
                
                results.push({
                  type: 'file',
                  purpose: purposeName,
                  file: fileName,
                  match: 'content',
                  context: context
                });
              }
            }
          } catch (error) {
            // Skip if can't fetch
          }
        }
      }
    }

    // Display results
    console.log(`📊 Found ${results.length} result(s)\n`);

    if (results.length === 0) {
      console.log('No matches found.');
    } else {
      for (const result of results) {
        if (result.type === 'purpose') {
          console.log(`📁 Purpose: ${result.purpose}`);
          console.log(`   Match: ${result.match}`);
          if (result.description) console.log(`   Description: ${result.description}`);
        } else {
          console.log(`📄 File: ${result.purpose}/${result.file}`);
          console.log(`   Match: ${result.match}`);
          if (result.metadata) {
            console.log(`   Metadata: ${JSON.stringify(result.metadata, null, 2)}`);
          }
          if (result.context) {
            console.log(`   Context: ...${result.context}...`);
          }
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error(`❌ Search failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

