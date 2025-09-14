#!/usr/bin/env node
// Package extension for Chrome Web Store submission

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StorePackager {
  constructor() {
    this.version = this.getVersion();
    this.packageDir = 'chrome-store-package';
    this.zipFile = `poor-jokes-newtab-v${this.version}.zip`;
  }

  getVersion() {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  }

  // Create package directory
  createPackageDir() {
    console.log('📁 Creating package directory...');
    
    if (fs.existsSync(this.packageDir)) {
      execSync(`rm -rf ${this.packageDir}`);
    }
    
    fs.mkdirSync(this.packageDir);
    console.log(`✅ Created ${this.packageDir}/`);
  }

  // Copy essential files
  copyFiles() {
    console.log('📋 Copying essential files...');
    
    const filesToCopy = [
      'newtab.html',
      'newtab-v2.js',
      'styles.css',
      'jokes.js',
      'js/config.js',
      'js/api-manager.js',
      'js/api-client.js',
      'api/validation.js',
      'api/jokes.js',
      'api/rate.js',
      'api/submissions.js',
      'manifest-store.json'
    ];

    filesToCopy.forEach(file => {
      if (fs.existsSync(file)) {
        const destPath = path.join(this.packageDir, file);
        const destDir = path.dirname(destPath);
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(file, destPath);
        console.log(`✅ Copied ${file}`);
      } else {
        console.warn(`⚠️  File not found: ${file}`);
      }
    });
  }

  // Rename manifest for store
  renameManifest() {
    console.log('📝 Setting up manifest...');
    
    const manifestPath = path.join(this.packageDir, 'manifest-store.json');
    const newManifestPath = path.join(this.packageDir, 'manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      fs.renameSync(manifestPath, newManifestPath);
      console.log('✅ Renamed manifest-store.json to manifest.json');
    }
  }

  // Create icons directory
  createIconsDir() {
    console.log('🎨 Creating icons directory...');
    
    const iconsDir = path.join(this.packageDir, 'icons');
    fs.mkdirSync(iconsDir, { recursive: true });
    
    // Check if icons already exist
    const iconSizes = [16, 32, 48, 128];
    let existingIcons = 0;
    
    iconSizes.forEach(size => {
      const iconPath = path.join(iconsDir, `icon${size}.png`);
      if (fs.existsSync(iconPath) && fs.statSync(iconPath).size > 0) {
        existingIcons++;
        console.log(`✅ Found existing icon${size}.png`);
      } else {
        // Create a simple placeholder only if no icon exists
        fs.writeFileSync(iconPath, '');
        console.log(`📄 Created placeholder icon${size}.png`);
      }
    });
    
    if (existingIcons === iconSizes.length) {
      console.log('🎉 All icons are ready!');
    } else {
      console.log('⚠️  Some icons are missing - replace placeholders with real ones!');
    }
  }

  // Create store assets directory
  createStoreAssetsDir() {
    console.log('🖼️  Creating store assets directory...');
    
    const assetsDir = path.join(this.packageDir, 'store-assets');
    fs.mkdirSync(assetsDir, { recursive: true });
    
    // Copy store listing content
    if (fs.existsSync('store-listing.md')) {
      fs.copyFileSync('store-listing.md', path.join(assetsDir, 'store-listing.md'));
      console.log('✅ Copied store listing content');
    }
    
    console.log('📋 Store assets directory created - add your screenshots and promotional images here');
  }

  // Create README for store package
  createStoreReadme() {
    console.log('📖 Creating store package README...');
    
    const readmeContent = `# Poor Jokes New Tab - Chrome Web Store Package

## Version ${this.version}
Generated: ${new Date().toISOString()}

## Files Included
- manifest.json (Chrome Web Store manifest)
- newtab.html (Main new tab page)
- newtab-v2.js (Enhanced JavaScript with API management)
- styles.css (Styling)
- jokes.js (Local joke fallback)
- js/ (API management scripts)
- api/ (Serverless API functions)
- icons/ (Extension icons - replace with real ones)

## Before Uploading to Chrome Web Store

### 1. Replace Icons
Replace the placeholder icon files in the icons/ directory with real PNG images:
- icon16.png (16x16px)
- icon32.png (32x32px) 
- icon48.png (48x48px)
- icon128.png (128x128px)

### 2. Test the Extension
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. Test all functionality:
   - New tab shows jokes
   - Rating system works
   - Joke submission works
   - Admin dashboard works

### 3. Prepare Store Assets
Create the following images for your store listing:
- Screenshots (1280x800px or 640x400px)
- Promotional images (1400x560px, 440x280px, 920x680px)
- Feature graphic (1400x560px)

### 4. Upload to Chrome Web Store
1. Go to https://chrome.google.com/webstore/devconsole/
2. Click "New Item"
3. Upload the ZIP file
4. Fill in store listing details
5. Submit for review

## Store Listing Content
See store-assets/store-listing.md for the complete store listing content.

## Support
- Website: https://poor-jokes-newtab-h84vfdbd2-mayanks-projects-72f678fa.vercel.app
- Admin: https://poor-jokes-newtab-h84vfdbd2-mayanks-projects-72f678fa.vercel.app/admin

Good luck with your Chrome Web Store submission! 🎭✨
`;

    fs.writeFileSync(path.join(this.packageDir, 'README.md'), readmeContent);
    console.log('✅ Created store package README');
  }

  // Create ZIP package
  createZipPackage() {
    console.log('📦 Creating ZIP package...');
    
    try {
      execSync(`cd ${this.packageDir} && zip -r ../${this.zipFile} .`, { stdio: 'inherit' });
      console.log(`✅ Created ${this.zipFile}`);
    } catch (error) {
      console.error('❌ Failed to create ZIP package:', error.message);
      console.log('💡 You can manually ZIP the chrome-store-package directory');
    }
  }

  // Main packaging process
  packageForStore() {
    console.log(`🚀 Packaging Poor Jokes New Tab v${this.version} for Chrome Web Store...`);
    
    try {
      this.createPackageDir();
      this.copyFiles();
      this.renameManifest();
      this.createIconsDir();
      this.createStoreAssetsDir();
      this.createStoreReadme();
      this.createZipPackage();
      
      console.log('🎉 Packaging completed successfully!');
      console.log(`📁 Package directory: ${this.packageDir}/`);
      console.log(`📦 ZIP file: ${this.zipFile}`);
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Replace placeholder icons with real ones');
      console.log('2. Test the extension locally');
      console.log('3. Create store screenshots and promotional images');
      console.log('4. Upload to Chrome Web Store');
      
    } catch (error) {
      console.error('💥 Packaging failed:', error.message);
      process.exit(1);
    }
  }
}

// Run packaging if this script is executed directly
if (require.main === module) {
  const packager = new StorePackager();
  packager.packageForStore();
}

module.exports = StorePackager;
