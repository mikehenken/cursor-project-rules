# Cloudflare Pages Deployment Troubleshooting

Comprehensive troubleshooting guide for Next.js applications deployed to Cloudflare Pages.

## 🚨 Common Issues & Solutions

### 1. Environment Variables Issues

#### Problem: Missing Environment Variables
```
❌ Missing required environment variables:
   CLOUDFLARE_API_TOKEN is required
```

**Solutions:**
1. **Check `.env` file exists**:
   ```bash
   ls -la .env
   ```

2. **Verify file contents**:
   ```bash
   cat .env
   ```

3. **Check for typos**:
   ```bash
   # Should be exactly:
   CLOUDFLARE_API_TOKEN=your_token_here
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   ```

4. **Test environment loading**:
   ```bash
   node -e "require('dotenv').config(); console.log(process.env.CLOUDFLARE_API_TOKEN)"
   ```

#### Problem: Invalid API Token
```
❌ Authentication failed
```

**Solutions:**
1. **Verify token permissions**:
   - Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Check token has "Cloudflare Pages:Edit" permission
   - Ensure token is not expired

2. **Test token manually**:
   ```bash
   npx wrangler whoami
   ```

3. **Create new token**:
   - Delete old token
   - Create new token with correct permissions
   - Update `.env` file

#### Problem: Wrong Account ID
```
❌ Account not found
```

**Solutions:**
1. **Get correct Account ID**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Copy Account ID from right sidebar
   - Update `.env` file

2. **Verify account access**:
   ```bash
   npx wrangler whoami
   ```

### 2. Build Process Issues

#### Problem: Build Failures
```
❌ Build process failed
```

**Solutions:**
1. **Check for TypeScript errors**:
   ```bash
   npm run build
   # Look for TypeScript compilation errors
   ```

2. **Verify dependencies**:
   ```bash
   npm install
   npm run build
   ```

3. **Check next.config.js**:
   ```javascript
   // Ensure static export is configured
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   }
   ```

4. **Clear build cache**:
   ```bash
   rm -rf .next
   rm -rf out
   npm run build
   ```

#### Problem: Missing Build Output
```
❌ Build output directory 'out' not found
```

**Solutions:**
1. **Verify next.config.js**:
   ```javascript
   const nextConfig = {
     output: 'export'  // This is required
   }
   ```

2. **Check build process**:
   ```bash
   npm run build
   ls -la out/
   ```

3. **Manual export**:
   ```bash
   npm run build
   npm run export
   ```

### 3. Deployment Issues

#### Problem: Project Not Found
```
❌ Project not found, creating new project...
```

**This is normal for first deployment. Solutions:**
1. **Let script create project automatically**
2. **Check Cloudflare dashboard** after deployment
3. **Verify project name** in deployment script

#### Problem: Deployment Fails After Project Creation
```
❌ Deployment failed after project creation
```

**Solutions:**
1. **Check project creation**:
   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
   - Verify project was created
   - Check for any errors

2. **Retry deployment**:
   ```bash
   npm run deploy
   ```

3. **Check build output**:
   ```bash
   ls -la out/
   # Ensure files exist
   ```

#### Problem: Wrangler Command Not Found
```
❌ Command not found: wrangler
```

**Solutions:**
1. **Install wrangler**:
   ```bash
   npm install wrangler
   ```

2. **Use npx**:
   ```bash
   npx wrangler pages deploy out --project-name your-project
   ```

3. **Check package.json**:
   ```json
   {
     "devDependencies": {
       "wrangler": "^3.0.0"
     }
   }
   ```

### 4. Application Issues

#### Problem: 404 Errors on Routes
```
❌ Page not found (404)
```

**Solutions:**
1. **Check trailingSlash**:
   ```javascript
   // In next.config.js
   const nextConfig = {
     trailingSlash: true
   }
   ```

2. **Verify static export**:
   ```javascript
   const nextConfig = {
     output: 'export'
   }
   ```

3. **Check file structure**:
   ```bash
   ls -la out/
   # Ensure all pages are exported
   ```

#### Problem: Images Not Loading
```
❌ Images not displaying
```

**Solutions:**
1. **Configure image optimization**:
   ```javascript
   // In next.config.js
   const nextConfig = {
     images: {
       unoptimized: true  // Required for static export
     }
   }
   ```

2. **Use public folder**:
   ```bash
   # Place images in public/ folder
   public/images/logo.png
   # Reference as: /images/logo.png
   ```

3. **Check image paths**:
   ```javascript
   // Use absolute paths
   <img src="/images/logo.png" alt="Logo" />
   ```

#### Problem: API Routes Not Working
```
❌ API endpoint returns 404
```

**Solutions:**
1. **Check API route structure**:
   ```bash
   # For Pages Router
   pages/api/hello.js
   
   # For App Router
   app/api/hello/route.js
   ```

2. **Verify static export compatibility**:
   - API routes don't work with static export
   - Use serverless functions or external API

3. **Alternative solutions**:
   - Use Cloudflare Workers
   - Use external API service
   - Use server-side rendering

### 5. Performance Issues

#### Problem: Slow Loading
```
❌ Application loads slowly
```

