#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are required');
  console.error('   Please check your .env file or environment variables');
  process.exit(1);
}

console.log('🚀 Starting SolSource MVP Presentation deployment to Cloudflare Pages...\n');

try {
  // Step 1: Build the Next.js application
  console.log('📦 Building Next.js application...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully\n');

  // Step 2: Check if out directory exists
  const outDir = path.join(__dirname, 'out');
  if (!fs.existsSync(outDir)) {
    throw new Error('Build output directory not found. Please run "npm run build" first.');
  }

  // Step 3: Create project if it doesn't exist, then deploy
  console.log('🌐 Deploying to Cloudflare Pages...');
  
  // Set environment variables for Wrangler
  process.env.CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_ACCOUNT_ID = CLOUDFLARE_ACCOUNT_ID;

  try {
    // Try to deploy first
    const deployCommand = `npx wrangler pages deploy out --project-name solsource-mvp-presentation`;
    console.log(`Executing: ${deployCommand}`);
    execSync(deployCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID
      }
    });
  } catch (error) {
    if (error.message.includes('Project not found')) {
      console.log('📝 Project not found, creating new project...');
      
      // Create the project first
      const createCommand = `npx wrangler pages project create solsource-mvp-presentation`;
      console.log(`Executing: ${createCommand}`);
      execSync(createCommand, { 
        stdio: 'inherit',
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN,
          CLOUDFLARE_ACCOUNT_ID
        }
      });
      
      // Now deploy
      const deployCommand = `npx wrangler pages deploy out --project-name solsource-mvp-presentation`;
      console.log(`Executing: ${deployCommand}`);
      execSync(deployCommand, { 
        stdio: 'inherit',
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN,
          CLOUDFLARE_ACCOUNT_ID
        }
      });
    } else {
      throw error;
    }
  }

  console.log('\n🎉 Deployment completed successfully!');
  console.log('📋 Your SolSource MVP Presentation is now live on Cloudflare Pages');
  console.log('🔐 Access is protected with server-side passphrase validation');
  console.log('\n📝 Next steps:');
  console.log('   • Check your Cloudflare dashboard for the deployment URL');
  console.log('   • Test the passphrase protection');
  console.log('   • Verify all slides are working correctly');

} catch (error) {
  console.error('\n❌ Deployment failed:');
  console.error(error.message);
  console.error('\n🔧 Troubleshooting:');
  console.error('   • Ensure all environment variables are set correctly');
  console.error('   • Check that Cloudflare API token has Pages permissions');
  console.error('   • Verify account ID is correct');
  console.error('   • Try running "npm run build" manually first');
  process.exit(1);
}
