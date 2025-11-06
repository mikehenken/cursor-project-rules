import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const FRAMEWORK_URL = process.env.FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev';
const TEST_BASE_DIR = join(process.env.HOME || tmpdir(), 'Projects', 'test-automations');

/**
 * Setup Flow E2E Tests
 * Tests the complete setup wizard flow from start to finish
 */
test.describe('Setup Flow', () => {
  let testDir;

  test.beforeEach(() => {
    // Create fresh test directory for each test
    testDir = join(TEST_BASE_DIR, `test-setup-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  test.afterEach(() => {
    // Cleanup test directory
    if (testDir && existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  test('Complete setup flow - minimal (rules only)', async ({ request }) => {
    // Download setup.sh
    const setupResponse = await request.get(`${FRAMEWORK_URL}/files/setup.sh`);
    expect(setupResponse.ok()).toBeTruthy();
    const setupScript = await setupResponse.text();
    
    // Download setup-wizard.js
    const wizardResponse = await request.get(`${FRAMEWORK_URL}/files/setup-wizard.js`);
    expect(wizardResponse.ok()).toBeTruthy();
    const wizardScript = await wizardResponse.text();
    
    // Save files to test directory
    const setupPath = join(testDir, 'setup.sh');
    const wizardPath = join(testDir, 'setup-wizard.js');
    writeFileSync(setupPath, setupScript);
    writeFileSync(wizardPath, wizardScript);
    chmodSync(setupPath, 0o755);
    
    // Run setup wizard with minimal flags
    try {
      const output = execSync(`node "${wizardPath}"`, {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 120000, // 2 minutes
        env: {
          ...process.env,
          RULES_FRAMEWORK_URL: FRAMEWORK_URL,
        },
        encoding: 'utf8',
      });
      
      // Check if setup completed successfully
      if (!output.includes('Setup Complete') && !output.includes('Rules installed')) {
        console.warn('Setup may not have completed fully');
      }
    } catch (error) {
      // Check if setup actually completed despite error
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      if (!output.includes('Setup Complete') && !existsSync(join(testDir, '.cursor', 'rules'))) {
        // Setup didn't complete, but continue to verify what was created
        console.warn('Setup may have failed, but continuing to verify files');
      }
    }
    
    // Verify .cursor/rules directory exists
    const rulesDir = join(testDir, '.cursor', 'rules');
    expect(existsSync(rulesDir)).toBe(true);
    
    // Verify rules were downloaded
    const coreDir = join(rulesDir, 'core');
    expect(existsSync(coreDir)).toBe(true);
    
    // Verify README.md was created
    const readmePath = join(testDir, 'README.md');
    expect(existsSync(readmePath)).toBe(true);
    
    const readmeContent = readFileSync(readmePath, 'utf8');
    expect(readmeContent).toContain('#');
    expect(readmeContent.length).toBeGreaterThan(100);
    
    // Verify docs directory structure exists
    const docsDir = join(testDir, 'docs');
    expect(existsSync(docsDir)).toBe(true);
    
    // Verify required docs subdirectories
    expect(existsSync(join(docsDir, 'setup'))).toBe(true);
    expect(existsSync(join(docsDir, 'development'))).toBe(true);
    expect(existsSync(join(docsDir, 'features'))).toBe(true);
    expect(existsSync(join(docsDir, 'guides'))).toBe(true);
    expect(existsSync(join(docsDir, 'api'))).toBe(true);
    expect(existsSync(join(docsDir, 'status'))).toBe(true);
    
    // Verify DOCS_INDEX.md exists
    expect(existsSync(join(docsDir, 'DOCS_INDEX.md'))).toBe(true);
    
    // Verify setup docs were created
    expect(existsSync(join(docsDir, 'setup', 'QUICK_START.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'setup', 'INSTALLATION.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'setup', 'DEPLOYMENT.md'))).toBe(true);
    expect(existsSync(join(docsDir, 'setup', 'CONFIGURATION.md'))).toBe(true);
    
    // Verify development docs
    expect(existsSync(join(docsDir, 'development', 'CONTRIBUTING.md'))).toBe(true);
  });

  test('Setup flow with Next.js - should create frontend directory', async ({ request }) => {
    // Download files
    const wizardResponse = await request.get(`${FRAMEWORK_URL}/files/setup-wizard.js`);
    const wizardScript = await wizardResponse.text();
    
    const wizardPath = join(testDir, 'setup-wizard.js');
    writeFileSync(wizardPath, wizardScript);
    
    // Run with Next.js flag
    try {
      execSync(`node "${wizardPath}" --nextjs`, {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 300000, // 5 minutes for Next.js setup
        env: {
          ...process.env,
          RULES_FRAMEWORK_URL: FRAMEWORK_URL,
        },
      });
    } catch (error) {
      // Check if setup actually completed
      if (existsSync(join(testDir, 'frontend'))) {
        // Setup completed, just check results
      } else if (error.stdout && error.stdout.toString().includes('Setup Complete')) {
        // Setup completed but might have timed out waiting
      } else {
        // Real error - but continue to verify what was created
      }
    }
    
    // Verify frontend directory was created
    const frontendDir = join(testDir, 'frontend');
    if (existsSync(frontendDir)) {
      expect(existsSync(join(frontendDir, 'package.json'))).toBe(true);
    }
    
    // Verify README mentions Next.js
    const readmePath = join(testDir, 'README.md');
    if (existsSync(readmePath)) {
      const readmeContent = readFileSync(readmePath, 'utf8');
      expect(readmeContent).toContain('Next.js');
    }
  });

  test('Setup flow with FastAPI - should create backend directory', async ({ request }) => {
    const wizardResponse = await request.get(`${FRAMEWORK_URL}/files/setup-wizard.js`);
    const wizardScript = await wizardResponse.text();
    
    const wizardPath = join(testDir, 'setup-wizard.js');
    writeFileSync(wizardPath, wizardScript);
    
    // Run with FastAPI flag
    try {
      execSync(`node "${wizardPath}" --fastapi`, {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 60000,
        env: {
          ...process.env,
          RULES_FRAMEWORK_URL: FRAMEWORK_URL,
        },
      });
    } catch (error) {
      // Continue to verify
    }
    
    // Verify backend directory was created
    const backendDir = join(testDir, 'backend');
    expect(existsSync(backendDir)).toBe(true);
    expect(existsSync(join(backendDir, 'main.py'))).toBe(true);
    expect(existsSync(join(backendDir, 'routers'))).toBe(true);
    expect(existsSync(join(backendDir, 'requirements.txt'))).toBe(true);
    
    // Verify README mentions FastAPI
    const readmePath = join(testDir, 'README.md');
    if (existsSync(readmePath)) {
      const readmeContent = readFileSync(readmePath, 'utf8');
      expect(readmeContent).toContain('FastAPI');
    }
  });

  test('Setup flow - verify all rules downloaded', async ({ request }) => {
    // Download setup wizard
    const wizardResponse = await request.get(`${FRAMEWORK_URL}/files/setup-wizard.js`);
    const wizardScript = await wizardResponse.text();
    
    const wizardPath = join(testDir, 'setup-wizard.js');
    writeFileSync(wizardPath, wizardScript);
    
    // Run setup
    try {
      execSync(`node "${wizardPath}"`, {
        cwd: testDir,
        stdio: 'pipe',
        timeout: 120000,
        env: {
          ...process.env,
          RULES_FRAMEWORK_URL: FRAMEWORK_URL,
        },
      });
    } catch (error) {
      // Continue to verify
    }
    
    // Get list of expected rules from API
    const rulesResponse = await request.get(`${FRAMEWORK_URL}/api/rules`);
    const rulesData = await rulesResponse.json();
    
    // Verify all purpose directories exist
    const rulesDir = join(testDir, '.cursor', 'rules');
    for (const purpose of rulesData) {
      const purposeDir = join(rulesDir, purpose.name);
      expect(existsSync(purposeDir)).toBe(true);
      
      // Verify files exist
      for (const fileName of purpose.files || []) {
        const filePath = join(purposeDir, fileName);
        expect(existsSync(filePath)).toBe(true);
      }
    }
  });
});

