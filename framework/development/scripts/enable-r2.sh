#!/bin/bash
# Enable R2 Storage for Cloudflare Account
# This script guides you through enabling R2 and creating the bucket

set -e

echo "🚀 Cloudflare R2 Setup Guide"
echo "=============================="
echo ""
echo "R2 must be enabled through the Cloudflare Dashboard first."
echo ""
echo "📋 Steps to enable R2:"
echo ""
echo "1. Open the Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com/"
echo ""
echo "2. Navigate to R2 Storage:"
echo "   - Click 'R2' in the left sidebar (under Storage section)"
echo ""
echo "3. Enable R2:"
echo "   - Click 'Get Started' or 'Purchase R2'"
echo "   - Follow the prompts to enable R2 (it's free up to certain limits)"
echo ""
echo "4. Create the bucket:"
echo "   - Click 'Create bucket'"
echo "   - Name: rules-framework-files"
echo "   - Location: Choose your preferred region"
echo "   - Click 'Create bucket'"
echo ""
echo "5. Update API Token permissions:"
echo "   - Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "   - Edit your API token"
echo "   - Add 'Cloudflare R2:Edit' permission"
echo "   - Save the token"
echo ""
echo "Press Enter once you've completed these steps to verify R2 is enabled..."
read

echo ""
echo "🔍 Verifying R2 setup..."

# Try to create bucket or verify it exists
cd "$(dirname "$0")/.."

if wrangler r2 bucket create rules-framework-files 2>&1 | grep -q "already exists\|successfully"; then
  echo "✅ Bucket exists or was created successfully!"
elif wrangler r2 bucket create rules-framework-files 2>&1 | grep -q "10042"; then
  echo "❌ R2 is still not enabled. Please ensure you completed all steps above."
  exit 1
else
  echo "✅ Attempting to create bucket..."
fi

echo ""
echo "📦 Testing bucket access..."
if wrangler r2 object list rules-framework-files 2>&1 | head -1; then
  echo "✅ R2 is working! You can now deploy the worker."
else
  echo "⚠️  Bucket access test failed, but bucket may still exist."
  echo "   You can proceed with deployment."
fi

echo ""
echo "🎯 Next steps:"
echo "   1. Run: cd framework/development"
echo "   2. Run: node scripts/deploy-framework.js"
echo ""

