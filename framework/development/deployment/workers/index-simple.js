/**
 * Rules Framework Cloudflare Worker (Simplified Version)
 * Serves deployment files and documentation without R2 dependency
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
      // Route handling
      if (path === '/' || path === '/index') {
        return handleIndex(env);
      } else if (path.startsWith('/api/')) {
        return handleAPI(path, request, env);
      } else if (path === '/setup') {
        return handleSetupScript(env);
      } else if (path === '/install') {
        return handleInstallScript(env);
      } else if (path.startsWith('/files/')) {
        return handleFileDownload(path, env);
      } else {
        return new Response('Rules Framework API\n\nEndpoints:\n- GET /api/files\n- GET /api/rules\n- GET /api/docs\n- GET /setup (auto-setup script)\n- GET /install (installer script)', { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }
  },
};

/**
 * Handle index/root requests
 */
async function handleIndex(env) {
  const indexData = {
    name: 'Rules Framework',
    version: env.FRAMEWORK_VERSION || '1.0.0',
    description: 'Cursor Rules Framework - Deployable to Cloudflare Workers',
    status: 'deployed',
    endpoints: {
      files: '/api/files',
      rules: '/api/rules',
      docs: '/api/docs'
    },
    usage: {
      pullFiles: 'GET /api/pull?type=deployment',
      pullRules: 'GET /api/pull?type=rules',
      pullDocs: 'GET /api/pull?type=docs'
    },
    note: 'This is a simplified version. R2 storage will be added in the next update.'
  };

  return new Response(JSON.stringify(indexData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle API requests
 */
async function handleAPI(path, request, env) {
  if (path === '/api/files') {
    return handleFilesList(env);
  } else if (path === '/api/rules') {
    return handleRulesList(env);
  } else if (path === '/api/docs') {
    return handleDocsList(env);
  } else {
    return new Response('API endpoint not found', { status: 404 });
  }
}

/**
 * Handle files list API
 */
async function handleFilesList(env) {
  const files = [
    {
      name: 'deploy-template.js',
      description: 'Universal deployment script for Next.js projects',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'next.config.template.js',
      description: 'Next.js configuration template',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'wrangler.template.toml',
      description: 'Cloudflare configuration template',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'package.template.json',
      description: 'Package configuration template',
      type: 'deployment',
      status: 'available'
    },
    {
      name: 'env.example',
      description: 'Environment variables template',
      type: 'deployment',
      status: 'available'
    }
  ];

  return new Response(JSON.stringify(files, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle rules list API
 */
async function handleRulesList(env) {
  const rules = [
    {
      name: 'core',
      description: 'Core project-wide rules',
      files: ['workflow.mdc', 'engineering-practices.mdc', 'code-hygiene.mdc', 'repo-creation.mdc'],
      status: 'available'
    },
    {
      name: 'backend',
      description: 'Backend and API development rules',
      files: ['api-guidelines.mdc'],
      status: 'available'
    },
    {
      name: 'docs',
      description: 'Documentation standards and organization',
      files: ['documentation.mdc', 'data-quality.mdc'],
      status: 'available'
    },
    {
      name: 'testing',
      description: 'Testing requirements and protocols',
      files: ['testing.mdc'],
      status: 'available'
    },
    {
      name: 'ci-cd',
      description: 'CI/CD and deployment rules',
      files: ['github.mdc'],
      status: 'available'
    }
  ];

  return new Response(JSON.stringify(rules, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle docs list API
 */
async function handleDocsList(env) {
  const docs = [
    {
      name: 'CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md',
      description: 'Complete deployment boilerplate guide',
      status: 'available'
    },
    {
      name: 'DEPLOYMENT_SETUP.md',
      description: 'Detailed setup instructions',
      status: 'available'
    },
    {
      name: 'TROUBLESHOOTING.md',
      description: 'Common issues and solutions',
      status: 'available'
    },
    {
      name: 'PURPOSE_SCOPED_RULES.md',
      description: 'Purpose-scoped Cursor rules guide',
      status: 'available'
    },
    {
      name: 'MCP_INTEGRATION.md',
      description: 'MCP integration guide for Cursor projects',
      status: 'available'
    }
  ];

  return new Response(JSON.stringify(docs, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Handle setup script request
 */
async function handleSetupScript(env) {
  try {
    const setupScript = "#!/bin/bash\n# Rules Framework Interactive Setup Script\nset -e\n\nFRAMEWORK_URL=\"https://rules-framework.mikehenken.workers.dev\"\n\n# Color codes for better UX\nRED='\\033[0;31m'\nGREEN='\\033[0;32m'\nYELLOW='\\033[1;33m'\nBLUE='\\033[0;34m'\nCYAN='\\033[0;36m'\nNC='\\033[0m' # No Color\n\n# Helper function to prompt for yes/no with default\nprompt_yes_no() {\n    local prompt=\"$1\"\n    local default=\"$2\"\n    local response\n    \n    if [ \"$default\" = \"yes\" ]; then\n        prompt=\"${prompt} [Y/n]: \"\n    else\n        prompt=\"${prompt} [y/N]: \"\n    fi\n    \n    read -p \"$prompt\" response\n    response=${response:-$default}\n    \n    case \"$response\" in\n        [Yy]|[Yy][Ee][Ss]|yes)\n            echo \"yes\"\n            ;;\n        *)\n            echo \"no\"\n            ;;\n    esac\n}\n\n# Helper function to prompt for input with default\nprompt_input() {\n    local prompt=\"$1\"\n    local default=\"$2\"\n    local response\n    \n    if [ -n \"$default\" ]; then\n        read -p \"${prompt} [${default}]: \" response < /dev/tty\n        echo \"${response:-$default}\"\n    else\n        read -p \"${prompt}: \" response < /dev/tty\n        echo \"$response\"\n    fi\n}\n\n# Helper function to prompt for choice\nprompt_choice() {\n    local prompt=\"$1\"\n    local default=\"$2\"\n    shift 2\n    local options=(\"$@\")\n    local response\n    \n    echo \"$prompt\"\n    for i in \"${!options[@]}\"; do\n        local marker=\"\"\n        if [ \"${options[$i]}\" = \"$default\" ]; then\n            marker=\" (default)\"\n        fi\n        echo \"  $((i+1)). ${options[$i]}${marker}\"\n    done\n    \n    read -p \"Enter choice [1-${#options[@]}]: \" response\n    \n    if [ -z \"$response\" ]; then\n        echo \"$default\"\n    else\n        local index=$((response - 1))\n        if [ \"$index\" -ge 0 ] && [ \"$index\" -lt \"${#options[@]}\" ]; then\n            echo \"${options[$index]}\"\n        else\n            echo \"$default\"\n        fi\n    fi\n}\n\necho -e \"${CYAN}\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557${NC}\"\necho -e \"${CYAN}\u2551        \ud83c\udfaf Rules Framework Interactive Setup Wizard         \u2551${NC}\"\necho -e \"${CYAN}\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557${NC}\"\necho \"\"\n\n# Get current directory name for default project name\nCURRENT_DIR=$(basename \"$PWD\")\n\n# ============================================================================\n# PART 1: INTERACTIVE QUESTIONNAIRE\n# ============================================================================\n\necho -e \"${BLUE}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\necho -e \"${BLUE}  Core Modules & Rules Configuration${NC}\"\necho -e \"${BLUE}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\necho \"\"\n\n# Question 1: Next.js frontend\nENABLE_NEXTJS=$(prompt_yes_no \"Enable Next.js frontend?\" \"yes\")\n\n# Question 2: FastAPI backend\nENABLE_FASTAPI=$(prompt_yes_no \"Enable FastAPI Python backend?\" \"yes\")\n\n# Question 3: Auto GitHub repo creation\nENABLE_GITHUB=$(prompt_yes_no \"Enable auto GitHub repo creation?\" \"yes\")\n\n# Question 4: Cloudflare deployment\nENABLE_CLOUDFLARE=$(prompt_yes_no \"Enable Cloudflare deployment?\" \"yes\")\n\n# Question 5: Rule granularity\nENABLE_GRANULAR_RULES=$(prompt_yes_no \"Configure individual rule granularity?\" \"no\")\n\necho \"\"\n\n# ============================================================================\n# CONDITIONAL: GitHub Configuration\n# ============================================================================\n\nif [ \"$ENABLE_GITHUB\" = \"yes\" ]; then\n    echo -e \"${BLUE}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\n    echo -e \"${BLUE}  GitHub Repository Configuration${NC}\"\n    echo -e \"${BLUE}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\n    echo \"\"\n    \n    # Prompt for project name\n    REPO_NAME=$(prompt_input \"Project name\" \"$CURRENT_DIR\")\n    \n    # Prompt for repository visibility\n    REPO_VISIBILITY=$(prompt_choice \"Repository visibility:\" \"private\" \"private\" \"public\")\n    \n    echo \"\"\nfi\n\n# ============================================================================\n# CONDITIONAL: Cloudflare Configuration\n# ============================================================================\n\nif [ \"$ENABLE_CLOUDFLARE\" = \"yes\" ]; then\n    echo -e \"${BLUE}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\n    echo -e \"${BLUE}  Cloudflare Deployment Configuration${NC}\"\n    echo -e \"${BLUE}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\n    echo \"\"\n    \n    # Prompt for Cloudflare API token\n    echo -e \"${YELLOW}\u26a0\ufe0f  These values will be passed as environment variables${NC}\"\n    CLOUDFLARE_API_TOKEN=$(prompt_input \"Cloudflare API Token\" \"\")\n    \n    # Prompt for Cloudflare account ID\n    CLOUDFLARE_ACCOUNT_ID=$(prompt_input \"Cloudflare Account ID\" \"\")\n    \n    # Prompt for deployment target\n    CLOUDFLARE_TARGET=$(prompt_choice \"Deployment target:\" \"Cloudflare Workers\" \"Cloudflare Workers\" \"Cloudflare Pages\")\n    \n    echo \"\"\nfi\n\n# ============================================================================\n# PART 2: DOWNLOAD FILES & PREPARE ENVIRONMENT\n# ============================================================================\n\necho -e \"${GREEN}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\necho -e \"${GREEN}  Downloading Framework Files...${NC}\"\necho -e \"${GREEN}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\necho \"\"\n\n# Create .cursor directory\nmkdir -p .cursor\n\n# Download MCP server\necho \"\ud83d\udce5 Downloading MCP server...\"\ncurl -s \"${FRAMEWORK_URL}/files/mcp-server.js\" > mcp-server.js\n\n# Create MCP configuration\necho \"\u2699\ufe0f  Creating MCP configuration...\"\ncat > .cursor/mcp.json << EOF\n{\n  \"mcpServers\": {\n    \"rules-framework\": {\n      \"command\": \"node\",\n      \"args\": [\"mcp-server.js\"],\n      \"env\": {\n        \"RULES_FRAMEWORK_URL\": \"${FRAMEWORK_URL}\"\n      }\n    }\n  }\n}\nEOF\n\n# Download setup wizard\necho \"\ud83d\udce5 Downloading setup wizard...\"\ncurl -s \"${FRAMEWORK_URL}/files/setup-wizard.js\" > setup-wizard.js\n\n# Download package.json template\necho \"\ud83d\udce5 Downloading package.json...\"\ncurl -s \"${FRAMEWORK_URL}/files/package.template.json\" > package.json\n\n# Install dependencies\necho \"\ud83d\udce6 Installing dependencies...\"\nnpm install --silent\n\necho \"\"\n\n# ============================================================================\n# PART 3: BUILD COMMAND-LINE ARGUMENTS & ENVIRONMENT VARIABLES\n# ============================================================================\n\necho -e \"${GREEN}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\necho -e \"${GREEN}  Starting Interactive Setup Wizard...${NC}\"\necho -e \"${GREEN}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${NC}\"\necho \"\"\n\n# Build command-line arguments\nWIZARD_ARGS=()\n\nif [ \"$ENABLE_NEXTJS\" = \"yes\" ]; then\n    WIZARD_ARGS+=(--nextjs)\nfi\n\nif [ \"$ENABLE_FASTAPI\" = \"yes\" ]; then\n    WIZARD_ARGS+=(--fastapi)\nfi\n\nif [ \"$ENABLE_GITHUB\" = \"yes\" ]; then\n    WIZARD_ARGS+=(--github)\n    WIZARD_ARGS+=(--repoName \"$REPO_NAME\")\n    WIZARD_ARGS+=(--repoVisibility \"$REPO_VISIBILITY\")\nfi\n\nif [ \"$ENABLE_CLOUDFLARE\" = \"yes\" ]; then\n    WIZARD_ARGS+=(--cloudflare)\n    WIZARD_ARGS+=(--cloudflareTarget \"$CLOUDFLARE_TARGET\")\n    \n    # Export environment variables for secrets\n    export CLOUDFLARE_API_TOKEN\n    export CLOUDFLARE_ACCOUNT_ID\nfi\n\nif [ \"$ENABLE_GRANULAR_RULES\" = \"yes\" ]; then\n    WIZARD_ARGS+=(--granular-rules)\nfi\n\n# Execute the Node.js wizard with all arguments\nnode setup-wizard.js \"${WIZARD_ARGS[@]}\"\n\necho \"\"\necho -e \"${GREEN}\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557${NC}\"\necho -e \"${GREEN}\u2551              \ud83c\udf89 Setup Complete! \ud83c\udf89                         \u2551${NC}\"\necho -e \"${GREEN}\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d${NC}\"\necho \"\"\n\n# Display configuration summary\necho -e \"${CYAN}Configuration Summary:${NC}\"\necho -e \"  Next.js Frontend: ${ENABLE_NEXTJS}\"\necho -e \"  FastAPI Backend: ${ENABLE_FASTAPI}\"\necho -e \"  GitHub Integration: ${ENABLE_GITHUB}\"\nif [ \"$ENABLE_GITHUB\" = \"yes\" ]; then\n    echo -e \"    - Repository Name: ${REPO_NAME}\"\n    echo -e \"    - Visibility: ${REPO_VISIBILITY}\"\nfi\necho -e \"  Cloudflare Deployment: ${ENABLE_CLOUDFLARE}\"\nif [ \"$ENABLE_CLOUDFLARE\" = \"yes\" ]; then\n    echo -e \"    - Target: ${CLOUDFLARE_TARGET}\"\nfi\necho -e \"  Granular Rules: ${ENABLE_GRANULAR_RULES}\"\necho \"\"\n\n";
    return new Response(setupScript, {
      headers: {
        'Content-Type': 'text/x-shellscript',
        'Content-Disposition': 'inline; filename="setup.sh"',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('Error in handleSetupScript:', error);
    return new Response('Error loading setup script', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}

/**
 * Handle install script request
 */
async function handleInstallScript(env) {
  const installScript = `#!/bin/bash

# Rules Framework Installer
# One-line installer: curl -s https://rules-framework.mikehenken.workers.dev/install | bash

echo "🎯 Rules Framework Installer"
echo "============================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required but not installed."
    echo "   Please install npm (usually comes with Node.js)"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Run the setup script
curl -s https://rules-framework.mikehenken.workers.dev/setup | bash
`;

  return new Response(installScript, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Content-Disposition': 'inline; filename="install.sh"'
    }
  });
}

/**
 * Handle file download requests
 */
async function handleFileDownload(path, env) {
  const fileName = path.replace('/files/', '');
  
  // Special handling for setup.sh - serve via handleSetupScript
  if (fileName === 'setup.sh') {
    // Redirect to /setup endpoint
    const url = new URL(path, 'https://rules-framework.mikehenken.workers.dev');
    url.pathname = '/setup';
    return Response.redirect(url.toString(), 302);
  }
  
  
  // For now, return a placeholder response
  // In a real implementation, you'd serve the actual files from R2 storage
  const fileContent = getFileContent(fileName);
  
  if (!fileContent) {
    return new Response('File not found', { status: 404 });
  }

  return new Response(fileContent, {
    headers: {
      'Content-Type': getContentType(fileName),
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * Get file content (placeholder implementation)
 */
function getFileContent(fileName) {
  // For now, return the actual MCP server content directly
  // In production, this would be served from R2 storage
  if (fileName === 'mcp-server.js') {
    return `#!/usr/bin/env node

/**
 * Rules Framework MCP Server
 * Provides MCP tools for rules management, template selection, and deployment
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP Server setup
const server = new Server(
  {
    name: 'rules-framework',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Configuration
const config = {
  rulesDir: join(__dirname, '.cursor', 'rules'),
  templatesDir: join(__dirname, 'templates'),
  docsDir: join(__dirname, 'docs'),
  frameworkUrl: process.env.RULES_FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev'
};

/**
 * List available MCP tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_rules',
        description: 'List all available purpose-scoped rules',
        inputSchema: {
          type: 'object',
          properties: {
            purpose: {
              type: 'string',
              description: 'Filter rules by purpose (core, backend, frontend, etc.)'
            }
          }
        }
      },
      {
        name: 'enable_rules',
        description: 'Enable specific rule sets for the project',
        inputSchema: {
          type: 'object',
          properties: {
            rules: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of rule names to enable'
            }
          },
          required: ['rules']
        }
      }
    ]
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_rules':
        return await listRules(args.purpose);
      case 'enable_rules':
        return await enableRules(args.rules);
      default:
        throw new Error(\`Unknown tool: \${name}\`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: \`Error: \${error.message}\`
        }
      ]
    };
  }
});

/**
 * List available rules
 */
async function listRules(purpose) {
  const rules = [
    {
      name: 'core-engineering',
      description: 'Core engineering practices and standards',
      purpose: 'core'
    },
    {
      name: 'core-testing',
      description: 'Testing requirements and best practices',
      purpose: 'core'
    },
    {
      name: 'backend-api',
      description: 'Backend API implementation guidelines',
      purpose: 'backend'
    }
  ];
  
  const filteredRules = purpose ? rules.filter(rule => rule.purpose === purpose) : rules;
  
  return {
    content: [
      {
        type: 'text',
        text: \`Available rules (\${filteredRules.length}):\n\` + 
              filteredRules.map(rule => \`- \${rule.name}: \${rule.description}\`).join('\\n')
      }
    ]
  };
}

/**
 * Enable rules for the project
 */
async function enableRules(rules) {
  const enabledRules = [];
  const enabledRules = [];
  
  
  for (const ruleName of rules) {
  for (const ruleName of rules) {
    if (!existsSync('.cursor')) {
    if (!existsSync('.cursor')) {
      mkdirSync('.cursor');
      mkdirSync('.cursor');
    }
    }
    if (!existsSync('.cursor/rules')) {
    if (!existsSync('.cursor/rules')) {
      mkdirSync('.cursor/rules');
      mkdirSync('.cursor/rules');
    }
    }
    
    
    const ruleContent = \`# \${ruleName} Rule
    const ruleContent = \`# \${ruleName} Rule


This rule provides guidelines for \${ruleName} development.
This rule provides guidelines for \${ruleName} development.


## Requirements
## Requirements
- Follow best practices
- Follow best practices
- Maintain code quality
- Maintain code quality
- Test thoroughly
- Test thoroughly
\`;
\`;
    
    
    const rulePath = \`.cursor/rules/\${ruleName}.mdc\`;
    const rulePath = \`.cursor/rules/\${ruleName}.mdc\`;
  
  
}
}


# Helper function to prompt for input with default
# Helper function to prompt for input with default
prompt_input() {
prompt_input() {
    local prompt="$1"
    local prompt="$1"
    local default="$2"
    local default="$2"
    local response
    local response
    
    
    if [ -n "$default" ]; then
    if [ -n "$default" ]; then
        read -p "\${prompt} [\${default}]: " response
        read -p "\${prompt} [\${default}]: " response
        echo "\${response:-$default}"
        echo "\${response:-$default}"
    else
    else
        read -p "\${prompt}: " response
        read -p "\${prompt}: " response
        echo "$response"
        echo "$response"
    fi
    fi
}
}


# Helper function to prompt for choice
# Helper function to prompt for choice
prompt_choice() {
prompt_choice() {
    local prompt="$1"
    local prompt="$1"
    local default="$2"
    local default="$2"
    shift 2
    shift 2
    local options=("$@")
    local options=("$@")
    local response
    local response
    
    
    echo "$prompt"
    echo "$prompt"
    for i in "\${!options[@]}"; do
    for i in "\${!options[@]}"; do
        local marker=""
        local marker=""
        if [ "\${options[$i]}" = "$default" ]; then
        if [ "\${options[$i]}" = "$default" ]; then
            marker=" (default)"
            marker=" (default)"
        fi
        fi
        echo "  $((i+1)). \${options[$i]}\${marker}"
        echo "  $((i+1)). \${options[$i]}\${marker}"
    done
    done
    
    
    read -p "Enter choice [1-\${#options[@]}]: " response
    read -p "Enter choice [1-\${#options[@]}]: " response
    
    
    if [ -z "$response" ]; then
    if [ -z "$response" ]; then
        echo "$default"
        echo "$default"
    else
    else
        local index=$((response - 1))
        local index=$((response - 1))
        if [ "$index" -ge 0 ] && [ "$index" -lt "\${#options[@]}" ]; then
        if [ "$index" -ge 0 ] && [ "$index" -lt "\${#options[@]}" ]; then
            echo "\${options[$index]}"
            echo "\${options[$index]}"
        else
        else
            echo "$default"
            echo "$default"
        fi
        fi
    fi
    fi
}
}


echo -e "\${CYAN}╔════════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${CYAN}╔════════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${CYAN}║        🎯 Rules Framework Interactive Setup Wizard         ║\${NC}"
echo -e "\${CYAN}║        🎯 Rules Framework Interactive Setup Wizard         ║\${NC}"
echo -e "\${CYAN}╔════════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${CYAN}╔════════════════════════════════════════════════════════════╗\${NC}"
echo ""
echo ""


# Get current directory name for default project name
# Get current directory name for default project name
CURRENT_DIR=$(basename "$PWD")
CURRENT_DIR=$(basename "$PWD")


# ============================================================================
# ============================================================================
# PART 1: INTERACTIVE QUESTIONNAIRE
# PART 1: INTERACTIVE QUESTIONNAIRE
# ============================================================================
# ============================================================================


echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${BLUE}  Core Modules & Rules Configuration\${NC}"
echo -e "\${BLUE}  Core Modules & Rules Configuration\${NC}"
echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo ""
echo ""


# Question 1: Next.js frontend
# Question 1: Next.js frontend
ENABLE_NEXTJS=$(prompt_yes_no "Enable Next.js frontend?" "yes")
ENABLE_NEXTJS=$(prompt_yes_no "Enable Next.js frontend?" "yes")


# Question 2: FastAPI backend
# Question 2: FastAPI backend
ENABLE_FASTAPI=$(prompt_yes_no "Enable FastAPI Python backend?" "yes")
ENABLE_FASTAPI=$(prompt_yes_no "Enable FastAPI Python backend?" "yes")


# Question 3: Auto GitHub repo creation
# Question 3: Auto GitHub repo creation
ENABLE_GITHUB=$(prompt_yes_no "Enable auto GitHub repo creation?" "yes")
ENABLE_GITHUB=$(prompt_yes_no "Enable auto GitHub repo creation?" "yes")


# Question 4: Cloudflare deployment
# Question 4: Cloudflare deployment
ENABLE_CLOUDFLARE=$(prompt_yes_no "Enable Cloudflare deployment?" "yes")
ENABLE_CLOUDFLARE=$(prompt_yes_no "Enable Cloudflare deployment?" "yes")


# Question 5: Rule granularity
# Question 5: Rule granularity
ENABLE_GRANULAR_RULES=$(prompt_yes_no "Configure individual rule granularity?" "no")
ENABLE_GRANULAR_RULES=$(prompt_yes_no "Configure individual rule granularity?" "no")


echo ""
echo ""


# ============================================================================
# ============================================================================
# CONDITIONAL: GitHub Configuration
# CONDITIONAL: GitHub Configuration
# ============================================================================
# ============================================================================


if [ "$ENABLE_GITHUB" = "yes" ]; then
if [ "$ENABLE_GITHUB" = "yes" ]; then
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo -e "\${BLUE}  GitHub Repository Configuration\${NC}"
    echo -e "\${BLUE}  GitHub Repository Configuration\${NC}"
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo ""
    echo ""
    
    
    # Prompt for project name
    # Prompt for project name
    REPO_NAME=$(prompt_input "Project name" "$CURRENT_DIR")
    REPO_NAME=$(prompt_input "Project name" "$CURRENT_DIR")
    
    
    # Prompt for repository visibility
    # Prompt for repository visibility
    REPO_VISIBILITY=$(prompt_choice "Repository visibility:" "private" "private" "public")
    REPO_VISIBILITY=$(prompt_choice "Repository visibility:" "private" "private" "public")
    
    
    echo ""
    echo ""
fi
fi


# ============================================================================
# ============================================================================
# CONDITIONAL: Cloudflare Configuration
# CONDITIONAL: Cloudflare Configuration
# ============================================================================
# ============================================================================


if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo -e "\${BLUE}  Cloudflare Deployment Configuration\${NC}"
    echo -e "\${BLUE}  Cloudflare Deployment Configuration\${NC}"
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo -e "\${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
    echo ""
    echo ""
    
    
    # Prompt for Cloudflare API token
    # Prompt for Cloudflare API token
    echo -e "\${YELLOW}⚠️  These values will be passed as environment variables\${NC}"
    echo -e "\${YELLOW}⚠️  These values will be passed as environment variables\${NC}"
    CLOUDFLARE_API_TOKEN=$(prompt_input "Cloudflare API Token" "")
    CLOUDFLARE_API_TOKEN=$(prompt_input "Cloudflare API Token" "")
    
    
    # Prompt for Cloudflare account ID
    # Prompt for Cloudflare account ID
    CLOUDFLARE_ACCOUNT_ID=$(prompt_input "Cloudflare Account ID" "")
    CLOUDFLARE_ACCOUNT_ID=$(prompt_input "Cloudflare Account ID" "")
    
    
    # Prompt for deployment target
    # Prompt for deployment target
    CLOUDFLARE_TARGET=$(prompt_choice "Deployment target:" "Cloudflare Workers" "Cloudflare Workers" "Cloudflare Pages")
    CLOUDFLARE_TARGET=$(prompt_choice "Deployment target:" "Cloudflare Workers" "Cloudflare Workers" "Cloudflare Pages")
    
    
    echo ""
    echo ""
fi
fi


# ============================================================================
# ============================================================================
# PART 2: DOWNLOAD FILES & PREPARE ENVIRONMENT
# PART 2: DOWNLOAD FILES & PREPARE ENVIRONMENT
# ============================================================================
# ============================================================================


echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${GREEN}  Downloading Framework Files...\${NC}"
echo -e "\${GREEN}  Downloading Framework Files...\${NC}"
echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo ""
echo ""


# Create .cursor directory
# Create .cursor directory
mkdir -p .cursor
mkdir -p .cursor


# Download MCP server
# Download MCP server
echo "📥 Downloading MCP server..."
echo "📥 Downloading MCP server..."
curl -s "\${FRAMEWORK_URL}/files/mcp-server.js" > mcp-server.js
curl -s "\${FRAMEWORK_URL}/files/mcp-server.js" > mcp-server.js


# Create MCP configuration
# Create MCP configuration
echo "⚙️  Creating MCP configuration..."
echo "⚙️  Creating MCP configuration..."
cat > .cursor/mcp.json << EOF
cat > .cursor/mcp.json << EOF
{
{
  "mcpServers": {
  "mcpServers": {
    "rules-framework": {
    "rules-framework": {
      "command": "node",
      "command": "node",
      "args": ["mcp-server.js"],
      "args": ["mcp-server.js"],
      "env": {
      "env": {
        "RULES_FRAMEWORK_URL": "\${FRAMEWORK_URL}"
        "RULES_FRAMEWORK_URL": "\${FRAMEWORK_URL}"
      }
      }
    }
    }
  }
  }
}
}
EOF
EOF


# Download setup wizard
# Download setup wizard
echo "📥 Downloading setup wizard..."
echo "📥 Downloading setup wizard..."
curl -s "\${FRAMEWORK_URL}/files/setup-wizard.js" > setup-wizard.js
curl -s "\${FRAMEWORK_URL}/files/setup-wizard.js" > setup-wizard.js


# Download package.json template
# Download package.json template
echo "📥 Downloading package.json..."
echo "📥 Downloading package.json..."
curl -s "\${FRAMEWORK_URL}/files/package.template.json" > package.json
curl -s "\${FRAMEWORK_URL}/files/package.template.json" > package.json


# Install dependencies
# Install dependencies
echo "📦 Installing dependencies..."
echo "📦 Installing dependencies..."
npm install --silent
npm install --silent


echo ""
echo ""


# ============================================================================
# ============================================================================
# PART 3: BUILD COMMAND-LINE ARGUMENTS & ENVIRONMENT VARIABLES
# PART 3: BUILD COMMAND-LINE ARGUMENTS & ENVIRONMENT VARIABLES
# ============================================================================
# ============================================================================


echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${GREEN}  Starting Interactive Setup Wizard...\${NC}"
echo -e "\${GREEN}  Starting Interactive Setup Wizard...\${NC}"
echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo -e "\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}"
echo ""
echo ""


# Build command-line arguments
# Build command-line arguments
WIZARD_ARGS=()
WIZARD_ARGS=()


if [ "$ENABLE_NEXTJS" = "yes" ]; then
if [ "$ENABLE_NEXTJS" = "yes" ]; then
    WIZARD_ARGS+=(--nextjs)
    WIZARD_ARGS+=(--nextjs)
fi
fi


if [ "$ENABLE_FASTAPI" = "yes" ]; then
if [ "$ENABLE_FASTAPI" = "yes" ]; then
    WIZARD_ARGS+=(--fastapi)
    WIZARD_ARGS+=(--fastapi)
fi
fi


if [ "$ENABLE_GITHUB" = "yes" ]; then
if [ "$ENABLE_GITHUB" = "yes" ]; then
    WIZARD_ARGS+=(--github)
    WIZARD_ARGS+=(--github)
    WIZARD_ARGS+=(--repoName "$REPO_NAME")
    WIZARD_ARGS+=(--repoName "$REPO_NAME")
    WIZARD_ARGS+=(--repoVisibility "$REPO_VISIBILITY")
    WIZARD_ARGS+=(--repoVisibility "$REPO_VISIBILITY")
fi
fi


if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
    WIZARD_ARGS+=(--cloudflare)
    WIZARD_ARGS+=(--cloudflare)
    WIZARD_ARGS+=(--cloudflareTarget "$CLOUDFLARE_TARGET")
    WIZARD_ARGS+=(--cloudflareTarget "$CLOUDFLARE_TARGET")
    
    
    # Export environment variables for secrets
    # Export environment variables for secrets
    export CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_ACCOUNT_ID
    export CLOUDFLARE_ACCOUNT_ID
fi
fi


if [ "$ENABLE_GRANULAR_RULES" = "yes" ]; then
if [ "$ENABLE_GRANULAR_RULES" = "yes" ]; then
    WIZARD_ARGS+=(--granular-rules)
    WIZARD_ARGS+=(--granular-rules)
fi
fi


# Execute the Node.js wizard with all arguments
# Execute the Node.js wizard with all arguments
node setup-wizard.js "\${WIZARD_ARGS[@]}"
node setup-wizard.js "\${WIZARD_ARGS[@]}"


echo ""
echo ""
echo -e "\${GREEN}╔════════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${GREEN}╔════════════════════════════════════════════════════════════╗\${NC}"
echo -e "\${GREEN}║              🎉 Setup Complete! 🎉                         ║\${NC}"
echo -e "\${GREEN}║              🎉 Setup Complete! 🎉                         ║\${NC}"
echo -e "\${GREEN}╚════════════════════════════════════════════════════════════╝\${NC}"
echo -e "\${GREEN}╚════════════════════════════════════════════════════════════╝\${NC}"
echo ""
echo ""


# Display configuration summary
# Display configuration summary
echo -e "\${CYAN}Configuration Summary:\${NC}"
echo -e "\${CYAN}Configuration Summary:\${NC}"
echo -e "  Next.js Frontend: \${ENABLE_NEXTJS}"
echo -e "  Next.js Frontend: \${ENABLE_NEXTJS}"
echo -e "  FastAPI Backend: \${ENABLE_FASTAPI}"
echo -e "  FastAPI Backend: \${ENABLE_FASTAPI}"
echo -e "  GitHub Integration: \${ENABLE_GITHUB}"
echo -e "  GitHub Integration: \${ENABLE_GITHUB}"
if [ "$ENABLE_GITHUB" = "yes" ]; then
if [ "$ENABLE_GITHUB" = "yes" ]; then
    echo -e "    - Repository Name: \${REPO_NAME}"
    echo -e "    - Repository Name: \${REPO_NAME}"
    echo -e "    - Visibility: \${REPO_VISIBILITY}"
    echo -e "    - Visibility: \${REPO_VISIBILITY}"
fi
fi
echo -e "  Cloudflare Deployment: \${ENABLE_CLOUDFLARE}"
echo -e "  Cloudflare Deployment: \${ENABLE_CLOUDFLARE}"
if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
    echo -e "    - Target: \${CLOUDFLARE_TARGET}"
    echo -e "    - Target: \${CLOUDFLARE_TARGET}"
fi
fi
echo -e "  Granular Rules: \${ENABLE_GRANULAR_RULES}"
echo -e "  Granular Rules: \${ENABLE_GRANULAR_RULES}"
echo ""
echo ""


`;
`;
  }
    writeFileSync(rulePath, ruleContent);
    enabledRules.push(ruleName);
  }
  

  
  return {
    content: [
      {
        type: 'text',
        text: \`Enabled rules: \${enabledRules.join(', ')}\`
      }
    ]
  };
}

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);

console.error('Rules Framework MCP Server started');
`;
  }
  
  // Fallback to placeholder content
  const files = {
    'mcp-server.js': '// MCP Server placeholder - would be actual server code',
    'setup-wizard.js': `#!/usr/bin/env node

console.log('🚀 Running Next.js setup...');

import { execSync } from 'child_process';
import fs from 'fs';

// Check if we're in a clean directory
const files = fs.readdirSync('.');
const hasConflicts = files.some(file => 
  ['.cursor', 'mcp-server.js', 'setup-wizard.js'].includes(file)
);

let tempDir = null;

if (hasConflicts) {
  console.log('⚠️  Directory has framework files, running Next.js setup...');
  
  // Create temp directory outside current directory
  tempDir = '../.framework-temp-' + Date.now();
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);
  
  // Move framework files to temp directory
  const frameworkFiles = ['.cursor', 'mcp-server.js', 'setup-wizard.js'];
  frameworkFiles.forEach(file => {
    if (fs.existsSync(file)) {
      if (file === '.cursor') {
        fs.cpSync(file, \`\${tempDir}/.cursor\`, { recursive: true });
        fs.rmSync(file, { recursive: true, force: true });
      } else {
        fs.renameSync(file, \`\${tempDir}/\${file}\`);
      }
    }
  });
  
  // Remove conflicting files temporarily
  if (fs.existsSync('package.json')) {
    fs.unlinkSync('package.json');
  }
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
  }
  if (fs.existsSync('node_modules')) {
    fs.rmSync('node_modules', { recursive: true, force: true });
  }
}

try {
  console.log('📦 Installing Next.js with TypeScript and Tailwind...');
  execSync('npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Next.js setup complete!');
  console.log('🔧 Adding Cloudflare Workers configuration...');
  
  // Add Cloudflare Workers dependencies
  execSync('npm install @cloudflare/next-on-pages @cloudflare/workers-types wrangler --legacy-peer-deps', { 
    stdio: 'inherit' 
  });
  
  // Restore framework files
  if (fs.existsSync(tempDir)) {
    console.log('🔄 Restoring framework files...');
    const frameworkFiles = ['.cursor', 'mcp-server.js'];
    frameworkFiles.forEach(file => {
      if (fs.existsSync(\`\${tempDir}/\${file}\`)) {
        if (file === '.cursor') {
          fs.cpSync(\`\${tempDir}/\${file}\`, '.cursor', { recursive: true });
        } else {
          fs.renameSync(\`\${tempDir}/\${file}\`, file);
        }
      }
    });
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  console.log('🎉 Setup complete! Your Next.js project is ready with Cloudflare Workers deployment.');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}`,
    'package.template.json': JSON.stringify({
      "name": "rules-framework-project",
      "version": "1.0.0",
      "description": "Project with Rules Framework",
      "type": "module",
      "scripts": {
        "setup": "node setup-wizard.js",
        "test": "echo \"Test passed\""
      },
      "dependencies": {
        "@modelcontextprotocol/sdk": "^0.4.0"
      }
    }, null, 2)
  };
  
  return files[fileName] || null;
}

/**
 * Get content type based on file extension
 */
function getContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  
  const types = {
    'js': 'application/javascript',
    'json': 'application/json',
    'toml': 'text/plain',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'mdc': 'text/markdown',
    'sh': 'text/plain'
  };

  return types[ext] || 'text/plain';
}
