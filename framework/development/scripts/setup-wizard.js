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

// Framework URL - can be overridden via environment variable
const FRAMEWORK_URL = process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev';

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

    // Always download and install rules
    await downloadAndInstallRules();

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
 * Clean up any leftover framework temp directories
 */
function cleanupFrameworkTempDirs() {
  try {
    const cwd = process.cwd();
    const parentDir = join(cwd, '..');
    
    // Check current directory for any .framework-temp-* directories
    if (fs.existsSync(cwd)) {
      try {
        const currentFiles = fs.readdirSync(cwd);
        const currentTempDirs = currentFiles.filter(file => 
          file.startsWith('.framework-temp-') && 
          fs.statSync(join(cwd, file)).isDirectory()
        );
        
        if (currentTempDirs.length > 0) {
          console.log(`🧹 Cleaning up ${currentTempDirs.length} leftover temporary directory(ies) in current directory...`);
          currentTempDirs.forEach(dir => {
            try {
              fs.rmSync(join(cwd, dir), { recursive: true, force: true });
              console.log(`  ✅ Removed ${dir}`);
            } catch (error) {
              console.log(`  ⚠️  Could not remove ${dir}: ${error.message}`);
            }
          });
        }
      } catch (error) {
        // Non-fatal: just continue
      }
    }
    
    // Check parent directory for any .framework-temp-* directories
    if (fs.existsSync(parentDir)) {
      try {
        const parentFiles = fs.readdirSync(parentDir);
        const parentTempDirs = parentFiles.filter(file => 
          file.startsWith('.framework-temp-') && 
          fs.statSync(join(parentDir, file)).isDirectory()
        );
        
        if (parentTempDirs.length > 0) {
          console.log(`🧹 Cleaning up ${parentTempDirs.length} leftover temporary directory(ies) in parent directory...`);
          parentTempDirs.forEach(dir => {
            try {
              fs.rmSync(join(parentDir, dir), { recursive: true, force: true });
              console.log(`  ✅ Removed ${dir}`);
            } catch (error) {
              console.log(`  ⚠️  Could not remove ${dir}: ${error.message}`);
            }
          });
        }
      } catch (error) {
        // Non-fatal: just continue
      }
    }
  } catch (error) {
    // Non-fatal: just log and continue
    console.log(`  ⚠️  Could not check for leftover temp directories: ${error.message}`);
  }
}

/**
 * Setup Next.js
 */
async function setupNextJS() {
  console.log('🚀 Running Next.js setup...');
  
  // Clean up any leftover temp directories first
  cleanupFrameworkTempDirs();
  
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

  // Check for conflicting files (exclude framework files and hidden files)
  const frameworkFilesToMove = ['.cursor', 'mcp-server.js', 'setup-wizard.js', 'setup.sh', 'package.json'];
  const conflictingFiles = files.filter(file => 
    !frameworkFilesToMove.includes(file) &&
    !['package-lock.json', 'node_modules', '.git'].includes(file) &&
    !file.startsWith('.')
  );

  let tempDir = null;
  
  // Always move framework files if they exist, even if no other conflicts
  if (frameworkFilesToMove.some(file => fs.existsSync(file))) {
    console.log('⚠️  Temporarily moving framework files before Next.js setup...');
    // Create temp dir in parent directory to avoid create-next-app conflicts
    // create-next-app is very strict and checks for ANY files/dirs, even hidden ones
    const cwd = process.cwd();
    const parentDir = join(cwd, '..');
    tempDir = join(parentDir, `.framework-temp-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    frameworkFilesToMove.forEach(file => {
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
  
  // Remove package-lock.json and node_modules if they exist (from npm install in setup.sh)
  // create-next-app will recreate these with the correct dependencies
  if (fs.existsSync('package-lock.json')) {
    console.log('🗑️  Removing package-lock.json (will be recreated by Next.js)...');
    fs.unlinkSync('package-lock.json');
  }
  if (fs.existsSync('node_modules')) {
    console.log('🗑️  Removing node_modules (will be reinstalled by Next.js)...');
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
  
  // Note: tempDir is created with leading dot (hidden) so create-next-app shouldn't see it
  // But create-next-app is very strict - if it still complains, we'll handle it
  
  // If there are other conflicting files, we need to handle them
  if (conflictingFiles.length > 0) {
    console.log(`⚠️  Warning: Found ${conflictingFiles.length} conflicting file(s): ${conflictingFiles.join(', ')}`);
    console.log('   These files may interfere with Next.js setup.');
    throw new Error(`Cannot proceed: Directory contains conflicting files. Please remove or rename: ${conflictingFiles.join(', ')}`);
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

    // Restore framework files (package.json is handled separately)
    if (tempDir && fs.existsSync(tempDir)) {
      console.log('🔄 Restoring framework files...');
      const frameworkFilesToRestore = ['.cursor', 'mcp-server.js', 'setup-wizard.js', 'setup.sh'];
      frameworkFilesToRestore.forEach(file => {
        if (fs.existsSync(`${tempDir}/${file}`)) {
          if (file === '.cursor') {
            fs.cpSync(`${tempDir}/${file}`, '.cursor', { recursive: true });
          } else {
            fs.renameSync(`${tempDir}/${file}`, file);
          }
        }
      });
      
      // Note: package.json is kept from Next.js setup, we don't restore the original
      // as Next.js creates its own with all necessary dependencies
      
      // Clean up temp directory
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
    // Restore framework files on error (including package.json)
    // tempDir is in parent directory now
    if (tempDir && fs.existsSync(tempDir)) {
      const frameworkFilesToRestore = ['.cursor', 'mcp-server.js', 'setup-wizard.js', 'setup.sh', 'package.json'];
      frameworkFilesToRestore.forEach(file => {
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
 * Download and install rules from framework API
 */
async function downloadAndInstallRules() {
  console.log('📋 Downloading rules from framework...');
  
  try {
    // First, get the list of available rules
    const listResponse = await fetch(`${FRAMEWORK_URL}/api/rules`);
    
    if (!listResponse.ok) {
      throw new Error(`HTTP ${listResponse.status}: ${listResponse.statusText}`);
    }

    const rulesList = await listResponse.json();
    
    if (!Array.isArray(rulesList)) {
      throw new Error('Invalid response format: expected array');
    }

    // Ensure .cursor/rules directory exists
    const rulesDir = join(process.cwd(), '.cursor', 'rules');
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }

    // Download each rule file
    for (const rulePurpose of rulesList) {
      const purpose = rulePurpose.name;
      const purposeDir = join(rulesDir, purpose);
      fs.mkdirSync(purposeDir, { recursive: true });

      for (const fileName of rulePurpose.files || []) {
        try {
          const ruleResponse = await fetch(`${FRAMEWORK_URL}/rules/${purpose}/${fileName}`);
          
          if (!ruleResponse.ok) {
            console.log(`  ⚠️  Failed to download ${purpose}/${fileName}: ${ruleResponse.status}`);
            continue;
          }

          const content = await ruleResponse.text();
          const filePath = join(purposeDir, fileName);
          fs.writeFileSync(filePath, content);
          console.log(`  ✅ Installed ${purpose}/${fileName}`);
        } catch (error) {
          console.log(`  ⚠️  Failed to download ${purpose}/${fileName}: ${error.message}`);
        }
      }
    }

    console.log('  ✅ Rules installed successfully!');
  } catch (error) {
    console.log(`  ⚠️  Failed to download rules: ${error.message}`);
    console.log('  💡 You can manually download rules later using:');
    console.log(`     curl -s ${FRAMEWORK_URL}/api/rules`);
    // Don't throw - allow setup to continue without rules
  }
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

