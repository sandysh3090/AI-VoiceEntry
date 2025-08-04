// Background service worker
console.log('Background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Visitor Voice Entry extension installed');
});

// Simple message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  try {
    if (message.action === 'openPopup') {
      console.log('Opening popup...');
      // Just send success response, popup will open automatically
      sendResponse({ success: true });
      return true;
    }
    
    if (message.action === 'ping') {
      console.log('Ping received, responding...');
      sendResponse({ success: true, message: 'Background script is alive' });
      return true;
    }
    
    // Default response
    sendResponse({ success: false, message: 'Unknown action: ' + message.action });
    return true;
    
  } catch (error) {
    console.error('Background script error:', error);
    sendResponse({ success: false, error: error.message });
    return true;
  }
});

// Handle tab updates to ensure buttons are added
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      chrome.tabs.sendMessage(tabId, { action: 'updateButtons' });
    } catch (error) {
      console.log('Could not send message to tab:', error);
    }
  }
}); 