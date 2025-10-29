#!/usr/bin/env node

/**
 * Universal Next.js Cloudflare Pages Deployment Script
 * 
 * This script provides a reusable deployment solution for Next.js applications
 * to Cloudflare Pages with comprehensive error handling and automation.
 * 
 * Features:
 * - Environment variable validation
 * - Automatic project creation
 * - Build validation
 * - Comprehensive error handling
 * - Deployment status reporting
 * 
 * Usage: node deploy-template.js [project-name] [environment]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configuration
const DEFAULT_PROJECT_NAME = process.env.PROJECT_NAME || 'nextjs-app';
const DEFAULT_ENVIRONMENT = process.env.DEPLOYMENT_ENV || 'production';
const BUILD_OUTPUT_DIR = 'out';

// Get command line arguments
const args = process.argv.slice(2);
const projectName = args[0] || DEFAULT_PROJECT_NAME;
const environment = args[1] || DEFAULT_ENVIRONMENT;

// Environment variables validation
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

// Validate required environment variables
function validateEnvironmentVariables() {
  const missingVars = [];
  
  if (!CLOUDFLARE_API_TOKEN) missingVars.push('CLOUDFLARE_API_TOKEN');
  if (!CLOUDFLARE_ACCOUNT_ID) missingVars.push('CLOUDFLARE_ACCOUNT_ID');
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   ${varName} is required`);
    });
    console.error('\n📝 Please check your .env file or environment variables');
    console.error('💡 See .env.example for required variables');
    process.exit(1);
  }
}

// Validate project configuration
function validateProjectConfiguration() {
  const requiredFiles = ['package.json', 'next.config.js'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required project files:');
    missingFiles.forEach(file => {
      console.error(`   ${file} is required`);
    });
    process.exit(1);
  }
  
  // Check if next.config.js has static export configuration
  try {
    const nextConfig = require(path.join(process.cwd(), 'next.config.js'));
    if (!nextConfig.output || nextConfig.output !== 'export') {
      console.warn('⚠️  Warning: next.config.js should have output: "export" for Cloudflare Pages');
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not validate next.config.js configuration');
  }
}

// Execute command with proper error handling
function executeCommand(command, description, options = {}) {
  try {
    console.log(`🔄 ${description}...`);
    console.log(`   Command: ${command}`);
    
    execSync(command, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID
      },
      ...options
    });
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(`   ${error.message}`);
    return false;
  }
}

// Build the Next.js application
function buildApplication() {
  console.log('\n📦 Building Next.js application...');
  
  // Check if build script exists
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (!packageJson.scripts || !packageJson.scripts.build) {
    console.error('❌ No build script found in package.json');
    process.exit(1);
  }
  
  const buildSuccess = executeCommand('npm run build', 'Build process');
  
  if (!buildSuccess) {
    console.error('\n🔧 Build troubleshooting:');
    console.error('   • Check for TypeScript errors');
    console.error('   • Verify all dependencies are installed');
    console.error('   • Ensure next.config.js is properly configured');
    process.exit(1);
  }
  
  // Verify build output
  const outDir = path.join(process.cwd(), BUILD_OUTPUT_DIR);
  if (!fs.existsSync(outDir)) {
    console.error(`❌ Build output directory '${BUILD_OUTPUT_DIR}' not found`);
    console.error('   Please check your next.config.js configuration');
    process.exit(1);
  }
  
  console.log('✅ Build validation completed');
}

// Deploy to Cloudflare Pages
function deployToCloudflare() {
  console.log('\n🌐 Deploying to Cloudflare Pages...');
  
  const fullProjectName = `${projectName}-${environment}`;
  const deployCommand = `npx wrangler pages deploy ${BUILD_OUTPUT_DIR} --project-name ${fullProjectName}`;
  
  try {
    // Try to deploy first
    executeCommand(deployCommand, 'Cloudflare Pages deployment');
  } catch (error) {
    if (error.message.includes('Project not found') || error.message.includes('404')) {
      console.log('📝 Project not found, creating new project...');
      
      // Create the project first
      const createCommand = `npx wrangler pages project create ${fullProjectName}`;
      const createSuccess = executeCommand(createCommand, 'Project creation');
      
      if (!createSuccess) {
        console.error('❌ Failed to create project');
        process.exit(1);
      }
      
      // Now deploy
      const deploySuccess = executeCommand(deployCommand, 'Cloudflare Pages deployment');
      
      if (!deploySuccess) {
        console.error('❌ Deployment failed after project creation');
        process.exit(1);
      }
    } else {
      throw error;
    }
  }
}

// Display deployment success information
function displaySuccessInfo() {
  console.log('\n🎉 Deployment completed successfully!');
  console.log(`📋 Your Next.js application is now live on Cloudflare Pages`);
  console.log(`📱 Project: ${projectName}-${environment}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log('\n📝 Next steps:');
  console.log('   • Check your Cloudflare dashboard for the deployment URL');
  console.log('   • Test all functionality and API endpoints');
  console.log('   • Verify environment variables are working correctly');
  console.log('   • Monitor performance and error logs');
  
  if (environment === 'production') {
    console.log('\n🔒 Production deployment considerations:');
    console.log('   • Set up custom domain if needed');
    console.log('   • Configure SSL/TLS settings');
    console.log('   • Set up monitoring and alerts');
    console.log('   • Review security settings');
  }
}

// Main deployment function
async function main() {
  console.log(`🚀 Starting Next.js deployment to Cloudflare Pages...`);
  console.log(`📱 Project: ${projectName}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🔧 Build output: ${BUILD_OUTPUT_DIR}\n`);
  
  try {
    // Step 1: Validate environment
    validateEnvironmentVariables();
    validateProjectConfiguration();
    
    // Step 2: Build application
    buildApplication();
    
    // Step 3: Deploy to Cloudflare
    deployToCloudflare();
    
    // Step 4: Display success information
    displaySuccessInfo();
    
  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Ensure all environment variables are set correctly');
    console.error('   • Check that Cloudflare API token has Pages permissions');
    console.error('   • Verify account ID is correct');
    console.error('   • Try running "npm run build" manually first');
    console.error('   • Check Cloudflare dashboard for any issues');
    console.error('   • Review build logs for errors');
    process.exit(1);
  }
}

// Run the deployment
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentVariables,
  validateProjectConfiguration,
  buildApplication,
  deployToCloudflare,
  displaySuccessInfo
};
