# Version Management & API Reliability

## 🚀 **Ensuring Latest API Version Always**

This system implements multiple strategies to prevent caching issues and ensure the latest API version is always used.

### **1. Environment-Based Configuration**
- **Development**: Uses localhost with cache-busting
- **Production**: Uses latest deployed URL with fallbacks
- **Automatic Detection**: Based on hostname

### **2. API Health Monitoring**
- **Automatic Health Checks**: Every 30 seconds in production
- **Fallback URLs**: Multiple API endpoints for redundancy
- **Real-time Switching**: Automatically switches to healthy endpoints

### **3. Cache Busting Strategies**
- **Timestamp Parameters**: Added to requests in development
- **Version Headers**: API version sent with each request
- **Cache Clearing**: Automatic cache clearing on deployment

### **4. Deployment Process**

#### **Simple Deployment**
```bash
npm run deploy:simple
```

#### **Full Deployment with Version Management**
```bash
npm run deploy
```
This will:
1. Update version numbers
2. Clear all caches
3. Deploy to Vercel
4. Update API URLs
5. Run health checks
6. Verify deployment

### **5. Health Monitoring**

#### **Check API Health**
```bash
npm run health
```

#### **Manual Health Check**
```javascript
// In browser console
console.log('API Status:', window.APIManager.getStatus());
```

### **6. Fallback System**

The system maintains multiple API endpoints:
1. **Primary**: Latest deployment
2. **Fallback 1**: Previous stable deployment
3. **Fallback 2**: Earlier stable deployment

If the primary fails, it automatically tries the next one.

### **7. Configuration Files**

#### **js/config.js**
- Environment detection
- API URL management
- Version information

#### **js/api-manager.js**
- Health monitoring
- Fallback management
- Request handling

### **8. Debugging**

#### **Check Current Configuration**
```javascript
console.log('Config:', window.APIConfig.getInfo());
console.log('Status:', window.APIManager.getStatus());
```

#### **Force API Switch**
```javascript
// Switch to next API endpoint
window.APIManager.currentUrlIndex++;
```

#### **View Available URLs**
```javascript
console.log('Available URLs:', window.APIManager.fallbackUrls);
```

### **9. Troubleshooting**

#### **API Not Updating**
1. Clear browser cache
2. Check console for errors
3. Verify API health: `npm run health`
4. Redeploy: `npm run deploy`

#### **Caching Issues**
1. Use `npm run deploy` (clears caches)
2. Check browser dev tools for cached responses
3. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

#### **Health Check Failures**
1. Check Vercel logs: `vercel logs <deployment-url>`
2. Verify environment variables
3. Test API endpoints manually

### **10. Best Practices**

1. **Always use `npm run deploy`** for production deployments
2. **Monitor health checks** in production
3. **Keep fallback URLs updated** when deploying
4. **Test locally first** with `npm run local`
5. **Check API status** before major changes

### **11. Monitoring Dashboard**

Visit the admin dashboard to see:
- Current API status
- Health check results
- Available endpoints
- Version information

### **12. Emergency Procedures**

#### **If All APIs Fail**
1. Check Vercel status
2. Verify environment variables
3. Check Supabase status
4. Rollback to previous version

#### **If Caching Persists**
1. Clear all caches: `rm -rf .vercel`
2. Hard refresh browser
3. Check CDN settings
4. Use incognito mode

This system ensures your Poor Jokes extension always uses the latest, working API version! 🎭✨
