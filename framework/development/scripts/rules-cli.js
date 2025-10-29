#!/usr/bin/env node

/**
 * Rules Framework CLI
 * Simple command-line interface for the Rules Framework
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🎯 Rules Framework CLI');
  console.log('======================\n');

  switch (command) {
    case 'setup':
      runSetup();
      break;
    case 'pull':
      runPull(args[1] || 'all');
      break;
    case 'deploy':
      runDeploy();
      break;
    case 'test':
      runTest();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

/**
 * Run setup wizard
 */
function runSetup() {
  console.log('🚀 Running Rules Framework Setup Wizard...\n');
  try {
    execSync(`node "${join(projectRoot, 'scripts', 'setup-wizard.js')}"`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run pull command
 */
function runPull(type) {
  console.log(`📥 Pulling ${type} from Rules Framework...\n`);
  
  const pullScript = join(projectRoot, 'scripts', 'pull-framework.js');
  
  try {
    execSync(`node "${pullScript}" ${type}`, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        RULES_FRAMEWORK_URL: 'https://rules-framework.mikehenken.workers.dev' 
      }
    });
  } catch (error) {
    console.error('❌ Pull failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run deploy command
 */
function runDeploy() {
  console.log('🚀 Deploying Rules Framework to Cloudflare...\n');
  
  try {
    execSync(`node "${join(projectRoot, 'scripts', 'deploy-framework.js')}"`, { 
      stdio: 'inherit',
      cwd: projectRoot
    });
  } catch (error) {
    console.error('❌ Deploy failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run test command
 */
function runTest() {
  console.log('🧪 Testing Rules Framework...\n');
  
  const frameworkUrl = 'https://rules-framework.mikehenken.workers.dev';
  
  try {
    console.log('Testing main endpoint...');
    execSync(`curl -s "${frameworkUrl}/" | head -5`, { stdio: 'inherit' });
    
    console.log('\nTesting files endpoint...');
    execSync(`curl -s "${frameworkUrl}/api/files" | head -5`, { stdio: 'inherit' });
    
    console.log('\nTesting rules endpoint...');
    execSync(`curl -s "${frameworkUrl}/api/rules" | head -5`, { stdio: 'inherit' });
    
    console.log('\n✅ Framework is working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Show help
 */
function showHelp() {
  console.log('Available Commands:');
  console.log('===================\n');
  
  console.log('setup          Run interactive setup wizard');
  console.log('pull [type]    Pull files from framework (deployment|rules|docs|all)');
  console.log('deploy         Deploy framework to Cloudflare');
  console.log('test           Test framework endpoints');
  console.log('help           Show this help message\n');
  
  console.log('Examples:');
  console.log('=========\n');
  
  console.log('  # Setup a new project');
  console.log('  rules setup\n');
  
  console.log('  # Pull deployment files');
  console.log('  rules pull deployment\n');
  
  console.log('  # Pull all files');
  console.log('  rules pull all\n');
  
  console.log('  # Deploy framework');
  console.log('  rules deploy\n');
  
  console.log('  # Test framework');
  console.log('  rules test\n');
  
  console.log('Framework URL:');
  console.log('==============');
  console.log('https://rules-framework.mikehenken.workers.dev');
}

// Run CLI
main();
