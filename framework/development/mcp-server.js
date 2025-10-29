#!/usr/bin/env node

/**
 * Rules Framework MCP Server
 * Provides MCP tools for rules management, template selection, and deployment
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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
        return await listRules(args);
      case 'get_rule':
        return await getRule(args);
      case 'enable_rules':
        return await enableRules(args);
      case 'list_templates':
        return await listTemplates(args);
      case 'get_template':
        return await getTemplate(args);
      case 'apply_template':
        return await applyTemplate(args);
      case 'configure_environment':
        return await configureEnvironment(args);
      case 'deploy_project':
        return await deployProject(args);
      case 'pull_from_framework':
        return await pullFromFramework(args);
      case 'validate_setup':
        return await validateSetup(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

/**
 * List available rules
 */
async function listRules(args) {
  const { purpose } = args;
  const rules = [];

  if (purpose) {
    const purposeDir = join(config.rulesDir, purpose, '.cursor', 'rules');
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
      const purposeDir = join(config.rulesDir, p, '.cursor', 'rules');
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

/**
 * Get a specific rule
 */
async function getRule(args) {
  const { purpose, ruleName } = args;
  const rulePath = join(config.rulesDir, purpose, '.cursor', 'rules', ruleName);
  
  if (!existsSync(rulePath)) {
    throw new Error(`Rule not found: ${purpose}/${ruleName}`);
  }

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

/**
 * Enable rules in a project
 */
async function enableRules(args) {
  const { purposes, projectPath = process.cwd() } = args;
  const results = [];

  for (const purpose of purposes) {
    const sourceDir = join(config.rulesDir, purpose);
    const targetDir = join(projectPath, '.cursor', 'rules', purpose);
    
    if (existsSync(sourceDir)) {
      // Copy the entire purpose directory
      execSync(`cp -r "${sourceDir}" "${targetDir}"`, { stdio: 'pipe' });
      results.push({
        purpose,
        status: 'enabled',
        path: targetDir
      });
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

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Rules Framework MCP Server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
