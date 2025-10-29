# Cloudflare Pages Deployment Setup Guide

Complete setup instructions for deploying Next.js applications to Cloudflare Pages using the boilerplate.

## 📋 Prerequisites

### Required Accounts
- [Cloudflare Account](https://dash.cloudflare.com/sign-up) (free tier available)
- [GitHub Account](https://github.com) (for version control)

### Required Software
- Node.js 18+ ([Download](https://nodejs.org/))
- npm 8+ (comes with Node.js)
- Git ([Download](https://git-scm.com/))

## 🔧 Cloudflare Setup

### 1. Get Cloudflare Account ID

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Copy the **Account ID** from the right sidebar
4. Save this for your `.env` file

### 2. Create API Token

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **"Create Token"**
3. Use **"Custom token"** template
4. Configure permissions:
   - **Account**: `Cloudflare Pages:Edit`
   - **Zone Resources**: `Include - All zones` (or specific zones)
5. Click **"Continue to summary"**
6. Click **"Create Token"**
7. **Copy the token immediately** (you won't see it again)
8. Save this for your `.env` file

### 3. Verify API Access

Test your credentials:

```bash
# Install Wrangler globally (optional)
npm install -g wrangler

# Test authentication
npx wrangler whoami
```

## 🚀 Project Setup

### 1. Initialize New Project

```bash
# Create new Next.js project
npx create-next-app@latest my-project
cd my-project

# Or use existing project
cd your-existing-project
```

### 2. Use Boilerplate Files

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

### 3. Install Dependencies

```bash
# Install required dependencies
npm install

# Install additional dependencies if needed
npm install dotenv wrangler
```

### 4. Configure Environment Variables

Edit your `.env` file:

```bash
# Required Cloudflare credentials
CLOUDFLARE_API_TOKEN=your_actual_token_here
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id_here

# Project configuration
PROJECT_NAME=my-awesome-project
DEPLOYMENT_ENV=production

# Add your application-specific variables
# DATABASE_URL=your_database_url
# API_KEY=your_api_key
```

### 5. Update Project Configuration

#### Update `wrangler.toml`:
```toml
name = "my-awesome-project"
compatibility_date = "2023-10-17"

[env.production]
name = "my-awesome-project-production"

[env.staging]
name = "my-awesome-project-staging"
```

#### Update `package.json`:
```json
{
  "name": "my-awesome-project",
  "scripts": {
    "deploy": "node deploy.js",
    "deploy:staging": "node deploy.js my-awesome-project staging",
    "deploy:production": "node deploy.js my-awesome-project production"
  }
}
```

## 🧪 Testing Setup

### 1. Test Build Process

```bash
# Test the build
npm run build

# Verify output directory
ls -la out/
```

### 2. Test Environment Variables

```bash
# Test environment loading
node -e "require('dotenv').config(); console.log('Token:', process.env.CLOUDFLARE_API_TOKEN ? 'Set' : 'Missing')"
```

### 3. Test Wrangler Connection

```bash
# Test Cloudflare connection
npx wrangler whoami
```

## 🚀 First Deployment

### 1. Deploy to Staging

```bash
# Deploy to staging first
npm run deploy:staging
```

### 2. Verify Deployment

1. Check [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Find your project: `my-awesome-project-staging`
3. Click on the project
4. Copy the deployment URL
5. Test the deployed application

### 3. Deploy to Production

```bash
# Deploy to production
npm run deploy:production
```

## 🔍 Verification Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Build process successful
- [ ] Wrangler authentication working
- [ ] Project configuration updated

### Post-Deployment
- [ ] Application accessible via URL
- [ ] All pages loading correctly
- [ ] API routes working (if any)
- [ ] Environment variables accessible
- [ ] Performance acceptable

## 🛠️ Customization

### Custom Build Process

If you need custom build steps:

```javascript
// In deploy.js, modify the build function
function buildApplication() {
  // Custom pre-build steps
  executeCommand('npm run prebuild', 'Pre-build process');
  
  // Standard build
  executeCommand('npm run build', 'Build process');
  
  // Custom post-build steps
  executeCommand('npm run postbuild', 'Post-build process');
}
```

### Environment-Specific Configuration

```javascript
// In deploy.js, add environment-specific logic
const environmentConfig = {
  production: {
    buildCommand: 'npm run build:prod',
    projectSuffix: 'prod'
  },
  staging: {
    buildCommand: 'npm run build:staging',
    projectSuffix: 'staging'
  }
};
```

### Custom Domain Setup

1. **In Cloudflare Dashboard**:
   - Go to Pages → Your Project → Custom domains
   - Add your domain
   - Configure DNS records

2. **In `wrangler.toml`**:
   ```toml
   [[env.production.routes]]
   pattern = "your-app.yourdomain.com"
   zone_name = "yourdomain.com"
   ```

## 🔒 Security Configuration

### Environment Variables Security

1. **Never commit `.env` files**:
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Use different tokens per environment**:
   ```bash
   # Production
   CLOUDFLARE_API_TOKEN=prod_token_here
   
   # Staging
   CLOUDFLARE_API_TOKEN=staging_token_here
   ```

3. **Rotate tokens regularly**:
   - Create new tokens
   - Update `.env` files
   - Test deployment
   - Delete old tokens

### Application Security

1. **Implement authentication**:
   ```javascript
   // pages/api/auth.js
   export default function handler(req, res) {
     const token = req.headers.authorization;
     if (!isValidToken(token)) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     // Handle authenticated request
   }
   ```

2. **Use security headers**:
   ```javascript
   // In next.config.js
   async headers() {
     return [
       {
         source: '/(.*)',
         headers: [
           { key: 'X-Frame-Options', value: 'DENY' },
           { key: 'X-Content-Type-Options', value: 'nosniff' },
           { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
         ]
       }
     ];
   }
   ```

## 📊 Monitoring Setup

### 1. Cloudflare Analytics

Enable in Cloudflare Dashboard:
- Go to Pages → Your Project → Analytics
- Enable Web Analytics
- Configure custom events

### 2. Error Monitoring

Add error tracking:

```javascript
// pages/_app.js
export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Initialize error tracking
    if (typeof window !== 'undefined') {
      // Add your error tracking service
    }
  }, []);
  
  return <Component {...pageProps} />;
}
```

### 3. Performance Monitoring

```javascript
// pages/_app.js
export function reportWebVitals(metric) {
  // Send to analytics service
  console.log(metric);
}
```

## 🚨 Troubleshooting

### Common Setup Issues

#### 1. "Command not found: wrangler"
```bash
# Solution: Install wrangler
npm install wrangler
# Or use npx
npx wrangler whoami
```

#### 2. "Invalid API token"
```bash
# Solution: Verify token permissions
npx wrangler whoami
# Check token has "Cloudflare Pages:Edit" permission
```

#### 3. "Account ID not found"
```bash
# Solution: Verify account ID
# Check Cloudflare dashboard right sidebar
# Ensure you're using the correct account
```

#### 4. "Build failed"
```bash
# Solution: Check build process
npm run build
# Fix any TypeScript/JavaScript errors
# Verify next.config.js configuration
```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment variable
DEBUG=true npm run deploy

# Or modify deploy.js
console.log('Debug info:', { projectName, environment, buildDir });
```

## 📚 Next Steps

### 1. Set Up CI/CD

Consider setting up automated deployments:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 2. Add Custom Domain

1. Purchase domain or use existing
2. Add to Cloudflare
3. Configure DNS records
4. Update `wrangler.toml`

### 3. Implement Monitoring

1. Set up error tracking
2. Configure performance monitoring
3. Set up alerts
4. Review analytics regularly

---

**Your Next.js application is now ready for Cloudflare Pages deployment! 🎉**
