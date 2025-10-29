#!/usr/bin/env node

/**
 * Push rules to git repository if user has appropriate access
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const COMMIT_MESSAGE = process.env.COMMIT_MESSAGE || 'Update rules from Rules Framework';
const BRANCH = process.env.BRANCH;
const REMOTE = process.env.REMOTE || 'origin';

/**
 * Main function
 */
async function main() {
  console.log('📤 Pushing Rules to Git');
  console.log('=======================\n');

  const projectPath = process.cwd();
  
  // Check if git is initialized
  if (!existsSync(join(projectPath, '.git'))) {
    console.error('❌ Git repository not initialized');
    process.exit(1);
  }

  try {
    // Check git status
    const statusOutput = execSync('git status --porcelain', { 
      cwd: projectPath, 
      encoding: 'utf8' 
    });

    if (!statusOutput.trim()) {
      console.log('ℹ️  No changes to commit');
      return;
    }

    // Check if rules directory has changes
    const rulesChanges = statusOutput.split('\n').filter(line => 
      line.trim().startsWith('.cursor/rules/')
    );

    if (rulesChanges.length === 0) {
      console.log('ℹ️  No rule changes detected');
      return;
    }

    console.log(`📋 Found ${rulesChanges.length} rule file(s) with changes`);

    // Check git write access
    try {
      console.log('🔍 Checking git access...');
      execSync('git fetch', { 
        cwd: projectPath, 
        stdio: 'pipe',
        timeout: 5000
      });
    } catch (error) {
      console.error('❌ No git write access or remote not configured');
      console.error('   Error:', error.message);
      process.exit(1);
    }

    // Stage rule changes
    console.log('📦 Staging rule changes...');
    execSync('git add .cursor/rules/', { 
      cwd: projectPath, 
      stdio: 'pipe' 
    });

    // Commit
    console.log('💾 Committing changes...');
    execSync(`git commit -m "${COMMIT_MESSAGE}"`, { 
      cwd: projectPath, 
      stdio: 'pipe' 
    });

    // Get current branch if not specified
    const currentBranch = BRANCH || execSync('git rev-parse --abbrev-ref HEAD', { 
      cwd: projectPath, 
      encoding: 'utf8' 
    }).trim();

    // Push
    console.log(`📤 Pushing to ${REMOTE}/${currentBranch}...`);
    try {
      execSync(`git push ${REMOTE} ${currentBranch}`, { 
        cwd: projectPath, 
        stdio: 'pipe' 
      });

      console.log(`\n✅ Successfully pushed rules to ${REMOTE}/${currentBranch}`);
      console.log(`📊 Files changed: ${rulesChanges.length}`);
    } catch (error) {
      console.error(`❌ Failed to push to git: ${error.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Git operation failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);

