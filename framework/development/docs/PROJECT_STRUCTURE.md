# Project Structure

## 🧹 Cleaned Up Architecture

The project has been reorganized for better clarity and maintainability.

## 📁 Directory Structure

```
rules-framework/
├── .cursor/                          # Cursor IDE configuration
│   ├── commands/                     # Slash commands
│   └── rules/                        # Purpose-scoped rules
│       ├── core/                     # Core project rules
│       ├── backend/                  # Backend/API rules
│       ├── docs/                     # Documentation rules
│       ├── testing/                  # Testing rules
│       └── ci-cd/                    # CI/CD rules
├── bin/                              # Executable scripts
│   └── rules                         # Global CLI command
├── deployment/                       # Cloudflare deployment
│   ├── scripts/                      # Deployment scripts
│   │   ├── auto-setup.sh            # One-line setup script
│   │   └── deploy-framework.js      # Framework deployment
│   ├── workers/                      # Cloudflare Workers
│   │   ├── index.js                 # Main worker
│   │   └── index-simple.js          # Simplified worker
│   └── wrangler.toml                # Cloudflare configuration
├── docs/                             # Documentation
│   ├── cli/                          # CLI documentation
│   │   └── CLI_GUIDE.md             # Complete CLI guide
│   ├── deployment/                   # Deployment docs
│   │   └── ONE_LINE_SETUP.md        # One-line setup guide
│   ├── quick-start/                  # Quick start docs
│   │   └── QUICK_START.md           # Quick start guide
│   ├── setup/                        # Setup documentation
│   ├── guides/                       # How-to guides
│   ├── features/                     # Feature documentation
│   └── DOCS_INDEX.md                # Documentation index
├── scripts/                          # Utility scripts
│   ├── configure-tokens.js          # Token configuration
│   ├── create-github-repo.sh        # GitHub repo creation
│   ├── pull-framework.js            # Framework file pulling
│   ├── rules-cli.js                 # CLI wrapper
│   ├── setup-cloudflare.sh          # Cloudflare setup
│   └── setup-wizard.js              # Interactive setup
├── templates/                        # Project templates
│   └── nextjs-cloudflare/           # Next.js + Cloudflare template
├── mcp-server.js                     # MCP server
├── package.json                      # Node.js configuration
├── install.sh                        # Global installation script
└── README.md                         # Project overview
```

## 🗑️ Files Removed

### Unneeded Documentation
- `AGENTS.md` - Outdated agent documentation
- `DEPLOYMENT_SETUP.md` - Duplicate of docs/setup/
- `CLI_GUIDE.md` - Moved to docs/cli/
- `ONE_LINE_SETUP.md` - Moved to docs/deployment/
- `QUICK_START.md` - Moved to docs/quick-start/
- `SETUP_COMPLETE.md` - Temporary completion file

### Test Files
- `scripts/test-setup.sh` - Test setup script
- `scripts/test-deployment.sh` - Test deployment script
- `wrangler-simple.toml` - Duplicate configuration

## 📂 New Organization

### Documentation Structure
- **Quick Start**: `docs/quick-start/` - Getting started guides
- **CLI Tools**: `docs/cli/` - Command-line interface documentation
- **Deployment**: `docs/deployment/` - Deployment and setup guides
- **Setup**: `docs/setup/` - Installation and configuration
- **Guides**: `docs/guides/` - How-to guides and tutorials
- **Features**: `docs/features/` - Feature-specific documentation

### Deployment Structure
- **Workers**: `deployment/workers/` - Cloudflare Workers code
- **Scripts**: `deployment/scripts/` - Deployment automation
- **Config**: `deployment/wrangler.toml` - Cloudflare configuration

### Core Files
- **MCP Server**: `mcp-server.js` - Model Context Protocol server
- **CLI**: `bin/rules` - Global command-line interface
- **Templates**: `templates/` - Project templates
- **Scripts**: `scripts/` - Utility scripts

## 🔧 Updated References

### Package.json Scripts
- `deploy:framework` now points to `deployment/scripts/deploy-framework.js`
- `deploy` now uses `deployment/wrangler.toml` configuration

### Wrangler Configuration
- `main` now points to `workers/index-simple.js`
- All deployment files are in `deployment/` directory

### Documentation Links
- All documentation links updated to reflect new structure
- README.md updated with new documentation paths
- DOCS_INDEX.md reorganized with new categories

## ✅ Benefits of New Structure

### 1. **Clear Separation of Concerns**
- Documentation organized by purpose
- Deployment files isolated
- Core functionality separated from utilities

### 2. **Better Maintainability**
- Easier to find specific files
- Logical grouping of related functionality
- Reduced duplication

### 3. **Improved User Experience**
- Clear documentation hierarchy
- Intuitive file locations
- Better navigation

### 4. **Scalability**
- Easy to add new documentation categories
- Simple to extend deployment options
- Clear structure for new features

## 🚀 Usage

The cleaned up structure maintains all functionality while providing:

- **One-line setup**: `curl -s https://rules-framework.mikehenken.workers.dev/install | bash`
- **CLI tools**: `rules setup`, `rules pull`, `rules deploy`
- **MCP integration**: @rules-framework commands in Cursor
- **Comprehensive docs**: Organized by purpose and user need

---

**The project is now clean, organized, and ready for production use!** 🎉
