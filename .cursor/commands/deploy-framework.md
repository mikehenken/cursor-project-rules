# Deploy Rules Framework

Deploy the Rules Framework to Cloudflare Workers.

## Usage
```bash
# Deploy to Cloudflare Workers
npm run deploy:framework

# Deploy with specific environment
npm run deploy:staging
npm run deploy:production
```

## What it does
- Uploads all rules, templates, and documentation to R2 storage
- Deploys the Cloudflare Worker
- Makes the framework available via API
- Updates the framework for other projects to use

## Prerequisites
- Cloudflare account with Workers enabled
- API token with proper permissions
- R2 bucket for file storage





