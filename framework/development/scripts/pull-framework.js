#!/usr/bin/env node

/**
 * Pull Rules Framework files from Cloudflare Workers
 * This script downloads deployment files, rules, and documentation from the deployed framework
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  frameworkUrl: process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.your-domain.workers.dev',
  outputDir: process.env.OUTPUT_DIR || join(process.cwd(), 'rules-framework-files'),
  types: {
    deployment: {
      endpoint: '/api/pull?type=deployment',
      description: 'Deployment files for Next.js Cloudflare Pages projects'
    },
    rules: {
      endpoint: '/api/pull?type=rules',
      description: 'Purpose-scoped Cursor rules'
    },
    docs: {
      endpoint: '/api/pull?type=docs',
      description: 'Documentation and guides'
    }
  }
};

/**
 * Main pull function
 */
async function pullFramework() {
  const args = process.argv.slice(2);
  const type = args[0] || 'all';
  
  console.log('📥 Pulling Rules Framework files...\n');
  console.log(`🌐 Framework URL: ${config.frameworkUrl}`);
  console.log(`📁 Output directory: ${config.outputDir}\n`);

  try {
    // Create output directory
    ensureDirectoryExists(config.outputDir);

    if (type === 'all' || type === 'deployment') {
      await pullDeploymentFiles();
    }

    if (type === 'all' || type === 'rules') {
      await pullRulesFiles();
    }

    if (type === 'all' || type === 'docs') {
      await pullDocumentation();
    }

    console.log('\n✅ Framework files pulled successfully!');
    console.log(`📁 Files saved to: ${config.outputDir}`);
    console.log('\n📖 Next steps:');
    console.log('   1. Review the pulled files');
    console.log('   2. Copy deployment files to your project');
    console.log('   3. Copy rules to your .cursor/rules/ directory');
    console.log('   4. Follow the setup instructions in the documentation');

  } catch (error) {
    console.error('❌ Failed to pull framework files:', error.message);
    process.exit(1);
  }
}

/**
 * Pull deployment files
 */
