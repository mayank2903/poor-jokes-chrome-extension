/**
 * Centralized URL Configuration
 * Single source of truth for all URLs in the application
 * This prevents URL drift and makes maintenance easier
 */

// Production URLs - Single source of truth
const PRODUCTION_URLS = {
  BASE: 'https://poor-jokes-newtab.vercel.app',
  API: 'https://poor-jokes-newtab.vercel.app/api',
  ADMIN: 'https://poor-jokes-newtab.vercel.app/admin',
  WEBSITE: 'https://poor-jokes-newtab.vercel.app'
};

// Development URLs
const DEVELOPMENT_URLS = {
  BASE: 'http://localhost:3001',
  API: 'http://localhost:3001/api',
  ADMIN: 'http://localhost:3001/admin',
  WEBSITE: 'http://localhost:3001'
};

// Environment detection
function getEnvironment() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
  }
  
  // Check for Node.js environment
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    return 'development';
  }
  
  return 'production';
}

// Get URLs based on environment
function getUrls() {
  const env = getEnvironment();
  return env === 'development' ? DEVELOPMENT_URLS : PRODUCTION_URLS;
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    PRODUCTION_URLS,
    DEVELOPMENT_URLS,
    getUrls,
    getEnvironment
  };
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.URLConfig = {
    PRODUCTION_URLS,
    DEVELOPMENT_URLS,
    getUrls,
    getEnvironment
  };
}

// For direct usage
const urls = getUrls();

// Export the current URLs
if (typeof module !== 'undefined' && module.exports) {
  module.exports.urls = urls;
} else if (typeof window !== 'undefined') {
  window.URLConfig.urls = urls;
}
