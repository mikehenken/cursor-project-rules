/**
 * Rules Framework Cloudflare Worker
 * Serves deployment files and documentation for other projects to pull
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
      } else if (path.startsWith('/files/')) {
        return handleFileRequest(path, env);
      } else if (path.startsWith('/docs/')) {
        return handleDocumentation(path, env);
      } else if (path.startsWith('/rules/')) {
        return handleRules(path, env);
      } else {
        return new Response('Not Found', { status: 404, headers: corsHeaders });
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
    endpoints: {
      files: '/api/files',
      docs: '/api/docs',
      rules: '/api/rules',
      pull: '/api/pull'
    },
    usage: {
      pullFiles: 'GET /api/pull?type=deployment',
      pullRules: 'GET /api/pull?type=rules',
      pullDocs: 'GET /api/pull?type=docs'
    }
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
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  if (path === '/api/files') {
    return handleFilesList(env);
  } else if (path === '/api/docs') {
    return handleDocsList(env);
  } else if (path === '/api/rules') {
    return handleRulesList(env);
  } else if (path === '/api/pull') {
    return handlePullRequest(searchParams, env);
  } else {
    return new Response('API endpoint not found', { status: 404 });
  }
}

/**
 * Handle file requests
 */
async function handleFileRequest(path, env) {
  const fileName = path.replace('/files/', '');
  
  // Get file from R2 storage
  const file = await env.RULES_STORAGE.get(fileName);
  
  if (!file) {
    return new Response('File not found', { status: 404 });
  }

  const headers = {
    'Content-Type': getContentType(fileName),
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600'
  };

  return new Response(file.body, { headers });
}

/**
 * Handle documentation requests
 */
