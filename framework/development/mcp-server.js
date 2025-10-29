#!/usr/bin/env node

/**
 * Rules Framework MCP Server
 * Provides MCP tools for rules management, template selection, and deployment
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP Server setup
const server = new Server(
  {
    name: 'rules-framework',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Configuration
const config = {
  rulesDir: join(__dirname, '.cursor', 'rules'),
  templatesDir: join(__dirname, 'templates'),
  docsDir: join(__dirname, 'docs'),
  frameworkUrl: process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.your-domain.workers.dev'
};

/**
 * List available MCP tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_rules',
        description: 'List all available purpose-scoped rules',
        inputSchema: {
          type: 'object',
          properties: {
            purpose: {
              type: 'string',
              description: 'Filter by specific purpose (core, backend, docs, testing, ci-cd)',
              enum: ['core', 'backend', 'docs', 'testing', 'ci-cd']
            }
          }
        }
      },
      {
        name: 'get_rule',
        description: 'Get a specific rule file content',
        inputSchema: {
          type: 'object',
          properties: {
            purpose: {
              type: 'string',
              description: 'Rule purpose directory',
              enum: ['core', 'backend', 'docs', 'testing', 'ci-cd']
            },
            ruleName: {
              type: 'string',
              description: 'Name of the rule file (e.g., workflow.mdc)'
            }
          },
          required: ['purpose', 'ruleName']
        }
      },
      {
        name: 'enable_rules',
        description: 'Enable specific rules in the current project',
        inputSchema: {
          type: 'object',
          properties: {
            purposes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['core', 'backend', 'docs', 'testing', 'ci-cd', 'frontend', 'deployment', 'api']
              },
              description: 'List of rule purposes to enable'
            },
            projectPath: {
              type: 'string',
              description: 'Path to the target project (defaults to current directory)'
            }
          },
          required: ['purposes']
        }
      },
      {
        name: 'list_templates',
        description: 'List available deployment templates',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Filter by template type',
              enum: ['deployment', 'rules', 'docs']
            }
          }
        }
      },
      {
        name: 'get_template',
        description: 'Get a specific template file',
        inputSchema: {
          type: 'object',
          properties: {
            templateName: {
              type: 'string',
              description: 'Name of the template file'
            },
            type: {
              type: 'string',
              description: 'Template type',
              enum: ['deployment', 'rules', 'docs']
            }
          },
          required: ['templateName', 'type']
        }
      },
      {
        name: 'apply_template',
        description: 'Apply a template to the current project',
        inputSchema: {
          type: 'object',
          properties: {
            templateName: {
              type: 'string',
              description: 'Name of the template to apply'
            },
            type: {
              type: 'string',
              description: 'Template type',
              enum: ['deployment', 'rules', 'docs']
            },
            projectPath: {
              type: 'string',
              description: 'Path to the target project (defaults to current directory)'
            },
            options: {
              type: 'object',
              description: 'Template-specific options',
              properties: {
                renameFiles: {
                  type: 'boolean',
                  description: 'Remove .template suffix from files'
                },
                overwrite: {
                  type: 'boolean',
                  description: 'Overwrite existing files'
                }
              }
            }
          },
          required: ['templateName', 'type']
        }
      },
      {
        name: 'configure_environment',
        description: 'Configure environment variables for deployment',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the target project'
            },
            environment: {
              type: 'string',
              description: 'Environment type',
              enum: ['development', 'staging', 'production']
            },
            cloudflareToken: {
              type: 'string',
              description: 'Cloudflare API token'
            },
            cloudflareAccountId: {
              type: 'string',
              description: 'Cloudflare account ID'
            },
            projectName: {
              type: 'string',
              description: 'Name of the project'
            }
          },
          required: ['projectPath', 'environment']
        }
      },
      {
        name: 'deploy_project',
        description: 'Deploy the project using the configured templates',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the target project'
            },
            environment: {
              type: 'string',
              description: 'Deployment environment',
              enum: ['staging', 'production']
            },
            dryRun: {
              type: 'boolean',
              description: 'Perform a dry run without actual deployment'
            }
          },
          required: ['projectPath', 'environment']
        }
      },
      {
        name: 'pull_from_framework',
        description: 'Pull files from the deployed Rules Framework',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the target project'
            },
            type: {
              type: 'string',
              description: 'Type of files to pull',
              enum: ['deployment', 'rules', 'docs', 'all']
            },
            frameworkUrl: {
              type: 'string',
              description: 'URL of the deployed framework'
            }
          },
          required: ['projectPath', 'type']
        }
      },
      {
        name: 'validate_setup',
        description: 'Validate the current project setup',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the target project'
            }
          }
        }
      },
      {
        name: 'reconfigure_rules',
        description: 'Reconfigure granular rules for the current project (outside of initial setup)',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the target project (defaults to current directory)'
            },
            purpose: {
              type: 'string',
              description: 'Specific purpose to reconfigure (optional, will prompt for all if not provided)',
              enum: ['core', 'backend', 'docs', 'testing', 'ci-cd']
            }
          }
        }
      },
      {
        name: 'sync_rules',
        description: 'Sync rules from server with conflict detection',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the target project (defaults to current directory)'
            },
            frameworkUrl: {
              type: 'string',
              description: 'URL of the deployed framework'
            },
            autoResolve: {
              type: 'string',
              description: 'How to resolve conflicts automatically',
              enum: ['server', 'local', 'none']
            }
          }
        }
      },
      {
        name: 'push_rules_to_git',
        description: 'Push new/modified rules to git repository if user has appropriate access',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the target project (defaults to current directory)'
            },
            commitMessage: {
              type: 'string',
              description: 'Custom commit message (optional)'
            },
            branch: {
              type: 'string',
              description: 'Git branch to push to (defaults to current branch)'
            },
            remote: {
              type: 'string',
              description: 'Git remote name (defaults to origin)'
            }
          }
        }
      },
      {
        name: 'search_rules',
        description: 'Search for rules by keyword, purpose, or content',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (searches in rule names, descriptions, and content)'
            },
            purpose: {
              type: 'string',
              description: 'Filter by specific purpose',
              enum: ['core', 'backend', 'docs', 'testing', 'ci-cd']
            },
            searchContent: {
              type: 'boolean',
              description: 'Whether to search in rule content (default: true)'
            }
          },
          required: ['query']
        }
      }
    ]
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_rules':
        return await listRules(args || {});
      case 'get_rule':
        return await getRule(args || {});
      case 'enable_rules':
        return await enableRules(args || {});
      case 'list_templates':
        return await listTemplates(args || {});
      case 'get_template':
        return await getTemplate(args || {});
      case 'apply_template':
        return await applyTemplate(args || {});
      case 'configure_environment':
        return await configureEnvironment(args || {});
      case 'deploy_project':
        return await deployProject(args || {});
      case 'pull_from_framework':
        return await pullFromFramework(args || {});
      case 'validate_setup':
        return await validateSetup(args || {});
      case 'reconfigure_rules':
        return await reconfigureRules(args || {});
      case 'sync_rules':
        return await syncRules(args || {});
      case 'push_rules_to_git':
        return await pushRulesToGit(args || {});
      case 'search_rules':
        return await searchRules(args || {});
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message, tool: name }, null, 2)
        }
      ],
      isError: true
    };
  }
});

/**
 * Fetch rules from API
 */
