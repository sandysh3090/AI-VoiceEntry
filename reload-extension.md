# How to Reload the Extension

## 🔄 **Step-by-Step Reload Process:**

### **1. Remove Old Extension:**
1. Go to `chrome://extensions/`
2. Find "Visitor Voice Entry System"
3. Click "Remove" or toggle it OFF
4. Confirm removal

### **2. Clear Browser Data (Optional but Recommended):**
1. Go to `chrome://settings/clearBrowserData`
2. Select "All time" for time range
3. Check "Cookies and other site data"
4. Click "Clear data"

### **3. Load Extension Again:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the folder containing your extension files:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `content.js`
   - `background.js`
   - `content.css`

### **4. Grant Permissions:**
1. When prompted, click "Allow" for microphone access
2. If not prompted, click the extension icon
3. Try the record button - it should now ask for permission

### **5. Test on a New Tab:**
1. Open a new tab (any website)
2. Look for the floating buttons (🎙️ and 📋)
3. Click the 🎙️ button
4. Allow microphone when prompted

## 🎯 **What Should Happen:**

### **First Time Setup:**
1. **Extension loads** with all permissions
2. **Floating buttons appear** on any webpage
3. **Clicking 🎙️** prompts for microphone permission
4. **Browser shows** camera/microphone icon in address bar
5. **Click "Allow"** for microphone access
6. **Extension works** for voice recording

### **If Still Not Working:**
1. **Check extension permissions** in `chrome://extensions/`
2. **Click "Details"** on your extension
3. **Ensure microphone permission** is enabled
4. **Try in Incognito mode** to test without other extensions

## 🔧 **Troubleshooting:**

### **If Buttons Don't Appear:**
1. Refresh the webpage
2. Check browser console for errors
3. Ensure extension is enabled

### **If Microphone Still Not Working:**
1. Try the test page: `http://localhost:8080/test-microphone.html`
2. Check if microphone works there
3. If test works, extension should work too

### **If Permission Still Denied:**
1. Go to `chrome://settings/content/microphone`
2. Remove any blocked sites
3. Clear all microphone permissions
4. Reload extension again

## ✅ **Verification Steps:**

1. **Extension loads** without errors
2. **Floating buttons** appear on webpages
3. **Microphone permission** is requested
4. **Voice recording** works in popup
5. **History button** opens history page

## 🚨 **Important Notes:**

- **Chrome extensions** have strict security requirements
- **Microphone permission** must be explicitly granted
- **Content scripts** run on every webpage
- **Popup** runs in extension context
- **Permissions** are requested when needed

## 📝 **Quick Commands:**

```bash
# 1. Stop your servers
# 2. Reload extension in Chrome
# 3. Start servers again
npm start
python3 -m http.server 8080
# 4. Test extension
``` 