async function handleDocumentation(path, env) {
  const docPath = path.replace('/docs/', '');
  
  // Get documentation from R2 storage
  const doc = await env.RULES_STORAGE.get(`docs/${docPath}`);
  
  if (!doc) {
    return new Response('Documentation not found', { status: 404 });
  }

  return new Response(doc.body, {
    headers: {
      'Content-Type': 'text/markdown',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * Handle rules requests
 */
async function handleRules(path, env) {
  const rulePath = path.replace('/rules/', '');
  
  // Get rule from R2 storage
  const rule = await env.RULES_STORAGE.get(`rules/${rulePath}`);
  
  if (!rule) {
    return new Response('Rule not found', { status: 404 });
  }

  return new Response(rule.body, {
    headers: {
      'Content-Type': 'text/markdown',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

/**
 * Handle files list API
 */
async function handleFilesList(env) {
  const files = [
    {
      name: 'deploy-template.js',
      path: '/files/deploy-template.js',
      description: 'Universal deployment script for Next.js projects',
      type: 'deployment'
    },
    {
      name: 'next.config.template.js',
      path: '/files/next.config.template.js',
      description: 'Next.js configuration template',
      type: 'deployment'
    },
    {
      name: 'wrangler.template.toml',
      path: '/files/wrangler.template.toml',
      description: 'Cloudflare configuration template',
      type: 'deployment'
    },
    {
      name: 'package.template.json',
      path: '/files/package.template.json',
      description: 'Package configuration template',
      type: 'deployment'
    },
    {
      name: 'env.example',
      path: '/files/env.example',
      description: 'Environment variables template',
      type: 'deployment'
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
 * Handle docs list API
 */
async function handleDocsList(env) {
  const docs = [
    {
      name: 'CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md',
      path: '/docs/CLOUDFLARE_DEPLOYMENT_BOILERPLATE.md',
      description: 'Complete deployment boilerplate guide'
    },
    {
      name: 'DEPLOYMENT_SETUP.md',
      path: '/docs/DEPLOYMENT_SETUP.md',
      description: 'Detailed setup instructions'
    },
    {
      name: 'TROUBLESHOOTING.md',
      path: '/docs/TROUBLESHOOTING.md',
      description: 'Common issues and solutions'
    },
    {
      name: 'PURPOSE_SCOPED_RULES.md',
      path: '/docs/PURPOSE_SCOPED_RULES.md',
      description: 'Purpose-scoped Cursor rules guide'
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
 * Handle rules list API
 */
async function handleRulesList(env) {
  const rules = [
    {
      name: 'core',
      path: '/rules/core/',
      description: 'Core project-wide rules',
      files: ['workflow.mdc', 'engineering-practices.mdc', 'code-hygiene.mdc', 'repo-creation.mdc']
    },
    {
      name: 'backend',
      path: '/rules/backend/',
      description: 'Backend and API development rules',
      files: ['api-guidelines.mdc']
    },
    {
      name: 'docs',
      path: '/rules/docs/',
      description: 'Documentation standards and organization',
      files: ['documentation.mdc', 'data-quality.mdc']
    },
    {
      name: 'testing',
      path: '/rules/testing/',
      description: 'Testing requirements and protocols',
      files: ['testing.mdc']
    },
    {
      name: 'ci-cd',
      path: '/rules/ci-cd/',
      description: 'CI/CD and deployment rules',
      files: ['github.mdc']
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
 * Handle pull requests
 */
async function handlePullRequest(searchParams, env) {
  const type = searchParams.get('type');
  const format = searchParams.get('format') || 'json';

  if (!type) {
    return new Response('Type parameter required (deployment, rules, docs)', { status: 400 });
  }

  let responseData;

  switch (type) {
    case 'deployment':
      responseData = await getDeploymentFiles(env);
      break;
    case 'rules':
      responseData = await getRulesFiles(env);
      break;
    case 'docs':
      responseData = await getDocsFiles(env);
      break;
    default:
      return new Response('Invalid type. Use: deployment, rules, docs', { status: 400 });
  }

  if (format === 'zip') {
    return createZipResponse(responseData);
  }

  return new Response(JSON.stringify(responseData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * Get deployment files
 */
async function getDeploymentFiles(env) {
  const files = [
    'deploy-template.js',
    'next.config.template.js',
    'wrangler.template.toml',
    'package.template.json',
    'env.example'
  ];

  const deploymentFiles = {};
  
  for (const fileName of files) {
    const file = await env.RULES_STORAGE.get(fileName);
    if (file) {
      deploymentFiles[fileName] = await file.text();
    }
  }

  return {
    type: 'deployment',
    files: deploymentFiles,
    instructions: {
      setup: 'Copy these files to your project and rename them (remove .template suffix)',
      configure: 'Edit .env with your Cloudflare credentials',
      deploy: 'Run npm run deploy'
    }
  };
}

/**
 * Get rules files
 */
async function getRulesFiles(env) {
  const rulesDirs = ['core', 'backend', 'docs', 'testing', 'ci-cd'];
  const rulesFiles = {};

  for (const dir of rulesDirs) {
    const dirFiles = await env.RULES_STORAGE.list({ prefix: `rules/${dir}/` });
    rulesFiles[dir] = {};
    
    for (const file of dirFiles.objects) {
      const fileContent = await env.RULES_STORAGE.get(file.key);
      if (fileContent) {
        const fileName = file.key.split('/').pop();
        rulesFiles[dir][fileName] = await fileContent.text();
      }
    }
  }

  return {
    type: 'rules',
    structure: rulesFiles,
    instructions: {
      copy: 'Copy the purpose directories you need to your project',
      example: 'cp -r core/ your-project/.cursor/rules/',
      usage: 'Rules will automatically apply based on directory context'
    }
  };
}

/**
 * Get documentation files
 */
async function getDocsFiles(env) {
  const docsFiles = await env.RULES_STORAGE.list({ prefix: 'docs/' });
  const docs = {};

  for (const file of docsFiles.objects) {
    const fileContent = await env.RULES_STORAGE.get(file.key);
    if (fileContent) {
      const fileName = file.key.split('/').pop();
      docs[fileName] = await fileContent.text();
    }
  }

  return {
    type: 'docs',
    files: docs,
    instructions: {
      usage: 'Use these documentation files as reference or copy to your project',
      structure: 'Follow the documentation organization structure outlined in the files'
    }
  };
}

/**
 * Create ZIP response
 */
async function createZipResponse(data) {
  // This would require a ZIP library - for now return JSON
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
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
    'mdc': 'text/markdown'
  };

  return types[ext] || 'text/plain';
}
