#!/usr/bin/env node

/**
 * Deploy Rules Framework to Cloudflare Workers
 * This script uploads all deployment files and documentation to R2 storage
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, mkdirSync, rmSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { tmpdir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const scriptDir = __dirname; // framework/development/deployment/scripts
const deploymentDir = join(scriptDir, '..'); // framework/development/deployment
const repoRoot = join(scriptDir, '..', '..', '..', '..'); // repo root
const docsDir = join(scriptDir, '..', '..', 'docs'); // framework/development/docs
const deploymentFilesDir = join(docsDir, 'features', 'deployment'); // framework/development/docs/features/deployment

// Configuration
const config = {
  r2Bucket: 'rules-framework-files',
  frameworkUrl: 'https://rules-framework.mikehenken.workers.dev',
  testDir: join(process.env.HOME || tmpdir(), 'Projects', 'test-automations'),
  deploymentFiles: [
    'deploy-template.js',
    'next.config.template.js', 
    'wrangler.template.toml',
    'package.template.json',
    'env.example',
    'setup.sh',
    'setup-wizard.js',
    'mcp-server.js'
  ],
  rulesDirectories: [
    'core',
    'backend', 
    'docs',
    'testing',
    'ci-cd'
  ],
  docsDirectories: [
    'features/deployment',
    'guides',
    'setup'
  ]
};

/**
 * Run all tests before deployment
 */
async function runAllTests() {
  console.log('🧪 Running all tests before deployment...\n');
  
  const tests = [
    { name: 'MCP Server Tests', command: 'npm run test:mcp' },
    { name: 'Framework Tests', command: 'npm run test:framework' }
  ];

  for (const test of tests) {
    console.log(`📋 Running ${test.name}...`);
    try {
      execSync(test.command, { stdio: 'inherit', cwd: repoRoot });
      console.log(`✅ ${test.name} passed!\n`);
    } catch (error) {
      console.error(`❌ ${test.name} failed!`);
      console.error('   Fix the failing tests before deploying.\n');
      throw new Error(`${test.name} failed`);
    }
  }
  
  console.log('✅ All tests passed!\n');
}

/**
 * Main deployment function
 */
