# Chrome Web Store Submission Checklist

## ✅ Package Ready
- **Zip file created:** `poor-jokes-newtab-v1.0.1-chrome-store-ready.zip` (51KB)
- **Version:** 1.0.1
- **All files included:** manifest.json, newtab.html, newtab-v2.js, styles.css, icons, js files, api files

## 📋 Pre-Submission Checklist

### 1. Test Extension Locally
- [ ] Load extension in Chrome (`chrome://extensions/` → Load unpacked → select `chrome-store-package/`)
- [ ] Open new tab - verify jokes load instantly from cache
- [ ] Test "Another" button - verify never-repeat works
- [ ] Test rating buttons (😂 and 😐) - verify ratings work
- [ ] Test "Copy" button
- [ ] Test "Submit Your Own Joke" form
- [ ] Verify daily background color changes
- [ ] Check console for errors

### 2. Verify Files in Package
- [x] manifest.json (version 1.0.1)
- [x] newtab.html
- [x] newtab-v2.js (with never-repeat, caching, all improvements)
- [x] styles.css (with improved button visibility)
- [x] jokes.js (local fallback)
- [x] js/config.js
- [x] js/api-manager.js
- [x] js/api-client.js
- [x] icons/ (all 4 sizes)
- [x] privacy-policy.html

### 3. Chrome Web Store Requirements

#### Store Listing
- [ ] **Name:** "Joor Pokes" (or update if needed)
- [ ] **Description:** Update with new features:
  - Never-repeat jokes
  - Instant loading with caching
  - Daily random backgrounds
  - Community ratings and submissions
- [ ] **Category:** Entertainment or Productivity
- [ ] **Language:** English
- [ ] **Screenshots:** Create 1-5 screenshots (1280x800px or 640x400px)
- [ ] **Promotional Images:** Optional but recommended
- [ ] **Privacy Policy URL:** https://poor-jokes-newtab.vercel.app/privacy-policy.html

#### Privacy & Permissions
- [x] No special permissions required
- [x] Privacy policy available
- [x] Only uses standard web APIs (fetch, localStorage)

#### Content Rating
- [ ] **Rating:** Select appropriate age rating (likely "Everyone")
- [ ] **Content:** Jokes are family-friendly

### 4. Submission Steps

1. **Go to Chrome Web Store Developer Dashboard**
   - https://chrome.google.com/webstore/devconsole/
   - Sign in with Google account

2. **Upload Package**
   - Click "New Item" or select existing item to update
   - Upload `poor-jokes-newtab-v1.0.1-chrome-store-ready.zip`
   - Wait for validation

3. **Fill Store Listing**
   - Name: "Joor Pokes"
   - Short description: "Transform your new tab with poor jokes, ratings, and daily laughs!"
   - Detailed description: (see store-listing.md for template)
   - Category: Entertainment
   - Language: English
   - Privacy policy: https://poor-jokes-newtab.vercel.app/privacy-policy.html

4. **Upload Screenshots**
   - At least 1 screenshot required
   - Recommended: 3-5 screenshots showing:
     - Main new tab with joke
     - Rating system
     - Submission form
     - Different daily backgrounds

5. **Review & Submit**
   - Review all information
   - Submit for review
   - Wait for approval (usually 1-3 business days)

## 🎯 New Features in v1.0.1

- ✅ Never-repeat joke system (bounded storage)
- ✅ localStorage caching for instant loading
- ✅ Daily random background colors
- ✅ Improved button visibility
- ✅ Simplified joke ID handling
- ✅ Better error handling
- ✅ Updated UI (emojis, button order, footer)

## 📦 Package Location

**Zip file:** `/Users/mb1994/Desktop/poor-jokes-newtab/poor-jokes-newtab-v1.0.1-chrome-store-ready.zip`

**Package directory:** `/Users/mb1994/Desktop/poor-jokes-newtab/chrome-store-package/`

## 🚀 Ready to Submit!

The extension is packaged and ready for Chrome Web Store submission. Follow the checklist above before submitting.


