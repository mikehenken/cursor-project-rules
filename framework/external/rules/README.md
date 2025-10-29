# External Project Rules

This directory contains the Cursor rules that are **pulled into external Cursor projects** via setup/MCP.

## 🎯 Purpose

These rules are provided to external projects to ensure:
- Consistent code quality across all projects
- Proper documentation standards
- Effective testing practices
- Clean architecture patterns

## 📁 Rule Categories

### Core Rules (`core/`)
- **workflow.mdc**: Core workspace rules and task-driven development
- **code-hygiene.mdc**: Code hygiene and project organization standards
- **engineering-practices.mdc**: Core engineering guardrails and coding standards
- **repo-creation.mdc**: Repository creation and script generation guidelines

### Backend Rules (`backend/`)
- **api-guidelines.mdc**: Backend API implementation and FastAPI guidelines

### Documentation Rules (`docs/`)
- **data-quality.mdc**: Documentation data quality standards
- **documentation.mdc**: Documentation organization and structure rules

### Testing Rules (`testing/`)
- **testing.mdc**: Testing requirements and protocols

### CI/CD Rules (`ci-cd/`)
- **github.mdc**: CI/CD GitHub workflow and PR conventions

## 🔧 Usage in External Projects

### Setup Process
1. **One-line setup**: `curl -s https://rules-framework.mikehenken.workers.dev/install | bash`
2. **Interactive setup**: `rules setup`
3. **MCP integration**: Rules are automatically configured

### Rule Application
- **Always Applied**: Core rules, data quality, framework development
- **Glob-Based**: Backend, docs, testing, CI/CD rules apply to specific file types
- **Selective**: Users can choose which rule categories to include

## 📚 Rule Details

### Core Rules (Always Applied)
- **Workflow**: Task-driven development, approval processes
- **Code Hygiene**: Clean code practices, file organization
- **Engineering Practices**: Architecture patterns, best practices
- **Repository Creation**: Guidelines for creating repositories

### Backend Rules (Python/API Files)
- **API Guidelines**: FastAPI and backend API standards
- **Database Practices**: Data modeling and management
- **Security**: Authentication and authorization patterns

### Documentation Rules (Markdown Files)
- **Documentation Standards**: Writing and formatting guidelines
- **Data Quality**: Accuracy and completeness requirements
- **Structure**: Organization and navigation patterns

### Testing Rules (Test Files)
- **Testing Requirements**: Mandatory testing protocols
- **Test Organization**: Structure and naming conventions
- **Quality Assurance**: Validation and verification standards

### CI/CD Rules (GitHub/YAML Files)
- **GitHub Workflows**: Automated testing and deployment
- **Release Management**: Versioning and publishing
- **Quality Gates**: Automated quality checks

## 🚀 Benefits for External Projects

### Code Quality
- **Consistent Standards**: All projects follow the same quality standards
- **Best Practices**: Guidelines refined through framework development
- **Clean Architecture**: Well-structured project code

### Documentation
- **Clear Guidelines**: Comprehensive documentation standards
- **Data Quality**: Accuracy and completeness requirements
- **User Experience**: Better project documentation

### Testing
- **Comprehensive Testing**: Mandatory testing requirements
- **Quality Assurance**: Validation and verification standards
- **Reliability**: More reliable and maintainable code

### Development Workflow
- **Task-Driven Development**: Clear development processes
- **Approval Workflows**: Structured change management
- **Team Collaboration**: Consistent team practices

## 🔄 Updates

### Automatic Updates
- External projects pull latest rules via MCP
- No manual updates needed
- Automatic updates via API

### Manual Updates
- Users can pull specific rule categories
- Customize rules for their project needs
- Maintain project-specific requirements

## 📁 Project Structure After Setup

```
external-project/
├── .cursor/
│   ├── rules/                      # Rules pulled from this directory
│   │   ├── core/                   # Core project rules
│   │   ├── backend/                # Backend/API rules
│   │   ├── docs/                   # Documentation rules
│   │   ├── testing/                # Testing rules
│   │   └── ci-cd/                  # CI/CD rules
│   └── mcp.json                    # MCP configuration
├── mcp-server.js                   # MCP server
├── setup-wizard.js                 # Setup wizard
└── package.json                    # Project configuration
```

---

**These rules ensure external projects maintain high quality standards!** 🎯