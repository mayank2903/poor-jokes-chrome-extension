#!/usr/bin/env node

/**
 * URL Validation Script
 * Ensures no old deployment URLs exist in the codebase
 * This prevents the HTTP 500 error from using old URLs
 */

const fs = require('fs');
const path = require('path');

// Old deployment URL patterns to check for
const OLD_URL_PATTERNS = [
  'ch7te6lzr-mayanks-projects-72f678fa',
  '6ewxclhxr-mayanks-projects-72f678fa',
  '6yax4u0s4-mayanks-projects-72f678fa',
  'kcr9acwtg-mayanks-projects-72f678fa',
  '5pk4sjl1w-mayanks-projects-72f678fa',
  '8wqpqlyzi-mayanks-projects-72f678fa',
  '7huqmp0n7-mayanks-projects-72f678fa',
  'h84vfdbd2-mayanks-projects-72f678fa'
];

// Files to exclude from validation
const EXCLUDE_PATTERNS = [
  'node_modules/',
  '.git/',
  'test-url-behavior.js', // This file intentionally tests old URLs
  'EXTENSION_UPDATE_GUIDE.md' // Documentation about old URLs
];

// Correct stable URL
const STABLE_URL = 'https://poor-jokes-newtab.vercel.app';

class URLValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.filesChecked = 0;
  }

  // Check if file should be excluded
  shouldExcludeFile(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
  }

  // Check file for old URLs
  checkFile(filePath) {
    if (this.shouldExcludeFile(filePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.filesChecked++;

      OLD_URL_PATTERNS.forEach(pattern => {
        if (content.includes(pattern)) {
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes(pattern)) {
              this.errors.push({
                file: filePath,
                line: index + 1,
                content: line.trim(),
                pattern: pattern
              });
            }
          });
        }
      });

      // Check for hardcoded vercel.app URLs that aren't the stable one
      const vercelUrlRegex = /https:\/\/poor-jokes-newtab-[a-z0-9]+-mayanks-projects-72f678fa\.vercel\.app/g;
      const matches = content.match(vercelUrlRegex);
      if (matches) {
        matches.forEach(match => {
          if (match !== STABLE_URL) {
            this.warnings.push({
              file: filePath,
              type: 'hardcoded_vercel_url',
              url: match,
              suggestion: `Replace with ${STABLE_URL}`
            });
          }
        });
      }

    } catch (error) {
      console.warn(`⚠️  Could not read file ${filePath}: ${error.message}`);
    }
  }

  // Recursively check directory
  checkDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.checkDirectory(fullPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.json') || item.endsWith('.html') || item.endsWith('.md'))) {
        this.checkFile(fullPath);
      }
    });
  }

  // Generate report
  generateReport() {
    console.log('🔍 URL Validation Report');
    console.log('=' .repeat(50));
    console.log(`📁 Files checked: ${this.filesChecked}`);
    console.log(`❌ Errors found: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log('');

    if (this.errors.length > 0) {
      console.log('❌ ERRORS - Old deployment URLs found:');
      console.log('');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}:${error.line}`);
        console.log(`   Pattern: ${error.pattern}`);
        console.log(`   Content: ${error.content}`);
        console.log('');
      });
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS - Hardcoded Vercel URLs found:');
      console.log('');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.file}`);
        console.log(`   URL: ${warning.url}`);
        console.log(`   Suggestion: ${warning.suggestion}`);
        console.log('');
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All URLs are clean! No old deployment URLs found.');
    }

    return this.errors.length === 0;
  }

  // Run validation
  run() {
    console.log('🚀 Starting URL validation...');
    console.log(`🎯 Checking for old URL patterns: ${OLD_URL_PATTERNS.join(', ')}`);
    console.log(`✅ Stable URL: ${STABLE_URL}`);
    console.log('');

    this.checkDirectory('.');
    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new URLValidator();
  const success = validator.run();
  
  if (!success) {
    console.log('');
    console.log('💡 To fix these issues:');
    console.log('1. Replace old URLs with the stable URL');
    console.log('2. Run this script again to verify');
    console.log('3. Commit the changes');
    process.exit(1);
  } else {
    console.log('');
    console.log('🎉 URL validation passed! Ready for deployment.');
    process.exit(0);
  }
}

module.exports = URLValidator;
