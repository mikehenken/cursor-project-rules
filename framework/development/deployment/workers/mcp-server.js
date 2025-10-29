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
              description: 'Filter rules by purpose (core, backend, frontend, etc.)'
            }
          }
        }
      },
      {
        name: 'enable_rules',
        description: 'Enable specific rule sets for the project',
        inputSchema: {
          type: 'object',
          properties: {
            rules: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of rule names to enable'
            }
          },
          required: ['rules']
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
        return await listRules(args.purpose);
      case 'enable_rules':
        return await enableRules(args.rules);
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
  const rules = [
    {
      name: 'core-engineering',
      description: 'Core engineering practices and standards',
      purpose: 'core'
    },
    {
      name: 'core-testing',
      description: 'Testing requirements and best practices',
      purpose: 'core'
    },
    {
      name: 'backend-api',
      description: 'Backend API implementation guidelines',
      purpose: 'backend'
    }
  ];
  
  const filteredRules = purpose ? rules.filter(rule => rule.purpose === purpose) : rules;
  
  return {
    content: [
      {
        type: 'text',
        text: `Available rules (${filteredRules.length}):\n` + 
              filteredRules.map(rule => `- ${rule.name}: ${rule.description}`).join('\n')
      }
    ]
  };
}

/**
 * Enable rules for the project
 */
async function enableRules(rules) {
  const enabledRules = [];
  
  for (const ruleName of rules) {
    if (!existsSync('.cursor')) {
      mkdirSync('.cursor');
    }
    if (!existsSync('.cursor/rules')) {
      mkdirSync('.cursor/rules');
    }
    
    const ruleContent = `# ${ruleName} Rule

This rule provides guidelines for ${ruleName} development.

## Requirements
- Follow best practices
- Maintain code quality
- Test thoroughly
`;
    
    const rulePath = `.cursor/rules/${ruleName}.mdc`;
    writeFileSync(rulePath, ruleContent);
    enabledRules.push(ruleName);
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Enabled rules: ${enabledRules.join(', ')}`
      }
    ]
  };
}

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Rules Framework MCP Server started');
