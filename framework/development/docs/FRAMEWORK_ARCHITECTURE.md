# Rules Framework Architecture

## 🏗️ Framework vs External Project Files

This document clearly distinguishes between files used for **developing the Rules Framework itself** and files that are **pulled into external Cursor projects**.

## 📁 Framework Development Files

These files are used to **develop, maintain, and deploy the Rules Framework**:

### Core Framework
```
rules-framework/                          # Framework development root
├── .cursor/                              # Framework's own Cursor rules
├── deployment/                           # Framework deployment to Cloudflare
│   ├── workers/                          # Cloudflare Workers code
│   ├── scripts/                          # Framework deployment scripts
│   └── wrangler.toml                    # Framework's Cloudflare config
├── docs/                                 # Framework documentation
├── scripts/                              # Framework development scripts
├── mcp-server.js                         # MCP server for external projects
├── package.json                          # Framework dependencies
└── README.md                             # Framework overview
```

### Framework Development Scripts
- `scripts/setup-wizard.js` - **Framework tool** for external projects
- `scripts/pull-framework.js` - **Framework tool** for external projects
- `scripts/rules-cli.js` - **Framework tool** for external projects
- `scripts/configure-tokens.js` - **Framework tool** for external projects
- `scripts/create-github-repo.sh` - **Framework tool** for external projects
- `scripts/setup-cloudflare.sh` - **Framework tool** for external projects

### Framework Deployment
- `deployment/workers/index-simple.js` - **Framework's** Cloudflare Worker
- `deployment/scripts/deploy-framework.js` - **Framework's** deployment script
- `deployment/scripts/auto-setup.sh` - **Framework's** one-line setup script
- `deployment/wrangler.toml` - **Framework's** Cloudflare configuration

## 📦 External Project Files

These files are **pulled into external Cursor projects** via setup/MCP:

### Files Pulled by Setup Wizard
```
external-project/                         # External project after setup
├── .cursor/
│   └── mcp.json                          # MCP configuration (pulled)
├── mcp-server.js                         # MCP server (pulled)
├── setup-wizard.js                       # Setup wizard (pulled)
├── package.json                          # Project config (pulled)
└── .env                                  # Environment variables (pulled)
```

### Files Available via MCP/API
- **Rules**: `.cursor/rules/*` - Purpose-scoped Cursor rules
- **Templates**: `templates/nextjs-cloudflare/*` - Project templates
- **Documentation**: `docs/quick-start/*`, `docs/cli/*` - User guides
- **Configuration**: Various config files and examples

## 🔄 Data Flow

### 1. Framework Development
```
Developer → Framework Files → Cloudflare Workers → API Endpoints
```

### 2. External Project Setup
```
External Project → Setup Wizard → Pulls Files → Configures Project
```

### 3. MCP Integration
```
Cursor Project → MCP Server → Framework API → Rules/Templates
```

## 🎯 Clear Usage Patterns

### For Framework Developers
**Work with these files:**
- `deployment/` - Deploy framework to Cloudflare
- `scripts/` - Develop framework tools
- `docs/` - Write framework documentation
- `mcp-server.js` - Enhance MCP functionality
- `.cursor/rules/` - Develop and test rules

**Commands:**
```bash
# Deploy framework
npm run deploy:framework

# Test framework
npm run test:framework

# Develop locally
npm run dev
```

### For External Project Users
**Get these files:**
- MCP server and configuration
- Setup wizard
- Project templates
- Cursor rules
- Documentation

**Commands:**
```bash
# One-line setup
curl -s https://rules-framework.mikehenken.workers.dev/install | bash

# Or use CLI
rules setup
```

## 📋 File Classification

### Framework Development Only
- `deployment/` - Framework deployment
- `scripts/` - Framework development tools
- `docs/` - Framework documentation
- `mcp-server.js` - MCP server implementation
- `package.json` - Framework dependencies
- `.cursor/rules/` - Framework's own rules

### External Project Files
- `templates/` - Project templates (pulled via MCP)
- Individual rule files (pulled via MCP)
- Documentation guides (pulled via MCP)
- Configuration examples (pulled via MCP)

### Shared/API Files
- `mcp-server.js` - Copied to external projects
- `setup-wizard.js` - Copied to external projects
- Configuration templates - Copied to external projects

## 🚀 Development Workflow

### 1. Framework Development
```bash
# 1. Develop framework features
# 2. Test locally
npm run dev

# 3. Deploy to Cloudflare
npm run deploy:framework

# 4. Test external integration
rules test
```

### 2. External Project Usage
```bash
# 1. One-line setup
curl -s https://rules-framework.mikehenken.workers.dev/install | bash

# 2. Configure project
rules setup

# 3. Use in Cursor
# @rules-framework commands available
```

## 🔧 Maintenance

### Framework Updates
- Update `deployment/workers/` - Deploy new worker
- Update `mcp-server.js` - Deploy new MCP server
- Update `scripts/` - Deploy new tools
- Update `docs/` - Deploy new documentation

### External Project Updates
- External projects pull latest via MCP
- No manual updates needed
- Automatic updates via API

---

**This architecture ensures clear separation between framework development and external project usage!** 🎯
