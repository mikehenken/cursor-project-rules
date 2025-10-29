#!/usr/bin/env node

/**
 * Enable R2 and create bucket via Cloudflare API
 * This script helps enable R2 storage for the Cloudflare account
 */

// Note: R2 must be enabled in Cloudflare Dashboard first

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || 'dd84ae290b8a011725410e223c0ea928';
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!apiToken) {
  console.error('❌ CLOUDFLARE_API_TOKEN environment variable is required');
  console.error('   Set it with: export CLOUDFLARE_API_TOKEN="your-token"');
  console.error('   Or use wrangler login to authenticate');
  process.exit(1);
}

console.log('🚀 Attempting to enable R2 storage...\n');

// Try to create bucket via Cloudflare API
try {
  const bucketName = 'rules-framework-files';
  
  console.log(`📦 Creating R2 bucket: ${bucketName}...`);
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: bucketName,
        location: 'wnam', // Western North America
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log(`✅ Bucket "${bucketName}" created successfully!`);
    console.log('\n📝 Next steps:');
    console.log('   1. Make sure R2 is enabled in your Cloudflare Dashboard');
    console.log('   2. Redeploy the worker: node scripts/deploy-framework.js');
  } else {
    if (data.errors && data.errors[0]?.code === 10042) {
      console.error('❌ R2 is not enabled for your account.');
      console.error('\n📋 Please enable R2 in the Cloudflare Dashboard:');
      console.error('   1. Go to https://dash.cloudflare.com/');
      console.error('   2. Click on "R2" in the left sidebar');
      console.error('   3. Click "Get Started" or "Purchase R2" to enable it');
      console.error('   4. Then run this script again to create the bucket');
    } else {
      console.error('❌ Failed to create bucket:', data.errors?.[0]?.message || data);
      console.error('\nFull response:', JSON.stringify(data, null, 2));
    }
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\n📋 Manual steps to enable R2:');
  console.error('   1. Go to https://dash.cloudflare.com/');
  console.error('   2. Click on "R2" in the left sidebar under Storage');
  console.error('   3. Click "Get Started" or "Purchase R2"');
  console.error('   4. Create a bucket named "rules-framework-files"');
  console.error('   5. Then run: node scripts/deploy-framework.js');
  process.exit(1);
}

