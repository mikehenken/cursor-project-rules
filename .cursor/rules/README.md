# Project Rules

This directory contains organized Cursor rules that were migrated from the legacy `.cursorrules` file.

## Rule Files

### Always Applied Rules (alwaysApply: true)
- **data-quality.mdc** - Data quality standards and verification protocols
- **documentation.mdc** - Mandatory documentation organization structure
- **testing.mdc** - Testing requirements and protocols  
- **code-hygiene.mdc** - Code hygiene and project organization
- **engineering-practices.mdc** - Core engineering guardrails
- **workflow.mdc** - Task-driven development workflow
- **repo-creation.mdc** - Repository creation approval requirements

### Context-Specific Rules (alwaysApply: false)
- **api-guidelines.mdc** - API and FastAPI guidelines (auto-attached for Python files)
- **github.mdc** - GitHub workflow conventions (auto-attached for GitHub files)

## How Rules Work

1. **Always Applied**: Rules with `alwaysApply: true` are included in every AI context
2. **Auto-Attached**: Rules with `globs` patterns are included when matching files are referenced
3. **Manual**: Rules can be manually invoked using `@ruleName` in chat

## Usage Tips

- Rules are automatically loaded based on their configuration
- Check active rules in the Agent sidebar during chat
- To temporarily disable a rule, you can toggle it in Cursor Settings → Rules
- For file-specific guidance, ensure you're working with files that match the glob patterns

## Migration Note

These rules were migrated from the legacy `.cursorrules` file to take advantage of:
- Better organization and modularity
- Context-aware rule application
- Version control for individual rule sets
- Easier maintenance and updates

