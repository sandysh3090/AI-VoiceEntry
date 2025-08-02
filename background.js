// Background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openPopup') {
    // Open the popup programmatically
    chrome.action.openPopup();
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Visitor Voice Entry extension installed');
});

// Handle tab updates to ensure buttons are added
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.tabs.sendMessage(tabId, { action: 'updateButtons' });
  }
}); 