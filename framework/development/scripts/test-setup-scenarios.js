#!/usr/bin/env node

/**
 * Test script for setup-wizard.js scenarios
 * Tests different combinations of flags to verify package.json creation logic
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

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`✅ ${message}`);
  } else {
    testsFailed++;
    console.error(`❌ ${message}`);
  }
}

async function testScenario(name, testDir, flags, expectedPackageJson) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   Directory: ${testDir}`);
  console.log(`   Flags: ${flags.join(' ')}`);
  
  const logFile = join(LOG_DIR, `test-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.log`);
  const logStream = fs.createWriteStream(logFile);
  console.log(`   Log file: ${logFile}`);
  
  try {
    // Create test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    // Run setup-wizard.js with flags (streaming output)
    const setupWizardPath = join(FRAMEWORK_ROOT, 'framework/development/scripts/setup-wizard.js');
    
    await new Promise((resolve, reject) => {
      const child = spawn('node', [setupWizardPath, ...flags], {
        cwd: testDir,
        env: { 
          ...process.env, 
          RULES_FRAMEWORK_URL: 'https://rules-framework.mikehenken.workers.dev',
          npm_config_audit: 'false',
          npm_config_fund: 'false',
          npm_config_progress: 'false'
        },
        stdio: ['inherit', 'pipe', 'pipe']
      });
      
      // Set timeout for long-running tests (especially Next.js)
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Test timeout after 10 minutes`));
      }, 600000); // 10 minute timeout
      
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
        clearTimeout(timeout);
        logStream.end();
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        logStream.end();
        reject(error);
      });
    });
    
    // Check package.json existence
    const packageJsonPath = join(testDir, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    
    if (expectedPackageJson === null) {
      assert(!hasPackageJson, `package.json should not exist for ${name}`);
    } else if (expectedPackageJson) {
      assert(hasPackageJson, `package.json should exist for ${name}`);
      
      if (hasPackageJson) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Check dependencies
        if (expectedPackageJson.dependencies) {
          for (const [dep, version] of Object.entries(expectedPackageJson.dependencies)) {
            assert(
              packageJson.dependencies && packageJson.dependencies[dep] === version,
              `package.json should have dependency ${dep}@${version}`
            );
          }
        }
        
        // Check that no unexpected dependencies exist
        if (expectedPackageJson.dependencies && packageJson.dependencies) {
          const expectedDeps = Object.keys(expectedPackageJson.dependencies);
          const actualDeps = Object.keys(packageJson.dependencies);
          const unexpectedDeps = actualDeps.filter(dep => !expectedDeps.includes(dep));
          assert(
            unexpectedDeps.length === 0,
            `package.json should not have unexpected dependencies: ${unexpectedDeps.join(', ')}`
          );
        }
        
        // Check type
        if (expectedPackageJson.type) {
          assert(
            packageJson.type === expectedPackageJson.type,
            `package.json should have type: ${expectedPackageJson.type}`
          );
        }
      }
    }
    
    // Cleanup
    fs.rmSync(testDir, { recursive: true, force: true });
    
  } catch (error) {
    testsFailed++;
    const errorMsg = `❌ Test failed for ${name}: ${error.message}`;
    console.error(errorMsg);
    console.error(`   Stack: ${error.stack}`);
    logStream.write(`\n${errorMsg}\n${error.stack}\n`);
    logStream.end();
    
    // Don't cleanup on error - leave directory for inspection
    console.log(`   📁 Test directory left for inspection: ${testDir}`);
    console.log(`   📄 Log file: ${logFile}`);
  }
}

async function main() {
  console.log('🚀 Testing Setup Wizard Scenarios\n');
  console.log('=' .repeat(60));
  console.log(`📁 Test base directory: ${TEST_BASE_DIR}`);
  console.log(`📄 Log directory: ${LOG_DIR}\n`);
  
  // Clean up old test directories but keep logs
  if (fs.existsSync(TEST_BASE_DIR)) {
    const entries = fs.readdirSync(TEST_BASE_DIR);
    for (const entry of entries) {
      if (entry !== 'logs') {
        const entryPath = join(TEST_BASE_DIR, entry);
        try {
          if (fs.statSync(entryPath).isDirectory()) {
            fs.rmSync(entryPath, { recursive: true, force: true });
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }
  
  const testBaseDir = join(TEST_BASE_DIR, 'scenarios');
  
  // Scenario 1: Docs only (no package.json)
  await testScenario(
    'Docs Only',
    join(testBaseDir, 'test-docs-only'),
    [],
    null  // No package.json expected
  );
  
  // Scenario 2: Rules + MCP only (package.json with MCP deps only)
  await testScenario(
    'Rules + MCP Only',
    join(testBaseDir, 'test-rules-mcp'),
    ['--mcp'],
    {
      type: 'module',
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.20.2'
      }
    }
  );
  
  // Scenario 3: Rules + MCP + Next.js (Next.js creates frontend package.json, root has MCP deps)
  // Note: This test can take 5-10 minutes due to Next.js installation
  console.log('\n⚠️  Warning: Next.js test may take 5-10 minutes...\n');
  await testScenario(
    'Rules + MCP + Next.js',
    join(testBaseDir, 'test-nextjs-mcp'),
    ['--nextjs', '--mcp'],
    {
      type: 'module',
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.20.2'
      }
    }
  );
  
  // Scenario 4: Rules only, no MCP (no package.json)
  await testScenario(
    'Rules Only, No MCP',
    join(testBaseDir, 'test-rules-only'),
    [],
    null  // No package.json expected
  );
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📁 Test directories: ${testBaseDir}`);
  console.log(`📄 Log files: ${LOG_DIR}`);
  console.log(`\n${testsFailed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed'}\n`);
  
  // Write summary to log file
  const summaryLog = join(LOG_DIR, `test-summary-${Date.now()}.log`);
  fs.writeFileSync(summaryLog, `Test Summary - ${new Date().toISOString()}\n`);
  fs.appendFileSync(summaryLog, `Passed: ${testsPassed}\n`);
  fs.appendFileSync(summaryLog, `Failed: ${testsFailed}\n`);
  console.log(`📋 Summary log: ${summaryLog}`);
  
  process.exit(testsFailed === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

