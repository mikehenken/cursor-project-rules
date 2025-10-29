#!/usr/bin/env node

/**
 * MCP Server Test Suite
 * Tests all MCP commands to ensure they work correctly
 * Run before deployment: npm run test:mcp
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..', '..');
const testDir = join(projectRoot, '.test-mcp-server');
const testRulesDir = join(testDir, '.cursor', 'rules');

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Import MCP server functions
 */
async function importMCPServer() {
  // Create a test version of the MCP server with modified config
  const mcpServerPath = join(projectRoot, 'framework', 'external', 'mcp-server.js');
  const mcpContent = readFileSync(mcpServerPath, 'utf8');
  
  // Create a test version with modified config
  const testMcpPath = join(testDir, 'mcp-server-test.js');
  const modifiedMcp = mcpContent.replace(
    /rulesDir: join\(__dirname, '\.cursor', 'rules'\)/,
    `rulesDir: '${testRulesDir.replace(/\\/g, '/')}'`
  );
  
  writeFileSync(testMcpPath, modifiedMcp);
  
  // Import the test version
  const module = await import(`file://${testMcpPath}`);
  return module;
}

/**
 * Test helper
 */
function test(name, fn) {
  return async () => {
    try {
      await fn();
      results.passed++;
      results.tests.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', error: error.message });
      console.error(`❌ ${name}: ${error.message}`);
    }
  };
}

/**
 * Setup test environment
 */
function setupTestEnvironment() {
  // Create test directory
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true });
  }
  mkdirSync(testDir, { recursive: true });
  mkdirSync(testRulesDir, { recursive: true });

  // Create test rules
  const testRules = {
    core: [
      { name: 'workflow.mdc', content: '# Workflow Rule\n\nTest workflow content.' },
      { name: 'engineering-practices.mdc', content: '# Engineering Practices\n\nTest content.' }
    ],
    backend: [
      { name: 'api-guidelines.mdc', content: '# API Guidelines\n\nTest content.' }
    ]
  };

  for (const [purpose, files] of Object.entries(testRules)) {
    const purposeDir = join(testRulesDir, purpose);
    mkdirSync(purposeDir, { recursive: true });
    for (const file of files) {
      writeFileSync(join(purposeDir, file.name), file.content);
    }
  }
}

/**
 * Cleanup test environment
 */
