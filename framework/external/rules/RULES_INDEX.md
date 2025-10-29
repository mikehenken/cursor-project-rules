# Rules Framework - Cursor Rules Index

## 🎯 Available Rules

This directory contains all the Cursor rules used for **developing the Rules Framework itself**.

## 📁 Rule Categories

### Core Rules (`core/`)
- **code-hygiene.mdc**: Clean code practices, file organization
- **engineering-practices.mdc**: Architecture patterns, best practices
- **repo-creation.mdc**: Guidelines for creating repositories
- **workflow.mdc**: Development workflow and processes

### Backend Rules (`backend/`)
- **api-guidelines.mdc**: FastAPI and backend API standards

### Documentation Rules (`docs/`)
- **data-quality.mdc**: Accuracy and completeness requirements
- **documentation.mdc**: Writing and formatting guidelines

### Testing Rules (`testing/`)
- **testing.mdc**: Testing requirements and protocols

### CI/CD Rules (`ci-cd/`)
- **github.mdc**: GitHub workflows and PR conventions

### Framework Development Rules
- **framework-development.mdc**: Framework-specific development guidelines

## 🔧 Usage

### Automatic Application
These rules are automatically applied when working on the Rules Framework:
- **Code Quality**: Enforced through linting and formatting
- **Documentation**: Required for all new features
- **Testing**: Mandatory for all functionality
- **Architecture**: Guided by engineering practices

### Manual Reference
- Use `@rules` in Cursor chat to reference specific rules
- Check individual `.mdc` files for detailed guidelines
- Refer to this index for rule categories

## 📚 Rule Details

### Core Rules
- **Code Hygiene**: File organization, clean code practices
- **Engineering Practices**: Architecture patterns, best practices
- **Repository Creation**: Guidelines for creating repositories
- **Workflow**: Development workflow and processes

### Backend Rules
- **API Guidelines**: FastAPI and backend API standards
- **Database Practices**: Data modeling and management
- **Security**: Authentication and authorization patterns

### Documentation Rules
- **Documentation Standards**: Writing and formatting guidelines
- **Data Quality**: Accuracy and completeness requirements
- **Structure**: Organization and navigation patterns

### Testing Rules
- **Testing Requirements**: Mandatory testing protocols
- **Test Organization**: Structure and naming conventions
- **Quality Assurance**: Validation and verification standards

### CI/CD Rules
- **GitHub Workflows**: Automated testing and deployment
- **Release Management**: Versioning and publishing
- **Quality Gates**: Automated quality checks

### Framework Development Rules
- **Architecture Clarity**: Framework vs external file separation
- **Documentation Standards**: Framework-specific documentation
- **Code Quality**: Framework development best practices
- **Deployment**: Framework deployment and distribution
- **Maintenance**: Regular updates and quality assurance

## 🔄 External Rules Access

### Symlink to External Rules
- `.cursor/external-rules/` - Symlink to external project rules
- Use for reference when developing external project features
- These rules are pulled into external Cursor projects

### External Rules Location
- `framework/external/rules/rules/` - External project rules
- These are the rules that external projects receive via MCP

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

## 🔧 Maintenance

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
