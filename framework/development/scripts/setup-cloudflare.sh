#!/bin/bash

# Setup script for Cloudflare deployment
echo "🚀 Setting up Cloudflare deployment for Rules Framework..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your Cloudflare credentials:"
    echo "   - CLOUDFLARE_API_TOKEN: Get from https://dash.cloudflare.com/profile/api-tokens"
    echo "   - CLOUDFLARE_ACCOUNT_ID: Get from https://dash.cloudflare.com/ (right sidebar)"
    echo ""
    echo "📖 Instructions:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Create a custom token with these permissions:"
    echo "   - Account: Cloudflare Workers:Edit"
    echo "   - Account: Account Settings:Read"
    echo "   - Zone: Zone:Read (if using custom domain)"
    echo "3. Copy the token to CLOUDFLARE_API_TOKEN in .env"
    echo "4. Get your Account ID from https://dash.cloudflare.com/ (right sidebar)"
    echo "5. Copy the Account ID to CLOUDFLARE_ACCOUNT_ID in .env"
    echo ""
    echo "After editing .env, run: npm run deploy:framework"
    exit 1
fi

# Load environment variables
source .env

# Check if required variables are set
if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ "$CLOUDFLARE_API_TOKEN" = "your_cloudflare_api_token_here" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not set in .env file"
    echo "Please edit .env file with your Cloudflare API token"
    exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ "$CLOUDFLARE_ACCOUNT_ID" = "your_cloudflare_account_id_here" ]; then
    echo "❌ CLOUDFLARE_ACCOUNT_ID not set in .env file"
    echo "Please edit .env file with your Cloudflare Account ID"
    exit 1
fi

echo "✅ Environment variables configured"
echo "🔧 Setting up Cloudflare resources..."

# Create R2 bucket
echo "📦 Creating R2 bucket: $R2_BUCKET_NAME"
npx wrangler r2 bucket create $R2_BUCKET_NAME || echo "Bucket may already exist"

# Update wrangler.toml with account ID
echo "⚙️  Updating wrangler.toml with Account ID..."
sed -i "s/your-account-id-here/$CLOUDFLARE_ACCOUNT_ID/g" wrangler.toml
sed -i "s/your-kv-namespace-id/$(uuidgen | tr '[:upper:]' '[:lower:]')/g" wrangler.toml

echo "✅ Cloudflare setup complete!"
echo "🚀 Ready to deploy. Run: npm run deploy:framework"
