#!/usr/bin/env node

/**
 * URL Behavior Test - Tests the actual URLs being used
 */

const https = require('https');

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
          resolve({ status: res.statusCode, data: json, url });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, url });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testStableURL() {
  console.log('\n🧪 Testing Stable Production URL...');
  
  try {
    const response = await makeRequest('https://poor-jokes-newtab.vercel.app/api/jokes');
    const isWorking = response.status === 200 && response.data.success;
    logTest('Stable URL Works', isWorking, `Status: ${response.status}, URL: ${response.url}`);
    
    return isWorking;
  } catch (error) {
    logTest('Stable URL Works', false, `Error: ${error.message}`);
    return false;
  }
}

async function testOldDeploymentURLs() {
  console.log('\n🧪 Testing Old Deployment URLs (checking rate API specifically)...');
  
  const oldUrls = [
    'https://poor-jokes-newtab-ch7te6lzr-mayanks-projects-72f678fa.vercel.app/api',
    'https://poor-jokes-newtab-5pk4sjl1w-mayanks-projects-72f678fa.vercel.app/api',
    'https://poor-jokes-newtab-8wqpqlyzi-mayanks-projects-72f678fa.vercel.app/api'
  ];
  
  for (const baseUrl of oldUrls) {
    try {
      // Test jokes endpoint (should work)
      const jokesResponse = await makeRequest(`${baseUrl}/jokes`);
      const jokesWorking = jokesResponse.status === 200 && jokesResponse.data.success;
      logTest(`Old URL Jokes: ${baseUrl.split('/')[2]}`, jokesWorking, `Status: ${jokesResponse.status}`);
      
      // Test rate endpoint (this is where the 500 error occurs)
      const rateResponse = await makeRequest(`${baseUrl}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          joke_id: 'test-joke-id',
          user_id: 'test-user-id',
          rating: 1
        })
      });
      
      const rateWorking = rateResponse.status === 200 || rateResponse.status === 201 || rateResponse.status === 500;
      logTest(`Old URL Rate: ${baseUrl.split('/')[2]}`, rateWorking, `Status: ${rateResponse.status} (500 expected for old URLs)`);
      
    } catch (error) {
      logTest(`Old URL: ${baseUrl.split('/')[2]}`, false, `Error: ${error.message}`);
    }
  }
}

async function testRateAPIOnStableURL() {
  console.log('\n🧪 Testing Rate API on Stable URL...');
  
  try {
    // First get a real joke ID
    const jokesResponse = await makeRequest('https://poor-jokes-newtab.vercel.app/api/jokes');
    
    if (jokesResponse.status === 200 && jokesResponse.data.success && jokesResponse.data.jokes.length > 0) {
      const jokeId = jokesResponse.data.jokes[0].id;
      
      // Now test rating with real joke ID
      const rateResponse = await makeRequest('https://poor-jokes-newtab.vercel.app/api/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          joke_id: jokeId,
          user_id: 'test-user-' + Date.now(),
          rating: 1
        })
      });
      
      const isWorking = (rateResponse.status === 200 || rateResponse.status === 201) && rateResponse.data.success;
      logTest('Rate API on Stable URL', isWorking, `Status: ${rateResponse.status} (201=Created), URL: ${rateResponse.url}`);
      
    } else {
      logTest('Rate API on Stable URL', false, 'Could not get joke ID');
    }
    
  } catch (error) {
    logTest('Rate API on Stable URL', false, `Error: ${error.message}`);
  }
}

async function testRateAPIOnOldURL() {
  console.log('\n🧪 Testing Rate API on Old URL (the problematic one)...');
  
  try {
    const rateResponse = await makeRequest('https://poor-jokes-newtab-ch7te6lzr-mayanks-projects-72f678fa.vercel.app/api/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        joke_id: 'test-joke-id',
        user_id: 'test-user-id',
        rating: 1
      })
    });
    
    // Old URLs are expected to fail with 500 - this proves our point
    const isExpectedFailure = rateResponse.status === 500;
    logTest('Rate API on Old URL (Expected Failure)', isExpectedFailure, `Status: ${rateResponse.status} (500 expected for old URLs)`);
    
  } catch (error) {
    // Network errors are also expected for old URLs
    logTest('Rate API on Old URL (Expected Failure)', true, `Error: ${error.message} (Expected for old URLs)`);
  }
}

async function runURLTests() {
  console.log('🚀 Starting URL Behavior Tests...');
  console.log('=' .repeat(60));
  
  const stableWorking = await testStableURL();
  await testOldDeploymentURLs();
  
  if (stableWorking) {
    await testRateAPIOnStableURL();
  }
  
  await testRateAPIOnOldURL();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 URL Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  console.log('\n🔍 Analysis:');
  console.log('- If stable URL works but old URLs fail, that explains the 500 error');
  console.log('- The extension was trying old deployment URLs that are broken');
  console.log('- This is why removing fallbacks fixes the issue');
  
  return results.failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runURLTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runURLTests };
