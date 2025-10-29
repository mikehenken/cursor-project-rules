#!/usr/bin/env node

/**
 * Configure Cloudflare API Tokens for Rules Framework Deployment
 * This script helps you update token permissions via the Cloudflare API
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load credentials from the read-dontchange file
const credentialsPath = join(__dirname, '..', 'templates', 'nextjs-cloudflare', 'read-dontchange');
const credentials = readFileSync(credentialsPath, 'utf8');

// Parse credentials
const parseCredentials = (content) => {
  const lines = content.split('\n');
  const creds = {};
  
  for (const line of lines) {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      creds[key.trim()] = value.trim();
    }
  }
  
  return creds;
};

const creds = parseCredentials(credentials);

console.log('🔧 Cloudflare Token Configuration Helper');
console.log('=====================================\n');

console.log('📋 Current Credentials Found:');
console.log(`- CLOUDFLARE_API_TOKEN: ${creds.CLOUDFLARE_API_TOKEN ? '✅ Set' : '❌ Not found'}`);
console.log(`- CLOUDFLARE_ACCOUNT_TOKEN: ${creds.CLOUDFLARE_ACCOUNT_TOKEN ? '✅ Set' : '❌ Not found'}`);
console.log(`- CLOUDFLARE_GLOBAL_TOKEN: ${creds.CLOUDFLARE_GLOBAL_TOKEN ? '✅ Set' : '❌ Not found'}`);
console.log(`- CLOUDFLARE_EMAIL: ${creds.CLOUDFLARE_EMAIL ? '✅ Set' : '❌ Not found'}`);
console.log(`- CLOUDFLARE_ACCOUNT_ID: ${creds.CLOUDFLARE_ACCOUNT_ID ? '✅ Set' : '❌ Not found'}\n`);

console.log('🎯 Required Permissions for Rules Framework Deployment:');
console.log('==================================================');
console.log('1. Cloudflare Workers:Edit');
console.log('2. Account Settings:Read');
console.log('3. Cloudflare R2:Edit (for file storage)');
console.log('4. Zone:Read (if using custom domain)\n');

console.log('🔧 Token Configuration Options:');
console.log('===============================\n');

console.log('Option 1: Update Existing Token Permissions');
console.log('-------------------------------------------');
console.log('1. Go to: https://dash.cloudflare.com/profile/api-tokens');
console.log('2. Find your token (starts with: ueStPGQVz7vDPmIcdhWjET1EOy-Sqn0onwDi0cai)');
console.log('3. Click "Edit"');
console.log('4. Add these permissions:');
console.log('   ✅ Account: Cloudflare Workers:Edit');
console.log('   ✅ Account: Account Settings:Read');
console.log('   ✅ Account: Cloudflare R2:Edit');
console.log('   ✅ Account: Zone:Read');
console.log('5. Save the token\n');

console.log('Option 2: Create New Token with Correct Permissions');
console.log('--------------------------------------------------');
console.log('1. Go to: https://dash.cloudflare.com/profile/api-tokens');
console.log('2. Click "Create Token"');
console.log('3. Use "Custom token" template');
console.log('4. Set permissions:');
console.log('   ✅ Account: Cloudflare Workers:Edit');
console.log('   ✅ Account: Account Settings:Read');
console.log('   ✅ Account: Cloudflare R2:Edit');
console.log('   ✅ Account: Zone:Read');
console.log('5. Account Resources: Include your account');
console.log('6. Copy the new token and update your .env file\n');

console.log('Option 3: Use Global API Key (Less Secure)');
console.log('------------------------------------------');
console.log('The Global API Key has full permissions but is less secure.');
console.log('You can use it for deployment by setting:');
console.log(`export CLOUDFLARE_EMAIL=${creds.CLOUDFLARE_EMAIL}`);
console.log(`export CLOUDFLARE_API_KEY=${creds.CLOUDFLARE_GLOBAL_TOKEN}\n`);

console.log('🧪 Test Token Permissions');
console.log('========================');
console.log('After updating permissions, test with:');
console.log('```bash');
console.log('export CLOUDFLARE_API_TOKEN=your_updated_token');
console.log('npx wrangler whoami');
console.log('npx wrangler deploy --config wrangler-simple.toml');
console.log('```\n');

console.log('📚 Additional Resources:');
console.log('======================');
console.log('- Token Permissions Guide: https://developers.cloudflare.com/fundamentals/api/get-started/permissions/');
console.log('- Workers API: https://developers.cloudflare.com/workers/api/');
console.log('- R2 API: https://developers.cloudflare.com/r2/api/');
console.log('- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/');

console.log('\n🎯 Recommended Next Steps:');
console.log('========================');
console.log('1. Update your existing token permissions (Option 1)');
console.log('2. Test the token with: npx wrangler whoami');
console.log('3. Try deployment with: npx wrangler deploy --config wrangler-simple.toml');
console.log('4. If successful, your Rules Framework will be deployed!');
