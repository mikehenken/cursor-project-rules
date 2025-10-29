# One-Line Setup for Rules Framework

## 🚀 Super Simple Setup

### For New Projects (Recommended)

```bash
curl -s https://rules-framework.mikehenken.workers.dev/install | bash
```

### For Existing Projects

```bash
curl -s https://rules-framework.mikehenken.workers.dev/setup | bash
```

## What This Does

### 1. **Prerequisites Check** (install only)
- ✅ Verifies Node.js is installed
- ✅ Verifies npm is available
- ❌ Exits gracefully if missing

### 2. **Downloads Framework Components**
- 📥 MCP server (`mcp-server.js`)
- 📥 Setup wizard (`setup-wizard.js`)
- 📥 Package.json template
- 📥 MCP configuration (`.cursor/mcp.json`)

### 3. **Installs Dependencies**
- 📦 Installs `@modelcontextprotocol/sdk`
- 📦 Installs other required packages

### 4. **Runs Interactive Setup**
- 🎯 Guides you through rule selection
- 🎯 Configures your project type
- 🎯 Sets up templates and environment

### 5. **Final Instructions**
- 🔄 Restart Cursor for MCP integration
- 🎉 Start using @rules-framework commands

## What You Get

### Files Created
```
your-project/
├── .cursor/
│   └── mcp.json              # MCP configuration
├── mcp-server.js             # MCP server
├── setup-wizard.js           # Setup wizard
├── package.json              # Project configuration
└── .env                      # Environment variables
```

### Cursor Integration
- **@rules-framework** commands available
- **MCP tools** for rules management
- **Slash commands** for quick actions

## Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Download setup script
curl -s https://rules-framework.mikehenken.workers.dev/setup > setup.sh
chmod +x setup.sh

# 2. Run setup
./setup.sh

# 3. Clean up
rm setup.sh
```

## Troubleshooting

### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Update Node.js (if needed)
# Using nvm
nvm install 20
nvm use 20

# Using volta
volta install node@20
```

### Permission Issues
```bash
# Make script executable
chmod +x setup.sh

# Run with bash explicitly
bash setup.sh
```

### Network Issues
```bash
# Test connectivity
curl -I https://rules-framework.mikehenken.workers.dev

# Download manually if needed
wget https://rules-framework.mikehenken.workers.dev/setup -O setup.sh
```

## Next Steps After Setup

1. **Restart Cursor** to enable MCP integration
2. **Test MCP connection** with @rules-framework commands
3. **Configure Cloudflare** credentials in `.env` (if needed)
4. **Start coding** with your new rules and templates!

## Framework URLs

- **Main API**: https://rules-framework.mikehenken.workers.dev
- **Setup Script**: https://rules-framework.mikehenken.workers.dev/setup
- **Install Script**: https://rules-framework.mikehenken.workers.dev/install
- **Documentation**: https://rules-framework.mikehenken.workers.dev/docs

---

**That's it!** One command, complete setup, ready to code! 🎉
