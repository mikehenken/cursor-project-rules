#!/bin/bash

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
curl -s "${FRAMEWORK_URL}/files/mcp-server.js" > mcp-server.js

# Get absolute path to project directory
PROJECT_DIR=$(pwd)
MCP_SERVER_PATH="${PROJECT_DIR}/mcp-server.js"

# Configure MCP in project directory
echo "  ⚙️  Configuring MCP integration..."
cat > .cursor/mcp.json << EOF
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["${MCP_SERVER_PATH}"],
      "env": {
        "RULES_FRAMEWORK_URL": "${FRAMEWORK_URL}"
      }
    }
  }
}
EOF

# Also update MCP configuration in user's home directory
# Cursor reads from ~/.cursor/mcp.json, not the project directory
echo "  ⚙️  Updating MCP configuration in home directory..."
mkdir -p "${HOME}/.cursor"
cat > "${HOME}/.cursor/mcp.json" << EOF
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["${MCP_SERVER_PATH}"],
      "env": {
        "RULES_FRAMEWORK_URL": "${FRAMEWORK_URL}"
      }
    }
  }
}
EOF
echo "  ✅ MCP configuration updated at ${HOME}/.cursor/mcp.json"

# Download setup wizard
echo "  📥 Downloading setup wizard..."
curl -s "${FRAMEWORK_URL}/files/setup-wizard.js" > setup-wizard.js

# Download package.json template
echo "  📥 Downloading package.json..."
curl -s "${FRAMEWORK_URL}/files/package.template.json" > package.json

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
echo "Framework URL: ${FRAMEWORK_URL}"
echo "Documentation: https://rules-framework.mikehenken.workers.dev/docs"
