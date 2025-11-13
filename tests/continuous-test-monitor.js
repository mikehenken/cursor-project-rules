#!/usr/bin/env node

/**
 * Continuous Test Monitor
 * Runs all tests in a loop to ensure continuous quality
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILURES = 3; // Alert after 3 consecutive failures

let consecutiveFailures = 0;
let totalRuns = 0;
let totalPasses = 0;
let totalFailures = 0;

function runTests() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Test Run #${++totalRuns} - ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  try {
    // Run all tests
    console.log('Running test suite...');
    execSync('npm run test:all', {
      cwd: projectRoot,
      stdio: 'inherit',
      timeout: 10 * 60 * 1000, // 10 minute timeout
    });
    
    // Tests passed
    consecutiveFailures = 0;
    totalPasses++;
    console.log(`\n✅ Test run #${totalRuns} PASSED`);
    console.log(`📊 Total: ${totalPasses} passed, ${totalFailures} failed\n`);
    
    return true;
  } catch (error) {
    consecutiveFailures++;
    totalFailures++;
    console.error(`\n❌ Test run #${totalRuns} FAILED (consecutive: ${consecutiveFailures})`);
    console.error(`📊 Total: ${totalPasses} passed, ${totalFailures} failed\n`);
    
    if (consecutiveFailures >= MAX_FAILURES) {
      console.error(`\n🚨 ALERT: ${MAX_FAILURES} consecutive failures!`);
      console.error('   Please investigate immediately.\n');
    }
    
    return false;
  }
}

function startMonitoring() {
  console.log('🚀 Starting Continuous Test Monitor');
  console.log(`📋 Running tests every ${INTERVAL_MS / 1000 / 60} minutes`);
  console.log(`⚠️  Alert after ${MAX_FAILURES} consecutive failures\n`);
  
  // Run immediately
  runTests();
  
  // Then run on interval
  setInterval(() => {
    runTests();
  }, INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping test monitor...');
  console.log(`📊 Final Stats: ${totalPasses} passed, ${totalFailures} failed`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Stopping test monitor...');
  console.log(`📊 Final Stats: ${totalPasses} passed, ${totalFailures} failed`);
  process.exit(0);
});

startMonitoring();