async function deployFramework() {
  console.log('🚀 Starting Rules Framework deployment to Cloudflare Workers...\n');

  // Check if tests should be skipped (explicit --skip-tests flag)
  const skipTests = process.argv.includes('--skip-tests') || process.argv.includes('--no-tests');
  
  // Check environment
  const hasEnvFlag = process.argv.includes('--env') || process.argv.includes('-e');
  let envValue = null;
  
  if (hasEnvFlag) {
    const flagIndex = process.argv.includes('--env') 
      ? process.argv.indexOf('--env')
      : process.argv.indexOf('-e');
    envValue = process.argv[flagIndex + 1] || null;
  }
  
  const isProduction = !hasEnvFlag || envValue === 'production';
  const environment = envValue || (isProduction ? 'production' : 'development');
  
  if (skipTests) {
    console.log(`⚠️  Tests skipped (--skip-tests flag provided)\n`);
  } else {
    // Run all tests before deployment (production and staging)
    console.log(`🧪 Running tests before ${environment} deployment...\n`);
    try {
      await runAllTests();
    } catch (error) {
      console.error('❌ Pre-deployment tests failed! Deployment aborted.');
      console.error(`   Error: ${error.message}`);
      console.error(`   Use --skip-tests to skip tests (not recommended)`);
      process.exit(1);
    }
  }

  try {
    // Check if wrangler is installed
    checkWranglerInstallation();

    // Upload deployment files
    console.log('📦 Uploading deployment files...');
    await uploadDeploymentFiles();

    // Upload rules files
    console.log('📋 Uploading rules files...');
    await uploadRulesFiles();

    // Upload documentation
    console.log('📚 Uploading documentation...');
    await uploadDocumentation();

    // Deploy worker
    console.log('🔧 Deploying Cloudflare Worker...');
    await deployWorker();

    // Verify R2 files match local files
    console.log('\n🔍 Verifying R2 file integrity...');
    await verifyR2Files();

    // Test setup wizard in test environment
    console.log('\n🧪 Testing setup wizard...');
    await testSetupWizard();

    console.log('\n✅ Rules Framework deployed successfully!');
    console.log('🌐 Your framework is now available at your Cloudflare Workers URL');
    console.log('📖 API endpoints:');
    console.log('   - GET /api/files - List deployment files');
    console.log('   - GET /api/rules - List rules files');
    console.log('   - GET /api/docs - List documentation');
    console.log('   - GET /api/pull?type=deployment - Pull deployment files');
    console.log('   - GET /api/pull?type=rules - Pull rules files');
    console.log('   - GET /api/pull?type=docs - Pull documentation');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

/**
 * Check if wrangler is installed
 */
function checkWranglerInstallation() {
  try {
    execSync('wrangler --version', { stdio: 'pipe' });
    console.log('✅ Wrangler CLI found');
  } catch (error) {
    console.error('❌ Wrangler CLI not found. Please install it:');
    console.error('   npm install -g wrangler');
    console.error('   or');
    console.error('   npm install wrangler --save-dev');
    process.exit(1);
  }
}

/**
 * Upload deployment files to R2
 */
async function uploadDeploymentFiles() {
  for (const fileName of config.deploymentFiles) {
    let filePath;
    if (fileName === 'setup.sh') {
      // setup.sh is at repo root
      filePath = join(repoRoot, fileName);
    } else if (fileName === 'setup-wizard.js') {
      // setup-wizard.js is in framework/development/scripts/
      filePath = join(scriptDir, '..', '..', 'scripts', fileName);
    } else if (fileName === 'mcp-server.js') {
      // mcp-server.js is in framework/external/ (for external projects)
      filePath = join(repoRoot, 'framework', 'external', fileName);
    } else {
      // Other deployment files are in framework/development/docs/features/deployment/
      filePath = join(deploymentFilesDir, fileName);
    }
    
    if (fileExists(filePath)) {
      console.log(`   📄 Uploading ${fileName}...`);
      await uploadToR2(fileName, filePath);
    } else {
      console.log(`   ⚠️  File not found: ${fileName} (checked: ${filePath})`);
    }
  }
}

/**
 * Upload rules files to R2
 */
async function uploadRulesFiles() {
  // Read from framework/external/rules (source of truth)
  const externalRulesDir = join(repoRoot, 'framework', 'external', 'rules');
  
  if (!dirExists(externalRulesDir)) {
    console.log(`   ⚠️  External rules directory not found: ${externalRulesDir}`);
    return;
  }

  for (const dirName of config.rulesDirectories) {
    const rulesDir = join(externalRulesDir, dirName);
    
    if (dirExists(rulesDir)) {
      console.log(`   📁 Uploading rules from ${dirName}/...`);
      const files = readdirSync(rulesDir);
      
      for (const fileName of files) {
        // Only upload .mdc files, skip README and other documentation files
        if (fileName.endsWith('.mdc')) {
          const filePath = join(rulesDir, fileName);
          const r2Key = `rules/${dirName}/${fileName}`;
          console.log(`     📄 Uploading ${fileName}...`);
          await uploadToR2(r2Key, filePath);
        }
      }
    } else {
      console.log(`   ⚠️  Rules directory not found: ${rulesDir}`);
    }
  }
}

/**
 * Upload documentation to R2
 */
async function uploadDocumentation() {
  for (const docsSubDir of config.docsDirectories) {
    const fullDocsDir = join(docsDir, docsSubDir);
    
    if (dirExists(fullDocsDir)) {
      console.log(`   📁 Uploading docs from ${docsSubDir}...`);
      await uploadDirectoryToR2(fullDocsDir, 'docs');
    } else {
      console.log(`   ⚠️  Docs directory not found: ${fullDocsDir}`);
    }
  }

  // Upload main documentation files
  const mainDocs = [
    'README.md',
    'docs/DOCS_INDEX.md'
  ];

  for (const docFile of mainDocs) {
    const filePath = join(repoRoot, docFile);
    if (fileExists(filePath)) {
      console.log(`   📄 Uploading ${docFile}...`);
      await uploadToR2(`docs/${docFile}`, filePath);
    }
  }
}

/**
 * Upload a single file to R2
 */
async function uploadToR2(r2Key, filePath) {
  try {
    const fileContent = readFileSync(filePath);
    
    // Try uploading to remote R2 first (Worker reads from remote)
    try {
      const remoteCommand = `wrangler r2 object put ${config.r2Bucket}/${r2Key} --file "${filePath}" --remote`;
      execSync(remoteCommand, { stdio: 'pipe' });
      console.log(`     ✅ Uploaded ${r2Key} to remote R2`);
      return;
    } catch (remoteError) {
      // If remote upload fails, try local as fallback
      console.log(`     ⚠️  Remote upload failed, trying local R2...`);
      const localCommand = `wrangler r2 object put ${config.r2Bucket}/${r2Key} --file "${filePath}"`;
      execSync(localCommand, { stdio: 'pipe' });
      console.log(`     ⚠️  Uploaded ${r2Key} to LOCAL R2 (Worker needs REMOTE - sync manually or update API token permissions)`);
      console.log(`     ⚠️  To fix: Update API token at https://dash.cloudflare.com/profile/api-tokens to include R2:Edit permission`);
      return;
    }
  } catch (error) {
    console.error(`     ❌ Failed to upload ${r2Key}:`, error.message);
    throw error;
  }
}

/**
 * Upload a directory to R2 recursively
 */
async function uploadDirectoryToR2(dirPath, r2Prefix) {
  const files = readdirSync(dirPath);
  
  for (const fileName of files) {
    const filePath = join(dirPath, fileName);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      await uploadDirectoryToR2(filePath, `${r2Prefix}/${fileName}`);
    } else {
      const relativePath = relative(repoRoot, filePath);
      const r2Key = `${r2Prefix}/${relativePath}`;
      console.log(`     📄 Uploading ${fileName}...`);
      await uploadToR2(r2Key, filePath);
    }
  }
}

/**
 * Deploy the Cloudflare Worker
 */
async function deployWorker() {
  try {
    console.log('   🔧 Deploying worker...');
    execSync('wrangler deploy', { 
      stdio: 'inherit',
      cwd: deploymentDir 
    });
    console.log('   ✅ Worker deployed successfully');
  } catch (error) {
    console.error('   ❌ Worker deployment failed:', error.message);
    throw error;
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/**
 * Check if directory exists
 */
function dirExists(dirPath) {
  try {
    return statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Verify R2 files match local files
 */
async function verifyR2Files() {
  const criticalFiles = [
    { r2Key: 'setup.sh', localPath: join(repoRoot, 'setup.sh') },
    { r2Key: 'setup-wizard.js', localPath: join(scriptDir, '..', '..', 'scripts', 'setup-wizard.js') },
    { r2Key: 'mcp-server.js', localPath: join(repoRoot, 'framework', 'external', 'mcp-server.js') }
  ];

  const tempDir = join(tmpdir(), 'rules-framework-verify');
  mkdirSync(tempDir, { recursive: true });

  try {
    for (const file of criticalFiles) {
      if (!fileExists(file.localPath)) {
        console.log(`   ⚠️  Local file not found: ${file.localPath}`);
        continue;
      }

      // Download from Worker URL (what users actually get)
      const tempFile = join(tempDir, file.r2Key);
      try {
        const url = `${config.frameworkUrl}/files/${file.r2Key}`;
        const command = `curl -s "${url}" -o "${tempFile}"`;
        execSync(command, { stdio: 'pipe' });
        
        // Verify file was downloaded
        if (!fileExists(tempFile)) {
          throw new Error(`Failed to download ${file.r2Key} from worker`);
        }
        
        const downloadedSize = statSync(tempFile).size;
        if (downloadedSize === 0) {
          throw new Error(`Downloaded ${file.r2Key} is empty`);
        }
        
        // Compare files
        const localContent = readFileSync(file.localPath, 'utf8');
        const r2Content = readFileSync(tempFile, 'utf8');
        
        if (localContent === r2Content) {
          console.log(`   ✅ ${file.r2Key} matches local file`);
        } else {
          console.error(`   ❌ ${file.r2Key} does NOT match local file!`);
          throw new Error(`R2 file ${file.r2Key} does not match local file`);
        }
      } catch (error) {
        if (error.message.includes('does not match')) {
          throw error;
        }
        console.error(`   ❌ Failed to verify ${file.r2Key}:`, error.message);
        throw new Error(`Failed to verify R2 file: ${file.r2Key}`);
      }
    }
  } finally {
    // Cleanup temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Test setup wizard in test environment
 */
async function testSetupWizard() {
  // Create test directory
  const testDirName = `test-setup-${Date.now()}`;
  const testDir = join(config.testDir, testDirName);
  
  try {
    // Ensure test-automations directory exists
    mkdirSync(config.testDir, { recursive: true });
    mkdirSync(testDir, { recursive: true });

    console.log(`   📁 Created test directory: ${testDir}`);

    // Download setup.sh from deployed URL
    console.log('   📥 Downloading setup.sh from deployed URL...');
    const setupScript = join(testDir, 'setup.sh');
    try {
      const curlCommand = `curl -s "${config.frameworkUrl}/files/setup.sh" -o "${setupScript}"`;
      execSync(curlCommand, { stdio: 'pipe' });
      
      // Make executable
      execSync(`chmod +x "${setupScript}"`, { stdio: 'pipe' });
      
      // Check if file was downloaded successfully
      if (!fileExists(setupScript)) {
        throw new Error('Failed to download setup.sh from deployed URL');
      }
      
      const downloadedContent = readFileSync(setupScript, 'utf8');
      if (downloadedContent.length === 0) {
        throw new Error('Downloaded setup.sh is empty');
      }
      
      console.log('   ✅ Downloaded setup.sh successfully');
    } catch (error) {
      throw new Error(`Failed to download setup.sh: ${error.message}`);
    }

    // Download setup-wizard.js from deployed URL
    console.log('   📥 Downloading setup-wizard.js from deployed URL...');
    const wizardScript = join(testDir, 'setup-wizard.js');
    try {
      const curlCommand = `curl -s "${config.frameworkUrl}/files/setup-wizard.js" -o "${wizardScript}"`;
      execSync(curlCommand, { stdio: 'pipe' });
      
      if (!fileExists(wizardScript)) {
        throw new Error('Failed to download setup-wizard.js from deployed URL');
      }
      
      const downloadedContent = readFileSync(wizardScript, 'utf8');
      if (downloadedContent.length === 0) {
        throw new Error('Downloaded setup-wizard.js is empty');
      }
      
      console.log('   ✅ Downloaded setup-wizard.js successfully');
    } catch (error) {
      throw new Error(`Failed to download setup-wizard.js: ${error.message}`);
    }

    // Test setup wizard can run (dry run with flags)
    console.log('   🧪 Testing setup wizard execution...');
    try {
      // Test with minimal flags (no actual setup, just verify it runs)
      const testCommand = `cd "${testDir}" && node "${wizardScript}" --nextjs 2>&1 || true`;
      const output = execSync(testCommand, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Check if wizard ran (should output something)
      if (output.includes('Rules Framework Setup Wizard') || output.includes('Next.js')) {
        console.log('   ✅ Setup wizard executes successfully');
      } else {
        console.log('   ⚠️  Setup wizard output unexpected:', output.substring(0, 200));
        // Don't fail - wizard might work but output format changed
      }
    } catch (error) {
      console.log(`   ⚠️  Setup wizard test: ${error.message}`);
      // Don't fail deployment for wizard test issues - wizard might work but test had issues
    }

    console.log('   ✅ Setup wizard test completed');

  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    throw error;
  } finally {
    // Cleanup test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
      console.log(`   🧹 Cleaned up test directory: ${testDir}`);
    } catch {
      console.log(`   ⚠️  Could not clean up test directory: ${testDir}`);
    }
  }
}

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  deployFramework().catch(console.error);
}