async function pullDeploymentFiles() {
  console.log('📦 Pulling deployment files...');
  
  try {
    const response = await fetch(`${config.frameworkUrl}${config.types.deployment.endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const deploymentDir = join(config.outputDir, 'deployment');
    ensureDirectoryExists(deploymentDir);

    // Save deployment files
    for (const [fileName, content] of Object.entries(data.files)) {
      const filePath = join(deploymentDir, fileName);
      writeFileSync(filePath, content);
      console.log(`   📄 Saved ${fileName}`);
    }

    // Save instructions
    const instructionsPath = join(deploymentDir, 'SETUP_INSTRUCTIONS.md');
    const instructions = generateDeploymentInstructions(data.instructions);
    writeFileSync(instructionsPath, instructions);
    console.log(`   📄 Saved SETUP_INSTRUCTIONS.md`);

    console.log('   ✅ Deployment files pulled successfully');

  } catch (error) {
    console.error('   ❌ Failed to pull deployment files:', error.message);
  }
}

/**
 * Pull rules files
 */
async function pullRulesFiles() {
  console.log('📋 Pulling rules files...');
  
  try {
    const response = await fetch(`${config.frameworkUrl}${config.types.rules.endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rulesDir = join(config.outputDir, 'rules');
    ensureDirectoryExists(rulesDir);

    // Save rules files by purpose
    // Correct structure: rules/purpose/file.mdc (NOT rules/purpose/.cursor/rules/file.mdc)
    for (const [purpose, files] of Object.entries(data.structure)) {
      const purposeDir = join(rulesDir, purpose);
      ensureDirectoryExists(purposeDir);

      for (const [fileName, content] of Object.entries(files)) {
        const filePath = join(purposeDir, fileName);
        writeFileSync(filePath, content);
        console.log(`   📄 Saved ${purpose}/${fileName}`);
      }
    }

    // Save instructions
    const instructionsPath = join(rulesDir, 'SETUP_INSTRUCTIONS.md');
    const instructions = generateRulesInstructions(data.instructions);
    writeFileSync(instructionsPath, instructions);
    console.log(`   📄 Saved SETUP_INSTRUCTIONS.md`);

    console.log('   ✅ Rules files pulled successfully');

  } catch (error) {
    console.error('   ❌ Failed to pull rules files:', error.message);
  }
}

/**
 * Pull documentation
 */
async function pullDocumentation() {
  console.log('📚 Pulling documentation...');
  
  try {
    const response = await fetch(`${config.frameworkUrl}${config.types.docs.endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const docsDir = join(config.outputDir, 'docs');
    ensureDirectoryExists(docsDir);

    // Save documentation files
    for (const [fileName, content] of Object.entries(data.files)) {
      const filePath = join(docsDir, fileName);
      writeFileSync(filePath, content);
      console.log(`   📄 Saved ${fileName}`);
    }

    // Save instructions
    const instructionsPath = join(docsDir, 'USAGE_INSTRUCTIONS.md');
    const instructions = generateDocsInstructions(data.instructions);
    writeFileSync(instructionsPath, instructions);
    console.log(`   📄 Saved USAGE_INSTRUCTIONS.md`);

    console.log('   ✅ Documentation pulled successfully');

  } catch (error) {
    console.error('   ❌ Failed to pull documentation:', error.message);
  }
}

/**
 * Generate deployment instructions
 */
function generateDeploymentInstructions(instructions) {
  return `# Deployment Files Setup Instructions

## Overview
These files provide a complete deployment solution for Next.js applications on Cloudflare Pages.

## Files Included
- \`deploy-template.js\` - Universal deployment script
- \`next.config.template.js\` - Next.js configuration template
- \`wrangler.template.toml\` - Cloudflare configuration template
- \`package.template.json\` - Package configuration template
- \`env.example\` - Environment variables template

## Setup Instructions

### 1. Copy Files to Your Project
\`\`\`bash
# Copy deployment files to your project root
cp deploy-template.js your-project/deploy.js
cp next.config.template.js your-project/next.config.js
cp wrangler.template.toml your-project/wrangler.toml
cp package.template.json your-project/package.json
cp env.example your-project/.env
\`\`\`

### 2. Configure Environment Variables
Edit \`.env\` with your Cloudflare credentials:
\`\`\`bash
CLOUDFLARE_API_TOKEN=your_actual_token_here
CLOUDFLARE_ACCOUNT_ID=your_actual_account_id_here
PROJECT_NAME=your-project-name
DEPLOYMENT_ENV=production
\`\`\`

### 3. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 4. Deploy
\`\`\`bash
npm run deploy
\`\`\`

## Next Steps
1. Review the deployment files and customize as needed
2. Set up your Cloudflare credentials
3. Test the deployment process
4. Deploy to production

For detailed instructions, see the documentation files.
`;
}

/**
 * Generate rules instructions
 */
function generateRulesInstructions(instructions) {
  return `# Rules Files Setup Instructions

## Overview
These purpose-scoped Cursor rules provide development guidelines organized by domain.

## Purpose Directories
- \`core/\` - Essential project-wide rules
- \`backend/\` - Backend and API development rules
- \`docs/\` - Documentation standards and organization
- \`testing/\` - Testing requirements and protocols
- \`ci-cd/\` - CI/CD and deployment rules

## Setup Instructions

### 1. Copy Rules to Your Project
\`\`\`bash
# Copy specific rule sets you need
cp -r core/ your-project/.cursor/rules/
cp -r backend/ your-project/.cursor/rules/
cp -r testing/ your-project/.cursor/rules/
\`\`\`

### 2. Verify Structure
Ensure your project has the nested structure:
\`\`\`
your-project/
└── .cursor/
    └── rules/
        ├── core/
        │   └── .cursor/
        │       └── rules/
        │           ├── workflow.mdc
        │           ├── engineering-practices.mdc
        │           └── ...
        └── backend/
            └── .cursor/
                └── rules/
                    └── api-guidelines.mdc
\`\`\`

### 3. Test Rules Application
- Open files in Cursor
- Check that rules are applied based on directory context
- Verify file type matching works correctly

## Usage
Rules will automatically apply based on:
- Directory context (working in specific purpose directories)
- File type matching (globs patterns)
- Always applied rules (project-wide)

## Customization
- Modify rule files to match your project needs
- Add custom rules to existing purpose directories
- Create new purpose directories for project-specific rules
`;
}

/**
 * Generate documentation instructions
 */
function generateDocsInstructions(instructions) {
  return `# Documentation Usage Instructions

## Overview
This documentation provides comprehensive guides for using the Rules Framework and deployment boilerplates.

## Documentation Structure
- Setup and installation guides
- Development workflows and standards
- Feature-specific documentation
- Troubleshooting and best practices

## Usage
1. Review the documentation relevant to your needs
2. Follow setup instructions for your project type
3. Use the guides for best practices and troubleshooting
4. Reference the documentation when customizing rules or deployment

## Key Documents
- \`CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md\` - Complete deployment guide
- \`PURPOSE_SCOPED_RULES.md\` - Purpose-scoped rules guide
- \`DEPLOYMENT_SETUP.md\` - Detailed setup instructions
- \`TROUBLESHOOTING.md\` - Common issues and solutions

## Next Steps
1. Review the documentation structure
2. Follow the setup guides for your project type
3. Customize rules and deployment files as needed
4. Use the troubleshooting guide if you encounter issues
`;
}

/**
 * Ensure directory exists
 */
function ensureDirectoryExists(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

// Show usage if no arguments
if (process.argv.length < 3) {
  console.log('📥 Rules Framework Pull Tool');
  console.log('\nUsage:');
  console.log('  node pull-framework.js [type]');
  console.log('\nTypes:');
  console.log('  all         - Pull all files (default)');
  console.log('  deployment  - Pull deployment files only');
  console.log('  rules       - Pull rules files only');
  console.log('  docs        - Pull documentation only');
  console.log('\nEnvironment Variables:');
  console.log('  RULES_FRAMEWORK_URL - Framework URL (default: https://rules-framework.your-domain.workers.dev)');
  console.log('  OUTPUT_DIR          - Output directory (default: ./rules-framework-files)');
  process.exit(0);
}

// Run pull
if (import.meta.url === `file://${process.argv[1]}`) {
  pullFramework().catch(console.error);
}
