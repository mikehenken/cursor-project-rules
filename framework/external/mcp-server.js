#!/usr/bin/env node

/**
 * Rules Framework MCP Server
 * Provides MCP tools for rules management, template selection, and deployment
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
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
  frameworkUrl: process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev'
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
      ]
    };
  }
});

/**
 * List available rules
 */
async function listRules(purpose) {
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
 * Get a specific rule
 */
async function getRule(args) {
  const { purpose, ruleName } = args;
  const rulePath = join(config.rulesDir, purpose, ruleName);
  
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

// Start the MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Rules Framework MCP Server running on stdio');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
