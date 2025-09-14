#!/usr/bin/env node
// Generate Chrome extension icons from SVG

const fs = require('fs');
const path = require('path');

class IconGenerator {
  constructor() {
    this.svgPath = 'store-assets/icon.svg';
    this.outputDir = 'chrome-store-package/icons';
    this.sizes = [16, 32, 48, 128];
  }

  // Check if required tools are available
  checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    try {
      // Check if ImageMagick is available
      require('child_process').execSync('convert -version', { stdio: 'pipe' });
      console.log('✅ ImageMagick found');
      return 'imagemagick';
    } catch (error) {
      console.log('⚠️  ImageMagick not found');
    }
    
    try {
      // Check if Inkscape is available
      require('child_process').execSync('inkscape --version', { stdio: 'pipe' });
      console.log('✅ Inkscape found');
      return 'inkscape';
    } catch (error) {
      console.log('⚠️  Inkscape not found');
    }
    
    console.log('❌ No image conversion tools found');
    return null;
  }

  // Generate icons using ImageMagick
  generateWithImageMagick() {
    console.log('🎨 Generating icons with ImageMagick...');
    
    this.sizes.forEach(size => {
      const outputPath = path.join(this.outputDir, `icon${size}.png`);
      const command = `convert -background transparent -resize ${size}x${size} "${this.svgPath}" "${outputPath}"`;
      
      try {
        require('child_process').execSync(command, { stdio: 'inherit' });
        console.log(`✅ Generated icon${size}.png`);
      } catch (error) {
        console.error(`❌ Failed to generate icon${size}.png:`, error.message);
      }
    });
  }

  // Generate icons using Inkscape
  generateWithInkscape() {
    console.log('🎨 Generating icons with Inkscape...');
    
    this.sizes.forEach(size => {
      const outputPath = path.join(this.outputDir, `icon${size}.png`);
      const command = `inkscape --export-type=png --export-filename="${outputPath}" --export-width=${size} --export-height=${size} "${this.svgPath}"`;
      
      try {
        require('child_process').execSync(command, { stdio: 'inherit' });
        console.log(`✅ Generated icon${size}.png`);
      } catch (error) {
        console.error(`❌ Failed to generate icon${size}.png:`, error.message);
      }
    });
  }

  // Create fallback icons using HTML5 Canvas (if no tools available)
  createFallbackIcons() {
    console.log('🎨 Creating fallback icons...');
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas" width="128" height="128"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Draw icon
        function drawIcon(size) {
            canvas.width = size;
            canvas.height = size;
            ctx.clearRect(0, 0, size, size);
            
            // Background circle
            ctx.fillStyle = '#ffc107';
            ctx.strokeStyle = '#ff8f00';
            ctx.lineWidth = size * 0.03;
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - size*0.05, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Face circle
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - size*0.15, 0, 2 * Math.PI);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(size/2 - size*0.11, size/2 - size*0.11, size*0.05, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(size/2 + size*0.11, size/2 - size*0.11, size*0.05, 0, 2 * Math.PI);
            ctx.fill();
            
            // Smile
            ctx.strokeStyle = '#333';
            ctx.lineWidth = size*0.03;
            ctx.beginPath();
            ctx.arc(size/2, size/2, size*0.35, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        
        // Generate all sizes
        const sizes = [16, 32, 48, 128];
        sizes.forEach(size => {
            drawIcon(size);
            const link = document.createElement('a');
            link.download = \`icon\${size}.png\`;
            link.href = canvas.toDataURL();
            link.click();
        });
    </script>
</body>
</html>
`;

    fs.writeFileSync('store-assets/icon-generator.html', htmlContent);
    console.log('📄 Created icon-generator.html');
    console.log('💡 Open this file in your browser to generate icons');
  }

  // Main generation process
  generateIcons() {
    console.log('🚀 Generating Chrome extension icons...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Check if SVG exists
    if (!fs.existsSync(this.svgPath)) {
      console.error('❌ SVG file not found:', this.svgPath);
      return;
    }
    
    const tool = this.checkDependencies();
    
    if (tool === 'imagemagick') {
      this.generateWithImageMagick();
    } else if (tool === 'inkscape') {
      this.generateWithInkscape();
    } else {
      this.createFallbackIcons();
    }
    
    console.log('🎉 Icon generation completed!');
    console.log('📁 Icons saved to:', this.outputDir);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  const generator = new IconGenerator();
  generator.generateIcons();
}

module.exports = IconGenerator;
