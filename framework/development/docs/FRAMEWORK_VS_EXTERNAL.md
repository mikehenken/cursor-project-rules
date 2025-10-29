# Framework vs External Project Files

## 🎯 Clear Distinction

This document clearly separates files used for **developing the Rules Framework** from files that are **pulled into external Cursor projects**.

## 🏗️ Framework Development Files

**Location**: `framework/development/`

These files are used to **develop, maintain, and deploy the Rules Framework itself**:

### Core Framework Files
- `framework/development/scripts/` - Framework development tools
- `framework/development/deployment/` - Cloudflare Workers deployment
- `framework/development/docs/` - Framework documentation
- `framework/development/mcp-server.js` - MCP server implementation

### Framework Development Commands
```bash
# Deploy framework to Cloudflare
npm run deploy:framework

# Test framework functionality
npm run test:framework

# Run development server
npm run dev
```

## 📦 External Project Files

**Location**: `framework/external/`

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
- **Rules**: `framework/external/rules/*` - Purpose-scoped Cursor rules
- **Templates**: `framework/external/templates/*` - Project templates
- **Documentation**: `framework/external/docs/*` - User guides

## 🔄 Data Flow

### 1. Framework Development
```
Developer → framework/development/ → Cloudflare Workers → API Endpoints
```

### 2. External Project Setup
```
External Project → Setup Wizard → Pulls from framework/external/ → Configures Project
```

### 3. MCP Integration
```
Cursor Project → MCP Server → Framework API → Rules/Templates from framework/external/
```

## 📋 File Classification

### Framework Development Only
- `framework/development/scripts/` - Framework development tools
- `framework/development/deployment/` - Framework deployment
- `framework/development/docs/` - Framework documentation
- `framework/development/mcp-server.js` - MCP server implementation
- `package.json` - Framework dependencies

### External Project Files
- `framework/external/templates/` - Project templates (pulled via MCP)
- `framework/external/rules/` - Cursor rules (pulled via MCP)
- `framework/external/docs/` - User documentation (pulled via MCP)

### Shared/API Files
- `framework/development/mcp-server.js` - Copied to external projects
- `framework/development/scripts/setup-wizard.js` - Copied to external projects
- Configuration templates - Copied to external projects

## 🚀 Usage Patterns

### For Framework Developers
**Work with these files:**
- `framework/development/` - All framework development
- `package.json` - Framework dependencies and scripts
- `.cursor/rules/` - Framework's own Cursor rules

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

## 🔧 Maintenance

### Framework Updates
- Update `framework/development/` - Deploy new framework
- Update `framework/external/` - Deploy new external files
- External projects pull latest via MCP

### External Project Updates
- External projects pull latest via MCP
- No manual updates needed
- Automatic updates via API

## 📁 Directory Structure

```
rules-framework/
├── framework/
│   ├── development/                    # Framework development files
│   │   ├── scripts/                   # Framework development scripts
│   │   ├── deployment/                # Framework deployment to Cloudflare
│   │   ├── docs/                      # Framework documentation
│   │   └── mcp-server.js             # MCP server implementation
│   └── external/                      # Files pulled into external projects
│       ├── templates/                 # Project templates
│       ├── rules/                     # Purpose-scoped Cursor rules
│       └── docs/                      # User documentation
├── .cursor/                           # Framework's own Cursor rules
├── package.json                       # Framework dependencies
└── README.md                          # Project overview
```

## 🎯 Key Benefits

### 1. **Clear Separation**
- Framework development files are isolated
- External project files are clearly identified
- No confusion about what goes where

### 2. **Easy Maintenance**
- Framework updates don't affect external projects
- External project files are versioned separately
- Clear deployment pipeline

### 3. **Better Organization**
- Logical grouping of related files
- Easy to find specific functionality
- Intuitive file locations

---

**This architecture ensures clear separation between framework development and external project usage!** 🎯
