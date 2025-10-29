# Rules Framework - Cursor Rules

This directory contains the Cursor rules used for **developing the Rules Framework itself**.

## 🎯 Purpose

These rules are applied to the Rules Framework development to ensure:
- Consistent code quality
- Proper documentation standards
- Effective testing practices
- Clean architecture patterns

## 🏗️ Why .cursor/rules/ Instead of .cursorrules

### **Consistency with Our Framework**
- We promote `.cursor/rules/` with purpose-scoped organization to external projects
- We should practice what we preach
- Maintains consistency across all projects using our framework

### **Better Organization**
- **Modular**: Each rule category in its own file
- **Maintainable**: Easy to update specific rule categories
- **Scalable**: Easy to add new rule categories
- **Clear**: Each file has a specific purpose

### **Framework Alignment**
- Matches our `framework/external/rules/` structure
- Consistent with our MCP integration approach
- Aligns with our purpose-scoped philosophy

## 📁 Rule Categories

### Core Rules (`core/`)
- **Code Hygiene**: Clean code practices, file organization
- **Engineering Practices**: Architecture patterns, best practices
- **Workflow**: Development workflow and processes
- **Repository Creation**: Guidelines for creating repositories

### Backend Rules (`backend/`)
- **API Guidelines**: FastAPI and backend API standards
- **Database Practices**: Data modeling and management
- **Security**: Authentication and authorization patterns

### Documentation Rules (`docs/`)
- **Documentation Standards**: Writing and formatting guidelines
- **Data Quality**: Accuracy and completeness requirements
- **Structure**: Organization and navigation patterns

### Testing Rules (`testing/`)
- **Testing Requirements**: Mandatory testing protocols
- **Test Organization**: Structure and naming conventions
- **Quality Assurance**: Validation and verification standards

### CI/CD Rules (`ci-cd/`)
- **GitHub Workflows**: Automated testing and deployment
- **Release Management**: Versioning and publishing
- **Quality Gates**: Automated quality checks

### Deployment Rules (`deployment/`)
- **Cloudflare Workers**: Serverless deployment patterns
- **Environment Management**: Configuration and secrets
- **Monitoring**: Logging and observability

## 🔧 Usage

These rules are automatically applied when working on the Rules Framework:

1. **Code Quality**: Enforced through linting and formatting
2. **Documentation**: Required for all new features
3. **Testing**: Mandatory for all functionality
4. **Architecture**: Guided by engineering practices

## 📚 External vs Framework Rules

### Framework Rules (This Directory)
- Used for **developing the Rules Framework itself**
- Applied to framework code, documentation, and processes
- Focused on framework development best practices

### External Rules (`framework/external/rules/`)
- Used by **external projects** that pull in the framework
- Applied to user projects via MCP integration
- Focused on general development best practices

## 🚀 Benefits

### For Framework Development
- **Consistent Quality**: All framework code follows the same standards
- **Better Documentation**: Clear guidelines for framework docs
- **Effective Testing**: Comprehensive testing requirements
- **Clean Architecture**: Well-structured framework code

### For External Projects
- **Proven Patterns**: Rules based on framework development experience
- **Best Practices**: Guidelines refined through framework development
- **Quality Assurance**: Standards that ensure project success

## 🔄 Maintenance

### Updating Framework Rules
1. Modify rules in this directory
2. Test with framework development
3. Deploy updated rules to external projects via MCP

### Syncing with External Rules
- Framework rules inform external rules
- External rules are derived from framework experience
- Both evolve together to maintain consistency

---

**These rules ensure the Rules Framework itself maintains the highest quality standards!** 🎯