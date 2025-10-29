# Rules Framework - Real-World Usage Examples

This document provides practical examples of using the Rules Framework in real-world scenarios.

## Quick Start Examples

### Example 1: New Next.js Project with Full Setup

**Scenario**: Starting a new Next.js project with backend, GitHub, and Cloudflare deployment.

```bash
# Run interactive setup
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash
```

**What happens**:
1. ✅ Downloads MCP server and setup wizard
2. ✅ Sets up Next.js with TypeScript and Tailwind
3. ✅ Creates FastAPI backend structure
4. ✅ Downloads and installs all 9 rules automatically
5. ✅ Configures GitHub repository (if enabled)
6. ✅ Sets up Cloudflare Workers deployment

**Result**:
```
project/
├── .cursor/
│   ├── mcp.json
│   └── rules/
│       ├── core/          (4 rules)
│       ├── backend/       (1 rule)
│       ├── docs/          (2 rules)
│       ├── testing/       (1 rule)
│       └── ci-cd/         (1 rule)
├── src/
│   └── app/
│       └── page.tsx      (Hello World)
├── backend/
│   ├── main.py
│   └── requirements.txt
├── mcp-server.js
├── setup-wizard.js
├── package.json
└── wrangler.toml
```

### Example 2: Adding Rules to Existing Project

**Scenario**: You have an existing project and want to add rules.

```bash
# Download setup script
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh > setup.sh

# Run just the rules download part
curl -s https://rules-framework.mikehenken.workers.dev/files/setup-wizard.js > setup-wizard.js
node setup-wizard.js
```

**What happens**:
- Downloads and installs all rules to `.cursor/rules/`
- Sets up MCP server configuration
- No project structure changes if you skip Next.js/FastAPI setup

### Example 3: Minimal Setup (Rules Only)

**Scenario**: You only want the rules, no project scaffolding.

```bash
# Create .cursor directory
mkdir -p .cursor

# Download MCP server
curl -s https://rules-framework.mikehenken.workers.dev/files/mcp-server.js > mcp-server.js

# Create MCP config
cat > .cursor/mcp.json << EOF
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "https://rules-framework.mikehenken.workers.dev"
      }
    }
  }
}
EOF

# Download rules manually
node -e "
const fs = require('fs');
const https = require('https');
const path = require('path');

async function downloadRules() {
  const response = await fetch('https://rules-framework.mikehenken.workers.dev/api/rules');
  const rules = await response.json();
  
  for (const rulePurpose of rules) {
    const purposeDir = path.join('.cursor', 'rules', rulePurpose.name);
    fs.mkdirSync(purposeDir, { recursive: true });
    
    for (const fileName of rulePurpose.files) {
      const fileResponse = await fetch(\`https://rules-framework.mikehenken.workers.dev/rules/\${rulePurpose.name}/\${fileName}\`);
      const content = await fileResponse.text();
      fs.writeFileSync(path.join(purposeDir, fileName), content);
      console.log(\`✅ Downloaded \${rulePurpose.name}/\${fileName}\`);
    }
  }
}

downloadRules();
"
```

## MCP Server Usage Examples

### Example 4: List Available Rules

After setup, use the MCP server in Cursor:

```
@rules-framework list_rules
```

**Response**:
```json
[
  {
    "purpose": "core",
    "files": [
      {
        "name": "workflow.mdc",
        "path": ".cursor/rules/core/workflow.mdc",
        "description": "Task-driven development workflow"
      },
      ...
    ]
  },
  ...
]
```

### Example 5: Get Specific Rule Content

```
@rules-framework get_rule purpose=core ruleName=workflow.mdc
```

### Example 6: Enable Additional Rules

```
@rules-framework enable_rules purposes=["frontend","deployment"]
```

## Real-World Project Scenarios

### Scenario A: Full-Stack Web Application

**Project**: E-commerce platform with Next.js frontend, FastAPI backend, and Cloudflare deployment.

**Setup**:
```bash
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash
```

**Answers to prompts**:
- Next.js Frontend: **yes**
- FastAPI Backend: **yes**
- GitHub Integration: **yes** (project name: `ecommerce-platform`)
- Cloudflare Deployment: **yes** (target: Cloudflare Workers)
- Granular Rules: **no**

**Result**: 
- ✅ All 9 rules installed
- ✅ Next.js with TypeScript
- ✅ FastAPI backend structure
- ✅ GitHub repo created
- ✅ Cloudflare Workers configured

