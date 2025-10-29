# Purpose-Scoped Cursor Rules Guide

This guide explains how to use and implement purpose-scoped Cursor rules, allowing you to organize rules by domain and apply only the relevant rule sets to your projects.

## What Are Purpose-Scoped Rules?

Purpose-scoped rules organize Cursor rules by domain or purpose (e.g., frontend, backend, testing, documentation) rather than keeping all rules in a flat structure. This allows you to:

- **Select relevant rule sets** for your specific project type
- **Avoid rule conflicts** between different domains
- **Maintain focused rule sets** for specific concerns
- **Enable context-aware rule application** based on directory structure

## Directory Structure

Purpose-scoped rules use a nested directory structure where each purpose has its own `.cursor/rules/` subdirectory:

```
.cursor/rules/
├── core/                    # Essential project-wide rules
│   └── .cursor/rules/
│       ├── workflow.mdc
│       ├── engineering-practices.mdc
│       ├── code-hygiene.mdc
│       └── repo-creation.mdc
├── backend/                 # Backend and API development
│   └── .cursor/rules/
│       └── api-guidelines.mdc
├── docs/                    # Documentation standards
│   └── .cursor/rules/
│       ├── documentation.mdc
│       └── data-quality.mdc
├── testing/                 # Testing requirements
│   └── .cursor/rules/
│       └── testing.mdc
├── ci-cd/                    # CI/CD and deployment
│   └── .cursor/rules/
│       └── github.mdc
├── frontend/                # Frontend development (ready for expansion)
│   └── .cursor/rules/
├── deployment/              # Deployment and infrastructure
│   └── .cursor/rules/
└── api/                     # API design and documentation
    └── .cursor/rules/
```

## How Purpose-Scoped Rules Work

### **Automatic Application**
Cursor automatically applies rules based on:
1. **Directory context** - Rules in a purpose directory apply when working in that directory
2. **File type matching** - Rules with `globs` patterns activate for matching files
3. **Always applied rules** - Rules with `alwaysApply: true` apply project-wide

### **Rule Types**
- **Always Applied** (`alwaysApply: true`) - Project-wide rules that apply everywhere
- **Auto-Attached** (with `globs` patterns) - Rules that activate based on file types
- **Manual** - Rules you can invoke with `@ruleName` in chat

### **Nested Structure Benefits**
- **Context-aware application** - Rules apply based on directory location
- **Selective copying** - Copy only the purpose directories you need
- **Clear separation** - Different rules for different project areas
- **Easy maintenance** - Update rules for specific purposes independently

## Usage Examples

### **1. Full-Stack Project**
Copy core, backend, frontend, and testing rules:

```bash
# Copy essential rules
cp -r .cursor/rules/core/ your-project/.cursor/rules/
cp -r .cursor/rules/backend/ your-project/.cursor/rules/
cp -r .cursor/rules/testing/ your-project/.cursor/rules/

# Add frontend rules when ready
cp -r .cursor/rules/frontend/ your-project/.cursor/rules/
```

### **2. Documentation Project**
Copy core and documentation rules:

```bash
cp -r .cursor/rules/core/ your-project/.cursor/rules/
cp -r .cursor/rules/docs/ your-project/.cursor/rules/
```

### **3. API-Only Project**
Copy core, backend, and API rules:

```bash
cp -r .cursor/rules/core/ your-project/.cursor/rules/
cp -r .cursor/rules/backend/ your-project/.cursor/rules/
cp -r .cursor/rules/api/ your-project/.cursor/rules/
```

### **4. CI/CD Project**
Copy core and CI/CD rules:

```bash
cp -r .cursor/rules/core/ your-project/.cursor/rules/
cp -r .cursor/rules/ci-cd/ your-project/.cursor/rules/
```

## Creating Custom Purpose Directories

### **1. Create the Directory Structure**
```bash
mkdir -p your-project/.cursor/rules/mobile/.cursor/rules/
```

### **2. Add Your Rules**
Create rule files in the nested `.cursor/rules/` directory:

```markdown
---
description: Mobile development guidelines
globs: ["**/*.tsx", "**/mobile/**"]
alwaysApply: false
---
## Mobile Development Rules
- Use React Native best practices
- Optimize for mobile performance
- Follow platform-specific guidelines
```

### **3. Configure Rule Behavior**
Use frontmatter to control rule application:
- `alwaysApply: true` - Apply project-wide
- `globs: ["**/*.tsx"]` - Auto-attach to TypeScript React files
- `description` - Explain the rule's purpose

