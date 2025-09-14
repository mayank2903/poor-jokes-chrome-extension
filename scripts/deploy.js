#!/usr/bin/env node
// Deployment script with version management and cache busting

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
  constructor() {
    this.version = this.getVersion();
    this.timestamp = new Date().toISOString();
    this.deploymentId = this.generateDeploymentId();
  }

  getVersion() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  }

  generateDeploymentId() {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update version in config files
  updateVersionInConfigs() {
    console.log('📝 Updating version in config files...');
    
    // Update config.js with new version
    const configPath = 'js/config.js';
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update version numbers
    configContent = configContent.replace(
      /version: '[\d.]+'/g,
      `version: '${this.version}'`
    );
    
    // Add deployment info
    configContent += `\n\n// Deployment Info\nwindow.DEPLOYMENT_INFO = {\n  version: '${this.version}',\n  timestamp: '${this.timestamp}',\n  deploymentId: '${this.deploymentId}'\n};\n`;
    
    fs.writeFileSync(configPath, configContent);
    console.log(`✅ Updated ${configPath} with version ${this.version}`);
  }

  // Clear caches
  clearCaches() {
    console.log('🧹 Clearing caches...');
    
    // Remove Vercel cache
    if (fs.existsSync('.vercel')) {
      execSync('rm -rf .vercel', { stdio: 'inherit' });
      console.log('✅ Cleared Vercel cache');
    }
    
    // Clear node_modules cache if exists
    if (fs.existsSync('node_modules/.cache')) {
      execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
      console.log('✅ Cleared node_modules cache');
    }
  }

  // Deploy to Vercel
  deploy() {
    console.log('🚀 Deploying to Vercel...');
    
    try {
      const output = execSync('vercel --prod --yes', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Extract deployment URL
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        const deploymentUrl = urlMatch[0];
        console.log(`✅ Deployed successfully: ${deploymentUrl}`);
        return deploymentUrl;
      } else {
        throw new Error('Could not extract deployment URL');
      }
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  // Update API URLs in config
  updateAPIUrls(deploymentUrl) {
    console.log('🔗 Updating API URLs...');
    
    const apiUrl = `${deploymentUrl}/api`;
    
    // Update config.js
    const configPath = 'js/config.js';
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update production URL
    configContent = configContent.replace(
      /baseUrl: 'https:\/\/[^']+'/,
      `baseUrl: '${apiUrl}'`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log(`✅ Updated API URL to: ${apiUrl}`);
  }

  // Run health checks
  async runHealthChecks(deploymentUrl) {
    console.log('🏥 Running health checks...');
    
    const apiUrl = `${deploymentUrl}/api`;
    const endpoints = ['/jokes', '/submissions?status=pending'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${apiUrl}${endpoint}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log(`✅ Health check passed: ${endpoint}`);
        } else {
          throw new Error(`Health check failed: ${endpoint}`);
        }
      } catch (error) {
        console.error(`❌ Health check failed: ${endpoint} - ${error.message}`);
        throw error;
      }
    }
    
    console.log('✅ All health checks passed');
  }

  // Main deployment process
  async deployWithVersionManagement() {
    console.log(`🚀 Starting deployment v${this.version}...`);
    console.log(`📅 Timestamp: ${this.timestamp}`);
    console.log(`🆔 Deployment ID: ${this.deploymentId}`);
    
    try {
      // Step 1: Update version in configs
      this.updateVersionInConfigs();
      
      // Step 2: Clear caches
      this.clearCaches();
      
      // Step 3: Deploy
      const deploymentUrl = this.deploy();
      
      // Step 4: Update API URLs
      this.updateAPIUrls(deploymentUrl);
      
      // Step 5: Run health checks
      await this.runHealthChecks(deploymentUrl);
      
      console.log('🎉 Deployment completed successfully!');
      console.log(`🌐 URL: ${deploymentUrl}`);
      console.log(`📊 Admin: ${deploymentUrl}/admin`);
      
      return deploymentUrl;
      
    } catch (error) {
      console.error('💥 Deployment failed:', error.message);
      process.exit(1);
    }
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployer = new DeploymentManager();
  deployer.deployWithVersionManagement().catch(console.error);
}

module.exports = DeploymentManager;
