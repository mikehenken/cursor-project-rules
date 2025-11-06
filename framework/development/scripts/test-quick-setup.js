#!/usr/bin/env node

/**
 * Quick test of setup-wizard.js with MCP flag
 * Tests that package.json is created correctly with only MCP dependencies
 */

import { spawn } from 'child_process';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRAMEWORK_ROOT = join(__dirname, '../../..');
const TEST_BASE_DIR = join(FRAMEWORK_ROOT, 'test-output');
const LOG_DIR = join(TEST_BASE_DIR, 'logs');

// Ensure directories exist
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const testDir = join(TEST_BASE_DIR, `quick-test-${Date.now()}`);
const logFile = join(LOG_DIR, `quick-test-${Date.now()}.log`);

console.log('🧪 Quick Setup Test');
console.log('===================\n');
console.log(`📁 Test directory: ${testDir}`);
console.log(`📄 Log file: ${logFile}\n`);

const logStream = fs.createWriteStream(logFile);

(async () => {
try {
  // Create test directory
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`✅ Created test directory`);
  
  // Run setup-wizard.js with MCP flag only
  const setupWizardPath = join(FRAMEWORK_ROOT, 'framework/development/scripts/setup-wizard.js');
  console.log('🚀 Running setup-wizard.js with --mcp flag...\n');
  
  await new Promise((resolve, reject) => {
    const child = spawn('node', [setupWizardPath, '--mcp'], {
      cwd: testDir,
      env: { ...process.env, RULES_FRAMEWORK_URL: 'https://rules-framework.mikehenken.workers.dev' },
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    // Stream stdout to console and log file
    child.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      logStream.write(output);
    });
    
    // Stream stderr to console and log file
    child.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      logStream.write(output);
    });
    
    child.on('close', (code) => {
      logStream.end();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      logStream.end();
      reject(error);
    });
  });
  
  // Verify package.json exists
  const packageJsonPath = join(testDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json was not created');
  }
  console.log('\n✅ package.json created');
  
  // Verify contents
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.dependencies || !packageJson.dependencies['@modelcontextprotocol/sdk']) {
    throw new Error('MCP dependency missing from package.json');
  }
  console.log('✅ MCP dependency found in package.json');
  
  if (packageJson.dependencies['@modelcontextprotocol/sdk'] !== '^1.20.2') {
    throw new Error(`Wrong MCP version: ${packageJson.dependencies['@modelcontextprotocol/sdk']}`);
  }
  console.log('✅ Correct MCP version (^1.20.2)');
  
  // Check for unexpected dependencies
  const expectedDeps = ['@modelcontextprotocol/sdk'];
  const actualDeps = Object.keys(packageJson.dependencies || {});
  const unexpectedDeps = actualDeps.filter(dep => !expectedDeps.includes(dep));
  
  if (unexpectedDeps.length > 0) {
    throw new Error(`Unexpected dependencies: ${unexpectedDeps.join(', ')}`);
  }
  console.log('✅ No unexpected dependencies');
  
  // Verify type is module
  if (packageJson.type !== 'module') {
    throw new Error(`Expected type: module, got: ${packageJson.type}`);
  }
  console.log('✅ type: module');
  
  // Check rules were installed
  const rulesDir = join(testDir, '.cursor', 'rules');
  if (!fs.existsSync(rulesDir)) {
    throw new Error('Rules directory not created');
  }
  console.log('✅ Rules directory created');
  
  console.log('\n🎉 All tests passed!');
  console.log(`📄 Full log saved to: ${logFile}`);
  
  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });
  console.log('🧹 Cleaned up test directory');
  
} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
  if (error.stack) {
    console.error(error.stack);
    logStream.write(`\nError: ${error.message}\n${error.stack}\n`);
  }
  logStream.end();
  
  // Don't cleanup on error - leave directory for inspection
  console.log(`\n📁 Test directory left for inspection: ${testDir}`);
  console.log(`📄 Log file: ${logFile}`);
  
  process.exit(1);
}
})();