async function fetchRulesFromAPI() {
  try {
    const response = await fetch(`${config.frameworkUrl}/api/rules`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch rules from API: ${error.message}`);
  }
}

/**
 * List available rules
 */
async function listRules(args) {
  const { purpose } = args || {};
  
  // Try to fetch from API first
  try {
    const apiRules = await fetchRulesFromAPI();
    
    // Filter by purpose if specified
    if (purpose) {
      const filtered = apiRules.filter(r => r.name === purpose);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(filtered, null, 2)
          }
        ]
      };
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(apiRules, null, 2)
        }
      ]
    };
  } catch (error) {
    // Fallback to local files if API fails
    const rules = [];

    if (purpose) {
      const purposeDir = join(config.rulesDir, purpose);
      if (existsSync(purposeDir)) {
        const files = readdirSync(purposeDir).filter(f => f.endsWith('.mdc'));
        rules.push({
          purpose,
          files: files.map(f => ({
            name: f,
            path: join(purposeDir, f),
            description: getRuleDescription(f)
          }))
        });
      }
    } else {
      const purposes = ['core', 'backend', 'docs', 'testing', 'ci-cd'];
      for (const p of purposes) {
        const purposeDir = join(config.rulesDir, p);
        if (existsSync(purposeDir)) {
          const files = readdirSync(purposeDir).filter(f => f.endsWith('.mdc'));
          rules.push({
            purpose: p,
            files: files.map(f => ({
              name: f,
              path: join(purposeDir, f),
              description: getRuleDescription(f)
            }))
          });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rules, null, 2)
        }
      ]
    };
  }
}

/**
 * Get a specific rule
 */
async function getRule(args) {
  const { purpose, ruleName } = args || {};
  
  if (!purpose || !ruleName) {
    throw new Error('Missing required parameters: purpose and ruleName are required');
  }
  
  const rulePath = join(config.rulesDir, purpose, ruleName);
  
  // Try local file first
  if (existsSync(rulePath)) {
    const content = readFileSync(rulePath, 'utf8');
    return {
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    };
  }
  
  // Fallback to API
  try {
    const response = await fetch(`${config.frameworkUrl}/rules/${purpose}/${ruleName}`);
    if (!response.ok) {
      throw new Error(`Rule not found: ${purpose}/${ruleName}`);
    }
    const content = await response.text();
    return {
      content: [
        {
          type: 'text',
          text: content
        }
      ]
    };
  } catch (error) {
    throw new Error(`Rule not found: ${purpose}/${ruleName}. ${error.message}`);
  }
}

/**
 * Enable rules in a project
 */
async function enableRules(args) {
  const { purposes, projectPath = process.cwd() } = args || {};
  
  if (!purposes || !Array.isArray(purposes) || purposes.length === 0) {
    throw new Error('Missing required parameter: purposes must be a non-empty array');
  }
  
  const results = [];

  for (const purpose of purposes) {
    const sourceDir = join(config.rulesDir, purpose);
    const targetDir = join(projectPath, '.cursor', 'rules', purpose);
    
    if (existsSync(sourceDir)) {
      // Ensure target directory exists
      mkdirSync(join(projectPath, '.cursor', 'rules'), { recursive: true });
      
      // Copy the entire purpose directory
      try {
        execSync(`cp -r "${sourceDir}" "${targetDir}"`, { stdio: 'pipe' });
        results.push({
          purpose,
          status: 'enabled',
          path: targetDir
        });
      } catch (error) {
        results.push({
          purpose,
          status: 'error',
          error: error.message
        });
      }
    } else {
      results.push({
        purpose,
        status: 'not_found',
        error: `Purpose directory not found: ${sourceDir}`
      });
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(results, null, 2)
      }
    ]
  };
}

/**
 * List available templates
 */
async function listTemplates(args) {
  const { type } = args;
  const templates = [];

  if (type === 'deployment') {
    const deploymentFiles = [
      'deploy-template.js',
      'next.config.template.js',
      'wrangler.template.toml',
      'package.template.json',
      'env.example'
    ];
    
    for (const file of deploymentFiles) {
      const filePath = join(__dirname, file);
      if (existsSync(filePath)) {
        templates.push({
          name: file,
          type: 'deployment',
          path: filePath,
          description: getTemplateDescription(file)
        });
      }
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(templates, null, 2)
      }
    ]
  };
}

/**
 * Get a specific template
 */
async function getTemplate(args) {
  const { templateName, type } = args;
  let templatePath;

  if (type === 'deployment') {
    templatePath = join(__dirname, templateName);
  } else {
    templatePath = join(config.templatesDir, type, templateName);
  }

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const content = readFileSync(templatePath, 'utf8');
  
  return {
    content: [
      {
        type: 'text',
        text: content
      }
    ]
  };
}

/**
 * Apply a template to a project
 */
async function applyTemplate(args) {
  const { templateName, type, projectPath = process.cwd(), options = {} } = args;
  let sourcePath;
  let targetName = templateName;

  if (type === 'deployment') {
    sourcePath = join(__dirname, templateName);
  } else {
    sourcePath = join(config.templatesDir, type, templateName);
  }

  if (!existsSync(sourcePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  // Remove .template suffix if requested
  if (options.renameFiles && templateName.includes('.template.')) {
    targetName = templateName.replace('.template.', '.');
  }

  const targetPath = join(projectPath, targetName);

  // Check if file exists and overwrite is not allowed
  if (existsSync(targetPath) && !options.overwrite) {
    throw new Error(`File already exists: ${targetName}. Use overwrite: true to replace.`);
  }

  // Copy the template
  execSync(`cp "${sourcePath}" "${targetPath}"`, { stdio: 'pipe' });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          template: templateName,
          target: targetName,
          path: targetPath,
          status: 'applied'
        }, null, 2)
      }
    ]
  };
}

/**
 * Configure environment
 */
async function configureEnvironment(args) {
  const { projectPath, environment, cloudflareToken, cloudflareAccountId, projectName } = args;
  
  const envContent = `# Environment Configuration
DEPLOYMENT_ENV=${environment}
${cloudflareToken ? `CLOUDFLARE_API_TOKEN=${cloudflareToken}` : '# CLOUDFLARE_API_TOKEN=your_token_here'}
${cloudflareAccountId ? `CLOUDFLARE_ACCOUNT_ID=${cloudflareAccountId}` : '# CLOUDFLARE_ACCOUNT_ID=your_account_id_here'}
${projectName ? `PROJECT_NAME=${projectName}` : '# PROJECT_NAME=your_project_name'}
`;

  const envPath = join(projectPath, '.env');
  writeFileSync(envPath, envContent);

  return {
    content: [
      {
        type: 'text',
        text: `Environment configured for ${environment}:\n${envContent}`
      }
    ]
  };
}

/**
 * Deploy project
 */
async function deployProject(args) {
  const { projectPath, environment, dryRun = false } = args;
  
  if (dryRun) {
    return {
      content: [
        {
          type: 'text',
          text: `Dry run: Would deploy ${projectPath} to ${environment} environment`
        }
      ]
    };
  }

  try {
    // Change to project directory and run deployment
    const result = execSync('npm run deploy', { 
      cwd: projectPath, 
      stdio: 'pipe',
      encoding: 'utf8'
    });

    return {
      content: [
        {
          type: 'text',
          text: `Deployment successful:\n${result}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Deployment failed: ${error.message}`);
  }
}

/**
 * Pull from framework
 */
async function pullFromFramework(args) {
  const { projectPath, type, frameworkUrl = config.frameworkUrl } = args;
  
  try {
    const pullScript = join(__dirname, 'scripts', 'pull-framework.js');
    const result = execSync(`node "${pullScript}" ${type}`, { 
      cwd: projectPath,
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, RULES_FRAMEWORK_URL: frameworkUrl }
    });

    return {
      content: [
        {
          type: 'text',
          text: `Files pulled successfully:\n${result}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to pull files: ${error.message}`);
  }
}

/**
 * Validate setup
 */
async function validateSetup(args) {
  const { projectPath = process.cwd() } = args;
  const validation = {
    projectPath,
    checks: []
  };

  // Check for .cursor/rules directory
  const rulesDir = join(projectPath, '.cursor', 'rules');
  validation.checks.push({
    name: 'rules_directory',
    status: existsSync(rulesDir) ? 'pass' : 'fail',
    message: existsSync(rulesDir) ? 'Rules directory exists' : 'Rules directory not found'
  });

  // Check for deployment files
  const deploymentFiles = ['deploy.js', 'wrangler.toml', 'package.json', '.env'];
  for (const file of deploymentFiles) {
    const filePath = join(projectPath, file);
    validation.checks.push({
      name: `deployment_file_${file}`,
      status: existsSync(filePath) ? 'pass' : 'fail',
      message: existsSync(filePath) ? `${file} exists` : `${file} not found`
    });
  }

  // Check for Node.js and npm
  try {
    execSync('node --version', { stdio: 'pipe' });
    validation.checks.push({
      name: 'node_js',
      status: 'pass',
      message: 'Node.js is available'
    });
  } catch {
    validation.checks.push({
      name: 'node_js',
      status: 'fail',
      message: 'Node.js not found'
    });
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(validation, null, 2)
      }
    ]
  };
}

/**
 * Get rule description
 */
function getRuleDescription(ruleName) {
  const descriptions = {
    'workflow.mdc': 'Task-driven development workflow',
    'engineering-practices.mdc': 'Core engineering guardrails and coding standards',
    'code-hygiene.mdc': 'Code hygiene and project organization',
    'repo-creation.mdc': 'Repository creation approval requirements',
    'api-guidelines.mdc': 'API implementation and FastAPI guidelines',
    'documentation.mdc': 'Documentation organization and structure rules',
    'data-quality.mdc': 'Data quality standards and verification protocols',
    'testing.mdc': 'Testing requirements and protocols',
    'github.mdc': 'GitHub workflow and PR conventions'
  };
  return descriptions[ruleName] || 'Rule description not available';
}

/**
 * Get template description
 */
function getTemplateDescription(templateName) {
  const descriptions = {
    'deploy-template.js': 'Universal deployment script for Next.js projects',
    'next.config.template.js': 'Next.js configuration template',
    'wrangler.template.toml': 'Cloudflare configuration template',
    'package.template.json': 'Package configuration template',
    'env.example': 'Environment variables template'
  };
  return descriptions[templateName] || 'Template description not available';
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
    // Handle array values
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
    // Handle string values
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
 * Prompt user for input (non-interactive version for MCP)
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
  return input.split(/[,\s]+/).map(s => s.trim()).filter(s => s);
}

/**
 * Reconfigure granular rules
 */
async function reconfigureRules(args) {
  const { projectPath = process.cwd(), purpose } = args || {};
  const rulesDir = join(projectPath, '.cursor', 'rules');
  
  if (!existsSync(rulesDir)) {
    throw new Error('Rules directory not found. Run setup first.');
  }

  const results = [];
  
  try {
    // Fetch available rules from framework API
    const apiRules = await fetchRulesFromAPI();
    
    // Filter by purpose if specified
    const purposesToProcess = purpose 
      ? apiRules.filter(r => r.name === purpose)
      : apiRules;

    for (const rulePurpose of purposesToProcess) {
      const purposeName = rulePurpose.name;
      const purposeDir = join(rulesDir, purposeName);
      
      if (!existsSync(purposeDir)) {
        results.push({
          purpose: purposeName,
          status: 'skipped',
          message: 'Purpose directory not found locally'
        });
        continue;
      }

      // Get local rules
      const localFiles = existsSync(purposeDir) 
        ? readdirSync(purposeDir).filter(f => f.endsWith('.mdc'))
        : [];

      // Process each rule file
      for (const fileName of rulePurpose.files || []) {
        const rulePath = join(purposeDir, fileName);
        const ruleExists = existsSync(rulePath);
        
        if (ruleExists) {
          try {
            // Fetch latest version from server
            const serverResponse = await fetch(`${config.frameworkUrl}/rules/${purposeName}/${fileName}`);
            if (serverResponse.ok) {
              const serverContent = await serverResponse.text();
              const localContent = readFileSync(rulePath, 'utf8');
              
              const { metadata: localMetadata } = parseFrontmatter(localContent);
              const { metadata: serverMetadata } = parseFrontmatter(serverContent);
              
              results.push({
                purpose: purposeName,
                file: fileName,
                status: 'exists',
                localMetadata,
                serverMetadata,
                canReconfigure: true
              });
            }
          } catch (error) {
            results.push({
              purpose: purposeName,
              file: fileName,
              status: 'error',
              error: error.message
            });
          }
        } else {
          results.push({
            purpose: purposeName,
            file: fileName,
            status: 'not_found',
            message: 'Rule not found locally'
          });
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            message: 'Rules reconfigured. Use sync_rules to update from server.',
            results
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to reconfigure rules: ${error.message}`);
  }
}

