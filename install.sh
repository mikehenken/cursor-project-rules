#!/bin/bash

# Rules Framework Installation Script
# Installs the Rules Framework CLI globally

echo "🎯 Rules Framework Installation"
echo "==============================\n"

# Get the current directory
RULES_FRAMEWORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Framework directory: $RULES_FRAMEWORK_DIR"

# Create global bin directory if it doesn't exist
GLOBAL_BIN="/usr/local/bin"
if [ ! -d "$GLOBAL_BIN" ]; then
    echo "Creating global bin directory..."
    sudo mkdir -p "$GLOBAL_BIN"
fi

# Install the global CLI
echo "🔧 Installing global CLI..."
sudo cp "$RULES_FRAMEWORK_DIR/bin/rules" "$GLOBAL_BIN/rules"
sudo chmod +x "$GLOBAL_BIN/rules"

# Create a symlink for easy access
if [ -d "$HOME/.local/bin" ]; then
    echo "🔗 Creating user symlink..."
    ln -sf "$GLOBAL_BIN/rules" "$HOME/.local/bin/rules"
fi

echo "\n✅ Installation complete!"
echo "========================"
echo ""
echo "You can now use the Rules Framework from anywhere:"
echo ""
echo "  rules setup          # Setup a new project"
echo "  rules pull all       # Pull all files from framework"
echo "  rules test           # Test framework endpoints"
echo "  rules help           # Show help"
echo ""
echo "Framework URL: https://rules-framework.mikehenken.workers.dev"
echo ""
echo "📚 Documentation:"
echo "  - MCP Integration: framework/development/docs/guides/MCP_INTEGRATION.md"
echo "  - Purpose-Scoped Rules: framework/development/docs/guides/PURPOSE_SCOPED_RULES.md"
echo "  - Deployment Guide: framework/development/docs/features/deployment/CLOUDFLARE_WORKERS_DEPLOYMENT.md"
