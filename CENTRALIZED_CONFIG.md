# Centralized API Configuration

This project now uses a centralized configuration system to manage API URLs in one place.

## 📁 Configuration File

**Location:** `config/api-config.js`

This file contains all API URLs and can be used by both client-side and server-side code.

## 🔧 How to Update URLs

### After Each Deployment:

1. **Get the new deployment URL** from Vercel
2. **Run the update script:**
   ```bash
   npm run update-api-url https://your-new-deployment.vercel.app
   ```
3. **Commit the changes:**
   ```bash
   git add config/api-config.js
   git commit -m "Update API URL to latest deployment"
   git push
   ```

### Manual Update:

Edit `config/api-config.js` and update:
- `PRODUCTION_URL` - Main API endpoint
- `ADMIN_URL` - Admin dashboard URL
- `BASE_URL` - Base URL without /api
- `FALLBACK_URLS` - Array of fallback URLs

## 🎯 Files Using Centralized Config

### Client-Side (Browser):
- `js/api-manager.js` - API manager with fallbacks
- `admin-local.html` - Admin dashboard
- Any other HTML files that need API access

### Server-Side (Node.js):
- `api/gmail-notifications.js` - Email notifications
- Any other API files that need URLs

## 🔄 How It Works

### Browser Usage:
```javascript
// Load the config
<script src="config/api-config.js"></script>

// Use the config
const apiUrl = window.APIConfig.PRODUCTION_URL;
const adminUrl = window.APIConfig.getAdminUrl();
```

### Node.js Usage:
```javascript
const API_CONFIG = require('./config/api-config');

const apiUrl = API_CONFIG.PRODUCTION_URL;
const adminUrl = API_CONFIG.ADMIN_URL;
```

## 🚀 Benefits

- **Single source of truth** - Update URLs in one place
- **Automatic fallbacks** - API manager uses multiple URLs
- **Environment detection** - Automatically uses localhost in development
- **Easy maintenance** - No more hunting for hardcoded URLs
- **Deployment script** - Automatically update after each deployment

## 📋 Usage Examples

### Update API URL After Deployment:
```bash
# After deploying to Vercel, get the new URL and run:
npm run update-api-url https://poor-jokes-newtab-abc123.vercel.app

# This will update all URLs in the config file
```

### Use in Code:
```javascript
// Get current API URL (handles development/production)
const apiUrl = window.APIConfig.getCurrentUrl();

// Get admin dashboard URL
const adminUrl = window.APIConfig.getAdminUrl();

// Get fallback URLs for API manager
const fallbacks = window.APIConfig.FALLBACK_URLS;
```

## 🔧 Configuration Options

### Available Properties:
- `PRODUCTION_URL` - Main production API URL
- `ADMIN_URL` - Admin dashboard URL
- `BASE_URL` - Base URL without /api
- `FALLBACK_URLS` - Array of fallback URLs
- `getCurrentUrl()` - Smart URL detection
- `getAdminUrl()` - Smart admin URL detection

### Environment Detection:
- **Development** - Uses localhost URLs
- **Production** - Uses Vercel deployment URLs
- **Fallbacks** - Multiple URLs for reliability

This centralized system makes URL management much easier and ensures consistency across the entire project! 🎉
