#!/usr/bin/env node

/**
 * Rules Framework Setup Wizard
 * Handles project setup with Next.js, FastAPI, GitHub, and Cloudflare integration
 * Accepts command-line flags from setup.sh
 */

import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';
import { createInterface } from 'readline';
import os from 'os';

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
    
    // Ensure MCP dependencies are installed in root (if Next.js wasn't set up)
    // This ensures mcp-server.js works even without Next.js
    if (!config.nextjs) {
      await ensureMCPDependencies();
    }

    // Handle granular rules if requested
    if (config.granularRules) {
      await handleGranularRules();
    }

    // Always create README and docs structure
    await createProjectDocumentation(config);

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
  
  const frontendDir = 'frontend';
  
  // Check if frontend directory already exists and has Next.js
  if (fs.existsSync(frontendDir)) {
    const frontendFiles = fs.readdirSync(frontendDir);
    const hasNextJS = frontendFiles.some(file => 
      ['next.config.ts', 'next.config.js', 'next-env.d.ts'].includes(file) ||
      fs.existsSync(join(frontendDir, 'src/app')) || fs.existsSync(join(frontendDir, 'pages'))
    );

    if (hasNextJS) {
      console.log('✅ Next.js already configured in frontend/');
      
      // Update page.tsx to show Hello World if it exists
      const pagePaths = [
        join(frontendDir, 'src/app/page.tsx'),
        join(frontendDir, 'src/app/page.js'),
        join(frontendDir, 'pages/index.tsx'),
        join(frontendDir, 'pages/index.js')
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
  }
  
  // Check for conflicting files in root (exclude framework files and hidden files)
  const files = fs.readdirSync('.');
  const frameworkFilesToMove = ['.cursor', 'mcp-server.js', 'setup-wizard.js', 'setup.sh', 'package.json'];
  const conflictingFiles = files.filter(file => 
    !frameworkFilesToMove.includes(file) &&
    !['package-lock.json', 'node_modules', '.git', 'frontend', 'backend', 'docs'].includes(file) &&
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
  
  // If there are other conflicting files, we need to handle them
  if (conflictingFiles.length > 0) {
    console.log(`⚠️  Warning: Found ${conflictingFiles.length} conflicting file(s): ${conflictingFiles.join(', ')}`);
    console.log('   These files may interfere with Next.js setup.');
    throw new Error(`Cannot proceed: Directory contains conflicting files. Please remove or rename: ${conflictingFiles.join(', ')}`);
  }

  try {
    // Create frontend directory if it doesn't exist
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    console.log('📦 Installing Next.js with TypeScript and Tailwind in frontend/...');
    execSync('npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes', { 
      stdio: 'inherit',
      cwd: join(process.cwd(), frontendDir)
    });

    // Update page.tsx with Hello World
    const pagePath = join(frontendDir, 'src/app/page.tsx');
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
      
      // Note: package.json is kept from Next.js setup, but we need to ensure
      // MCP dependencies are added to root package.json (handled above)
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log('✅ Next.js setup complete in frontend/!');
    
    // Ensure root package.json has MCP dependencies (Next.js creates its own in frontend/)
    // Root package.json needs @modelcontextprotocol/sdk for mcp-server.js
    const rootPackageJsonPath = join(process.cwd(), 'package.json');
    if (fs.existsSync(rootPackageJsonPath)) {
      try {
        const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
        if (!rootPackageJson.dependencies || !rootPackageJson.dependencies['@modelcontextprotocol/sdk']) {
          console.log('📦 Ensuring MCP dependencies are installed in root...');
          if (!rootPackageJson.dependencies) {
            rootPackageJson.dependencies = {};
          }
          rootPackageJson.dependencies['@modelcontextprotocol/sdk'] = '^1.20.2';
          if (!rootPackageJson.type) {
            rootPackageJson.type = 'module';
          }
          fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
          
          // Install MCP dependencies
          execSync('npm install @modelcontextprotocol/sdk@^1.20.2 --silent', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
          console.log('  ✅ MCP dependencies installed in root');
        }
      } catch (error) {
        console.log(`  ⚠️  Could not update root package.json: ${error.message}`);
        // Try to install anyway
        try {
          execSync('npm install @modelcontextprotocol/sdk@^1.20.2 --silent', { 
            stdio: 'inherit',
            cwd: process.cwd()
          });
        } catch (installError) {
          console.log(`  ⚠️  Could not install MCP dependencies: ${installError.message}`);
        }
      }
    } else {
      // Create root package.json if it doesn't exist
      console.log('📦 Creating root package.json with MCP dependencies...');
      const rootPackageJson = {
        name: 'rules-framework-project',
        version: '1.0.0',
        private: true,
        description: 'Project with Rules Framework and MCP integration',
        type: 'module',
        dependencies: {
          '@modelcontextprotocol/sdk': '^1.20.2'
        }
      };
      fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
      execSync('npm install --silent', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('  ✅ Root package.json created and dependencies installed');
    }
    
    // Add Cloudflare Workers dependencies if deploying to Cloudflare
    if (config.cloudflare && config.cloudflareTarget === 'Cloudflare Workers') {
      console.log('🔧 Adding Cloudflare Workers configuration...');
      try {
        execSync('npm install @cloudflare/next-on-pages @cloudflare/workers-types wrangler --legacy-peer-deps', { 
          stdio: 'inherit',
          cwd: join(process.cwd(), frontendDir)
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
  // Create directory structure following FastAPI best practices
  const routersDir = join(backendDir, 'routers');
  const modelsDir = join(backendDir, 'models');
  const schemasDir = join(backendDir, 'schemas');
  
  fs.mkdirSync(routersDir, { recursive: true });
  fs.mkdirSync(modelsDir, { recursive: true });
  fs.mkdirSync(schemasDir, { recursive: true });
  
  // Create main.py following FastAPI structure guidelines
  const mainPy = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import health, api

app = FastAPI(
    title="API",
    description="FastAPI application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(api.router, prefix="/api", tags=["api"])

@app.get("/")
async def root():
    return {"message": "Hello World"}
`;
  fs.writeFileSync(join(backendDir, 'main.py'), mainPy);

  // Create routers/__init__.py
  const routersInit = `# Routers package
`;
  fs.writeFileSync(join(routersDir, '__init__.py'), routersInit);

  // Create routers/health.py (health check endpoint)
  const healthRouter = `from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint for readiness/liveness probes"""
    return {"status": "healthy"}
`;
  fs.writeFileSync(join(routersDir, 'health.py'), healthRouter);

  // Create routers/api.py (example API routes)
  const apiRouter = `from fastapi import APIRouter

router = APIRouter()

@router.get("/hello")
async def hello():
    """Example API endpoint"""
    return {"message": "Hello World from FastAPI"}
`;
  fs.writeFileSync(join(routersDir, 'api.py'), apiRouter);

  // Create models/__init__.py
  const modelsInit = `# Models package
`;
  fs.writeFileSync(join(modelsDir, '__init__.py'), modelsInit);

  // Create schemas/__init__.py
  const schemasInit = `# Schemas package for Pydantic models
`;
  fs.writeFileSync(join(schemasDir, '__init__.py'), schemasInit);

  // Create requirements.txt
  const requirementsTxt = `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
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
*.egg-info/
dist/
build/
.pytest_cache/
`;
  fs.writeFileSync(join(backendDir, '.gitignore'), gitignore);

  console.log(`  ✅ Created ${backendDir}/main.py`);
  console.log(`  ✅ Created ${backendDir}/routers/ directory structure`);
  console.log(`  ✅ Created ${backendDir}/models/ directory structure`);
  console.log(`  ✅ Created ${backendDir}/schemas/ directory structure`);
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
 * Ensure MCP dependencies are installed in root package.json
 */
async function ensureMCPDependencies() {
  const rootPackageJsonPath = join(process.cwd(), 'package.json');
  
  if (fs.existsSync(rootPackageJsonPath)) {
    try {
      const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
      if (!rootPackageJson.dependencies || !rootPackageJson.dependencies['@modelcontextprotocol/sdk']) {
        console.log('📦 Ensuring MCP dependencies are installed...');
        if (!rootPackageJson.dependencies) {
          rootPackageJson.dependencies = {};
        }
        rootPackageJson.dependencies['@modelcontextprotocol/sdk'] = '^1.20.2';
        if (!rootPackageJson.type) {
          rootPackageJson.type = 'module';
        }
        fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
        
        // Install MCP dependencies
        execSync('npm install @modelcontextprotocol/sdk@^1.20.2 --silent', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('  ✅ MCP dependencies installed');
      }
    } catch (error) {
      console.log(`  ⚠️  Could not update package.json: ${error.message}`);
      // Try to install anyway
      try {
        execSync('npm install @modelcontextprotocol/sdk@^1.20.2 --silent', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (installError) {
        console.log(`  ⚠️  Could not install MCP dependencies: ${installError.message}`);
      }
    }
  } else {
    // Create package.json if it doesn't exist
    console.log('📦 Creating package.json with MCP dependencies...');
    const rootPackageJson = {
      name: 'rules-framework-project',
      version: '1.0.0',
      private: true,
      description: 'Project with Rules Framework and MCP integration',
      type: 'module',
      dependencies: {
        '@modelcontextprotocol/sdk': '^1.20.2'
      }
    };
    fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
    execSync('npm install --silent', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('  ✅ Package.json created and dependencies installed');
  }
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
          
          // Validate content - ensure it's actual rule content, not API documentation
          if (!content.trim() || content.includes('Rules Framework API') || !content.includes('---')) {
            console.log(`  ⚠️  Invalid content for ${purpose}/${fileName}, skipping...`);
            continue;
          }
          
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
 * Parse YAML frontmatter from rule file content
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const yamlContent = match[1];
  const body = match[2];
  const metadata = {};
  
  // Simple YAML parser for basic key-value pairs
  const lines = yamlContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmed.substring(0, colonIndex).trim();
    let value = trimmed.substring(colonIndex + 1).trim();
    
    // Handle boolean values
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Handle array values (simple format: ["item1", "item2"])
    else if (value.startsWith('[') && value.endsWith(']')) {
      const arrayContent = value.slice(1, -1);
      value = arrayContent.split(',').map(item => {
        const trimmedItem = item.trim();
        if (trimmedItem.startsWith('"') && trimmedItem.endsWith('"')) {
          return trimmedItem.slice(1, -1);
        }
        return trimmedItem;
      });
    }
    // Handle string values (remove quotes if present)
    else if ((value.startsWith('"') && value.endsWith('"')) || 
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    metadata[key] = value;
  }
  
  return { metadata, body };
}

/**
 * Generate YAML frontmatter from metadata object
 */
function generateFrontmatter(metadata) {
  const lines = ['---'];
  
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      const arrayStr = value.map(item => `"${item}"`).join(', ');
      lines.push(`${key}: [${arrayStr}]`);
    } else {
      lines.push(`${key}: "${value}"`);
    }
  }
  
  lines.push('---');
  return lines.join('\n') + '\n';
}

/**
 * Prompt user for input
 */
function question(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

/**
 * Parse array input from user
 */
function parseArrayInput(input) {
  if (!input || input.trim() === '') return [];
  // Handle comma-separated or space-separated values
  return input.split(/[,\s]+/).map(s => s.trim()).filter(s => s);
}

/**
 * Edit rule content using user's editor
 * Opens a temporary file in the user's default editor
 */
async function editRuleContent(initialContent, ruleName) {
  const tmpDir = os.tmpdir();
  const tmpFile = join(tmpDir, `rule-edit-${Date.now()}-${ruleName.replace(/\//g, '-')}.mdc`);
  
  // Write initial content to temp file
  fs.writeFileSync(tmpFile, initialContent);
  
  // Determine editor (use $EDITOR, or common defaults)
  const editor = process.env.EDITOR || process.env.VISUAL || (process.platform === 'win32' ? 'notepad' : 'nano');
  
  console.log(`  📝 Opening ${ruleName} in ${editor}...`);
  console.log(`  💡 Save and close the editor to continue, or Ctrl+C to cancel`);
  
  // Open editor
  const result = spawnSync(editor, [tmpFile], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  
  if (result.error) {
    throw new Error(`Failed to open editor: ${result.error.message}`);
  }
  
  if (result.signal === 'SIGINT' || result.status === 130) {
    // User cancelled (Ctrl+C)
    fs.unlinkSync(tmpFile);
    return null;
  }
  
  // Read edited content
  if (!fs.existsSync(tmpFile)) {
    throw new Error('Temporary file was deleted during editing');
  }
  
  const editedContent = fs.readFileSync(tmpFile, 'utf8');
  
  // Clean up temp file
  try {
    fs.unlinkSync(tmpFile);
  } catch (err) {
    // Ignore cleanup errors
  }
  
  return editedContent;
}

/**
 * Handle granular rules configuration
 */
async function handleGranularRules() {
  console.log('\n📋 Configuring granular rules...\n');
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    // Fetch available rules from framework API
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

    // Track excluded rules (for this project only)
    const excludedRules = [];
    
    // Process each rule purpose
    for (const rulePurpose of rulesList) {
      const purpose = rulePurpose.name;
      const purposeDir = join(rulesDir, purpose);
      
      // Ensure purpose directory exists
      if (!fs.existsSync(purposeDir)) {
        fs.mkdirSync(purposeDir, { recursive: true });
      }
      
      console.log(`\n📁 Purpose: ${purpose} (${rulePurpose.description || 'No description'})`);
      console.log('─'.repeat(60));
      
      // Process each file in this purpose
      for (const fileName of rulePurpose.files || []) {
        const rulePath = `${purpose}/${fileName}`;
        
        try {
          // Fetch the rule content
          const ruleResponse = await fetch(`${FRAMEWORK_URL}/rules/${purpose}/${fileName}`);
          
          if (!ruleResponse.ok) {
            console.log(`  ⚠️  Failed to fetch ${rulePath}: ${ruleResponse.status}`);
            continue;
          }

          const content = await ruleResponse.text();
          
          // Validate content - ensure it's actual rule content, not API documentation
          if (!content.trim() || content.includes('Rules Framework API') || !content.includes('---')) {
            console.log(`  ⚠️  Invalid content for ${purpose}/${fileName}, skipping...`);
            continue;
          }
          
          let { metadata, body } = parseFrontmatter(content);
          
          console.log(`\n  📄 Rule: ${fileName}`);
          console.log(`     Description: ${metadata.description || 'No description'}`);
          console.log(`     Always Apply: ${metadata.alwaysApply || false}`);
          console.log(`     Globs: ${metadata.globs ? JSON.stringify(metadata.globs) : 'None'}`);
          
          // Check if rule already exists
          const filePath = join(purposeDir, fileName);
          const ruleExists = fs.existsSync(filePath);
          
          if (ruleExists) {
            // Load existing rule to show current state
            const existingContent = fs.readFileSync(filePath, 'utf8');
            const { metadata: existingMetadata, body: existingBody } = parseFrontmatter(existingContent);
            
            // Merge existing metadata to show current state
            const mergedMetadata = { ...metadata, ...existingMetadata };
            metadata = mergedMetadata;
            if (existingBody.trim()) {
              body = existingBody; // Use existing body
            }
            
            console.log(`     ⚠️  Rule already exists in project`);
          }
          
          // Prompt user for action
          const action = await question(rl, `\n  What would you like to do with this rule?\n  [I]nclude  [M]odify  [E]xclude  [Skip] remaining: `);
          const actionLower = action.trim().toLowerCase();
          
          if (actionLower === 'skip' || actionLower === 's') {
            console.log(`  ⏭️  Skipping remaining rules...`);
            break;
          }
          
          if (actionLower === 'e' || actionLower === 'exclude') {
            // Check if user wants to exclude from all projects
            const excludeAll = await question(rl, `  Exclude from [T]his project only or [A]ll projects? `);
            const excludeAllLower = excludeAll.trim().toLowerCase();
            
            if (excludeAllLower === 'a' || excludeAllLower === 'all') {
              console.log(`  🚫 Excluded ${rulePath} from all projects`);
              // Note: In a real implementation, this could be stored in a global exclusion list
              // For now, we'll just skip installing it
              excludedRules.push({ path: rulePath, global: true });
              continue;
            } else {
              console.log(`  🚫 Excluded ${rulePath} from this project`);
              excludedRules.push({ path: rulePath, global: false });
              continue;
            }
          }
          
          if (actionLower === 'm' || actionLower === 'modify') {
            // Modify rule properties
            console.log(`\n  ✏️  Modifying ${fileName}...`);
            
            // Ask what to modify
            const modifyType = await question(rl, `  Modify [M]etadata, [C]ontent, or [B]oth? [M]: `);
            const modifyTypeLower = modifyType.trim().toLowerCase() || 'm';
            
            if (modifyTypeLower === 'c' || modifyTypeLower === 'content' || modifyTypeLower === 'b' || modifyTypeLower === 'both') {
              // Edit rule content
              try {
                const editedBody = await editRuleContent(body, fileName);
                if (editedBody !== null) {
                  body = editedBody;
                  console.log(`  ✅ Content modified`);
                } else {
                  console.log(`  ⏭️  Content editing cancelled`);
                }
              } catch (error) {
                console.log(`  ⚠️  Failed to edit content: ${error.message}`);
                const continueEdit = await question(rl, `  Continue with metadata editing? [Y/n]: `);
                if (continueEdit.trim().toLowerCase() === 'n') {
                  continue;
                }
              }
            }
            
            if (modifyTypeLower === 'm' || modifyTypeLower === 'metadata' || modifyTypeLower === 'b' || modifyTypeLower === 'both') {
              // Modify description
              const newDesc = await question(rl, `  Description [${metadata.description || ''}]: `);
              if (newDesc.trim()) {
                metadata.description = newDesc.trim();
              }
              
              // Modify alwaysApply
              const currentAlwaysApply = metadata.alwaysApply || false;
              const newAlwaysApply = await question(rl, `  Always Apply [${currentAlwaysApply}] (true/false): `);
              if (newAlwaysApply.trim()) {
                metadata.alwaysApply = newAlwaysApply.trim().toLowerCase() === 'true';
              }
              
              // Modify globs
              const currentGlobs = metadata.globs ? JSON.stringify(metadata.globs) : '[]';
              const newGlobs = await question(rl, `  Globs [${currentGlobs}] (comma-separated patterns, or empty for none): `);
              if (newGlobs.trim() !== '') {
                const parsedGlobs = parseArrayInput(newGlobs);
                metadata.globs = parsedGlobs.length > 0 ? parsedGlobs : undefined;
              }
              
              // Allow modification of additional properties
              const moreProps = await question(rl, `  Modify more properties? (name, type, category, etc.) [y/N]: `);
              if (moreProps.trim().toLowerCase() === 'y') {
                const propName = await question(rl, `  Property name: `);
                const propValue = await question(rl, `  Property value: `);
                if (propName.trim() && propValue.trim()) {
                  metadata[propName.trim()] = propValue.trim();
                }
              }
              
              console.log(`  ✅ Metadata modified`);
            }
            
            console.log(`  ✅ Modified ${fileName}`);
          } else if (actionLower === 'i' || actionLower === 'include' || actionLower === '') {
            // Include with default settings (empty string means Enter was pressed)
            console.log(`  ✅ Including ${fileName} with default settings`);
          }
          
          // Install the rule (either original or modified)
          fs.mkdirSync(purposeDir, { recursive: true });
          const finalContent = generateFrontmatter(metadata) + body;
          fs.writeFileSync(filePath, finalContent);
          console.log(`  ✅ Installed ${rulePath}`);
          
        } catch (error) {
          console.log(`  ⚠️  Failed to process ${rulePath}: ${error.message}`);
        }
      }
    }

    // Summary
    console.log('\n✅ Granular rules configuration complete!');
    if (excludedRules.length > 0) {
      console.log(`\n📊 Summary:`);
      console.log(`   - Excluded ${excludedRules.length} rule(s)`);
      excludedRules.forEach(rule => {
        console.log(`     • ${rule.path} ${rule.global ? '(global exclusion)' : '(project exclusion)'}`);
      });
    }
    
  } catch (error) {
    console.log(`  ⚠️  Failed to configure granular rules: ${error.message}`);
    console.log('  💡 Falling back to default rule installation...');
  } finally {
    rl.close();
  }
}

/**
 * Create project README.md and documentation structure
 */
async function createProjectDocumentation(config) {
  console.log('📝 Creating project documentation structure...');
  
  // Get project name from config or directory name
  const projectName = config.repoName || basename(process.cwd());
  
  // Create README.md
  await createREADME(projectName, config);
  
  // Create docs directory structure
  await createDocsStructure(config);
  
  console.log('  ✅ Documentation structure created');
}

/**
 * Create README.md in project root
 */
async function createREADME(projectName, config) {
  const readmePath = join(process.cwd(), 'README.md');
  
  // Don't overwrite existing README
  if (fs.existsSync(readmePath)) {
    console.log('  ℹ️  README.md already exists, skipping...');
    return;
  }
  
  const components = [];
  if (config.nextjs) components.push('Next.js Frontend');
  if (config.fastapi) components.push('FastAPI Backend');
  
  const componentsList = components.length > 0 
    ? `\n- ${components.join('\n- ')}` 
    : '';
  
  const readmeContent = `# ${projectName}

${components.length > 0 ? `A modern web application built with ${components.join(' and ')}.` : 'A new project with Rules Framework integration.'}

## 🚀 Quick Start

${config.nextjs ? `### Frontend Development
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
` : ''}
${config.fastapi ? `### Backend Development
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`
` : ''}
## 📚 Documentation

Comprehensive documentation is available in the [\`docs/\`](./docs/) directory:

- [Setup & Installation](./docs/setup/) - Getting started guides
- [Development](./docs/development/) - Developer workflows and standards
- [Features](./docs/features/) - Feature-specific documentation
- [Guides](./docs/guides/) - How-to guides and best practices
${config.fastapi ? '- [API Documentation](./docs/api/) - API endpoints and authentication' : ''}

See [docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md) for a complete index of all documentation.

## 🛠️ Project Structure

\`\`\`
${projectName}/
${config.nextjs ? '├── frontend/              # Next.js frontend application\n' : ''}${config.fastapi ? '├── backend/                # FastAPI backend application\n' : ''}├── docs/                  # Project documentation
├── .cursor/                # Cursor IDE rules
└── README.md              # This file
\`\`\`

${config.github ? `## 🔗 GitHub Repository

Repository: \`${config.repoName}\`
Visibility: \`${config.repoVisibility}\`
` : ''}
${config.cloudflare ? `## ☁️ Cloudflare Deployment

Deployment Target: \`${config.cloudflareTarget}\`

See [docs/setup/DEPLOYMENT.md](./docs/setup/DEPLOYMENT.md) for deployment instructions.
` : ''}
## 📋 Rules Framework

This project uses the [Rules Framework](https://rules-framework.mikehenken.workers.dev) for Cursor IDE integration.

- Rules are configured in \`.cursor/rules/\`
- MCP server provides framework integration
- Use \`@rules-framework\` commands in Cursor chat

---

For detailed documentation, see the [docs directory](./docs/).
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log('  ✅ Created README.md');
}

/**
 * Create complete docs directory structure
 */
async function createDocsStructure(config) {
  const docsPath = join(process.cwd(), 'docs');
  
  // Create all required subdirectories
  const subdirs = [
    'setup',
    'development',
    'features',
    'guides',
    'api',
    'status'
  ];
  
  subdirs.forEach(subdir => {
    const dirPath = join(docsPath, subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  // Create placeholder files in setup/
  const setupDir = join(docsPath, 'setup');
  if (!fs.existsSync(join(setupDir, 'QUICK_START.md'))) {
    fs.writeFileSync(join(setupDir, 'QUICK_START.md'), `# Quick Start Guide

Get up and running with ${basename(process.cwd())} quickly.

## Prerequisites

${config.nextjs ? '- Node.js 18+ and npm\n' : ''}${config.fastapi ? '- Python 3.11+\n' : ''}

## Installation

${config.nextjs ? `### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
` : ''}${config.fastapi ? `### Backend
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`
` : ''}
## Next Steps

- See [INSTALLATION.md](./INSTALLATION.md) for detailed setup instructions
- Check [CONFIGURATION.md](./CONFIGURATION.md) for configuration options
- Review [docs/development/](./../development/) for development workflows
`);
  }
  
  if (!fs.existsSync(join(setupDir, 'INSTALLATION.md'))) {
    fs.writeFileSync(join(setupDir, 'INSTALLATION.md'), `# Installation Guide

Detailed installation instructions for ${basename(process.cwd())}.

## Requirements

${config.nextjs ? '- Node.js 18+ and npm\n' : ''}${config.fastapi ? '- Python 3.11+\n' : ''}

## Step-by-Step Installation

${config.nextjs ? `### Install Frontend Dependencies
\`\`\`bash
cd frontend
npm install
\`\`\`
` : ''}${config.fastapi ? `### Setup Python Environment
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`
` : ''}
## Verification

${config.nextjs ? `Verify frontend installation:
\`\`\`bash
cd frontend
npm run build
\`\`\`
` : ''}${config.fastapi ? `Verify backend installation:
\`\`\`bash
cd backend
source venv/bin/activate
python -c "import fastapi; print(fastapi.__version__)"
\`\`\`
` : ''}
## Troubleshooting

See [docs/guides/troubleshooting.md](./../guides/troubleshooting.md) for common issues.
`);
  }
  
  if (!fs.existsSync(join(setupDir, 'DEPLOYMENT.md'))) {
    const deploymentContent = config.cloudflare 
      ? `# Deployment Guide

Deploy ${basename(process.cwd())} to ${config.cloudflareTarget}.

## Prerequisites

- Cloudflare account with API token
- Wrangler CLI installed (if using Cloudflare Workers)

## Deployment Steps

${config.cloudflareTarget === 'Cloudflare Workers' ? `### Deploy to Cloudflare Workers
\`\`\`bash
npx wrangler pages deploy frontend
\`\`\`
` : `### Deploy to Cloudflare Pages
\`\`\`bash
npx wrangler pages deploy frontend
\`\`\`
`}
${config.fastapi ? `### Deploy Backend
See backend-specific deployment documentation.
` : ''}
## Configuration

Configuration is managed via:
- \`.env\` file (not committed to git)
- \`wrangler.toml\` (Cloudflare Workers configuration)

See [CONFIGURATION.md](./CONFIGURATION.md) for details.
`
      : `# Deployment Guide

Deployment instructions for ${basename(process.cwd())}.

## Deployment Options

${config.fastapi ? `### Backend Deployment
Deploy the FastAPI backend to your preferred hosting platform.

Common options:
- Docker containers
- Cloud platforms (AWS, GCP, Azure)
- PaaS services (Heroku, Railway, Render)
` : ''}
## Configuration

See [CONFIGURATION.md](./CONFIGURATION.md) for deployment configuration details.
`;
    
    fs.writeFileSync(join(setupDir, 'DEPLOYMENT.md'), deploymentContent);
  }
  
  if (!fs.existsSync(join(setupDir, 'CONFIGURATION.md'))) {
    fs.writeFileSync(join(setupDir, 'CONFIGURATION.md'), `# Configuration Guide

Configuration options for ${basename(process.cwd())}.

## Environment Variables

${config.cloudflare ? `### Cloudflare Configuration
\`\`\`bash
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
\`\`\`
` : ''}
## Configuration Files

${config.nextjs ? `- \`frontend/.env.local\` - Frontend environment variables
` : ''}${config.fastapi ? `- \`backend/.env\` - Backend environment variables
` : ''}${config.cloudflare ? `- \`wrangler.toml\` - Cloudflare Workers configuration
` : ''}- \`.cursor/mcp.json\` - MCP server configuration

## Customization

For project-specific configuration, see:
- [docs/development/ARCHITECTURE.md](./../development/ARCHITECTURE.md) - Architecture overview
- [docs/guides/](./../guides/) - Customization guides
`);
  }
  
  // Create placeholder files in development/
  const developmentDir = join(docsPath, 'development');
  if (!fs.existsSync(join(developmentDir, 'CONTRIBUTING.md'))) {
    fs.writeFileSync(join(developmentDir, 'CONTRIBUTING.md'), `# Contributing Guide

Contributing guidelines for ${basename(process.cwd())}.

## Development Setup

See [docs/setup/INSTALLATION.md](./../setup/INSTALLATION.md) for setup instructions.

## Code Style

- Follow the project's code style guidelines
- Run linters before committing
- Write tests for new features

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See [CODE_STYLE.md](./CODE_STYLE.md) for detailed style guidelines.
`);
  }
  
  // Create DOCS_INDEX.md
  await createDocsIndex(docsPath, config);
  
  console.log('  ✅ Created docs directory structure');
}

/**
 * Create DOCS_INDEX.md with links to all documentation
 */
async function createDocsIndex(docsPath, config) {
  const indexPath = join(docsPath, 'DOCS_INDEX.md');
  
  if (fs.existsSync(indexPath)) {
    // Don't overwrite existing index
    return;
  }
  
  const projectName = basename(process.cwd());
  
  const indexContent = `# Documentation Index

Complete index of documentation for ${projectName}.

## 📚 Overview

This directory contains all project documentation organized by purpose and feature.

## 📂 Directory Structure

### [Setup](./setup/)
Installation, deployment, and configuration guides.

- [QUICK_START.md](./setup/QUICK_START.md) - Get started quickly
- [INSTALLATION.md](./setup/INSTALLATION.md) - Detailed installation instructions
- [DEPLOYMENT.md](./setup/DEPLOYMENT.md) - Deployment guide
- [CONFIGURATION.md](./setup/CONFIGURATION.md) - Configuration options

### [Development](./development/)
Developer guides, workflows, and coding standards.

- [CONTRIBUTING.md](./development/CONTRIBUTING.md) - How to contribute
- [ARCHITECTURE.md](./development/ARCHITECTURE.md) - System architecture (to be added)
- [TESTING_STRATEGY.md](./development/TESTING_STRATEGY.md) - Testing guidelines (to be added)
- [CODE_STYLE.md](./development/CODE_STYLE.md) - Code style guide (to be added)

### [Features](./features/)
Feature-specific documentation organized by domain/module.

*To be populated as features are documented.*

### [Guides](./guides/)
General how-to guides and best practices.

- Create [troubleshooting.md](./guides/troubleshooting.md) for common issues
- Create [best-practices.md](./guides/best-practices.md) for development best practices
- Create [integration-guides.md](./guides/integration-guides.md) for integration examples

${config.fastapi ? `### [API](./api/)
API endpoint documentation.

- [endpoints.md](./api/endpoints.md) - API endpoint reference (to be added)
- [authentication.md](./api/authentication.md) - Authentication guide (to be added)
` : ''}
### [Status](./status/)
Project status, changelogs, and migration notes.

- [CHANGELOG.md](./status/CHANGELOG.md) - Project changelog (to be added)
- [completion-reports.md](./status/completion-reports.md) - Completion reports (to be added)
- [migration-notes.md](./status/migration-notes.md) - Migration notes (to be added)

## 📝 Documentation Standards

- Use UPPER_CASE for major documents (QUICK_START.md, ARCHITECTURE.md)
- Use kebab-case for feature-specific docs (user-authentication.md)
- Keep documentation up to date
- Update this index when adding new documentation

## 🔗 Quick Links

- [README.md](../README.md) - Project overview
${config.nextjs ? `- [Frontend README](../frontend/README.md) - Frontend documentation` : ''}${config.fastapi ? `\n- [Backend README](../backend/README.md) - Backend documentation` : ''}
`;

  fs.writeFileSync(indexPath, indexContent);
  console.log('  ✅ Created docs/DOCS_INDEX.md');
}

// Run main function
main().catch(console.error);

