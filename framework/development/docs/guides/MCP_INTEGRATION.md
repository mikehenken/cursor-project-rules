# MCP Integration Guide

This guide explains how to set up the Rules Framework as an MCP (Model Context Protocol) tool in other Cursor projects, enabling seamless integration for rules management, template selection, and deployment.

## 🎯 What is MCP Integration?

MCP (Model Context Protocol) allows Cursor to communicate with external tools and services. By setting up the Rules Framework as an MCP server, other Cursor projects can:

- **List and enable rules** - Browse available purpose-scoped rules
- **Select templates** - Choose deployment templates for their projects
- **Configure environments** - Set up Cloudflare credentials and project settings
- **Deploy projects** - Deploy directly through Cursor with MCP integration
- **Pull from framework** - Download files from the deployed Rules Framework

## 🚀 Quick Setup

### 1. Install MCP Dependencies

```bash
# Install MCP SDK
npm install @modelcontextprotocol/sdk

# Or use the provided script
npm run mcp:install
```

### 2. Configure Cursor MCP Settings

Add the Rules Framework MCP server to your Cursor configuration:

**File: `~/.cursor/mcp.json`**
```json
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["/path/to/rules-framework/mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "https://your-framework-url.workers.dev"
      }
    }
  }
}
```

### 3. Start Using MCP Tools

Once configured, you can use the MCP tools in Cursor:

- **@rules-framework** - Access all Rules Framework functionality
- **List rules** - Browse available purpose-scoped rules
- **Enable rules** - Enable specific rule sets for your project
- **Apply templates** - Select and apply deployment templates
- **Configure deployment** - Set up environment and deploy

## 🛠️ Available MCP Tools

### **Rules Management**

#### `list_rules`
List all available purpose-scoped rules:
```json
{
  "purpose": "core"  // Optional: filter by specific purpose
}
```

#### `get_rule`
Get a specific rule file content:
```json
{
  "purpose": "core",
  "ruleName": "workflow.mdc"
}
```

#### `enable_rules`
Enable specific rules in your project:
```json
{
  "purposes": ["core", "backend", "testing"],
  "projectPath": "/path/to/your/project"  // Optional: defaults to current directory
}
```

### **Template Management**

#### `list_templates`
List available deployment templates:
```json
{
  "type": "deployment"  // Optional: filter by template type
}
```

#### `get_template`
Get a specific template file:
```json
{
  "templateName": "deploy-template.js",
  "type": "deployment"
}
```

#### `apply_template`
Apply a template to your project:
```json
{
  "templateName": "deploy-template.js",
  "type": "deployment",
  "projectPath": "/path/to/your/project",
  "options": {
    "renameFiles": true,    // Remove .template suffix
    "overwrite": false      // Don't overwrite existing files
  }
}
```

### **Environment Configuration**

#### `configure_environment`
Configure environment variables for deployment:
```json
{
  "projectPath": "/path/to/your/project",
  "environment": "production",
  "cloudflareToken": "your_token_here",
  "cloudflareAccountId": "your_account_id",
  "projectName": "your-project-name"
}
```

### **Deployment**

#### `deploy_project`
Deploy your project:
```json
{
  "projectPath": "/path/to/your/project",
  "environment": "production",
  "dryRun": false
}
```

### **Framework Integration**

#### `pull_from_framework`
Pull files from the deployed Rules Framework:
```json
{
  "projectPath": "/path/to/your/project",
  "type": "deployment",  // or "rules", "docs", "all"
  "frameworkUrl": "https://your-framework-url.workers.dev"
}
```

### **Validation**

#### `validate_setup`
Validate your project setup:
```json
{
  "projectPath": "/path/to/your/project"
}
```

## 📋 Usage Examples

### **Example 1: Set Up a New Project**

1. **List available rules:**
   ```
   @rules-framework list_rules
   ```

2. **Enable core rules:**
   ```
   @rules-framework enable_rules {"purposes": ["core", "backend"]}
   ```

3. **Apply deployment template:**
   ```
   @rules-framework apply_template {"templateName": "deploy-template.js", "type": "deployment", "options": {"renameFiles": true}}
   ```