**Rules Applied**:
- **Core**: Workflow, engineering practices, code hygiene
- **Backend**: API guidelines for FastAPI endpoints
- **Docs**: Documentation standards for API docs
- **Testing**: Testing requirements for both frontend and backend
- **CI/CD**: GitHub workflows for deployment

### Scenario B: API-Only Backend Service

**Project**: REST API service using FastAPI, deployed to Cloudflare Workers.

**Setup**:
```bash
mkdir my-api-service && cd my-api-service
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash
```

**Answers**:
- Next.js Frontend: **no**
- FastAPI Backend: **yes**
- GitHub Integration: **yes**
- Cloudflare Deployment: **yes**
- Granular Rules: **no**

**Result**:
- ✅ Backend rules only (core, backend, testing, ci-cd)
- ✅ FastAPI structure
- ✅ GitHub repo
- ✅ Cloudflare Workers config

**Rules Applied**:
- **Core**: Engineering practices, code hygiene
- **Backend**: API guidelines (FastAPI best practices)
- **Testing**: API testing requirements
- **CI/CD**: GitHub workflows

### Scenario C: Documentation Site

**Project**: Static documentation site using Next.js.

**Setup**:
```bash
mkdir docs-site && cd docs-site
curl -s https://rules-framework.mikehenken.workers.dev/files/setup.sh | bash
```

**Answers**:
- Next.js Frontend: **yes**
- FastAPI Backend: **no**
- GitHub Integration: **yes**
- Cloudflare Deployment: **yes** (target: Cloudflare Pages)
- Granular Rules: **yes** (select only: core, docs)

**Result**:
- ✅ Documentation-focused rules
- ✅ Next.js site
- ✅ Cloudflare Pages deployment

**Rules Applied**:
- **Core**: Workflow, code hygiene
- **Docs**: Documentation standards, data quality

## Troubleshooting Examples

### Issue: Rules Not Found After Setup

**Problem**: Setup completes but `.cursor/rules/` is empty.

**Solution**:
```bash
# Check if rules were downloaded
ls -la .cursor/rules/

# Manually download rules
node setup-wizard.js
```

### Issue: MCP Server Error "No server info found"

**Problem**: Cursor shows MCP error after setup.

**Solution**:
1. Verify `.cursor/mcp.json` exists and is correct
2. Verify `mcp-server.js` exists in project root
3. Restart Cursor completely
4. Check Node.js version: `node --version` (should be 18+)

### Issue: Rules Not Applying

**Problem**: Cursor isn't applying rules even though they exist.

**Solution**:
1. Verify rule structure: `.cursor/rules/{purpose}/*.mdc`
2. Check rule file format (should be `.mdc` files)
3. Restart Cursor
4. Check rule frontmatter in files

## Advanced Usage

### Custom Rule Selection

To download only specific rules:

```bash
# Download rules list
curl -s https://rules-framework.mikehenken.workers.dev/api/rules > rules-list.json

# Download specific rules manually
mkdir -p .cursor/rules/core
curl -s https://rules-framework.mikehenken.workers.dev/rules/core/workflow.mdc > .cursor/rules/core/workflow.mdc
curl -s https://rules-framework.mikehenken.workers.dev/rules/core/engineering-practices.mdc > .cursor/rules/core/engineering-practices.mdc
```

### Updating Rules

To update rules to latest version:

```bash
# Re-run setup wizard (it will overwrite existing rules)
node setup-wizard.js
```

### Using MCP Tools Programmatically

```javascript
// In your project scripts
import { spawn } from 'child_process';

const mcpServer = spawn('node', ['mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send MCP request
mcpServer.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
}));
```

## Best Practices

1. **Always restart Cursor** after setup to enable MCP integration
2. **Verify rules structure** before committing to git
3. **Use granular rules** for projects that don't need all rule categories
4. **Keep rules updated** by re-running setup periodically
5. **Document custom rules** if you modify any framework rules

## Next Steps

- See [MCP Integration Guide](../guides/MCP_INTEGRATION.md) for advanced MCP usage
- See [Purpose-Scoped Rules Guide](../guides/PURPOSE_SCOPED_RULES.md) for rule organization
- See [Troubleshooting Guide](../guides/TROUBLESHOOTING.md) for common issues


