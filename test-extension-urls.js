#!/usr/bin/env node

/**
 * Extension URL Test - Ensures Extension Never Uses Old Deployment URLs
 * This test prevents the issue where extensions use old deployment URLs
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

function checkFileForOldURLs(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern for old deployment URLs
    const oldURLPattern = /poor-jokes-newtab-[a-z0-9]+-mayanks-projects-72f678fa\.vercel\.app/g;
    const matches = content.match(oldURLPattern);
    
    if (matches) {
      logTest(`${description} - No Old URLs`, false, `Found old URLs: ${matches.join(', ')}`);
      return false;
    } else {
      logTest(`${description} - No Old URLs`, true, 'No old deployment URLs found');
      return true;
    }
    
  } catch (error) {
    logTest(`${description} - File Read`, false, `Error: ${error.message}`);
    return false;
  }
}

function checkFileForStableURL(filePath, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for stable URL (either /api or just the base URL)
    const hasStableURL = content.includes('https://poor-jokes-newtab.vercel.app/api') || 
                        content.includes('https://poor-jokes-newtab.vercel.app');
    logTest(`${description} - Has Stable URL`, hasStableURL, `File: ${filePath}`);
    
    return hasStableURL;
    
  } catch (error) {
    logTest(`${description} - File Read`, false, `Error: ${error.message}`);
    return false;
  }
}

function validateAPIManager() {
  console.log('\n🧪 Validating API Manager...');
  
  try {
    const apiManagerPath = 'chrome-store-package/js/api-manager.js';
    const content = fs.readFileSync(apiManagerPath, 'utf8');
    
    // Check getCurrentURL method uses stable URL
    const hasStableURLInMethod = content.includes("return 'https://poor-jokes-newtab.vercel.app/api';");
    logTest('API Manager - Uses Stable URL in getCurrentURL', hasStableURLInMethod, 'Method returns stable URL');
    
    // Check no old URLs in fallback array
    const fallbackMatch = content.match(/fallbackUrls.*?\[(.*?)\]/s);
    if (fallbackMatch) {
      const fallbackContent = fallbackMatch[1];
      const hasOldURLs = fallbackContent.includes('poor-jokes-newtab-') && fallbackContent.includes('mayanks-projects-72f678fa.vercel.app');
      logTest('API Manager - No Old URLs in Fallbacks', !hasOldURLs, 'Fallback array clean');
    }
    
    // Check no old URLs anywhere in file
    const noOldURLs = checkFileForOldURLs(apiManagerPath, 'API Manager');
    
    return hasStableURLInMethod && noOldURLs;
    
  } catch (error) {
    logTest('API Manager - Parse', false, `Error: ${error.message}`);
    return false;
  }
}

function validateConfig() {
  console.log('\n🧪 Validating Config...');
  
  try {
    const configPath = 'chrome-store-package/js/config.js';
    const content = fs.readFileSync(configPath, 'utf8');
    
    // Check production config uses stable URL
    const hasStableURLInConfig = content.includes("baseUrl: 'https://poor-jokes-newtab.vercel.app/api'");
    logTest('Config - Production Uses Stable URL', hasStableURLInConfig, 'Production config has stable URL');
    
    // Check no old URLs anywhere in file
    const noOldURLs = checkFileForOldURLs(configPath, 'Config');
    
    return hasStableURLInConfig && noOldURLs;
    
  } catch (error) {
    logTest('Config - Parse', false, `Error: ${error.message}`);
    return false;
  }
}

function validateManifest() {
  console.log('\n🧪 Validating Manifest...');
  
  try {
    const manifestPath = 'chrome-store-package/manifest.json';
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check host_permissions has stable URL
    const hasStableHostPermission = manifest.host_permissions && 
      manifest.host_permissions.some(url => url === 'https://poor-jokes-newtab.vercel.app/*');
    logTest('Manifest - Has Stable Host Permission', hasStableHostPermission, 'Stable URL in host_permissions');
    
    // Check no old URLs in host_permissions
    const hasOldHostPermissions = manifest.host_permissions && 
      manifest.host_permissions.some(url => url.includes('poor-jokes-newtab-') && url.includes('mayanks-projects-72f678fa.vercel.app'));
    logTest('Manifest - No Old Host Permissions', !hasOldHostPermissions, 'No old URLs in host_permissions');
    
    // Check homepage_url uses stable URL
    const hasStableHomepage = manifest.homepage_url === 'https://poor-jokes-newtab.vercel.app';
    logTest('Manifest - Stable Homepage URL', hasStableHomepage, `Homepage: ${manifest.homepage_url}`);
    
    return hasStableHostPermission && !hasOldHostPermissions && hasStableHomepage;
    
  } catch (error) {
    logTest('Manifest - Parse', false, `Error: ${error.message}`);
    return false;
  }
}

function validateAllFiles() {
  console.log('\n🧪 Validating All Extension Files...');
  
  // Files that MUST have stable URL
  const criticalFiles = [
    'chrome-store-package/js/config.js',
    'chrome-store-package/js/api-manager.js',
    'chrome-store-package/manifest.json'
  ];
  
  // Files that just need to be clean (no old URLs)
  const cleanFiles = [
    'chrome-store-package/js/api-client.js',
    'chrome-store-package/newtab-v2.js'
  ];
  
  let allValid = true;
  
  // Check critical files for stable URL
  for (const file of criticalFiles) {
    const hasStableURL = checkFileForStableURL(file, path.basename(file));
    const noOldURLs = checkFileForOldURLs(file, path.basename(file));
    allValid = allValid && hasStableURL && noOldURLs;
  }
  
  // Check clean files for no old URLs
  for (const file of cleanFiles) {
    const noOldURLs = checkFileForOldURLs(file, path.basename(file));
    allValid = allValid && noOldURLs;
  }
  
  return allValid;
}

function validateNoOldURLsInCode() {
  console.log('\n🧪 Validating No Old URLs in Code...');
  
  // Check for any references to old deployment URLs in the codebase
  const searchPatterns = [
    /poor-jokes-newtab-[a-z0-9]+-mayanks-projects-72f678fa\.vercel\.app/g,
    /https:\/\/poor-jokes-newtab-[a-z0-9]+-mayanks-projects-72f678fa\.vercel\.app/g,
    /mayanks-projects-72f678fa\.vercel\.app/g
  ];
  
  const filesToCheck = [
    'chrome-store-package/js/config.js',
    'chrome-store-package/js/api-manager.js',
    'chrome-store-package/js/api-client.js',
    'chrome-store-package/newtab-v2.js',
    'chrome-store-package/manifest.json'
  ];
  
  let allClean = true;
  
  for (const file of filesToCheck) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      for (const pattern of searchPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          logTest(`No Old URLs - ${path.basename(file)}`, false, `Found: ${matches.join(', ')}`);
          allClean = false;
        }
      }
      
      if (allClean) {
        logTest(`No Old URLs - ${path.basename(file)}`, true, 'Clean');
      }
      
    } catch (error) {
      logTest(`No Old URLs - ${path.basename(file)}`, false, `Error: ${error.message}`);
      allClean = false;
    }
  }
  
  return allClean;
}

function validateStableURLUsage() {
  console.log('\n🧪 Validating Stable URL Usage...');
  
  // Only check critical files that MUST have stable URL
  const criticalFiles = [
    'chrome-store-package/js/config.js',
    'chrome-store-package/js/api-manager.js',
    'chrome-store-package/manifest.json'
  ];
  
  let allUseStable = true;
  
  for (const file of criticalFiles) {
    const usesStable = checkFileForStableURL(file, path.basename(file));
    allUseStable = allUseStable && usesStable;
  }
  
  return allUseStable;
}

async function runExtensionURLTests() {
  console.log('🚀 Starting Extension URL Validation Tests...');
  console.log('=' .repeat(60));
  console.log('🎯 Goal: Ensure extension NEVER uses old deployment URLs');
  console.log('=' .repeat(60));
  
  const apiManagerValid = validateAPIManager();
  const configValid = validateConfig();
  const manifestValid = validateManifest();
  const allFilesValid = validateAllFiles();
  const noOldURLs = validateNoOldURLsInCode();
  const stableURLUsage = validateStableURLUsage();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Extension URL Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  const allValid = apiManagerValid && configValid && manifestValid && allFilesValid && noOldURLs && stableURLUsage;
  
  if (allValid) {
    console.log('\n🎉 All URL validation tests passed!');
    console.log('✅ Extension will NEVER use old deployment URLs');
    console.log('✅ Only stable production URL will be used');
    console.log('✅ This issue is prevented from happening again');
  } else {
    console.log('\n⚠️  URL validation failed!');
    console.log('❌ Extension may use old deployment URLs');
    console.log('🔧 Fix the issues above before deploying');
    console.log('\n💡 Common fixes:');
    console.log('- Remove old URLs from manifest.json host_permissions');
    console.log('- Update API Manager to only use stable URL');
    console.log('- Ensure config files use stable URL only');
  }
  
  return allValid;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runExtensionURLTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runExtensionURLTests };
