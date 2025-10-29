#!/usr/bin/env node

/**
 * Rules Framework Setup Wizard
 * Handles project setup with Next.js, FastAPI, GitHub, and Cloudflare integration
 * Accepts command-line flags from setup.sh
 */

import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command-line arguments
const args = process.argv.slice(2);
const config = {
  nextjs: args.includes('--nextjs'),
  fastapi: args.includes('--fastapi'),
  github: args.includes('--github'),
  repoName: getArgValue('--repoName'),
  repoVisibility: getArgValue('--repoVisibility') || 'private',
  cloudflare: args.includes('--cloudflare'),
  cloudflareTarget: getArgValue('--cloudflareTarget') || 'Cloudflare Workers',
  granularRules: args.includes('--granular-rules'),
  cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
  cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID
};

function getArgValue(flag) {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Rules Framework Setup Wizard');
  console.log('================================\n');

  try {
    // Setup Next.js if requested
    if (config.nextjs) {
      await setupNextJS();
    }

    // Setup FastAPI if requested
    if (config.fastapi) {
      await setupFastAPI();
    }

    // Setup GitHub if requested
    if (config.github) {
      await setupGitHub();
    }

    // Setup Cloudflare if requested
    if (config.cloudflare) {
      await setupCloudflare();
    }

    // Handle granular rules if requested
    if (config.granularRules) {
      await handleGranularRules();
    }

    console.log('\n🎉 Setup Complete!');
    console.log('==================\n');
    
    console.log('📋 Configuration Summary:');
    if (config.nextjs) console.log('  ✅ Next.js Frontend');
    if (config.fastapi) console.log('  ✅ FastAPI Backend');
    if (config.github) {
      console.log(`  ✅ GitHub Integration`);
      console.log(`     - Repository: ${config.repoName}`);
      console.log(`     - Visibility: ${config.repoVisibility}`);
    }
    if (config.cloudflare) {
      console.log(`  ✅ Cloudflare Deployment`);
      console.log(`     - Target: ${config.cloudflareTarget}`);
    }
    if (config.granularRules) {
      console.log('  ✅ Granular Rules Configuration');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Setup Next.js
 */
async function setupNextJS() {
  console.log('🚀 Running Next.js setup...');
  
  const files = fs.readdirSync('.');
  const hasNextJS = files.some(file => 
    ['next.config.ts', 'next.config.js', 'next-env.d.ts'].includes(file) ||
    fs.existsSync('src/app') || fs.existsSync('pages')
  );

  if (hasNextJS) {
    console.log('✅ Next.js already configured');
    
    // Update page.tsx to show Hello World if it exists
    const pagePaths = [
      'src/app/page.tsx',
      'src/app/page.js',
      'pages/index.tsx',
      'pages/index.js'
    ];
    
    for (const pagePath of pagePaths) {
      if (fs.existsSync(pagePath)) {
        const content = fs.readFileSync(pagePath, 'utf8');
        if (!content.includes('Hello World')) {
          // Simple Hello World page
          const helloWorldPage = `export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <h1>Hello World</h1>
    </div>
  );
}`;
          fs.writeFileSync(pagePath, helloWorldPage);
          console.log(`  ✅ Updated ${pagePath} with Hello World`);
        }
      }
    }
    return;
  }

  // Check for conflicting files
  const conflictingFiles = files.filter(file => 
    !['.cursor', 'mcp-server.js', 'setup-wizard.js', 'package.json', 'package-lock.json', 'node_modules', '.git'].includes(file) &&
    !file.startsWith('.')
  );

  let tempDir = null;
  if (conflictingFiles.length > 0) {
    console.log('⚠️  Directory has files, temporarily moving framework files...');
    tempDir = `.framework-temp-${Date.now()}`;
    fs.mkdirSync(tempDir);
    
    const frameworkFiles = ['.cursor', 'mcp-server.js', 'setup-wizard.js'];
    frameworkFiles.forEach(file => {
      if (fs.existsSync(file)) {
        if (file === '.cursor') {
          fs.cpSync(file, `${tempDir}/.cursor`, { recursive: true });
          fs.rmSync(file, { recursive: true, force: true });
        } else {
          fs.renameSync(file, `${tempDir}/${file}`);
        }
      }
    });
  }

  try {
    console.log('📦 Installing Next.js with TypeScript and Tailwind...');
    execSync('npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Update page.tsx with Hello World
    const pagePath = 'src/app/page.tsx';
    if (fs.existsSync(pagePath)) {
      const helloWorldPage = `export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <h1>Hello World</h1>
    </div>
  );
}`;
      fs.writeFileSync(pagePath, helloWorldPage);
    }

    // Restore framework files
    if (tempDir && fs.existsSync(tempDir)) {
      console.log('🔄 Restoring framework files...');
      const frameworkFiles = ['.cursor', 'mcp-server.js'];
      frameworkFiles.forEach(file => {
        if (fs.existsSync(`${tempDir}/${file}`)) {
          if (file === '.cursor') {
            fs.cpSync(`${tempDir}/${file}`, '.cursor', { recursive: true });
          } else {
            fs.renameSync(`${tempDir}/${file}`, file);
          }
        }
      });
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log('✅ Next.js setup complete!');
    
    // Add Cloudflare Workers dependencies if deploying to Cloudflare
    if (config.cloudflare && config.cloudflareTarget === 'Cloudflare Workers') {
      console.log('🔧 Adding Cloudflare Workers configuration...');
      try {
        execSync('npm install @cloudflare/next-on-pages @cloudflare/workers-types wrangler --legacy-peer-deps', { 
          stdio: 'inherit' 
        });
      } catch (error) {
        console.log('⚠️  Cloudflare dependencies installation failed, continuing...');
      }
    }
  } catch (error) {
    // Restore framework files on error
    if (tempDir && fs.existsSync(tempDir)) {
      const frameworkFiles = ['.cursor', 'mcp-server.js'];
      frameworkFiles.forEach(file => {
        if (fs.existsSync(`${tempDir}/${file}`)) {
          if (file === '.cursor') {
            fs.cpSync(`${tempDir}/${file}`, '.cursor', { recursive: true });
          } else {
            fs.renameSync(`${tempDir}/${file}`, file);
          }
        }
      });
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * Setup FastAPI backend
 */
async function setupFastAPI() {
  console.log('🐍 Running FastAPI setup...');
  
  const backendDir = 'backend';
  if (fs.existsSync(backendDir)) {
    console.log('✅ FastAPI backend directory already exists');
    
    // Check if main.py exists and update it
    const mainPyPath = join(backendDir, 'main.py');
    if (!fs.existsSync(mainPyPath)) {
      await createFastAPIFiles(backendDir);
    }
    return;
  }

  fs.mkdirSync(backendDir);
  await createFastAPIFiles(backendDir);
  console.log('✅ FastAPI backend setup complete!');
}

async function createFastAPIFiles(backendDir) {
  // Create main.py
  const mainPy = `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/api/hello")
async def hello():
    return {"message": "Hello World from FastAPI"}
`;
  fs.writeFileSync(join(backendDir, 'main.py'), mainPy);

  // Create requirements.txt
  const requirementsTxt = `fastapi==0.104.1
uvicorn==0.24.0
`;
  fs.writeFileSync(join(backendDir, 'requirements.txt'), requirementsTxt);

  // Create .gitignore for backend
  const gitignore = `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv
`;
  fs.writeFileSync(join(backendDir, '.gitignore'), gitignore);

  console.log(`  ✅ Created ${backendDir}/main.py`);
  console.log(`  ✅ Created ${backendDir}/requirements.txt`);
}

/**
 * Setup GitHub repository
 */
async function setupGitHub() {
  console.log('🐙 Setting up GitHub repository...');
  
  if (!config.repoName) {
    console.log('⚠️  No repository name provided, skipping GitHub setup');
    return;
  }

  // Check if git is initialized
  if (!fs.existsSync('.git')) {
    try {
      execSync('git init', { stdio: 'inherit' });
      console.log('  ✅ Initialized git repository');
    } catch (error) {
      console.log('  ⚠️  Git init failed, continuing...');
    }
  }

  // Check if remote already exists
  try {
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    if (remotes.includes('origin')) {
      console.log('  ✅ Git remote already configured');
      return;
    }
  } catch (error) {
    // No remotes, continue
  }

  // Create GitHub repo using gh CLI if available
  try {
    const visibilityFlag = config.repoVisibility === 'private' ? '--private' : '--public';
    execSync(`gh repo create ${config.repoName} ${visibilityFlag} --source=. --remote=origin --push`, {
      stdio: 'inherit'
    });
    console.log(`  ✅ Created GitHub repository: ${config.repoName}`);
    console.log(`  ✅ Pushed code to GitHub`);
  } catch (error) {
    console.log('  ⚠️  GitHub CLI not available or repo creation failed');
    console.log('  💡 You can manually create the repo and push:');
    console.log(`     gh repo create ${config.repoName} ${config.repoVisibility === 'private' ? '--private' : '--public'}`);
    console.log(`     git remote add origin git@github.com:$(git config user.name)/${config.repoName}.git`);
    console.log(`     git push -u origin main`);
  }
}

/**
 * Setup Cloudflare configuration
 */
async function setupCloudflare() {
  console.log('☁️  Setting up Cloudflare configuration...');
  
  // Create wrangler.toml
  const accountId = config.cloudflareAccountId || 'your_account_id_here';
  const wranglerConfig = `name = "${config.repoName || 'project'}"
compatibility_date = "2024-01-01"
account_id = "${accountId}"

[env.production]
name = "${config.repoName || 'project'}"
`;
  
  fs.writeFileSync('wrangler.toml', wranglerConfig);
  console.log('  ✅ Created wrangler.toml');

  // Create .env file with Cloudflare credentials
  const envContent = `# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=${config.cloudflareApiToken || 'your_cloudflare_api_token_here'}
CLOUDFLARE_ACCOUNT_ID=${accountId}
FRAMEWORK_VERSION=1.0.0
DEPLOYMENT_TYPE=${config.cloudflareTarget.toLowerCase().replace('cloudflare ', '')}
`;
  
  fs.writeFileSync('.env', envContent);
  console.log('  ✅ Created .env file');

  // Add .env to .gitignore if not already there
  if (fs.existsSync('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    if (!gitignore.includes('.env')) {
      fs.appendFileSync('.gitignore', '\n.env\n');
    }
  } else {
    fs.writeFileSync('.gitignore', '.env\n');
  }

  console.log('  ✅ Cloudflare configuration complete!');
}

/**
 * Handle granular rules configuration
 */
async function handleGranularRules() {
  console.log('📋 Configuring granular rules...');
  console.log('  This feature will be implemented in a future update.');
  console.log('  For now, all rules will be enabled with default settings.');
  
  // TODO: Implement granular rules selection
  // This would involve:
  // 1. Fetching available rules from framework API
  // 2. Iterating through each rule
  // 3. Presenting options: Include, Modify, Exclude, Exclude All
  // 4. Handling modifications to rule properties
}

// Run main function
main().catch(console.error);

