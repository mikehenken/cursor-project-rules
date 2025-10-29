# Documentation Index

This directory contains all project documentation organized by feature and purpose.

## 🎯 Rules Framework Overview

This repository provides a comprehensive set of Cursor AI rules and deployment boilerplates for modern web development projects. It includes:

- **Modular Cursor Rules**: Organized, context-aware rules for different development scenarios
- **Next.js Cloudflare Deployment Boilerplate**: Complete deployment solution for Next.js applications
- **Best Practices**: Engineering standards, testing protocols, and documentation organization

## 📁 Directory Structure

### Quick Start
- [**QUICK_START.md**](quick-start/QUICK_START.md) - Quick start guide for new users
- [**ONE_LINE_SETUP.md**](deployment/ONE_LINE_SETUP.md) - One-line setup for instant deployment

### CLI Tools
- [**CLI_GUIDE.md**](cli/CLI_GUIDE.md) - Complete CLI usage guide

### Setup & Installation
- [**INSTALLATION.md**](setup/INSTALLATION.md) - Detailed installation instructions
- [**DEPLOYMENT_SETUP.md**](setup/DEPLOYMENT_SETUP.md) - Cloudflare Pages deployment setup
- [**CONFIGURATION.md**](setup/CONFIGURATION.md) - Environment and project configuration

### Development
- [**CONTRIBUTING.md**](development/CONTRIBUTING.md) - How to contribute to the project
- [**ARCHITECTURE.md**](development/ARCHITECTURE.md) - Project architecture overview
- [**TESTING_STRATEGY.md**](development/TESTING_STRATEGY.md) - Testing guidelines and strategies
- [**CODE_STYLE.md**](development/CODE_STYLE.md) - Coding standards and style guide
- [**AGENTS.md**](development/AGENTS.md) - AI agent configuration and prompts

### Features

#### Deployment
- [**overview.md**](features/deployment/overview.md) - Deployment feature overview
- [**CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md**](features/deployment/CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md) - Complete deployment boilerplate
- [**CLOUDFLARE_WORKERS_DEPLOYMENT.md**](features/deployment/CLOUDFLARE_WORKERS_DEPLOYMENT.md) - Cloudflare Workers deployment guide
- [**BOILERPLATE_INDEX.md**](features/deployment/BOILERPLATE_INDEX.md) - Boilerplate files overview

#### Templates
- [**Next.js Cloudflare Template**](../templates/nextjs-cloudflare/) - Complete Next.js deployment template
  - `deploy-template.js` - Universal deployment script
  - `next.config.template.js` - Next.js configuration template
  - `wrangler.template.toml` - Cloudflare configuration template
  - `package.template.json` - Package configuration template
  - `env.example` - Environment variables template

### Guides
- [**integration-guides.md**](guides/integration-guides.md) - Integration with external services
- [**troubleshooting.md**](guides/troubleshooting.md) - Common issues and solutions
- [**best-practices.md**](guides/best-practices.md) - Development and deployment best practices
- [**PURPOSE_SCOPED_RULES.md**](guides/PURPOSE_SCOPED_RULES.md) - Purpose-scoped Cursor rules guide
- [**MCP_INTEGRATION.md**](guides/MCP_INTEGRATION.md) - MCP integration guide for Cursor projects

### API
- [**endpoints.md**](api/endpoints.md) - API endpoint documentation
- [**authentication.md**](api/authentication.md) - Authentication and authorization

### Status
- [**CHANGELOG.md**](status/CHANGELOG.md) - Project changelog and version history
- [**completion-reports.md**](status/completion-reports.md) - Project completion status
- [**migration-notes.md**](status/migration-notes.md) - Migration and upgrade notes

## 🚀 Quick Navigation

### For New Users
1. Start with [Quick Start Guide](setup/QUICK_START.md)
2. Follow [Installation Instructions](setup/INSTALLATION.md)
3. Set up [Deployment](setup/DEPLOYMENT_SETUP.md)

### For Developers
1. Read [Architecture Overview](development/ARCHITECTURE.md)
2. Review [Contributing Guidelines](development/CONTRIBUTING.md)
3. Follow [Code Style Guide](development/CODE_STYLE.md)

### For Cursor Rules
1. Explore [Cursor Rules Directory](../.cursor/rules/) - Purpose-scoped rule files
2. Read [Purpose-Scoped Rules Guide](guides/PURPOSE_SCOPED_RULES.md) - How to use purpose-scoped rules
3. Review [Agent Configuration](development/AGENTS.md) - AI agent setup
4. Check [Engineering Practices](../.cursor/rules/core/.cursor/rules/engineering-practices.mdc) - Core standards

### For Deployment
1. Use [Deployment Boilerplate](features/deployment/CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md)
2. Follow [Setup Instructions](setup/DEPLOYMENT_SETUP.md)
3. Check [Troubleshooting Guide](guides/troubleshooting.md)

## 📋 Documentation Standards

### File Naming Conventions
- **UPPER_CASE**: Major documents (QUICK_START.md, TESTING_STRATEGY.md)
- **kebab-case**: Feature-specific docs (deployment-setup.md, oauth-setup.md)
- **overview.md**: Category introductions at each level

### Content Organization
- Each feature category has logical subcategories
- Overview files explain the category/feature
- Hierarchy is kept shallow (max 3-4 levels deep)
- Clear navigation and cross-references

### Maintenance
- Update this index when adding new documentation
- Keep links current and functional
- Organize by feature hierarchy to match directory structure
- Review and update quarterly

## 🔗 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)

---

**Last Updated**: $(date)
**Maintained By**: Project Team

