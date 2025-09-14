# 🔧 Troubleshooting Guide

## "Failed to load submissions" Error

This error usually means the local server isn't running or there's a connection issue. Here's how to fix it:

### Step 1: Check if the server is running

Open a terminal and run:
```bash
cd /Users/mb1994/Desktop/poor-jokes-newtab
npm run local
```

You should see:
```
🚀 Local server running at http://localhost:3001
📱 Extension: http://localhost:3001
🎛️  Admin: http://localhost:3001/admin
```

### Step 2: Test the API directly

Open a new terminal and test the API:
```bash
curl "http://localhost:3001/api/submissions?status=pending"
```

You should see JSON data with submissions.

### Step 3: Test in browser

1. Open `http://localhost:3001/test-api.html` in your browser
2. Click "Run All Tests" button
3. Check if all tests pass

### Step 4: Check browser console

1. Open `http://localhost:3001/admin` in your browser
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for error messages
5. Refresh the page and watch the console

### Step 5: Common fixes

**If server won't start:**
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process using port 3001
kill -9 $(lsof -t -i:3001)

# Try different port
PORT=3002 node local-server.js
```

**If CORS errors:**
- Make sure you're accessing via `http://localhost:3001` not `file://`
- Check that the server is running
- Try refreshing the page

**If extension not working:**
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "Reload" button
4. Check for errors in the extension details

### Step 6: Debug mode

Add this to your browser console to debug:
```javascript
// Test API connection
fetch('http://localhost:3001/api/jokes')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test submissions
fetch('http://localhost:3001/api/submissions?status=pending')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Quick Fix Checklist

- [ ] Server is running (`npm run local`)
- [ ] Server responds to curl test
- [ ] Browser can access `http://localhost:3001`
- [ ] No CORS errors in console
- [ ] Extension is loaded in Chrome
- [ ] All files are in the correct location

## Still having issues?

1. Check the terminal where the server is running for error messages
2. Check browser console for JavaScript errors
3. Try accessing `http://localhost:3001/test-api.html` to test the API
4. Make sure all dependencies are installed (`npm install`)

## Alternative: Use the test page

If the admin dashboard isn't working, you can use the test page to verify everything is working:

1. Open `http://localhost:3001/test-api.html`
2. This will test all API endpoints
3. Use this to verify the backend is working before debugging the frontend