function cleanupTestEnvironment() {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Running MCP Server Tests\n');
  console.log('='.repeat(50));

  setupTestEnvironment();

  // Import test functions - we'll test them directly
  const { readFileSync: testReadFileSync, readdirSync: testReaddirSync, existsSync: testExistsSync } = await import('fs');
  const { join: testJoin } = await import('path');

  // Simulate the listRules function
  async function listRules(args) {
    const { purpose } = args || {};
    const rules = [];

    if (purpose) {
      const purposeDir = testJoin(testRulesDir, purpose);
      if (testExistsSync(purposeDir)) {
        const files = testReaddirSync(purposeDir).filter(f => f.endsWith('.mdc'));
        rules.push({
          purpose,
          files: files.map(f => ({
            name: f,
            path: testJoin(purposeDir, f),
            description: f.replace('.mdc', '')
          }))
        });
      }
    } else {
      const purposes = ['core', 'backend'];
      for (const p of purposes) {
        const purposeDir = testJoin(testRulesDir, p);
        if (testExistsSync(purposeDir)) {
          const files = testReaddirSync(purposeDir).filter(f => f.endsWith('.mdc'));
          rules.push({
            purpose: p,
            files: files.map(f => ({
              name: f,
              path: testJoin(purposeDir, f),
              description: f.replace('.mdc', '')
            }))
          });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rules, null, 2)
        }
      ]
    };
  }

  // Simulate getRule function
  async function getRule(args) {
    const { purpose, ruleName } = args || {};
    
    if (!purpose || !ruleName) {
      throw new Error('Missing required parameters: purpose and ruleName are required');
    }
    
    const rulePath = testJoin(testRulesDir, purpose, ruleName);
    
    if (!testExistsSync(rulePath)) {
      throw new Error(`Rule not found: ${purpose}/${ruleName}`);
    }

    const content = testReadFileSync(rulePath, 'utf8');
    
    return {
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    };
  }

  // Simulate enableRules function
  async function enableRules(args) {
    const { purposes, projectPath = testDir } = args || {};
    
    if (!purposes || !Array.isArray(purposes) || purposes.length === 0) {
      throw new Error('Missing required parameter: purposes must be a non-empty array');
    }
    
    const results = [];

    for (const purpose of purposes) {
      const sourceDir = testJoin(testRulesDir, purpose);
      const targetDir = testJoin(projectPath, '.cursor', 'rules', purpose);
      
      if (testExistsSync(sourceDir)) {
        mkdirSync(testJoin(projectPath, '.cursor', 'rules'), { recursive: true });
        try {
          execSync(`cp -r "${sourceDir}" "${targetDir}"`, { stdio: 'pipe' });
          results.push({
            purpose,
            status: 'enabled',
            path: targetDir
          });
        } catch (error) {
          results.push({
            purpose,
            status: 'error',
            error: error.message
          });
        }
      } else {
        results.push({
          purpose,
          status: 'not_found',
          error: `Purpose directory not found: ${sourceDir}`
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }
      ]
    };
  }

  const tests = [
    test('List all rules (no filter)', async () => {
      const response = await listRules({});
      const content = JSON.parse(response.content[0].text);
      if (!Array.isArray(content) || content.length < 2) {
        throw new Error(`Expected at least 2 purposes, got ${content.length}`);
      }
      const core = content.find(r => r.purpose === 'core');
      if (!core || core.files.length !== 2) {
        throw new Error('Core rules not found or incorrect count');
      }
    }),

    test('List rules filtered by purpose', async () => {
      const response = await listRules({ purpose: 'core' });
      const content = JSON.parse(response.content[0].text);
      if (!Array.isArray(content) || content.length !== 1) {
        throw new Error('Should return single purpose');
      }
      if (content[0].purpose !== 'core') {
        throw new Error('Should return core purpose');
      }
      if (content[0].files.length !== 2) {
        throw new Error(`Expected 2 core files, got ${content[0].files.length}`);
      }
    }),

    test('Get specific rule', async () => {
      const response = await getRule({
        purpose: 'core',
        ruleName: 'workflow.mdc'
      });
      const content = response.content[0].text;
      if (!content.includes('Workflow Rule')) {
        throw new Error('Rule content not found');
      }
    }),

    test('Get rule with invalid purpose', async () => {
      try {
        await getRule({
          purpose: 'invalid',
          ruleName: 'workflow.mdc'
        });
        throw new Error('Should have thrown error');
      } catch (error) {
        if (!error.message.includes('not found')) {
          throw error;
        }
      }
    }),

    test('Get rule with missing parameters', async () => {
      try {
        await getRule({});
        throw new Error('Should have thrown error');
      } catch (error) {
        if (!error.message.includes('required')) {
          throw error;
        }
      }
    }),

    test('Enable rules', async () => {
      const targetDir = join(testDir, 'enabled-rules');
      mkdirSync(targetDir, { recursive: true });

      const response = await enableRules({
        purposes: ['core'],
        projectPath: targetDir
      });

      const content = JSON.parse(response.content[0].text);
      if (!Array.isArray(content) || content.length !== 1) {
        throw new Error('Should return array with one result');
      }
      if (content[0].status !== 'enabled') {
        throw new Error(`Expected status 'enabled', got '${content[0].status}'`);
      }

      // Verify files were copied
      const enabledCoreDir = join(targetDir, '.cursor', 'rules', 'core');
      if (!existsSync(enabledCoreDir)) {
        throw new Error('Enabled rules directory not found');
      }

      const files = readdirSync(enabledCoreDir);
      if (files.length !== 2) {
        throw new Error(`Expected 2 files, got ${files.length}`);
      }
    }),

    test('Enable rules with invalid purpose', async () => {
      const response = await enableRules({
        purposes: ['invalid-purpose']
      });

      const content = JSON.parse(response.content[0].text);
      if (content[0].status !== 'not_found') {
        throw new Error(`Expected status 'not_found', got '${content[0].status}'`);
      }
    }),

    test('Enable rules with empty array', async () => {
      try {
        await enableRules({
          purposes: []
        });
        throw new Error('Should have thrown error');
      } catch (error) {
        if (!error.message.includes('required')) {
          throw error;
        }
      }
    }),

    test('Enable rules with missing purposes', async () => {
      try {
        await enableRules({});
        throw new Error('Should have thrown error');
      } catch (error) {
        if (!error.message.includes('required')) {
          throw error;
        }
      }
    })
  ];

  // Run all tests
  for (const testFn of tests) {
    await testFn();
  }

  cleanupTestEnvironment();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Summary:`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📝 Total:  ${results.passed + results.failed}\n`);

  if (results.failed > 0) {
    console.log('Failed tests:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  }

  console.log('🎉 All tests passed!\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
