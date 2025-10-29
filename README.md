# Rules Framework

A comprehensive Cursor AI rules framework with Cloudflare Workers deployment and MCP integration.

## 🏗️ Architecture Overview

This framework has two distinct parts:

### 1. **Framework Development** (`framework/development/`)
Files for **developing and maintaining** the Rules Framework itself.

### 2. **External Project Files** (`framework/external/`)
Files that are **pulled into external Cursor projects** via setup/MCP.

## 🚀 Quick Start for External Projects

### One-Line Setup
```bash
curl -s https://rules-framework.mikehenken.workers.dev/install | bash
```

### What You Get
- **MCP Integration**: @rules-framework commands in Cursor
- **Purpose-Scoped Rules**: Core, backend, docs, testing, CI/CD rules
- **Templates**: Next.js + Cloudflare, FastAPI, documentation
- **CLI Tools**: `rules setup`, `rules pull`, `rules deploy`

## 📁 Project Structure

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
│   ├── rules/                         # Purpose-scoped rules for framework development
│   └── commands/                      # Slash commands
├── package.json                       # Framework dependencies
└── README.md                          # This file
```

## 🎯 For Framework Developers

### Development Files
- `framework/development/scripts/` - Framework development tools
- `framework/development/deployment/` - Cloudflare Workers deployment
- `framework/development/docs/` - Framework documentation
- `framework/development/mcp-server.js` - MCP server implementation

### Development Commands
```bash
# Deploy framework to Cloudflare
npm run deploy:framework

# Test framework functionality
npm run test:framework

# Run development server
npm run dev
```

## 🎯 For External Project Users

### External Files (Pulled via Setup)
- `framework/external/templates/` - Project templates
- `framework/external/rules/` - Cursor rules
- `framework/external/docs/` - User guides

### Usage Commands
```bash
# One-line setup
curl -s https://rules-framework.mikehenken.workers.dev/install | bash

# Interactive setup
rules setup

# Pull specific components
rules pull

# Deploy to Cloudflare
rules deploy
```

## 🔄 How It Works

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

## 📚 Documentation

### Framework Development
- [Framework Architecture](FRAMEWORK_ARCHITECTURE.md) - Detailed architecture explanation
- [Development Docs](framework/development/docs/) - Framework development guides

### External Project Usage
- [Quick Start](framework/external/docs/quick-start/QUICK_START.md) - Get started quickly
- [CLI Guide](framework/external/docs/cli/CLI_GUIDE.md) - Complete CLI usage
- [One-Line Setup](framework/external/docs/deployment/ONE_LINE_SETUP.md) - Instant setup

## 🛠️ Available Components

### Purpose-Scoped Rules
- **Core**: Essential project-wide rules
- **Backend**: API and FastAPI guidelines
- **Docs**: Documentation standards
- **Testing**: Testing requirements
- **CI/CD**: GitHub workflows

### Templates
- **Next.js + Cloudflare**: Full-stack template
- **FastAPI**: Backend API template
- **Documentation**: Docs structure

### MCP Tools
- `get-rules` - List available rules
- `enable-rules` - Enable specific rules
- `get-templates` - List templates
- `configure-env` - Set up environment

## 🔧 Configuration

### Environment Variables
```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# GitHub Configuration (optional)
GITHUB_TOKEN=your_github_token
GITHUB_USERNAME=your_username
```

## 🚀 Deployment

### Framework Deployment
```bash
# Deploy to Cloudflare Workers
npm run deploy:framework

# Deploy with staging environment
npm run deploy:staging
```

### External Project Deployment
```bash
# Deploy external project
rules deploy

# Configure Cloudflare credentials
rules configure
```

## 🆘 Support

For detailed help, see the [complete documentation](framework/development/docs/DOCS_INDEX.md) or check:

- [Quick Start Guide](framework/external/docs/quick-start/QUICK_START.md)
- [CLI Guide](framework/external/docs/cli/CLI_GUIDE.md)
- [One-Line Setup](framework/external/docs/deployment/ONE_LINE_SETUP.md)
- [Framework Architecture](FRAMEWORK_ARCHITECTURE.md)

---

**Ready to enhance your Cursor development experience!** 🎉