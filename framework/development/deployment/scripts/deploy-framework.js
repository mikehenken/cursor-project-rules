#!/usr/bin/env node

/**
 * Deploy Rules Framework to Cloudflare Workers
 * This script uploads all deployment files and documentation to R2 storage
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const config = {
  r2Bucket: 'rules-framework-files',
  deploymentFiles: [
    'deploy-template.js',
    'next.config.template.js', 
    'wrangler.template.toml',
    'package.template.json',
    'env.example'
  ,
    'setup.sh'],
  rulesDirectories: [
    'core',
    'backend', 
    'docs',
    'testing',
    'ci-cd'
  ],
  docsDirectories: [
    'docs/features/deployment',
    'docs/guides',
    'docs/setup'
  ]
};

/**
 * Main deployment function
 */
async function deployFramework() {
  console.log('🚀 Starting Rules Framework deployment to Cloudflare Workers...\n');

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
    const filePath = fileName === 'setup.sh' 
        ? join(projectRoot, '..', '..', '..', fileName)
        : join(projectRoot, fileName);
    
    if (fileExists(filePath)) {
      console.log(`   📄 Uploading ${fileName}...`);
      await uploadToR2(fileName, filePath);
    } else {
      console.log(`   ⚠️  File not found: ${fileName}`);
    }
  }
}

/**
 * Upload rules files to R2
 */
async function uploadRulesFiles() {
  for (const dirName of config.rulesDirectories) {
    const rulesDir = join(projectRoot, '.cursor', 'rules', dirName);
    
    if (dirExists(rulesDir)) {
      console.log(`   📁 Uploading rules from ${dirName}/...`);
      const files = readdirSync(rulesDir);
      
      for (const fileName of files) {
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
  for (const docsDir of config.docsDirectories) {
    const fullDocsDir = join(projectRoot, docsDir);
    
    if (dirExists(fullDocsDir)) {
      console.log(`   📁 Uploading docs from ${docsDir}...`);
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
    const filePath = join(projectRoot, docFile);
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
    
    // Use wrangler to upload to R2
    const command = `wrangler r2 object put ${config.r2Bucket}/${r2Key} --file "${filePath}"`;
    execSync(command, { stdio: 'pipe' });
    
    console.log(`     ✅ Uploaded ${r2Key}`);
  } catch (error) {
    console.error(`     ❌ Failed to upload ${r2Key}:`, error.message);
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
      const relativePath = relative(projectRoot, filePath);
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
      cwd: projectRoot 
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

// Run deployment
if (import.meta.url === `file://${process.argv[1]}`) {
  deployFramework().catch(console.error);
}