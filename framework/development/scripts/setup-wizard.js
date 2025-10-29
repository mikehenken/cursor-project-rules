#!/usr/bin/env node

/**
 * Rules Framework Setup Wizard
 * Interactive CLI tool for setting up projects with the Rules Framework
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Configuration
const config = {
  frameworkUrl: 'https://rules-framework.mikehenken.workers.dev',
  rulesDir: join(projectRoot, '.cursor', 'rules'),
  templatesDir: join(projectRoot, 'templates')
};

/**
 * Main setup wizard
 */
async function setupWizard() {
  console.log('🎯 Rules Framework Setup Wizard');
  console.log('================================\n');
  console.log('This wizard will help you set up your project with the Rules Framework.');
  console.log('You can choose which components to include based on your project needs.\n');

  try {
    // Get project information
    const projectInfo = await getProjectInfo();
    
    // Get component selections
    const selections = await getComponentSelections();
    
    // Apply selections
    await applySelections(projectInfo, selections);
    
    // Show next steps
    showNextSteps(projectInfo, selections);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Get project information
 */
async function getProjectInfo() {
  console.log('📋 Project Information');
  console.log('=====================\n');
  
  const projectPath = process.cwd();
  const projectName = projectPath.split('/').pop();
  
  console.log(`Project Path: ${projectPath}`);
  console.log(`Project Name: ${projectName}\n`);
  
  return {
    path: projectPath,
    name: projectName
  };
}

/**
 * Get component selections
 */
async function getComponentSelections() {
  console.log('🔧 Component Selection');
  console.log('======================\n');
  console.log('Select which components you want to include in your project:\n');
  
  const selections = {
    rules: [],
    templates: [],
    mcp: false,
    cloudflare: false,
    github: false
  };
  
  // Rules selection
  console.log('📋 Cursor Rules:');
  const ruleOptions = [
    { key: 'core', name: 'Core Rules', description: 'Essential project-wide rules (workflow, engineering practices, code hygiene)' },
    { key: 'backend', name: 'Backend Rules', description: 'API development and FastAPI guidelines' },
    { key: 'docs', name: 'Documentation Rules', description: 'Documentation standards and organization' },
    { key: 'testing', name: 'Testing Rules', description: 'Testing requirements and protocols' },
    { key: 'ci-cd', name: 'CI/CD Rules', description: 'GitHub workflow and deployment conventions' }
  ];
  
  for (const rule of ruleOptions) {
    const include = await askYesNo(`  Include ${rule.name}? (${rule.description})`);
    if (include) {
      selections.rules.push(rule.key);
    }
  }
  
  console.log('\n📦 Templates:');
  const templateOptions = [
    { key: 'nextjs-cloudflare', name: 'Next.js + Cloudflare', description: 'Complete Next.js deployment setup for Cloudflare Pages' },
    { key: 'deployment', name: 'Deployment Files', description: 'Universal deployment scripts and configuration' }
  ];
  
  for (const template of templateOptions) {
    const include = await askYesNo(`  Include ${template.name}? (${template.description})`);
    if (include) {
      selections.templates.push(template.key);
    }
  }
  
  console.log('\n🔌 Integrations:');
  selections.mcp = await askYesNo('  Enable MCP integration? (Allows Cursor to use Rules Framework tools)');
  selections.cloudflare = await askYesNo('  Configure Cloudflare deployment? (Sets up environment variables)');
  selections.github = await askYesNo('  Include GitHub repository setup? (Adds .github templates and workflows)');
  
  return selections;
}

/**
 * Apply selections to project
 */
async function applySelections(projectInfo, selections) {
  console.log('\n🚀 Applying Configuration');
  console.log('=========================\n');
  
  // Create .cursor/rules directory structure
  if (selections.rules.length > 0) {
    console.log('📋 Setting up Cursor rules...');
    await setupRules(projectInfo, selections.rules);
  }
  
  // Apply templates
  if (selections.templates.length > 0) {
    console.log('📦 Applying templates...');
    await applyTemplates(projectInfo, selections.templates);
  }
  
  // Setup MCP integration
  if (selections.mcp) {
    console.log('🔌 Setting up MCP integration...');
    await setupMCP(projectInfo);
  }
  
  // Configure Cloudflare
  if (selections.cloudflare) {
    console.log('☁️  Configuring Cloudflare...');
    await setupCloudflare(projectInfo);
  }
  
  // Setup GitHub
  if (selections.github) {
    console.log('🐙 Setting up GitHub...');
    await setupGitHub(projectInfo);
  }
}

/**
 * Setup Cursor rules
 */
async function setupRules(projectInfo, ruleTypes) {
  const rulesDir = join(projectInfo.path, '.cursor', 'rules');
  mkdirSync(rulesDir, { recursive: true });
  
  for (const ruleType of ruleTypes) {
    const sourceDir = join(config.rulesDir, ruleType);
    const targetDir = join(rulesDir, ruleType);
    
    if (existsSync(sourceDir)) {
      execSync(`cp -r "${sourceDir}" "${targetDir}"`, { stdio: 'pipe' });
      console.log(`  ✅ Added ${ruleType} rules`);
    } else {
      console.log(`  ⚠️  ${ruleType} rules not found`);
    }
  }
}

/**
 * Apply templates
 */
async function applyTemplates(projectInfo, templateTypes) {
  for (const templateType of templateTypes) {
    if (templateType === 'nextjs-cloudflare') {
      await applyNextJSCloudflareTemplate(projectInfo);
    } else if (templateType === 'deployment') {
      await applyDeploymentTemplate(projectInfo);
    }
  }
}

/**
 * Apply Next.js Cloudflare template
 */
async function applyNextJSCloudflareTemplate(projectInfo) {
  const templateDir = join(config.templatesDir, 'nextjs-cloudflare');
  const files = [
    'deploy-template.js',
    'next.config.template.js',
    'wrangler.template.toml',
    'package.template.json',
    'env.example'
  ];
  
  for (const file of files) {
    const sourcePath = join(templateDir, file);
    if (existsSync(sourcePath)) {
      let targetName = file;
      if (file.includes('.template.')) {
        targetName = file.replace('.template.', '.');
      }
      const targetPath = join(projectInfo.path, targetName);
      execSync(`cp "${sourcePath}" "${targetPath}"`, { stdio: 'pipe' });
      console.log(`  ✅ Added ${targetName}`);
    }
  }
}

/**
 * Apply deployment template
 */
async function applyDeploymentTemplate(projectInfo) {
  const files = [
    'deploy-template.js',
    'wrangler.template.toml',
    'env.example'
  ];
  
  for (const file of files) {
    const sourcePath = join(projectRoot, file);
    if (existsSync(sourcePath)) {
      let targetName = file;
      if (file.includes('.template.')) {
        targetName = file.replace('.template.', '.');
      }
      const targetPath = join(projectInfo.path, targetName);
      execSync(`cp "${sourcePath}" "${targetPath}"`, { stdio: 'pipe' });
      console.log(`  ✅ Added ${targetName}`);
    }
  }
}

/**
 * Setup MCP integration
 */
async function setupMCP(projectInfo) {
  const mcpConfig = {
    mcpServers: {
      "rules-framework": {
        command: "node",
        args: [join(projectRoot, "mcp-server.js")],
        env: {
          RULES_FRAMEWORK_URL: config.frameworkUrl
        }
      }
    }
  };
  
  const mcpPath = join(projectInfo.path, '.cursor', 'mcp.json');
  writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2));
  console.log(`  ✅ Created .cursor/mcp.json`);
  
  // Copy MCP server if not exists
  const mcpServerPath = join(projectInfo.path, 'mcp-server.js');
  if (!existsSync(mcpServerPath)) {
    execSync(`cp "${join(projectRoot, 'mcp-server.js')}" "${mcpServerPath}"`, { stdio: 'pipe' });
    console.log(`  ✅ Added mcp-server.js`);
  }
}

