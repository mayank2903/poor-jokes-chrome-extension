#!/usr/bin/env node

/**
 * Deployment Script with Integration Tests
 * Runs all tests before deploying to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting deployment with integration tests...\n');

async function runTests() {
  console.log('🧪 Running integration tests...');
  
  try {
    // Run URL behavior tests
    console.log('  📡 Testing URL behavior...');
    execSync('node test-url-behavior.js', { stdio: 'inherit' });
    
    // Run extension tests
    console.log('  🔧 Testing extension...');
    execSync('node test-extension.js', { stdio: 'inherit' });
    
    // Run config validation
    console.log('  ⚙️  Validating configuration...');
    execSync('node test-config-validation.js', { stdio: 'inherit' });
    
    console.log('✅ All tests passed!\n');
    return true;
    
  } catch (error) {
    console.error('❌ Tests failed:', error.message);
    console.log('\n💡 Fix the issues above before deploying.');
    return false;
  }
}

async function deploy() {
  console.log('🚀 Deploying to Vercel...');
  
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Deployment successful!');
    return true;
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return false;
  }
}

async function testPostDeployment() {
  console.log('🧪 Testing post-deployment...');
  
  try {
    // Wait a bit for deployment to be ready
    console.log('  ⏳ Waiting for deployment to be ready...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test the deployed API
    console.log('  📡 Testing deployed API...');
    execSync('curl -f "https://poor-jokes-newtab.vercel.app/api/jokes"', { stdio: 'inherit' });
    
    console.log('✅ Post-deployment test passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Post-deployment test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('=' .repeat(60));
  console.log('🎭 Poor Jokes New Tab - Deployment Pipeline');
  console.log('=' .repeat(60));
  
  // Step 1: Run tests
  const testsPassed = await runTests();
  if (!testsPassed) {
    console.log('\n❌ Deployment aborted due to test failures.');
    process.exit(1);
  }
  
  // Step 2: Deploy
  const deploySuccess = await deploy();
  if (!deploySuccess) {
    console.log('\n❌ Deployment failed.');
    process.exit(1);
  }
  
  // Step 3: Test post-deployment
  const postDeploySuccess = await testPostDeployment();
  if (!postDeploySuccess) {
    console.log('\n⚠️  Deployment completed but post-deployment tests failed.');
    console.log('💡 Check the deployed application manually.');
  }
  
  console.log('\n🎉 Deployment pipeline completed successfully!');
  console.log('🌐 Your app is live at: https://poor-jokes-newtab.vercel.app');
}

// Run the deployment pipeline
main().catch(error => {
  console.error('💥 Deployment pipeline failed:', error);
  process.exit(1);
});
