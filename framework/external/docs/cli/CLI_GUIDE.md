# CLI Guide

## 🛠️ Available Commands

### Global CLI Commands

```bash
# Setup and configuration
rules setup                    # Run interactive setup wizard
rules pull                     # Pull files from framework
rules deploy                   # Deploy to Cloudflare
rules test                     # Test framework functionality
rules status                   # Check framework status
rules help                     # Show help information
```

### Setup Wizard

```bash
rules setup
```

Interactive wizard that guides you through:
- Component selection (rules, templates, environment)
- Project type detection
- MCP configuration
- Dependency installation

### Pull Framework

```bash
rules pull
```

Pull specific components from the framework:
- Rules (core, backend, docs, testing, ci-cd)
- Templates (nextjs-cloudflare, fastapi)
- Documentation
- Configuration files

### Deploy Framework

```bash
rules deploy
```

Deploy your project to Cloudflare:
- Configure Cloudflare credentials
- Deploy to Workers
- Set up R2 storage
- Configure environment variables

### Test Framework

```bash
rules test
```

Test framework functionality:
- MCP server connection
- API endpoints
- File downloads
- Configuration validation

### Status Check

```bash
rules status
```

Check framework status:
- MCP server status
- Cloudflare deployment status
- Configuration status
- Dependencies status

## 🔧 Configuration

### Environment Variables

Create `.env` file with:

```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_GLOBAL_API_KEY=your_global_key
CLOUDFLARE_EMAIL=your_email

# GitHub Configuration (optional)
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_username

# Framework Configuration
RULES_FRAMEWORK_URL=https://rules-framework.mikehenken.workers.dev
```

### MCP Configuration

The CLI automatically creates `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "https://rules-framework.mikehenken.workers.dev"
      }
    }
  }
}
```

## 📁 Project Structure

After running `rules setup`:

```
your-project/
├── .cursor/
│   └── mcp.json              # MCP configuration
├── mcp-server.js             # MCP server
├── setup-wizard.js           # Setup wizard
├── package.json              # Project configuration
├── .env                      # Environment variables
└── node_modules/             # Dependencies
```

## 🎯 Usage Examples

### New Project Setup

```bash
# 1. Create new project directory
mkdir my-new-project
cd my-new-project

# 2. Run setup wizard
rules setup

# 3. Follow interactive prompts
# 4. Restart Cursor
# 5. Start using @rules-framework commands
```

### Existing Project Integration

```bash
# 1. Navigate to existing project
cd existing-project

# 2. Pull specific components
rules pull

# 3. Select what to include
# 4. Configure as needed
```

### Deployment

```bash
# 1. Configure Cloudflare credentials
rules deploy

# 2. Follow deployment prompts
# 3. Deploy to Cloudflare Workers
# 4. Configure R2 storage (if needed)
```

## 🔍 Troubleshooting

### Common Issues

**Command not found: rules**
```bash
# Install globally
npm install -g /path/to/rules-framework
# Or use npx
npx rules setup
```

**MCP connection failed**
```bash
# Check MCP configuration
cat .cursor/mcp.json

# Restart Cursor
# Check Node.js version (requires v18+)
```

**Cloudflare deployment failed**
```bash
# Check credentials
cat .env

# Test connection
rules test

# Reconfigure
rules deploy
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=1 rules setup

# Verbose output
rules setup --verbose
```

## 📚 Additional Resources

- **Quick Start**: [QUICK_START.md](../quick-start/QUICK_START.md)
- **MCP Integration**: [MCP_INTEGRATION.md](../guides/MCP_INTEGRATION.md)
- **Deployment**: [DEPLOYMENT_SETUP.md](../setup/DEPLOYMENT_SETUP.md)
- **API Reference**: [API_DOCS.md](../api/API_DOCS.md)

---

**Need help?** Use `rules help` or check the documentation! 🚀