**Solutions:**
1. **Optimize images**:
   ```javascript
   // Use next/image with unoptimized
   import Image from 'next/image'
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={500}
     height={300}
     unoptimized
   />
   ```

2. **Enable compression**:
   ```javascript
   // In next.config.js
   const nextConfig = {
     compress: true
   }
   ```

3. **Use CDN**:
   - Cloudflare automatically provides CDN
   - Check Cloudflare dashboard for optimization settings

#### Problem: Large Bundle Size
```
❌ Bundle size is too large
```

**Solutions:**
1. **Analyze bundle**:
   ```bash
   npm install -g @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

2. **Optimize imports**:
   ```javascript
   // Use dynamic imports
   const Component = dynamic(() => import('./Component'))
   ```

3. **Remove unused dependencies**:
   ```bash
   npm prune
   ```

## 🔍 Debugging Techniques

### 1. Enable Debug Mode

```bash
# Set debug environment variable
DEBUG=true npm run deploy

# Or modify deploy.js
console.log('Debug info:', {
  projectName,
  environment,
  buildDir: BUILD_OUTPUT_DIR,
  envVars: {
    token: CLOUDFLARE_API_TOKEN ? 'Set' : 'Missing',
    account: CLOUDFLARE_ACCOUNT_ID ? 'Set' : 'Missing'
  }
});
```

### 2. Manual Testing

```bash
# Test build process
npm run build

# Test environment variables
node -e "require('dotenv').config(); console.log(process.env)"

# Test wrangler connection
npx wrangler whoami

# Test manual deployment
npx wrangler pages deploy out --project-name test-project
```

### 3. Check Logs

```bash
# Check build logs
npm run build 2>&1 | tee build.log

# Check deployment logs
npm run deploy 2>&1 | tee deploy.log

# Check Cloudflare logs
# Go to Cloudflare Dashboard → Pages → Your Project → Functions → Logs
```

### 4. Verify Configuration

```bash
# Check next.config.js
cat next.config.js

# Check wrangler.toml
cat wrangler.toml

# Check package.json
cat package.json

# Check environment variables
cat .env
```

## 🛠️ Advanced Troubleshooting

### 1. Network Issues

#### Problem: Connection Timeout
```
❌ Connection timeout
```

**Solutions:**
1. **Check internet connection**
2. **Try different network**
3. **Check Cloudflare status**: [status.cloudflare.com](https://status.cloudflare.com)
4. **Retry deployment**

#### Problem: DNS Issues
```
❌ DNS resolution failed
```

**Solutions:**
1. **Check DNS settings**
2. **Try different DNS server**
3. **Check domain configuration**

### 2. Permission Issues

#### Problem: Insufficient Permissions
```
❌ Permission denied
```

**Solutions:**
1. **Check API token permissions**:
   - Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - Verify token has "Cloudflare Pages:Edit" permission
   - Check account access

2. **Create new token**:
   - Delete old token
   - Create new token with correct permissions
   - Update `.env` file

### 3. Resource Limits

#### Problem: Build Timeout
```
❌ Build timeout
```

**Solutions:**
1. **Optimize build process**:
   ```javascript
   // In next.config.js
   const nextConfig = {
     webpack: (config) => {
       config.optimization.splitChunks = {
         chunks: 'all',
         cacheGroups: {
           default: false,
           vendors: false,
           vendor: {
             name: 'vendor',
             chunks: 'all',
             test: /node_modules/
           }
         }
       };
       return config;
     }
   }
   ```

2. **Reduce bundle size**:
   - Remove unused dependencies
   - Use dynamic imports
   - Optimize images

### 4. Environment-Specific Issues

#### Problem: Staging vs Production
```
❌ Different behavior between environments
```

**Solutions:**
1. **Check environment variables**:
   ```bash
   # Verify staging environment
   DEPLOYMENT_ENV=staging npm run deploy
   
   # Verify production environment
   DEPLOYMENT_ENV=production npm run deploy
   ```

2. **Use environment-specific configuration**:
   ```javascript
   // In deploy.js
   const config = {
     staging: {
       buildCommand: 'npm run build:staging',
       projectSuffix: 'staging'
     },
     production: {
       buildCommand: 'npm run build:prod',
       projectSuffix: 'prod'
     }
   };
   ```

## 📞 Getting Help

### 1. Self-Service Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

### 2. Community Support

- [Cloudflare Community](https://community.cloudflare.com/)
- [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/nextjs+cloudflare)

### 3. Professional Support

- [Cloudflare Support](https://support.cloudflare.com/)
- [Next.js Support](https://nextjs.org/support)

## 📋 Checklist for Common Issues

### Before Reporting Issues

- [ ] Check environment variables are set correctly
- [ ] Verify build process works locally
- [ ] Test wrangler connection manually
- [ ] Check Cloudflare dashboard for errors
- [ ] Review deployment logs
- [ ] Try different environment
- [ ] Clear build cache and retry

### When Reporting Issues

Include the following information:
1. **Error message** (exact text)
2. **Environment** (staging/production)
3. **Build logs** (if available)
4. **Configuration files** (next.config.js, wrangler.toml)
5. **Steps to reproduce**
6. **Expected vs actual behavior**

---

**Remember: Most deployment issues are related to configuration or environment setup. Double-check your setup before seeking help! 🔧**
