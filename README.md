# Rules Framework

A comprehensive Cursor AI rules framework with Cloudflare Workers deployment and MCP integration.

## 🏗️ Architecture Overview

This framework has two distinct parts:

### 1. **Framework Development** (`framework/development/`)
Files for **developing and maintaining** the Rules Framework itself.

### 2. **External Project Files** (`framework/external/`)
Files that are **pulled into external Cursor projects** via setup/MCP.

## 🚀 Quick Start for External Projects

### Interactive Setup (Recommended)
```bash
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash
```

This interactive wizard will guide you through:
- Choosing core modules (Next.js, FastAPI)
- Configuring GitHub repo creation
- Setting up Cloudflare deployment
- Customizing individual rules (optional)

### Quick Setup (Non-Interactive)
```bash
curl -s https://rules-framework.mikehenken.workers.dev/install | bash
```

### What You Get
- **MCP Integration**: @rules-framework commands in Cursor
- **Purpose-Scoped Rules**: Core, backend, docs, testing, CI/CD rules
- **Templates**: Next.js + Cloudflare, FastAPI, documentation
- **CLI Tools**: `rules setup`, `rules pull`, `rules deploy`

## 📋 Interactive Setup Options

When you run the interactive setup, you'll be asked:

### Core Configuration
- **Next.js Frontend** (default: Yes)
- **FastAPI Backend** (default: Yes)
- **Auto GitHub Repo Creation** (default: Yes)
- **Cloudflare Deployment** (default: Yes)
- **Granular Rule Configuration** (default: No)

### GitHub Configuration (if enabled)
- **Project Name**: Defaults to current directory name
- **Repository Visibility**: `private` (default) or `public`

### Cloudflare Configuration (if enabled)
- **API Token**: Your Cloudflare API token
- **Account ID**: Your Cloudflare account ID
- **Deployment Target**: `Cloudflare Workers` (default) or `Cloudflare Pages`

### Granular Rules (if enabled)
For each available rule, you can:
- **(I)nclude**: Keep with default settings
- **(M)odify**: Customize name, description, scope, categories
- **(E)xclude**: Disable for this project
- **Exclude (A)ll**: Disable globally and save preference

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
# Interactive setup (remote)
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash

# Interactive setup (local)
./setup.sh

# Non-interactive setup
curl -s https://rules-framework.mikehenken.workers.dev/install | bash

# Pull specific components
rules pull

# Deploy to Cloudflare
rules deploy
```

### Running the Interactive Setup

**From Remote:**
```bash
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash
```

**From Local Repository:**
```bash
# Make executable (if needed)
chmod +x setup.sh

# Run interactive wizard
./setup.sh
```

The wizard will:
1. Ask configuration questions with smart defaults
2. Download framework files
3. Install dependencies
4. Launch `setup-wizard.js` with your preferences
5. Display a configuration summary

### Example Interactive Session

```
╔════════════════════════════════════════════════════════════╗
║        🎯 Rules Framework Interactive Setup Wizard         ║
╔════════════════════════════════════════════════════════════╗

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Core Modules & Rules Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enable Next.js frontend? [Y/n]: y
Enable FastAPI Python backend? [Y/n]: y
Enable auto GitHub repo creation? [Y/n]: y
Enable Cloudflare deployment? [Y/n]: n
Configure individual rule granularity? [y/N]: n

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GitHub Repository Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project name [my-project]: my-awesome-app
Repository visibility:
  1. private (default)
  2. public
Enter choice [1-2]: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Downloading Framework Files...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📥 Downloading MCP server...
⚙️  Creating MCP configuration...
📥 Downloading setup wizard...
📥 Downloading package.json...
📦 Installing dependencies...

╔════════════════════════════════════════════════════════════╗
║              🎉 Setup Complete! 🎉                         ║
╚════════════════════════════════════════════════════════════╝

Configuration Summary:
  Next.js Frontend: yes
  FastAPI Backend: yes
  GitHub Integration: yes
    - Repository Name: my-awesome-app
    - Visibility: private
  Cloudflare Deployment: no
  Granular Rules: no
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