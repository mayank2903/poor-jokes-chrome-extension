#!/usr/bin/env node

/**
 * Integration Test Suite - Tests Actual Extension Behavior
 * This tests the real APIManager and extension logic, not just hardcoded URLs
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment for Node.js testing
global.window = {
  location: { hostname: 'localhost' },
  APIConfig: {
    currentEnv: 'production',
    getBaseURL: () => 'https://poor-jokes-newtab.vercel.app/api',
    getVersion: () => '1.0.0'
  }
};

global.fetch = require('node-fetch');

// Load the actual extension files
const apiManagerCode = fs.readFileSync('chrome-store-package/js/api-manager.js', 'utf8');
const configCode = fs.readFileSync('chrome-store-package/js/config.js', 'utf8');

// Execute the code to create the classes
eval(configCode);
eval(apiManagerCode);

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

async function testAPIManagerURL() {
  console.log('\n🧪 Testing APIManager URL Selection...');
  
  try {
    const apiManager = new APIManager();
    const currentURL = apiManager.getCurrentURL();
    
    const isStableURL = currentURL === 'https://poor-jokes-newtab.vercel.app/api';
    logTest('APIManager Uses Stable URL', isStableURL, `Got: ${currentURL}`);
    
    const hasOnlyOneFallback = apiManager.fallbackUrls.length === 1;
    logTest('Single Fallback URL', hasOnlyOneFallback, `Count: ${apiManager.fallbackUrls.length}`);
    
    const fallbackIsStable = apiManager.fallbackUrls[0] === 'https://poor-jokes-newtab.vercel.app/api';
    logTest('Fallback is Stable URL', fallbackIsStable, `Fallback: ${apiManager.fallbackUrls[0]}`);
    
  } catch (error) {
    logTest('APIManager URL Selection', false, error.message);
  }
}

async function testAPIManagerRequest() {
  console.log('\n🧪 Testing APIManager Request Method...');
  
  try {
    const apiManager = new APIManager();
    
    // Test that it uses the correct URL
    const response = await apiManager.request('/jokes');
    
    const isSuccess = response && response.success;
    logTest('APIManager Request Success', isSuccess, `Response: ${isSuccess ? 'Success' : 'Failed'}`);
    
    if (isSuccess) {
      const hasJokes = response.jokes && Array.isArray(response.jokes);
      logTest('APIManager Returns Jokes', hasJokes, `Jokes count: ${response.jokes ? response.jokes.length : 0}`);
    }
    
  } catch (error) {
    logTest('APIManager Request', false, error.message);
  }
}

async function testRateAPICall() {
  console.log('\n🧪 Testing Rate API Call...');
  
  try {
    const apiManager = new APIManager();
    
    // Test with a real joke ID from the API
    const jokesResponse = await apiManager.request('/jokes');
    if (jokesResponse.success && jokesResponse.jokes.length > 0) {
      const realJokeId = jokesResponse.jokes[0].id;
      
      const rateResponse = await apiManager.request('/rate', {
        method: 'POST',
        body: JSON.stringify({
          joke_id: realJokeId,
          user_id: 'test-user-' + Date.now(),
          rating: 1
        })
      });
      
      // Rate API should work with real joke ID
      const isSuccess = rateResponse && rateResponse.success;
      logTest('Rate API with Real Joke ID', isSuccess, `Response: ${isSuccess ? 'Success' : 'Failed'}`);
      
    } else {
      logTest('Rate API with Real Joke ID', false, 'Could not get real joke ID');
    }
    
  } catch (error) {
    logTest('Rate API with Real Joke ID', false, error.message);
  }
}

async function testNoFallbackBehavior() {
  console.log('\n🧪 Testing No Fallback Behavior...');
  
  try {
    const apiManager = new APIManager();
    
    // Check that it doesn't try multiple URLs
    const originalFetch = global.fetch;
    let requestCount = 0;
    
    global.fetch = async (url, options) => {
      requestCount++;
      console.log(`  📡 Request ${requestCount}: ${url}`);
      return originalFetch(url, options);
    };
    
    await apiManager.request('/jokes');
    
    const onlyOneRequest = requestCount === 1;
    logTest('Single Request Made', onlyOneRequest, `Request count: ${requestCount}`);
    
    // Restore original fetch
    global.fetch = originalFetch;
    
  } catch (error) {
    logTest('No Fallback Behavior', false, error.message);
  }
}

async function testExtensionConfig() {
  console.log('\n🧪 Testing Extension Configuration...');
  
  try {
    const config = new APIConfig();
    const baseURL = config.getBaseURL();
    
    const isStableURL = baseURL === 'https://poor-jokes-newtab.vercel.app/api';
    logTest('Config Uses Stable URL', isStableURL, `Got: ${baseURL}`);
    
    const isProduction = config.currentEnv === 'production';
    logTest('Config is Production', isProduction, `Environment: ${config.currentEnv}`);
    
  } catch (error) {
    logTest('Extension Configuration', false, error.message);
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Extension Integration Tests...');
  console.log('=' .repeat(60));
  
  await testAPIManagerURL();
  await testAPIManagerRequest();
  await testRateAPICall();
  await testNoFallbackBehavior();
  await testExtensionConfig();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Integration Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All integration tests passed! Extension behavior is correct!');
  } else {
    console.log('\n⚠️  Some integration tests failed. Extension behavior needs fixing.');
  }
  
  return results.failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runIntegrationTests };