## Rule Configuration

### **Frontmatter Options**
```yaml
---
description: Brief description of the rule's purpose
globs: ["**/*.py", "**/api/**"]  # File patterns to match
alwaysApply: true                # Apply project-wide
---
```

### **Rule Types and Use Cases**
- **Always Applied** - Core project rules that should apply everywhere
- **Auto-Attached** - Domain-specific rules that activate based on file types
- **Manual** - Rules you invoke explicitly with `@ruleName`

### **Best Practices**
- Keep related rules together in the same purpose directory
- Use clear, descriptive names for purpose directories
- Maintain consistent frontmatter across rules
- Test rules in isolation before combining

## Migration from Flat Structure

### **Step 1: Analyze Existing Rules**
Identify which rules belong to which purpose:
- Core rules: workflow, engineering practices, code hygiene
- Domain rules: API guidelines, testing, documentation
- Project-specific rules: custom rules for your specific needs

### **Step 2: Create Purpose Directories**
```bash
mkdir -p .cursor/rules/{core,backend,docs,testing,ci-cd}/.cursor/rules/
```

### **Step 3: Move Rules**
Place rules in appropriate purpose directories:
```bash
mv .cursor/rules/workflow.mdc .cursor/rules/core/.cursor/rules/
mv .cursor/rules/api-guidelines.mdc .cursor/rules/backend/.cursor/rules/
# ... continue for other rules
```

### **Step 4: Update Frontmatter**
Adjust rule descriptions and `alwaysApply` settings:
```yaml
---
description: Core workflow rules for task-driven development
alwaysApply: true
---
```

### **Step 5: Test Application**
Verify rules apply correctly in their new locations:
- Check that rules activate in appropriate directories
- Test file type matching with `globs` patterns
- Verify project-wide rules still apply everywhere

## Troubleshooting

### **Rules Not Applying**
- **Check directory structure** - Ensure nested `.cursor/rules/` directories exist
- **Verify frontmatter** - Check `alwaysApply` and `globs` settings
- **Test context** - Work in the appropriate directory for the rules to apply

### **Rule Conflicts**
- **Review `alwaysApply`** - Check for conflicting project-wide rules
- **Check glob patterns** - Ensure patterns don't overlap unexpectedly
- **Consider priority** - Some rules may override others based on specificity

### **Custom Rules Not Working**
- **Follow format** - Use proper frontmatter structure
- **Test isolation** - Test rules individually before combining
- **Check syntax** - Ensure YAML frontmatter is valid

## Best Practices

### **Rule Organization**
- Group related rules by purpose/domain
- Use consistent naming conventions
- Keep rules focused on specific concerns
- Document custom rules and their purposes

### **Project Structure**
- Copy only the purpose directories you need
- Create custom purpose directories for project-specific rules
- Maintain the nested `.cursor/rules/` structure
- Keep rules organized and well-documented

### **Rule Maintenance**
- Update rules based on project evolution
- Test rules in development before production
- Version control rule changes
- Document rule purposes and usage

## Advanced Usage

### **Conditional Rules**
Use glob patterns to create conditional rule application:
```yaml
---
globs: ["**/*.py", "**/api/**"]
alwaysApply: false
---
# This rule only applies to Python files and API directories
```

### **Rule Inheritance**
Create base rules in core directory and extend them in purpose directories:
```yaml
# core/.cursor/rules/base-coding-standards.mdc
---
description: Base coding standards
alwaysApply: true
---

# backend/.cursor/rules/api-specific-standards.mdc
---
description: API-specific coding standards
globs: ["**/*.py"]
alwaysApply: false
---
```

### **Rule Composition**
Combine multiple rule sets for complex projects:
```bash
# Copy multiple purpose directories
cp -r .cursor/rules/core/ your-project/.cursor/rules/
cp -r .cursor/rules/backend/ your-project/.cursor/rules/
cp -r .cursor/rules/frontend/ your-project/.cursor/rules/
cp -r .cursor/rules/testing/ your-project/.cursor/rules/
```

## Conclusion

Purpose-scoped rules provide a powerful way to organize and apply Cursor rules based on project needs. By organizing rules by purpose and using directory-specific application, you can create more focused, maintainable rule sets that adapt to your project's specific requirements.

The key benefits are:
- **Selective application** - Choose only relevant rule sets
- **Context awareness** - Rules apply based on directory and file types
- **Easy maintenance** - Update rules for specific purposes independently
- **Clear organization** - Separate concerns by domain/purpose
