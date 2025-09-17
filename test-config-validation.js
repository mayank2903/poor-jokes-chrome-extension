#!/usr/bin/env node

/**
 * Configuration Validation Test
 * Ensures all config files use stable URLs and no old deployment URLs
 */

const fs = require('fs');
const path = require('path');

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

function checkFileForStableURL(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for stable URL (either direct or through config reference)
    const hasStableURL = content.includes('https://poor-jokes-newtab.vercel.app/api') || 
                        content.includes('poor-jokes-newtab.vercel.app') ||
                        content.includes('APIConfig') ||
                        content.includes('getBaseURL');
    logTest(`${description} - Has Stable URL`, hasStableURL, `File: ${filePath}`);
    
    // Check for old deployment URLs (should not have them)
    const hasOldURLs = content.includes('poor-jokes-newtab-') && content.includes('mayanks-projects-72f678fa.vercel.app');
    logTest(`${description} - No Old URLs`, !hasOldURLs, `File: ${filePath}`);
    
    return hasStableURL && !hasOldURLs;
    
  } catch (error) {
    logTest(`${description} - File Read`, false, `Error: ${error.message}`);
    return false;
  }
}

function validateManifest() {
  console.log('\n🧪 Validating Manifest.json...');
  
  try {
    const manifestPath = 'chrome-store-package/manifest.json';
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check required fields
    const hasRequiredFields = manifest.name && manifest.version && manifest.manifest_version;
    logTest('Manifest - Required Fields', hasRequiredFields, 'Has name, version, manifest_version');
    
    // Check version
    const correctVersion = manifest.version === '1.0.1';
    logTest('Manifest - Correct Version', correctVersion, `Version: ${manifest.version}`);
    
    // Check permissions
    const hasNewTabOverride = manifest.chrome_url_overrides && manifest.chrome_url_overrides.newtab;
    logTest('Manifest - Has New Tab Override', hasNewTabOverride, 'Has newtab override configured');
    
    // Check host permissions (not required for new tab extensions)
    const hasHostPermissions = !manifest.host_permissions || manifest.host_permissions.length === 0;
    logTest('Manifest - No Host Permissions', hasHostPermissions, 'No host permissions needed for new tab extension');
    
    // Check for old URLs in host permissions
    const hasOldHostURLs = manifest.host_permissions && 
      manifest.host_permissions.some(url => url.includes('poor-jokes-newtab-') && url.includes('mayanks-projects-72f678fa.vercel.app'));
    logTest('Manifest - No Old Host URLs', !hasOldHostURLs, 'No old deployment URLs in host_permissions');
    
    return hasRequiredFields && correctVersion && hasNewTabOverride && hasHostPermissions && !hasOldHostURLs;
    
  } catch (error) {
    logTest('Manifest - Parse', false, `Error: ${error.message}`);
    return false;
  }
}

function validateConfigFiles() {
  console.log('\n🧪 Validating Configuration Files...');
  
  const configFiles = [
    { path: 'chrome-store-package/js/config.js', name: 'Chrome Store Config' },
    { path: 'chrome-store-package/js/api-manager.js', name: 'API Manager' },
    { path: 'config/api-config.js', name: 'Main Config' }
  ];
  
  let allValid = true;
  
  for (const file of configFiles) {
    const isValid = checkFileForStableURL(file.path, file.name);
    allValid = allValid && isValid;
  }
  
  return allValid;
}

function validateExtensionFiles() {
  console.log('\n🧪 Validating Extension Files...');
  
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
  
  let allPresent = true;
  
  for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    logTest(`File Exists - ${file}`, exists, exists ? 'Found' : 'Missing');
    allPresent = allPresent && exists;
  }
  
  return allPresent;
}

function validateNoOldURLs() {
  console.log('\n🧪 Validating No Old URLs...');
  
  const filesToCheck = [
    'chrome-store-package/js/config.js',
    'chrome-store-package/js/api-manager.js',
    'config/api-config.js',
    'chrome-store-package/manifest.json'
  ];
  
  let noOldURLs = true;
  
  for (const file of filesToCheck) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Look for old deployment URL pattern
      const oldURLPattern = /poor-jokes-newtab-[a-z0-9]+-mayanks-projects-72f678fa\.vercel\.app/g;
      const matches = content.match(oldURLPattern);
      
      if (matches) {
        logTest(`No Old URLs - ${file}`, false, `Found old URLs: ${matches.join(', ')}`);
        noOldURLs = false;
      } else {
        logTest(`No Old URLs - ${file}`, true, 'No old deployment URLs found');
      }
      
    } catch (error) {
      logTest(`No Old URLs - ${file}`, false, `Error: ${error.message}`);
      noOldURLs = false;
    }
  }
  
  return noOldURLs;
}

async function runConfigValidation() {
  console.log('🚀 Starting Configuration Validation...');
  console.log('=' .repeat(60));
  
  const manifestValid = validateManifest();
  const configValid = validateConfigFiles();
  const filesValid = validateExtensionFiles();
  const noOldURLs = validateNoOldURLs();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Configuration Validation Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  const allValid = manifestValid && configValid && filesValid && noOldURLs;
  
  if (allValid) {
    console.log('\n🎉 All configuration validation passed! Ready for deployment!');
  } else {
    console.log('\n⚠️  Configuration validation failed. Fix issues before deploying.');
    console.log('\n🔧 Common fixes:');
    console.log('- Update all URLs to use stable production URL');
    console.log('- Remove old deployment URLs from config files');
    console.log('- Ensure manifest.json has correct version and permissions');
  }
  
  return allValid;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runConfigValidation().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runConfigValidation };