4. **Configure environment:**
   ```
   @rules-framework configure_environment {"environment": "production", "projectName": "my-project"}
   ```

### **Example 2: Pull from Deployed Framework**

1. **Pull deployment files:**
   ```
   @rules-framework pull_from_framework {"type": "deployment"}
   ```

2. **Pull rules:**
   ```
   @rules-framework pull_from_framework {"type": "rules"}
   ```

3. **Validate setup:**
   ```
   @rules-framework validate_setup
   ```

### **Example 3: Deploy Project**

1. **Configure environment:**
   ```
   @rules-framework configure_environment {"environment": "production", "cloudflareToken": "your_token"}
   ```

2. **Deploy:**
   ```
   @rules-framework deploy_project {"environment": "production"}
   ```

## 🔧 Advanced Configuration

### **Custom MCP Server Path**

If you want to use a custom path for the MCP server:

```json
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["/custom/path/to/rules-framework/mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "https://your-custom-framework-url.workers.dev"
      }
    }
  }
}
```

### **Multiple Framework Instances**

You can configure multiple Rules Framework instances:

```json
{
  "mcpServers": {
    "rules-framework-prod": {
      "command": "node",
      "args": ["/path/to/rules-framework/mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "https://prod-framework.workers.dev"
      }
    },
    "rules-framework-dev": {
      "command": "node",
      "args": ["/path/to/rules-framework/mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "https://dev-framework.workers.dev"
      }
    }
  }
}
```

### **Environment Variables**

Set environment variables for the MCP server:

```json
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["/path/to/rules-framework/mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "https://your-framework.workers.dev",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

## 🚨 Troubleshooting

### **Common Issues**

1. **MCP Server Not Found**
   - Verify the path to `mcp-server.js` is correct
   - Ensure Node.js is installed and accessible
   - Check file permissions

2. **Rules Not Loading**
   - Verify the Rules Framework directory structure
   - Check that `.cursor/rules/` directories exist
   - Ensure rule files have `.mdc` extension

3. **Templates Not Found**
   - Verify template files exist in the framework
   - Check template names and types
   - Ensure proper file permissions

4. **Deployment Fails**
   - Verify Cloudflare credentials are set
   - Check project configuration
   - Ensure all required files are present

### **Debug Mode**

Enable debug logging by setting environment variables:

```json
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["/path/to/rules-framework/mcp-server.js"],
      "env": {
        "DEBUG": "true",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### **Validation**

Use the validation tool to check your setup:

```
@rules-framework validate_setup
```

This will check:
- Rules directory structure
- Deployment files
- Node.js installation
- Required dependencies

## 📚 Best Practices

### **Rules Management**
- Enable only the rule sets you need
- Use purpose-scoped rules for better organization
- Regularly update rules from the framework

### **Template Usage**
- Review templates before applying
- Customize templates for your project needs
- Keep templates up to date

### **Environment Configuration**
- Use different environments for development and production
- Secure your Cloudflare credentials
- Validate configuration before deployment

### **Deployment**
- Test deployments in staging first
- Use dry-run mode to validate deployment
- Monitor deployment logs

## 🔄 Updates and Maintenance

### **Updating the Framework**
1. Pull latest changes from the Rules Framework
2. Update your MCP server configuration if needed
3. Test with your projects

### **Adding Custom Rules**
1. Create custom rule files in your project
2. Add them to the appropriate purpose directory
3. Use the MCP tools to manage them

### **Framework Evolution**
- Monitor the Rules Framework for updates
- Test new features in development
- Migrate to new versions as needed

## 📖 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Cursor MCP Integration](https://docs.cursor.com/context/mcp)
- [Rules Framework Documentation](../DOCS_INDEX.md)
- [Deployment Guide](features/deployment/CLOUDFLARE_WORKERS_DEPLOYMENT.md)

## 🎯 Next Steps

1. **Set up MCP integration** using this guide
2. **Test the tools** with a sample project
3. **Configure your environment** for deployment
4. **Deploy your first project** using the MCP tools
5. **Explore advanced features** and customization options

Your Rules Framework is now ready to be used as an MCP tool in other Cursor projects!