/**
 * Sync rules from server with conflict detection
 */
async function syncRules(args) {
  const { projectPath = process.cwd(), frameworkUrl = config.frameworkUrl, autoResolve = 'none' } = args || {};
  const rulesDir = join(projectPath, '.cursor', 'rules');
  
  if (!existsSync(rulesDir)) {
    mkdirSync(rulesDir, { recursive: true });
  }

  const conflicts = [];
  const synced = [];
  const errors = [];

  try {
    // Fetch rules from server
    const apiRules = await fetchRulesFromAPI();
    
    for (const rulePurpose of apiRules) {
      const purposeName = rulePurpose.name;
      const purposeDir = join(rulesDir, purposeName);
      mkdirSync(purposeDir, { recursive: true });

      for (const fileName of rulePurpose.files || []) {
        const rulePath = join(purposeDir, fileName);
        const ruleExists = existsSync(rulePath);
        
        try {
          // Fetch server version
          const serverResponse = await fetch(`${frameworkUrl}/rules/${purposeName}/${fileName}`);
          if (!serverResponse.ok) {
            errors.push({
              purpose: purposeName,
              file: fileName,
              error: `Server returned ${serverResponse.status}`
            });
            continue;
          }

          const serverContent = await serverResponse.text();
          
          if (ruleExists) {
            // Check for conflicts
            const localContent = readFileSync(rulePath, 'utf8');
            
            if (localContent !== serverContent) {
              const { metadata: localMetadata } = parseFrontmatter(localContent);
              const { metadata: serverMetadata } = parseFrontmatter(serverContent);
              
              // Check if it's a real conflict (different metadata or body)
              const localBody = parseFrontmatter(localContent).body;
              const serverBody = parseFrontmatter(serverContent).body;
              
              if (localBody !== serverBody || JSON.stringify(localMetadata) !== JSON.stringify(serverMetadata)) {
                conflicts.push({
                  purpose: purposeName,
                  file: fileName,
                  local: { metadata: localMetadata, body: localBody.substring(0, 200) },
                  server: { metadata: serverMetadata, body: serverBody.substring(0, 200) }
                });

                // Auto-resolve if requested
                if (autoResolve === 'server') {
                  writeFileSync(rulePath, serverContent);
                  synced.push({ purpose: purposeName, file: fileName, action: 'updated_from_server' });
                } else if (autoResolve === 'local') {
                  synced.push({ purpose: purposeName, file: fileName, action: 'kept_local' });
                }
                // If autoResolve === 'none', leave conflict for user to resolve
              } else {
                // No actual conflict, files are the same
                synced.push({ purpose: purposeName, file: fileName, action: 'unchanged' });
              }
            } else {
              synced.push({ purpose: purposeName, file: fileName, action: 'unchanged' });
            }
          } else {
            // New file, just sync it
            writeFileSync(rulePath, serverContent);
            synced.push({ purpose: purposeName, file: fileName, action: 'added' });
          }
        } catch (error) {
          errors.push({
            purpose: purposeName,
            file: fileName,
            error: error.message
          });
        }
      }
    }

    const result = {
      synced: synced.length,
      conflicts: conflicts.length,
      errors: errors.length,
      syncedFiles: synced,
      conflicts: conflicts,
      errors: errors
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to sync rules: ${error.message}`);
  }
}

/**
 * Push rules to git
 */
async function pushRulesToGit(args) {
  const { projectPath = process.cwd(), commitMessage, branch, remote = 'origin' } = args || {};
  
  // Check if git is initialized
  if (!existsSync(join(projectPath, '.git'))) {
    throw new Error('Git repository not initialized');
  }

  try {
    // Check git status
    const statusOutput = execSync('git status --porcelain', { 
      cwd: projectPath, 
      encoding: 'utf8' 
    });

    if (!statusOutput.trim()) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'No changes to commit',
              status: 'clean'
            }, null, 2)
          }
        ]
      };
    }

    // Check if rules directory has changes
    const rulesChanges = statusOutput.split('\n').filter(line => 
      line.trim().startsWith('.cursor/rules/')
    );

    if (rulesChanges.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'No rule changes detected',
              status: 'no_rules_changes'
            }, null, 2)
          }
        ]
      };
    }

    // Check git write access
    try {
      execSync('git fetch', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 5000
      });
    } catch (error) {
      throw new Error('No git write access or remote not configured');
    }

    // Stage rule changes
    execSync('git add .cursor/rules/', { 
      cwd: projectPath, 
      stdio: 'pipe' 
    });

    // Commit
    const finalCommitMessage = commitMessage || 'Update rules from Rules Framework';
    execSync(`git commit -m "${finalCommitMessage}"`, { 
      cwd: projectPath, 
      stdio: 'pipe' 
    });

    // Get current branch if not specified
    const currentBranch = branch || execSync('git rev-parse --abbrev-ref HEAD', { 
      cwd: projectPath, 
      encoding: 'utf8' 
    }).trim();

    // Push
    try {
      execSync(`git push ${remote} ${currentBranch}`, { 
        cwd: projectPath, 
        stdio: 'pipe' 
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Rules pushed to git successfully',
              branch: currentBranch,
              remote: remote,
              filesChanged: rulesChanges.length
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to push to git: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`Git operation failed: ${error.message}`);
  }
}

/**
 * Search rules
 */
async function searchRules(args) {
  const { query, purpose, searchContent = true } = args || {};
  
  if (!query) {
    throw new Error('Search query is required');
  }

  const results = [];
  
  try {
    // Fetch rules from API
    const apiRules = await fetchRulesFromAPI();
    
    // Filter by purpose if specified
    const purposesToSearch = purpose 
      ? apiRules.filter(r => r.name === purpose)
      : apiRules;

    for (const rulePurpose of purposesToSearch) {
      const purposeName = rulePurpose.name;
      
      // Search in purpose name/description
      if (purposeName.toLowerCase().includes(query.toLowerCase()) ||
          (rulePurpose.description && rulePurpose.description.toLowerCase().includes(query.toLowerCase()))) {
        results.push({
          type: 'purpose',
          purpose: purposeName,
          description: rulePurpose.description,
          match: 'purpose_name_or_description'
        });
      }

      // Search in rule files
      for (const fileName of rulePurpose.files || []) {
        // Search in filename
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            type: 'file',
            purpose: purposeName,
            file: fileName,
            match: 'filename'
          });
        }

        // Search in content if requested
        if (searchContent) {
          try {
            const ruleResponse = await fetch(`${config.frameworkUrl}/rules/${purposeName}/${fileName}`);
            if (ruleResponse.ok) {
              const content = await ruleResponse.text();
              const { metadata, body } = parseFrontmatter(content);
              
              // Search in metadata
              const metadataStr = JSON.stringify(metadata).toLowerCase();
              if (metadataStr.includes(query.toLowerCase())) {
                results.push({
                  type: 'file',
                  purpose: purposeName,
                  file: fileName,
                  match: 'metadata',
                  metadata: metadata
                });
              }
              
              // Search in body
              if (body.toLowerCase().includes(query.toLowerCase())) {
                const matchIndex = body.toLowerCase().indexOf(query.toLowerCase());
                const contextStart = Math.max(0, matchIndex - 50);
                const contextEnd = Math.min(body.length, matchIndex + query.length + 50);
                const context = body.substring(contextStart, contextEnd);
                
                results.push({
                  type: 'file',
                  purpose: purposeName,
                  file: fileName,
                  match: 'content',
                  context: context
                });
              }
            }
          } catch (error) {
            // Skip if can't fetch
          }
        }
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query,
            resultsCount: results.length,
            results: results
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    throw new Error(`Search failed: ${error.message}`);
  }
}

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Rules Framework MCP Server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
