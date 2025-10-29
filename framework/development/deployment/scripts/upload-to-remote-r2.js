#!/usr/bin/env node

/**
 * Upload files to Cloudflare R2 Remote using REST API
 * This bypasses wrangler's permission issues
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'dd84ae290b8a011725410e223c0ea928';
const BUCKET_NAME = 'rules-framework-files';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!API_TOKEN) {
  console.error('❌ CLOUDFLARE_API_TOKEN environment variable not set');
  process.exit(1);
}

async function uploadToRemoteR2(key, filePath) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${key}`;
  
  try {
    const fileContent = readFileSync(filePath);
    const contentLength = fileContent.length;
    
    // Get upload URL first
    const uploadUrlResponse = execSync(
      `curl -s -X POST "${url}" -H "Authorization: Bearer ${API_TOKEN}" -H "Content-Length: 0"`,
      { encoding: 'utf8' }
    );
    
    const uploadUrl = JSON.parse(uploadUrlResponse).result?.uploadURL;
    
    if (!uploadUrl) {
      throw new Error('Failed to get upload URL');
    }
    
    // Upload file
    execSync(
      `curl -s -X PUT "${uploadUrl}" --data-binary @"${filePath}" -H "Content-Length: ${contentLength}"`,
      { stdio: 'pipe' }
    );
    
    console.log(`✅ Uploaded ${key} to remote R2`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload ${key}:`, error.message);
    return false;
  }
}

// Upload critical files
const criticalFiles = [
  { key: 'setup-wizard.js', path: join(process.cwd(), '..', '..', '..', '..', 'framework', 'development', 'scripts', 'setup-wizard.js') },
  { key: 'setup.sh', path: join(process.cwd(), '..', '..', '..', '..', 'setup.sh') },
  { key: 'mcp-server.js', path: join(process.cwd(), '..', '..', '..', '..', 'framework', 'external', 'mcp-server.js') }
];

console.log('🚀 Uploading critical files to remote R2...\n');

for (const file of criticalFiles) {
  await uploadToRemoteR2(file.key, file.path);
}

console.log('\n✅ Done!');


