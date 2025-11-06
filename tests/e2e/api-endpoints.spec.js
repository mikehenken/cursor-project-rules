import { test, expect } from '@playwright/test';

const FRAMEWORK_URL = process.env.FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev';

/**
 * API Endpoint Tests
 * Tests all API endpoints to ensure they return correct structure and data
 */
test.describe('API Endpoints', () => {
  
  test('GET /api/files - should return array of deployment files', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/files`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Verify response is an array
    expect(Array.isArray(data)).toBe(true);
    
    // Verify each file has required fields
    if (data.length > 0) {
      const file = data[0];
      expect(file).toHaveProperty('name');
      expect(file).toHaveProperty('path');
      expect(typeof file.name).toBe('string');
      expect(typeof file.path).toBe('string');
    }
    
    // Verify required files exist
    const fileNames = data.map(f => f.name);
    expect(fileNames).toContain('setup.sh');
    expect(fileNames).toContain('setup-wizard.js');
    expect(fileNames).toContain('mcp-server.js');
  });

  test('GET /api/rules - should return array of rule purposes', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/rules`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Verify response is an array
    expect(Array.isArray(data)).toBe(true);
    
    // Verify each purpose has required fields
    if (data.length > 0) {
      const purpose = data[0];
      expect(purpose).toHaveProperty('name');
      expect(purpose).toHaveProperty('files');
      expect(Array.isArray(purpose.files)).toBe(true);
      expect(typeof purpose.name).toBe('string');
    }
    
    // Verify required purposes exist
    const purposes = data.map(p => p.name);
    expect(purposes).toContain('core');
    expect(purposes).toContain('backend');
    expect(purposes).toContain('docs');
    expect(purposes).toContain('testing');
    expect(purposes).toContain('ci-cd');
  });

  test('GET /api/rules - should return all purposes including core', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/rules`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Should return array with multiple purposes
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Verify core purpose exists
    const corePurpose = data.find(p => p.name === 'core');
    expect(corePurpose).toBeTruthy();
    expect(Array.isArray(corePurpose.files)).toBe(true);
    expect(corePurpose.files.length).toBeGreaterThan(0);
  });

  test('GET /api/docs - should return array of documentation', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/docs`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Verify response is an array
    expect(Array.isArray(data)).toBe(true);
  });

  test('GET /files/setup.sh - should download setup script', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/files/setup.sh`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const content = await response.text();
    
    // Verify it's actually a bash script
    expect(content).toContain('#!/bin/bash');
    expect(content.length).toBeGreaterThan(100);
    
    // Verify it contains setup-related content
    expect(content.toLowerCase()).toMatch(/setup|wizard|framework/i);
  });

  test('GET /files/setup-wizard.js - should download setup wizard', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/files/setup-wizard.js`);
    
    expect(response.ok()).toBeTruthy();
    const content = await response.text();
    
    // Verify it's JavaScript
    expect(content).toContain('setup-wizard.js');
    expect(content).toContain('#!/usr/bin/env node');
    expect(content.length).toBeGreaterThan(1000);
  });

  test('GET /rules/core/workflow.mdc - should download rule file', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/rules/core/workflow.mdc`);
    
    expect(response.ok()).toBeTruthy();
    const content = await response.text();
    
    // Verify it's a rule file with frontmatter
    expect(content).toContain('---');
    expect(content.length).toBeGreaterThan(100);
  });

  test('GET /api/pull?type=deployment - should return deployment files', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/pull?type=deployment`);
    
    // Pull endpoint might not be implemented, check for either success or 404
    if (response.ok()) {
      const data = await response.json();
      // Should return object (structure varies by implementation)
      expect(typeof data).toBe('object');
      expect(data).not.toBe(null);
    } else {
      // If not implemented, that's OK for now
      expect([404, 400]).toContain(response.status());
    }
  });

  test('GET /api/pull?type=rules - should return rules files', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/pull?type=rules`);
    
    if (response.ok()) {
      const data = await response.json();
      expect(typeof data).toBe('object');
      expect(data).not.toBe(null);
    } else {
      expect([404, 400]).toContain(response.status());
    }
  });

  test('GET /api/pull?type=docs - should return documentation', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/pull?type=docs`);
    
    if (response.ok()) {
      const data = await response.json();
      expect(typeof data).toBe('object');
      expect(data).not.toBe(null);
    } else {
      expect([404, 400]).toContain(response.status());
    }
  });

  test('GET / - should return framework info', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('version');
    expect(typeof data.name).toBe('string');
    expect(data.name).toContain('Rules Framework');
  });

  test('404 - should handle invalid endpoints', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/invalid`);
    
    expect(response.status()).toBe(404);
  });

  test('404 - should handle invalid file paths', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/files/nonexistent.sh`);
    
    expect(response.status()).toBe(404);
  });
});

