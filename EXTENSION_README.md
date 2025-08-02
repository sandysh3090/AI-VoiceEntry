# Visitor Voice Entry Chrome Extension

This Chrome extension adds floating buttons to any webpage for voice-based visitor entry and history viewing.

## 🚀 Features

- **🎙️ Record Voice Entry**: Floating button to record visitor information
- **📋 View History**: Floating button to open the full history view
- **Popup Interface**: Clean popup for voice recording
- **Auto-Processing**: Sends voice to your backend server
- **History Integration**: Opens your existing history page

## 📦 Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the folder containing these files:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `content.js`
   - `background.js`
   - `content.css`

### 2. Start Your Servers

Make sure your backend and frontend servers are running:

```bash
# Terminal 1: Backend server
npm start

# Terminal 2: Frontend server  
python3 -m http.server 8080
```

### 3. Grant Permissions

When prompted, allow the extension to:
- Access microphone
- Access localhost:3000 (backend)
- Access localhost:8080 (frontend)

## 🎯 How to Use

### On Any Webpage:

1. **🎙️ Record Button** (Blue, top-right):
   - Click to start recording
   - Speak visitor information
   - Click again to stop recording
   - Audio is sent to your backend for processing

2. **📋 History Button** (Green, top-right):
   - Click to open full history view
   - Opens `http://localhost:8080` in new tab
   - Shows all today's visitor entries

### Extension Popup:

- Click the extension icon in Chrome toolbar
- Use the popup for quick voice recording
- See status messages for recording progress

## 🔧 Configuration

### Backend URL:
- Default: `http://localhost:3000`
- Update in `popup.js` if your server runs on different port

### Frontend URL:
- Default: `http://localhost:8080`
- Update in `content.js` and `popup.js` if needed

## 📁 Files Structure

```
extension/
├── manifest.json      # Extension configuration
├── popup.html        # Popup interface
├── popup.js          # Popup functionality
├── content.js        # Floating buttons on webpages
├── background.js     # Background service worker
└── content.css       # Button styles
```

## 🎨 Customization

### Button Position:
Edit `content.js` to change button position:
```javascript
buttonContainer.style.cssText = `
  position: fixed;
  top: 20px;        // Distance from top
  right: 20px;      // Distance from right
  z-index: 10000;   // Layer priority
`;
```

### Button Colors:
Edit `content.js` to change colors:
```javascript
// Record button (blue)
backgroundColor: '#3b82f6'

// History button (green)  
backgroundColor: '#10b981'
```

## 🔍 Troubleshooting

### Buttons Not Appearing:
1. Check if extension is enabled in `chrome://extensions/`
2. Refresh the webpage
3. Check browser console for errors

### Voice Recording Not Working:
1. Ensure microphone permission is granted
2. Check if backend server is running on port 3000
3. Verify network connectivity

### History Not Loading:
1. Ensure frontend server is running on port 8080
2. Check if `http://localhost:8080` opens in browser
3. Verify CORS settings in your backend

## 🚀 Usage Examples

### Quick Voice Entry:
1. Visit any webpage
2. Click the blue 🎙️ button
3. Speak: "Visitor John Doe, mobile number is 1234567890 to see office 101"
4. Click stop recording
5. See success message

### View History:
1. Click the green 📋 button
2. New tab opens with full history
3. See all today's entries with details

## 📝 Notes

- Extension works on all websites
- Buttons are always visible in top-right corner
- Voice processing uses your existing backend
- History opens your existing frontend
- No data is stored in the extension itself 