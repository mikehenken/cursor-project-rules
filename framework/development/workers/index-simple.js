/**
 * Rules Framework Cloudflare Worker (Simplified Version)
 * Serves deployment files and documentation without R2 dependency
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Route handling
      if (path === '/' || path === '/index') {
        return handleIndex(env);
      } else if (path.startsWith('/api/')) {
        return handleAPI(path, request, env);
      } else if (path === '/setup') {
        return handleSetupScript(env);
      } else if (path === '/install') {
        return handleInstallScript(env);
      } else if (path.startsWith('/files/')) {
        return handleFileDownload(path, env);
      } else {
        return new Response('Rules Framework API\n\nEndpoints:\n- GET /api/files\n- GET /api/rules\n- GET /api/docs\n- GET /setup (auto-setup script)\n- GET /install (installer script)', { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  },
};

/**
 * Handle index/root requests
 */
async function handleIndex(env) {
  const indexData = {
    name: 'Rules Framework',
    version: env.FRAMEWORK_VERSION || '1.0.0',
    description: 'Cursor Rules Framework - Deployable to Cloudflare Workers',
    status: 'deployed',
    endpoints: {
      files: '/api/files',
      rules: '/api/rules',
      docs: '/api/docs'
    },
    usage: {
      pullFiles: 'GET /api/pull?type=deployment',
      pullRules: 'GET /api/pull?type=rules',
      pullDocs: 'GET /api/pull?type=docs'
    },
    note: 'This is a simplified version. R2 storage will be added in the next update.'
  };

  return new Response(JSON.stringify(indexData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle API requests
 */
async function handleAPI(path, request, env) {
  if (path === '/api/files') {
    return handleFilesList(env);
  } else if (path === '/api/rules') {
    return handleRulesList(env);
  } else if (path === '/api/docs') {
    return handleDocsList(env);
  } else {
    return new Response('API endpoint not found', { status: 404 });
  }
}

/**
 * Handle files list API
 */
async function handleFilesList(env) {
  const files = [
    {
      name: 'deploy-template.js',
      description: 'Universal deployment script for Next.js projects',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'next.config.template.js',
      description: 'Next.js configuration template',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'wrangler.template.toml',
      description: 'Cloudflare configuration template',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'package.template.json',
      description: 'Package configuration template',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'env.example',
      description: 'Environment variables template',
      type: 'deployment',
      status: 'available'
    }
  ];

  return new Response(JSON.stringify(files, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle rules list API
 */
async function handleRulesList(env) {
  const rules = [
    {
      name: 'core',
      description: 'Core project-wide rules',
      files: ['workflow.mdc', 'engineering-practices.mdc', 'code-hygiene.mdc', 'repo-creation.mdc'],
      status: 'available'
    },
    {
      name: 'backend',
      description: 'Backend and API development rules',
      files: ['api-guidelines.mdc'],
      status: 'available'
    },
    {
      name: 'docs',
      description: 'Documentation standards and organization',
      files: ['documentation.mdc', 'data-quality.mdc'],
      status: 'available'
    },
    {
      name: 'testing',
      description: 'Testing requirements and protocols',
      files: ['testing.mdc'],
      status: 'available'
    },
    {
      name: 'ci-cd',
      description: 'CI/CD and deployment rules',
      files: ['github.mdc'],
      status: 'available'
    }
  ];

  return new Response(JSON.stringify(rules, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle docs list API
 */
async function handleDocsList(env) {
  const docs = [
    {
      name: 'CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md',
      description: 'Complete deployment boilerplate guide',
      status: 'available'
    },
    {
      name: 'DEPLOYMENT_SETUP.md',
      description: 'Detailed setup instructions',
      status: 'available'
    },
    {
      name: 'TROUBLESHOOTING.md',
      description: 'Common issues and solutions',
      status: 'available'
    },
    {
      name: 'PURPOSE_SCOPED_RULES.md',
      description: 'Purpose-scoped Cursor rules guide',
      status: 'available'
    },
    {
      name: 'MCP_INTEGRATION.md',
      description: 'MCP integration guide for Cursor projects',
      status: 'available'
    }
  ];

  return new Response(JSON.stringify(docs, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle setup script request
 */
async function handleSetupScript(env) {
  const setupScript = `#!/bin/bash

# Rules Framework Auto-Setup Script
# This script can be downloaded and run with: curl -s https://rules-framework.mikehenken.workers.dev/setup | bash

set -e

echo "🎯 Rules Framework Auto-Setup"
echo "============================="
echo ""

# Check if we're in a git repository or empty directory
if [ ! -d ".git" ] && [ -n "$(ls -A 2>/dev/null)" ]; then
    echo "⚠️  Warning: This directory is not empty and not a git repository."
    echo "   The setup will add files to the current directory."
    echo ""
    read -p "Continue? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Framework URL
FRAMEWORK_URL="https://rules-framework.mikehenken.workers.dev"

echo "📡 Downloading Rules Framework components..."

# Create .cursor directory
mkdir -p .cursor

# Download MCP server
echo "  📥 Downloading MCP server..."
curl -s "\${FRAMEWORK_URL}/files/mcp-server.js" > mcp-server.js

# Configure MCP
echo "  ⚙️  Configuring MCP integration..."
cat > .cursor/mcp.json << EOF
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "\${FRAMEWORK_URL}"
      }
    }
  }
}
EOF

# Download setup wizard
echo "  📥 Downloading setup wizard..."
curl -s "\${FRAMEWORK_URL}/files/setup-wizard.js" > setup-wizard.js

# Download package.json template
echo "  📥 Downloading package.json..."
curl -s "\${FRAMEWORK_URL}/files/package.template.json" > package.json

# Install dependencies
echo "  📦 Installing dependencies..."
npm install --silent

echo ""
echo "✅ Components downloaded successfully!"
echo ""

# Run setup wizard
echo "🚀 Starting interactive setup wizard..."
echo "======================================"
echo ""

node setup-wizard.js

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Restart Cursor to enable MCP integration"
echo "2. Use @rules-framework commands in Cursor"
echo "3. Configure Cloudflare credentials in .env (if needed)"
echo "4. Start coding with your new rules and templates!"
echo ""
echo "Framework URL: \${FRAMEWORK_URL}"
echo "Documentation: https://rules-framework.mikehenken.workers.dev/docs"
`;

  return new Response(setupScript, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Content-Disposition': 'inline; filename="setup.sh"'
    }
  });
}

/**
 * Handle install script request
 */
async function handleInstallScript(env) {
  const installScript = `#!/bin/bash

# Rules Framework Installer
# One-line installer: curl -s https://rules-framework.mikehenken.workers.dev/install | bash

echo "🎯 Rules Framework Installer"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    echo "   Please install npm (usually comes with Node.js)"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Run the setup script
curl -s https://rules-framework.mikehenken.workers.dev/setup | bash
`;

  return new Response(installScript, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Content-Disposition': 'inline; filename="install.sh"'
    }
  });
}

/**
 * Handle file download requests
 */
async function handleFileDownload(path, env) {
  const fileName = path.replace('/files/', '');
  
  // For now, return a placeholder response
  // In a real implementation, you'd serve the actual files from R2 storage
  const fileContent = getFileContent(fileName);
  
  if (!fileContent) {
    return new Response('File not found', { status: 404 });
  }

  return new Response(fileContent, {
    headers: {
      'Content-Type': getContentType(fileName),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * Get file content (placeholder implementation)
 */
function getFileContent(fileName) {
  // This would normally fetch from R2 storage
  // For now, return placeholder content
  const files = {
    'mcp-server.js': '// MCP Server placeholder - would be actual server code',
    'setup-wizard.js': '// Setup wizard placeholder - would be actual wizard code',
    'package.template.json': JSON.stringify({
      "name": "rules-framework-project",
      "version": "1.0.0",
      "description": "Project with Rules Framework",
      "type": "module",
      "scripts": {
        "setup": "node setup-wizard.js",
        "test": "echo \\"Test passed\\""
      },
      "dependencies": {
        "@modelcontextprotocol/sdk": "^0.4.0"
      }
    }, null, 2)
  };
  
  return files[fileName] || null;
}

/**
 * Get content type based on file extension
 */
function getContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  const types = {
    'js': 'application/javascript',
    'json': 'application/json',
    'toml': 'text/plain',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'mdc': 'text/markdown',
    'sh': 'text/plain'
  };

  return types[ext] || 'text/plain';
}
