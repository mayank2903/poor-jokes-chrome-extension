# 🔄 Chrome Extension Update Guide

## **The Problem:**
Your installed Chrome extension is using an **old deployment URL** that causes 500 errors:
```
🌐 API Request: GET https://poor-jokes-newtab-ch7te6lzr-mayanks-projects-72f678fa.vercel.app/api/jokes
```

## **The Solution:**
Update your installed extension to use the **stable production URL**.

---

## **🛠️ Step-by-Step Fix:**

### **Step 1: Open Chrome Extensions Page**
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right)

### **Step 2: Find Your Extension**
Look for **"Joor Pokes"** or **"Poor Jokes"** extension

### **Step 3: Update the Extension**
**Option A: Reload the Extension (if you installed from folder)**
1. Click the **"Reload"** button (🔄) next to your extension
2. This will reload the extension with the latest code

**Option B: Remove and Reinstall (if you installed from ZIP)**
1. Click **"Remove"** to uninstall the old version
2. Click **"Load unpacked"**
3. Select the `chrome-store-package` folder from your project
4. Click **"Select Folder"**

### **Step 4: Verify the Fix**
1. Open a **new tab**
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Look for API requests - they should now show:
   ```
   🌐 API Request: GET https://poor-jokes-newtab.vercel.app/api/jokes
   ```
   **NOT** the old URL with `ch7te6lzr-mayanks-projects-72f678fa`

---

## **🔍 How to Verify It's Working:**

### **Check Console Logs:**
- ✅ **Correct**: `https://poor-jokes-newtab.vercel.app/api/jokes`
- ❌ **Wrong**: `https://poor-jokes-newtab-ch7te6lzr-mayanks-projects-72f678fa.vercel.app/api/jokes`

### **Test Functionality:**
1. **Jokes load** without errors
2. **Rating works** (no 500 errors)
3. **Joke submission works**
4. **Refresh button works**

---

## **📦 Updated Package:**
- **File**: `poor-jokes-newtab-v1.0.1-updated.zip`
- **Version**: 1.0.1
- **Changes**: Uses stable production URL only

---

## **🚨 Why This Happened:**

1. **Old extension** was installed with old deployment URLs
2. **Chrome caches** the extension code
3. **Updates don't auto-apply** to unpacked extensions
4. **Manual reload** is required

---

## **💡 Prevention for Future:**

### **For Development:**
- Always **reload** the extension after code changes
- Use **"Load unpacked"** for development
- Check console logs regularly

### **For Production:**
- Use **Chrome Web Store** for automatic updates
- Users get updates automatically
- No manual intervention needed

---

## **🎯 Quick Commands:**

```bash
# Create updated package
cd chrome-store-package
zip -r ../poor-jokes-newtab-v1.0.1-updated.zip . -x "*.DS_Store" "*.git*" "node_modules/*" "README.md" "store-assets/*"

# Test the extension
npm run test:integration
```

---

## **✅ Success Indicators:**

After updating, you should see:
- ✅ No 500 errors in console
- ✅ Jokes load successfully
- ✅ Rating system works
- ✅ API requests use stable URL
- ✅ Console shows: `🌐 API Request: GET https://poor-jokes-newtab.vercel.app/api/jokes`

---

## **🆘 If Still Not Working:**

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Restart Chrome** completely
3. **Check manifest.json** version is 1.0.1
4. **Verify API Manager** is using stable URL
5. **Run integration tests**: `npm run test:integration`

---

**🎉 Once updated, your extension will work perfectly with no more 500 errors!**
