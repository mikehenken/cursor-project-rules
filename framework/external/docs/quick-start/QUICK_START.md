# Quick Start Guide

## 🚀 One-Line Setup

### For New Projects
```bash
curl -s https://rules-framework.mikehenken.workers.dev/install | bash
```

### For Existing Projects
```bash
curl -s https://rules-framework.mikehenken.workers.dev/setup | bash
```

## What This Does

1. **Prerequisites Check** (install only)
   - ✅ Verifies Node.js is installed
   - ✅ Verifies npm is available
   - ❌ Exits gracefully if missing

2. **Downloads Framework Components**
   - 📥 MCP server (`mcp-server.js`)
   - 📥 Setup wizard (`setup-wizard.js`)
   - 📥 Package.json template
   - 📥 MCP configuration (`.cursor/mcp.json`)

3. **Installs Dependencies**
   - 📦 Installs `@modelcontextprotocol/sdk`
   - 📦 Installs other required packages

4. **Runs Interactive Setup**
   - 🎯 Guides you through rule selection
   - 🎯 Configures your project type
   - 🎯 Sets up templates and environment

5. **Final Instructions**
   - 🔄 Restart Cursor to enable MCP integration
   - 🎉 Start using @rules-framework commands

## Files Created

```
your-project/
├── .cursor/
│   └── mcp.json              # MCP configuration
├── mcp-server.js             # MCP server
├── setup-wizard.js           # Setup wizard
├── package.json              # Project configuration
└── .env                      # Environment variables
```

## Next Steps

1. **Restart Cursor** to enable MCP integration
2. **Use @rules-framework commands** in Cursor chat
3. **Configure Cloudflare credentials** in `.env` (if needed)
4. **Start coding** with your new rules and templates!

## Available Commands

### In Cursor Chat
- `@rules-framework get-rules` - List available rules
- `@rules-framework enable-rules` - Enable specific rules
- `@rules-framework get-templates` - List templates
- `@rules-framework configure-env` - Set up environment

### Slash Commands
- `/setup-rules` - Run setup wizard
- `/pull-framework` - Pull files from framework
- `/deploy-framework` - Deploy to Cloudflare

## Troubleshooting

### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Update Node.js (if needed)
nvm install 20
nvm use 20
```

### Permission Issues
```bash
# Make script executable
chmod +x setup.sh

# Run with bash explicitly
bash setup.sh
```

---

**That's it!** One command, complete setup, ready to code! 🎉
