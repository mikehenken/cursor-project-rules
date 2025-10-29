#!/usr/bin/env node

/**
 * Quick test verification script
 * Verifies that all new features are properly integrated
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRAMEWORK_ROOT = join(__dirname, '../../..');

const features = [
  {
    name: 'reconfigure-rules.js',
    path: join(FRAMEWORK_ROOT, 'framework/development/scripts/reconfigure-rules.js'),
    description: 'Reconfigure granular rules script'
  },
  {
    name: 'sync-rules.js',
    path: join(FRAMEWORK_ROOT, 'framework/development/scripts/sync-rules.js'),
    description: 'Sync rules from server script'
  },
  {
    name: 'push-rules-git.js',
    path: join(FRAMEWORK_ROOT, 'framework/development/scripts/push-rules-git.js'),
    description: 'Push rules to git script'
  },
  {
    name: 'search-rules.js',
    path: join(FRAMEWORK_ROOT, 'framework/development/scripts/search-rules.js'),
    description: 'Search rules script'
  }
];

console.log('🔍 Verifying Features\n');
console.log('====================\n');

let allPass = true;

for (const feature of features) {
  const exists = existsSync(feature.path);
  console.log(`${exists ? '✅' : '❌'} ${feature.name}: ${feature.description}`);
  if (!exists) allPass = false;
}

// Check MCP server
const mcpServer = join(FRAMEWORK_ROOT, 'framework/development/mcp-server.js');
if (existsSync(mcpServer)) {
  const content = readFileSync(mcpServer, 'utf8');
  const tools = ['reconfigure_rules', 'sync_rules', 'push_rules_to_git', 'search_rules'];
  console.log('\n📋 MCP Server Tools:');
  tools.forEach(tool => {
    const found = content.includes(tool);
    console.log(`${found ? '✅' : '❌'} ${tool}`);
    if (!found) allPass = false;
  });
}

// Check CLI
const cli = join(FRAMEWORK_ROOT, 'framework/development/scripts/rules-cli.js');
if (existsSync(cli)) {
  const content = readFileSync(cli, 'utf8');
  const commands = ['reconfigure', 'sync', 'push', 'search'];
  console.log('\n📋 CLI Commands:');
  commands.forEach(cmd => {
    const found = content.includes(`case '${cmd}':`) || content.includes(`run${cmd.charAt(0).toUpperCase() + cmd.slice(1)}`);
    console.log(`${found ? '✅' : '❌'} ${cmd}`);
    if (!found) allPass = false;
  });
}

console.log('\n' + (allPass ? '✅ All features verified!' : '❌ Some features missing'));
process.exit(allPass ? 0 : 1);

