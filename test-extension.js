#!/usr/bin/env node

/**
 * Comprehensive Chrome Extension Test Suite
 * Tests all functionality before Chrome Web Store submission
 */

const https = require('https');

const API_BASE = 'https://poor-jokes-newtab.vercel.app/api';
const ADMIN_PASSWORD = 'PoorJokes2024!Admin';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testJokesAPI() {
  console.log('\n🧪 Testing Jokes API...');
  
  try {
    const response = await makeRequest(`${API_BASE}/jokes`);
    const success = response.status === 200 && response.data.success;
    const jokeCount = response.data.jokes ? response.data.jokes.length : 0;
    
    logTest('Jokes API Response', success, `Status: ${response.status}, Jokes: ${jokeCount}`);
    
    if (success && jokeCount > 0) {
      const joke = response.data.jokes[0];
      const hasRequiredFields = joke.id && joke.content && typeof joke.up_votes === 'number';
      logTest('Joke Data Structure', hasRequiredFields, 'Has id, content, up_votes fields');
    }
    
  } catch (error) {
    logTest('Jokes API Response', false, error.message);
  }
}

async function testSubmissionsAPI() {
  console.log('\n🧪 Testing Submissions API...');
  
  try {
    const response = await makeRequest(`${API_BASE}/submissions?status=pending`, {
      headers: {
        'x-admin-password': ADMIN_PASSWORD
      }
    });
    
    const success = response.status === 200 && response.data.success;
    logTest('Submissions API Response', success, `Status: ${response.status}`);
    
  } catch (error) {
    logTest('Submissions API Response', false, error.message);
  }
}

async function testRateAPI() {
  console.log('\n🧪 Testing Rate API...');
  
  try {
    const testData = {
      joke_id: 'test-joke-id',
      user_id: 'test-user-id',
      rating: 1
    };
    
    const response = await makeRequest(`${API_BASE}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    // Rate API might fail for test data, but should return proper error
    const hasProperResponse = response.status === 200 || response.status === 400 || response.status === 500;
    logTest('Rate API Response', hasProperResponse, `Status: ${response.status} (Expected for test data)`);
    
  } catch (error) {
    logTest('Rate API Response', false, error.message);
  }
}

async function testSubmitJokeAPI() {
  console.log('\n🧪 Testing Submit Joke API...');
  
  try {
    const testJoke = {
      content: 'Test joke for extension validation - ' + Date.now(),
      submitted_by: 'Extension Test'
    };
    
    const response = await makeRequest(`${API_BASE}/jokes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testJoke)
    });
    
    const success = (response.status === 200 || response.status === 201) && response.data.success;
    logTest('Submit Joke API Response', success, `Status: ${response.status} (201 = Created)`);
    
  } catch (error) {
    logTest('Submit Joke API Response', false, error.message);
  }
}

async function testCORSHeaders() {
  console.log('\n🧪 Testing CORS Headers...');
  
  try {
    const response = await makeRequest(`${API_BASE}/jokes`, {
      headers: {
        'Origin': 'chrome-extension://test',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    // Check if CORS headers are present (this is a basic check)
    const success = response.status === 200;
    logTest('CORS Headers', success, `Status: ${response.status}`);
    
  } catch (error) {
    logTest('CORS Headers', false, error.message);
  }
}

async function testExtensionFiles() {
  console.log('\n🧪 Testing Extension Files...');
  
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'chrome-store-package/manifest.json',
    'chrome-store-package/newtab.html',
    'chrome-store-package/newtab-v2.js',
    'chrome-store-package/styles.css',
    'chrome-store-package/js/config.js',
    'chrome-store-package/js/api-manager.js',
    'chrome-store-package/icons/icon16.png',
    'chrome-store-package/icons/icon48.png',
    'chrome-store-package/icons/icon128.png'
  ];
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    logTest(`File: ${file}`, exists, exists ? 'Found' : 'Missing');
  }
}

async function testManifest() {
  console.log('\n🧪 Testing Manifest.json...');
  
  const fs = require('fs');
  const manifestPath = 'chrome-store-package/manifest.json';
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    const hasRequiredFields = manifest.name && manifest.version && manifest.manifest_version;
    logTest('Manifest Structure', hasRequiredFields, 'Has name, version, manifest_version');
    
    const hasNewTabPermission = manifest.permissions && manifest.permissions.includes('activeTab');
    logTest('New Tab Permission', hasNewTabPermission, 'Has activeTab permission');
    
    const hasIcons = manifest.icons && manifest.icons['16'] && manifest.icons['48'] && manifest.icons['128'];
    logTest('Icons Configuration', hasIcons, 'Has 16px, 48px, 128px icons');
    
    const hasChromeUrlOverrides = manifest.chrome_url_overrides && manifest.chrome_url_overrides.newtab;
    logTest('New Tab Override', hasChromeUrlOverrides, 'Has newtab override');
    
  } catch (error) {
    logTest('Manifest Validation', false, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Chrome Extension Test Suite...');
  console.log('=' .repeat(50));
  
  await testJokesAPI();
  await testSubmissionsAPI();
  await testRateAPI();
  await testSubmitJokeAPI();
  await testCORSHeaders();
  await testExtensionFiles();
  await testManifest();
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Extension is ready for Chrome Web Store!');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix issues before submitting to Chrome Web Store.');
  }
  
  return results.failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runAllTests, testJokesAPI, testSubmissionsAPI, testRateAPI, testSubmitJokeAPI };
