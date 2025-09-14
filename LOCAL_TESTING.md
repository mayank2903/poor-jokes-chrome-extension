# 🧪 Local Testing Guide

This guide will help you test the Poor Jokes extension locally before deploying to production.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Server
```bash
npm run local
```
This will start a local server at `http://localhost:3001`

### 3. Test the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked" and select this project folder
4. The extension will now use the local API automatically

## 📱 What You Can Test

### Extension Features:
- ✅ **View jokes** - See jokes with ratings
- ✅ **Rate jokes** - Thumbs up/down with live updates
- ✅ **Submit jokes** - Submit new jokes for review
- ✅ **Copy jokes** - Copy jokes to clipboard
- ✅ **Responsive design** - Test on different screen sizes

### Admin Dashboard:
- ✅ **View statistics** - See total jokes and pending submissions
- ✅ **Moderate submissions** - Approve or reject submitted jokes
- ✅ **Real-time updates** - See changes immediately
- ✅ **Rejection feedback** - Provide reasons when rejecting

## 🔧 Testing Scenarios

### 1. Basic Functionality
1. Open a new tab (should show the extension)
2. Click "Another" to see different jokes
3. Rate a joke with thumbs up/down
4. Check if ratings update in real-time

### 2. Joke Submission
1. Click "Submit Your Own Joke"
2. Enter a test joke
3. Submit it
4. Check admin dashboard to see the submission

### 3. Admin Moderation
1. Open `http://localhost:3001/admin` in a new tab
2. See the submitted joke in pending submissions
3. Approve or reject the joke
4. Check if approved jokes appear in the extension

### 4. Rating System
1. Rate the same joke multiple times
2. Check if you can change your rating
3. Verify that clicking the same rating removes it
4. Check if ratings persist after page refresh

## 🎯 Mock Data

The local server comes with pre-loaded test data:

### Sample Jokes:
- "I used to play piano by ear, but now I use my hands." (83% liked)
- "Why did the scarecrow win an award? He was outstanding in his field." (96% liked)
- "I told my computer I needed a break — it said 'No problem, I'll go to sleep.'" (62% liked)

### Sample Submissions:
- "Why don't scientists trust atoms? Because they make up everything."
- "I don't trust stairs — they're always up to something."

## 🔍 Debugging

### Check Console Logs:
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for any error messages
4. Check Network tab for API calls

### Common Issues:

**Extension not loading:**
- Check if local server is running
- Verify manifest.json is valid
- Check Chrome extensions page for errors

**API calls failing:**
- Ensure local server is running on port 3001
- Check CORS settings
- Verify API endpoints are working

**Ratings not updating:**
- Check browser console for errors
- Verify localStorage is working
- Check if API responses are successful

## 🛠️ Development Tips

### Hot Reload:
- The local server auto-reloads when you change files
- Refresh the extension page to see changes
- Use Chrome's "Reload" button on the extension

### Testing Different Scenarios:
1. **Clear localStorage** to test fresh user experience
2. **Submit multiple jokes** to test moderation workflow
3. **Rate jokes from different "users"** (change user ID in localStorage)
4. **Test offline mode** by stopping the local server

### API Testing:
You can test API endpoints directly:
```bash
# Get jokes
curl http://localhost:3001/api/jokes

# Submit a joke
curl -X POST http://localhost:3001/api/jokes \
  -H "Content-Type: application/json" \
  -d '{"content":"Test joke","submitted_by":"test_user"}'

# Rate a joke
curl -X POST http://localhost:3001/api/rate \
  -H "Content-Type: application/json" \
  -d '{"joke_id":"1","user_id":"test_user","rating":1}'
```

## 📊 What to Look For

### Extension:
- Jokes load and display correctly
- Rating buttons work and show feedback
- Submission form appears and functions
- Copy button works
- Responsive design on mobile

### Admin Dashboard:
- Statistics load correctly
- Submissions appear in pending list
- Approve/reject buttons work
- Approved jokes appear in extension
- Real-time updates work

### Data Persistence:
- Ratings persist after page refresh
- Submitted jokes appear in admin
- Approved jokes appear in extension
- User ID persists across sessions

## 🚀 Ready for Production?

Once local testing is complete:
1. Set up Supabase database
2. Deploy to Vercel
3. Update API URLs in the extension
4. Test with real database
5. Deploy the extension

## 🆘 Troubleshooting

### Server won't start:
```bash
# Check if port 3001 is available
lsof -i :3001

# Kill process using port 3001
kill -9 $(lsof -t -i:3001)

# Try different port
PORT=3002 node local-server.js
```

### Extension not working:
1. Check Chrome extensions page for errors
2. Reload the extension
3. Check console for JavaScript errors
4. Verify all files are in the correct location

### API errors:
1. Check server console for errors
2. Verify all dependencies are installed
3. Check if all required files exist
4. Test API endpoints directly with curl

Happy testing! 🎭
