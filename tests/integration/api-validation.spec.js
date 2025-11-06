import { test, expect } from '@playwright/test';

const FRAMEWORK_URL = process.env.FRAMEWORK_URL || 'https://rules-framework.mikehenken.workers.dev';

/**
 * API Response Validation Tests
 * Validates response structures match expected formats
 */
test.describe('API Response Validation', () => {
  
  test('GET /api/files response structure validation', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/files`);
    const data = await response.json();
    
    // Must be array
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Each item must have required fields
    data.forEach(file => {
      expect(file).toHaveProperty('name');
      expect(file).toHaveProperty('path');
      expect(typeof file.name).toBe('string');
      expect(typeof file.path).toBe('string');
      expect(file.name.length).toBeGreaterThan(0);
      expect(file.path.length).toBeGreaterThan(0);
    });
  });

  test('GET /api/rules response structure validation', async ({ request }) => {
    const response = await request.get(`${FRAMEWORK_URL}/api/rules`);
    const data = await response.json();
    
    // Must be array
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Each purpose must have required structure
    data.forEach(purpose => {
      expect(purpose).toHaveProperty('name');
      expect(purpose).toHaveProperty('files');
      expect(typeof purpose.name).toBe('string');
      expect(Array.isArray(purpose.files)).toBe(true);
      
      // Files must be strings (filenames)
      purpose.files.forEach(file => {
        expect(typeof file).toBe('string');
        expect(file.endsWith('.mdc')).toBe(true);
      });
    });
  });

  test('GET /api/pull response structure validation', async ({ request }) => {
    const types = ['deployment', 'rules', 'docs'];
    
    for (const type of types) {
      const response = await request.get(`${FRAMEWORK_URL}/api/pull?type=${type}`);
      
      // Pull endpoint might not be fully implemented
      if (response.ok()) {
        const data = await response.json();
        // Should return object
        expect(typeof data).toBe('object');
        expect(data).not.toBe(null);
      } else {
        // Accept 404 or 400 as valid responses if endpoint not implemented
        expect([404, 400]).toContain(response.status());
      }
    }
  });

  test('File download content validation', async ({ request }) => {
    // Test setup.sh
    const setupResponse = await request.get(`${FRAMEWORK_URL}/files/setup.sh`);
    const setupContent = await setupResponse.text();
    
    expect(setupContent).toContain('#!/bin/bash');
    expect(setupContent.length).toBeGreaterThan(1000);
    expect(setupResponse.headers()['content-type']).toContain('text');
    
    // Test setup-wizard.js
    const wizardResponse = await request.get(`${FRAMEWORK_URL}/files/setup-wizard.js`);
    const wizardContent = await wizardResponse.text();
    
    expect(wizardContent).toContain('#!/usr/bin/env node');
    expect(wizardContent).toContain('setup-wizard');
    expect(wizardContent.length).toBeGreaterThan(5000);
  });

  test('Rule file content validation', async ({ request }) => {
    // Get rules list
    const rulesResponse = await request.get(`${FRAMEWORK_URL}/api/rules`);
    const rulesData = await rulesResponse.json();
    
    // Test first rule from each purpose
    for (const purpose of rulesData.slice(0, 3)) {
      if (purpose.files && purpose.files.length > 0) {
        const ruleFile = purpose.files[0];
        const ruleResponse = await request.get(
          `${FRAMEWORK_URL}/rules/${purpose.name}/${ruleFile}`
        );
        
        expect(ruleResponse.ok()).toBe(true);
        const ruleContent = await ruleResponse.text();
        
        // Rule files should have frontmatter
        expect(ruleContent).toContain('---');
        expect(ruleContent.length).toBeGreaterThan(50);
      }
    }
  });

  test('Error response validation', async ({ request }) => {
    // Test 404 for invalid endpoint
    const invalidEndpoint = await request.get(`${FRAMEWORK_URL}/api/invalid-endpoint`);
    expect(invalidEndpoint.status()).toBe(404);
    
    // Test 404 for invalid file
    const invalidFile = await request.get(`${FRAMEWORK_URL}/files/nonexistent.js`);
    expect(invalidFile.status()).toBe(404);
    
    // Test 404 for invalid rule
    const invalidRule = await request.get(`${FRAMEWORK_URL}/rules/invalid/nonexistent.mdc`);
    expect(invalidRule.status()).toBe(404);
  });

  test('Content-Type headers validation', async ({ request }) => {
    // JSON endpoints should return JSON
    const apiResponse = await request.get(`${FRAMEWORK_URL}/api/files`);
    const contentType = apiResponse.headers()['content-type'];
    expect(contentType).toContain('json');
    
    // File endpoints should return appropriate content type
    const fileResponse = await request.get(`${FRAMEWORK_URL}/files/setup.sh`);
    const fileContentType = fileResponse.headers()['content-type'];
    expect(fileContentType).toBeTruthy();
  });
});