/**
 * Setup Cloudflare configuration
 */
async function setupCloudflare(projectInfo) {
  const envPath = join(projectInfo.path, '.env');
  const envContent = `# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here
PROJECT_NAME=${projectInfo.name}
DEPLOYMENT_ENV=production

# Get your credentials from:
# https://dash.cloudflare.com/profile/api-tokens
`;

  writeFileSync(envPath, envContent);
  console.log(`  ✅ Created .env file`);
}

/**
 * Setup GitHub integration
 */
async function setupGitHub(projectInfo) {
  const githubDir = join(projectInfo.path, '.github');
  mkdirSync(githubDir, { recursive: true });
  
  // Create PR template
  const prTemplate = `# Pull Request

## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] All existing tests still pass

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
`;

  writeFileSync(join(githubDir, 'pull_request_template.md'), prTemplate);
  console.log(`  ✅ Created GitHub PR template`);
}

/**
 * Show next steps
 */
function showNextSteps(projectInfo, selections) {
  console.log('\n🎉 Setup Complete!');
  console.log('==================\n');
  
  console.log('📋 What was configured:');
  if (selections.rules.length > 0) {
    console.log(`  ✅ Cursor rules: ${selections.rules.join(', ')}`);
  }
  if (selections.templates.length > 0) {
    console.log(`  ✅ Templates: ${selections.templates.join(', ')}`);
  }
  if (selections.mcp) {
    console.log('  ✅ MCP integration');
  }
  if (selections.cloudflare) {
    console.log('  ✅ Cloudflare configuration');
  }
  if (selections.github) {
    console.log('  ✅ GitHub integration');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('==============');
  
  if (selections.cloudflare) {
    console.log('1. Configure Cloudflare credentials in .env file');
    console.log('2. Get your API token from: https://dash.cloudflare.com/profile/api-tokens');
  }
  
  if (selections.mcp) {
    console.log('3. Restart Cursor to enable MCP integration');
    console.log('4. Use @rules-framework commands in Cursor');
  }
  
  if (selections.templates.includes('nextjs-cloudflare')) {
    console.log('5. Install dependencies: npm install');
    console.log('6. Deploy: npm run deploy');
  }
  
  console.log('\n📚 Available Commands:');
  console.log('======================');
  console.log('In Cursor:');
  console.log('  @rules-framework list_rules - Browse available rules');
  console.log('  @rules-framework enable_rules - Enable specific rule sets');
  console.log('  @rules-framework apply_template - Apply templates');
  console.log('  @rules-framework deploy_project - Deploy your project');
  
  console.log('\nCLI:');
  console.log('  node scripts/setup-wizard.js - Run this wizard again');
  console.log('  npm run pull:deployment - Pull deployment files from framework');
  console.log('  npm run pull:rules - Pull rules from framework');
  
  console.log('\n🌐 Framework URL:');
  console.log('================');
  console.log(`https://rules-framework.mikehenken.workers.dev`);
}

/**
 * Ask yes/no question
 */
function askYesNo(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

// Run the wizard
if (import.meta.url === `file://${process.argv[1]}`) {
  setupWizard().catch(console.error);
}
