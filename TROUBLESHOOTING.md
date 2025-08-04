# Microphone Troubleshooting Guide

## 🎤 "Microphone is in use by another application" Error

This error occurs when another application or browser tab is currently using your microphone.

### 🔍 **Step-by-Step Troubleshooting:**

#### **1. Check Other Browser Tabs**
- Close all other browser tabs that might be using microphone
- Look for tabs with camera/microphone icons in the address bar
- Close video conferencing tabs (Zoom, Teams, Google Meet, etc.)

#### **2. Check Other Applications**
- Close any applications that might be using microphone:
  - **Video Conferencing**: Zoom, Teams, Skype, Discord
  - **Voice Recording**: Voice Memos, Audacity, GarageBand
  - **Screen Recording**: QuickTime, OBS, Camtasia
  - **Voice Chat**: Discord, Slack, WhatsApp Web

#### **3. Check System Audio Settings**
- **Mac**: System Preferences > Sound > Input
- **Windows**: Settings > System > Sound > Input
- **Linux**: Sound Settings > Input

#### **4. Restart Browser**
1. Close Chrome completely
2. Reopen Chrome
3. Try the extension again

#### **5. Check Chrome Extensions**
1. Go to `chrome://extensions/`
2. Look for other extensions that might use microphone
3. Temporarily disable them
4. Test your extension

#### **6. Use Task Manager (Windows)**
1. Press `Ctrl + Shift + Esc`
2. Look for applications using microphone
3. End those processes

#### **7. Use Activity Monitor (Mac)**
1. Open Activity Monitor
2. Search for "audio" or "microphone"
3. Quit processes using audio

### 🧪 **Test Microphone Access:**

1. **Open Test Page**: Go to `http://localhost:8080/test-microphone.html`
2. **Click "Test Microphone Access"**
3. **If successful**: Try the extension
4. **If failed**: Follow troubleshooting steps above

### 🔧 **Quick Fixes:**

#### **Option 1: Restart Everything**
```bash
# 1. Close all browser tabs
# 2. Close all applications
# 3. Restart browser
# 4. Try extension
```

#### **Option 2: Use Incognito Mode**
1. Open Chrome in Incognito mode
2. Load the extension
3. Test microphone access

#### **Option 3: Check Browser Permissions**
1. Go to `chrome://settings/content/microphone`
2. Remove any blocked sites
3. Clear all microphone permissions
4. Try again

### 🎯 **Common Causes:**

1. **Video Conferencing Apps**: Zoom, Teams, Google Meet
2. **Voice Recording Apps**: Voice Memos, Audacity
3. **Browser Extensions**: Other extensions using microphone
4. **System Apps**: Voice assistants, screen recorders
5. **Other Browser Tabs**: Tabs with camera/microphone access

### ✅ **Verification Steps:**

1. **Check Active Streams**: Open Chrome DevTools > Console
2. **Look for Errors**: Check for microphone-related errors
3. **Test in Incognito**: Try without other extensions
4. **Test on Different Site**: Try on a simple website

### 🚨 **If Nothing Works:**

1. **Restart Computer**: Complete system restart
2. **Check Hardware**: Try different microphone
3. **Update Browser**: Update to latest Chrome version
4. **Reinstall Extension**: Remove and reinstall extension

### 📞 **Still Having Issues?**

1. Check the browser console for detailed error messages
2. Try the test page first: `http://localhost:8080/test-microphone.html`
3. Ensure your backend server is running: `npm start`
4. Ensure your frontend server is running: `python3 -m http.server 8080` 