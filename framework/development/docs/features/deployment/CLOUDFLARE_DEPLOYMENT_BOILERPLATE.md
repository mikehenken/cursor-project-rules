# Next.js Cloudflare Pages Deployment Boilerplate

A comprehensive, reusable deployment solution for Next.js applications on Cloudflare Pages with Cursor AI integration.

## 🚀 Quick Start

### 1. Use Boilerplate Files

The boilerplate files are already included in your project:

```bash
# Rename template files to active files
mv templates/nextjs-cloudflare/deploy-template.js deploy.js
mv templates/nextjs-cloudflare/next.config.template.js next.config.js
mv templates/nextjs-cloudflare/wrangler.template.toml wrangler.toml
mv templates/nextjs-cloudflare/package.template.json package.json

# Copy environment template
cp templates/nextjs-cloudflare/env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your Cloudflare credentials:

```bash
CLOUDFLARE_API_TOKEN=your_actual_token_here
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id_here
PROJECT_NAME=your-project-name
DEPLOYMENT_ENV=production
```

### 3. Deploy

```bash
npm install
npm run deploy
```

## 📁 Boilerplate Files

### Core Files

| File | Purpose | Required |
|------|---------|----------|
| `.cursorrules` | Cursor AI deployment rules | ✅ |
| `deploy-template.js` | Universal deployment script | ✅ |
| `env.example` | Environment variables template | ✅ |
| `next.config.template.js` | Next.js static export config | ✅ |
| `wrangler.template.toml` | Cloudflare configuration | ✅ |
| `package.template.json` | Dependencies and scripts | ✅ |

### Documentation Files

| File | Purpose |
|------|---------|
| `CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md` | This guide |
| `DEPLOYMENT_SETUP.md` | Detailed setup instructions |
| `TROUBLESHOOTING.md` | Common issues and solutions |

## 🛠️ Features

### Deployment Automation
- ✅ Environment variable validation
- ✅ Automatic project creation
- ✅ Build validation
- ✅ Comprehensive error handling
- ✅ Multi-environment support
- ✅ Deployment status reporting

### Next.js Optimization
- ✅ Static export configuration
- ✅ Image optimization for static export
- ✅ Trailing slash support
- ✅ Security headers
- ✅ Redirect configuration

### Cloudflare Integration
- ✅ Wrangler CLI automation
- ✅ Environment-specific deployments
- ✅ Custom domain support
- ✅ Environment variables management

## 🔧 Configuration

### Environment Variables

#### Required Variables
```bash
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

#### Optional Variables
```bash
PROJECT_NAME=your-project-name
DEPLOYMENT_ENV=production|staging|development
```

### Next.js Configuration

The boilerplate includes optimized `next.config.js` for Cloudflare Pages:

```javascript
const nextConfig = {
  output: 'export',           // Required for static export
  trailingSlash: true,        // Consistent routing
  images: {
    unoptimized: true         // Required for static export
  }
}
```

### Cloudflare Configuration

Environment-specific deployments with `wrangler.toml`:

```toml
[env.production]
name = "your-project-production"

[env.staging]
name = "your-project-staging"
```

## 🚀 Deployment Commands

### Basic Deployment
```bash
npm run deploy
```

### Environment-Specific Deployment
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Custom project and environment
node deploy.js my-project staging
```

### Manual Deployment
```bash
# Build first
npm run build

# Deploy with custom settings
node deploy.js project-name environment
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Missing Environment Variables
```
❌ Missing required environment variables:
   CLOUDFLARE_API_TOKEN is required
```
**Solution**: Check your `.env` file and ensure all required variables are set.

#### 2. Build Failures
```
❌ Build process failed
```
**Solution**: 
- Check for TypeScript errors
- Verify all dependencies are installed
- Ensure `next.config.js` is properly configured

#### 3. Project Not Found
```
❌ Project not found, creating new project...
```
**Solution**: This is normal for first deployment. The script will create the project automatically.

#### 4. Deployment Failures
```
❌ Deployment failed
```
**Solution**:
- Verify Cloudflare API token has Pages permissions
- Check account ID is correct
- Ensure build output directory exists

### Debug Mode

Enable verbose logging:

```bash
DEBUG=true npm run deploy
```

### Manual Verification

1. **Check Build Output**:
   ```bash
   ls -la out/
   ```

2. **Verify Environment Variables**:
   ```bash
   node -e "console.log(process.env.CLOUDFLARE_API_TOKEN ? 'Token set' : 'Token missing')"
   ```

3. **Test Wrangler Connection**:
   ```bash
   npx wrangler whoami
   ```

## 📚 Advanced Usage

### Custom Build Process

Modify the build command in `deploy.js`:

```javascript
// Custom build command
const buildSuccess = executeCommand('npm run build:custom', 'Custom build process');
```

### Environment-Specific Configuration

Use different configurations per environment:

```javascript
// In deploy.js
const config = {
  production: { buildCommand: 'npm run build:prod' },
  staging: { buildCommand: 'npm run build:staging' },
  development: { buildCommand: 'npm run build:dev' }
};
```

### Custom Domain Setup

Configure custom domains in `wrangler.toml`:

```toml
[[env.production.routes]]
pattern = "your-app.yourdomain.com"
zone_name = "yourdomain.com"
```

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use strong, unique API tokens
- ✅ Rotate credentials regularly
- ✅ Use different values per environment

### Deployment Security
- ✅ Validate all environment variables
- ✅ Use HTTPS for all deployments
- ✅ Implement proper authentication
- ✅ Monitor deployment logs

### Code Security
- ✅ Use TypeScript for type safety
- ✅ Implement proper error handling
- ✅ Validate all inputs
- ✅ Use security headers

## 📈 Monitoring & Maintenance

### Deployment Monitoring
- Check Cloudflare dashboard for deployment status
- Monitor build logs for errors
- Verify environment variables are working
- Test all functionality after deployment

### Performance Optimization
- Monitor Core Web Vitals
- Optimize images and assets
- Use Cloudflare's CDN features
- Implement caching strategies

### Regular Maintenance
- Update dependencies regularly
- Rotate API keys
- Review security settings
- Monitor error logs

## 🤝 Contributing

### Adding New Features
1. Update the deployment script
2. Add corresponding tests
3. Update documentation
4. Test with different environments

### Reporting Issues
1. Check troubleshooting guide
2. Verify environment setup
3. Test with minimal configuration
4. Report with detailed error messages

## 📄 License

MIT License - feel free to use in your projects.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting guide
2. Review Cloudflare Pages documentation
3. Test with minimal configuration
4. Check deployment logs

---

**Happy Deploying! 🚀**
