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
    case 'reconfigure':
      runReconfigure(args.slice(1));
      break;
    case 'sync':
      runSync(args.slice(1));
      break;
    case 'push':
      runPush(args.slice(1));
      break;
    case 'search':
      runSearch(args.slice(1));
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
 * Run reconfigure command
 */
function runReconfigure(args) {
  console.log('🔧 Reconfiguring granular rules...\n');
  
  const purpose = args.find(arg => arg.startsWith('--purpose='))?.split('=')[1];
  
  try {
    const reconfigureScript = join(__dirname, 'reconfigure-rules.js');
    execSync(`node "${reconfigureScript}" ${purpose ? `--purpose=${purpose}` : ''}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('❌ Reconfigure failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run sync command
 */
function runSync(args) {
  console.log('🔄 Syncing rules from server...\n');
  
  const autoResolve = args.find(arg => arg.startsWith('--resolve='))?.split('=')[1] || 'none';
  const frameworkUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1];
  
  try {
    const syncScript = join(__dirname, 'sync-rules.js');
    const env = { 
      ...process.env,
      RULES_FRAMEWORK_URL: frameworkUrl || 'https://rules-framework.mikehenken.workers.dev',
      AUTO_RESOLVE: autoResolve
    };
    execSync(`node "${syncScript}"`, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env
    });
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run push command
 */
function runPush(args) {
  console.log('📤 Pushing rules to git...\n');
  
  const commitMessage = args.find(arg => arg.startsWith('--message='))?.split('=')[1];
  const branch = args.find(arg => arg.startsWith('--branch='))?.split('=')[1];
  const remote = args.find(arg => arg.startsWith('--remote='))?.split('=')[1] || 'origin';
  
  try {
    const pushScript = join(__dirname, 'push-rules-git.js');
    const env = { 
      ...process.env,
      COMMIT_MESSAGE: commitMessage,
      BRANCH: branch,
      REMOTE: remote
    };
    execSync(`node "${pushScript}"`, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env
    });
  } catch (error) {
    console.error('❌ Push failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run search command
 */
function runSearch(args) {
  console.log('🔍 Searching rules...\n');
  
  const query = args.find(arg => !arg.startsWith('--')) || args[0];
  const purpose = args.find(arg => arg.startsWith('--purpose='))?.split('=')[1];
  const noContent = args.includes('--no-content');
  
  if (!query) {
    console.error('❌ Search query required');
    console.log('Usage: rules search <query> [--purpose=<purpose>] [--no-content]');
    process.exit(1);
  }
  
  try {
    const searchScript = join(__dirname, 'search-rules.js');
    execSync(`node "${searchScript}" "${query}" ${purpose ? `--purpose=${purpose}` : ''} ${noContent ? '--no-content' : ''}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('❌ Search failed:', error.message);
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
  console.log('reconfigure    Reconfigure granular rules');
  console.log('sync           Sync rules from server with conflict detection');
  console.log('push           Push rules to git');
  console.log('search         Search for rules');
  console.log('help           Show this help message\n');
  
  console.log('Examples:');
  console.log('=========\n');
  
  console.log('  # Setup a new project');
  console.log('  rules setup\n');
  
  console.log('  # Pull deployment files');
  console.log('  rules pull deployment\n');
  
  console.log('  # Reconfigure rules');
  console.log('  rules reconfigure --purpose=core\n');
  
  console.log('  # Sync rules from server');
  console.log('  rules sync --resolve=server\n');
  
  console.log('  # Push rules to git');
  console.log('  rules push --message="Update rules" --branch=main\n');
  
  console.log('  # Search for rules');
  console.log('  rules search "testing" --purpose=core\n');
  
  console.log('Framework URL:');
  console.log('==============');
  console.log('https://rules-framework.mikehenken.workers.dev');
}

// Run CLI
main();
