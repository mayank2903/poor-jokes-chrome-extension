// Script to update API URL after deployment
const fs = require('fs');
const path = require('path');

// Get the new deployment URL from command line argument
const newUrl = process.argv[2];

if (!newUrl) {
  console.log('❌ Please provide the new deployment URL');
  console.log('Usage: node scripts/update-api-url.js https://your-new-deployment.vercel.app');
  process.exit(1);
}

// Extract base URL and API URL
const baseUrl = newUrl.replace(/\/$/, ''); // Remove trailing slash
const apiUrl = `${baseUrl}/api`;
const adminUrl = `${baseUrl}/admin-local.html`;

console.log('🔄 Updating API configuration...');
console.log('Base URL:', baseUrl);
console.log('API URL:', apiUrl);
console.log('Admin URL:', adminUrl);

// Update the API config file
const configPath = path.join(__dirname, '../config/api-config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace the production URL
configContent = configContent.replace(
  /PRODUCTION_URL: '[^']*'/,
  `PRODUCTION_URL: '${apiUrl}'`
);

// Replace the admin URL
configContent = configContent.replace(
  /ADMIN_URL: '[^']*'/,
  `ADMIN_URL: '${adminUrl}'`
);

// Replace the base URL
configContent = configContent.replace(
  /BASE_URL: '[^']*'/,
  `BASE_URL: '${baseUrl}'`
);

// Update the first fallback URL (most recent)
configContent = configContent.replace(
  /'https:\/\/poor-jokes-newtab-[^']*\.vercel\.app\/api', \/\/ Latest/,
  `'${apiUrl}', // Latest`
);

// Write the updated config
fs.writeFileSync(configPath, configContent);

console.log('✅ API configuration updated successfully!');
console.log('');
console.log('📋 Updated URLs:');
console.log(`- Production API: ${apiUrl}`);
console.log(`- Admin Dashboard: ${adminUrl}`);
console.log(`- Base URL: ${baseUrl}`);
console.log('');
console.log('🎯 All files using the centralized config will now use the new URL!');
