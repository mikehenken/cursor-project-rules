# Cloudflare Workers Deployment for Rules Framework

This guide explains how to deploy the Rules Framework to Cloudflare Workers, making it available for other projects to pull deployment files, rules, and documentation.

## 🎯 Overview

The Rules Framework can be deployed as a Cloudflare Worker that serves:
- **Deployment Files** - Next.js Cloudflare Pages deployment boilerplate
- **Purpose-Scoped Rules** - Cursor rules organized by domain
- **Documentation** - Complete guides and setup instructions

## 🚀 Quick Start

### 1. Prerequisites

- Cloudflare account with Workers and R2 enabled
- Node.js 18+ installed
- Wrangler CLI installed: `npm install -g wrangler`

### 2. Configure Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create R2 bucket for file storage
wrangler r2 bucket create rules-framework-files

# Note the bucket name and account ID for configuration
```

### 3. Configure Environment

Update `wrangler.toml` with your settings:

```toml
name = "rules-framework"
main = "src/index.js"

# Update with your account ID
[env.production]
name = "rules-framework"
route = "rules-framework.your-domain.com/*"

# Update with your R2 bucket name
[[r2_buckets]]
binding = "RULES_STORAGE"
bucket_name = "rules-framework-files"
```

### 4. Deploy Framework

```bash
# Install dependencies
npm install

# Deploy to Cloudflare Workers
npm run deploy

# Or use the deployment script
node scripts/deploy-framework.js
```

## 📁 Framework Structure

### Deployment Files
- `deploy-template.js` - Universal deployment script
- `next.config.template.js` - Next.js configuration template
- `wrangler.template.toml` - Cloudflare configuration template
- `package.template.json` - Package configuration template
- `env.example` - Environment variables template

### Purpose-Scoped Rules
- `core/` - Essential project-wide rules
- `backend/` - Backend and API development rules
- `docs/` - Documentation standards and organization
- `testing/` - Testing requirements and protocols
- `ci-cd/` - CI/CD and deployment rules

### Documentation
- Complete setup and deployment guides
- Purpose-scoped rules documentation
- Troubleshooting and best practices

## 🔧 API Endpoints

Once deployed, your framework provides these endpoints:

### **List Endpoints**
- `GET /api/files` - List available deployment files
- `GET /api/rules` - List available rules by purpose
- `GET /api/docs` - List available documentation

### **Pull Endpoints**
- `GET /api/pull?type=deployment` - Pull all deployment files
- `GET /api/pull?type=rules` - Pull all rules files
- `GET /api/pull?type=docs` - Pull all documentation

### **File Access**
- `GET /files/{filename}` - Access individual deployment files
- `GET /docs/{filename}` - Access individual documentation files
- `GET /rules/{purpose}/{filename}` - Access individual rule files

## 📥 Using the Deployed Framework

### **From Another Cursor Project**

1. **Pull Deployment Files**
```bash
# Download the pull script
curl -o pull-framework.js https://your-framework-url.com/files/pull-framework.js

# Pull deployment files
node pull-framework.js deployment
```

2. **Pull Rules Files**
```bash
# Pull purpose-scoped rules
node pull-framework.js rules

# Copy specific rule sets to your project
cp -r rules-framework-files/rules/core/ your-project/.cursor/rules/
cp -r rules-framework-files/rules/backend/ your-project/.cursor/rules/
```

3. **Pull Documentation**
```bash
# Pull documentation
node pull-framework.js docs

# Review setup guides
cat rules-framework-files/docs/CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md
```

### **Direct API Access**

```bash
# Get deployment files
curl "https://your-framework-url.com/api/pull?type=deployment" > deployment-files.json

# Get rules files
curl "https://your-framework-url.com/api/pull?type=rules" > rules-files.json

# Get documentation
curl "https://your-framework-url.com/api/pull?type=docs" > docs-files.json
```

## 🛠️ Configuration

### **Environment Variables**

Set these in your Cloudflare Workers dashboard:

```bash
FRAMEWORK_VERSION=1.0.0
DEPLOYMENT_TYPE=cloudflare-workers
```

### **R2 Storage Configuration**

The framework uses R2 for file storage:

```toml
[[r2_buckets]]
binding = "RULES_STORAGE"
bucket_name = "rules-framework-files"
preview_bucket_name = "rules-framework-files-preview"
```

### **KV Namespace (Optional)**

For caching frequently accessed files:

```toml
[[kv_namespaces]]
binding = "RULES_CACHE"
id = "your-kv-namespace-id"
```

## 🔄 Updating the Framework

### **Update Files**

1. **Modify source files** in your local repository
2. **Run deployment script** to upload changes:
```bash
node scripts/deploy-framework.js
```

3. **Files are automatically updated** in R2 storage

### **Add New Files**

1. **Add files to appropriate directories**
2. **Update deployment script** if needed
3. **Redeploy** to make files available

### **Version Management**

The framework includes version information:
- Framework version in API responses
- File timestamps for cache invalidation
- Content-Type headers for proper file handling

## 📊 Monitoring and Analytics

### **Cloudflare Analytics**

Monitor your framework usage:
- Request volume and patterns
- Geographic distribution
- Error rates and performance

### **Custom Analytics**

Add custom analytics to track:
- Most downloaded files
- Popular rule sets
- Documentation usage

## 🔒 Security Considerations

### **CORS Configuration**

The framework includes CORS headers for cross-origin access:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### **Rate Limiting**

Consider implementing rate limiting for:
- API endpoints
- File downloads
- Bulk operations

### **Authentication (Optional)**

For private frameworks, add authentication:
- API key validation
- User authentication
- Access control

## 🚨 Troubleshooting

### **Common Issues**

1. **R2 Bucket Not Found**
   - Verify bucket name in `wrangler.toml`
   - Check bucket exists in Cloudflare dashboard
   - Ensure proper permissions

2. **Files Not Uploading**
   - Check file paths in deployment script
   - Verify file permissions
   - Review deployment logs

3. **API Endpoints Not Working**
   - Verify worker deployment
   - Check route configuration
   - Review worker logs

### **Debugging**

Enable debug logging:
```bash
# Deploy with debug logging
wrangler deploy --compatibility-date 2024-01-01 --log-level debug
```

Check worker logs:
```bash
# View real-time logs
wrangler tail

# View specific worker logs
wrangler tail --name rules-framework
```

## 📈 Performance Optimization

### **Caching**

Implement caching for:
- Frequently accessed files
- API responses
- Static content

### **CDN Integration**

Use Cloudflare's CDN for:
- Global file distribution
- Reduced latency
- Bandwidth optimization

### **Compression**

Enable compression for:
- Large documentation files
- JSON responses
- Static assets

## 🔄 Backup and Recovery

### **R2 Backup**

Regularly backup your R2 bucket:
```bash
# List all files
wrangler r2 object list rules-framework-files

# Download specific files
wrangler r2 object get rules-framework-files/filename
```

### **Version Control**

Maintain version control for:
- Framework source code
- Configuration files
- Deployment scripts

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [R2 Storage Documentation](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

## 🎯 Next Steps

1. **Deploy your framework** using this guide
2. **Test the API endpoints** to ensure everything works
3. **Share the framework URL** with other projects
4. **Monitor usage** and optimize as needed
5. **Update files** as the framework evolves

Your Rules Framework is now deployed and ready for other projects to pull files and documentation!
