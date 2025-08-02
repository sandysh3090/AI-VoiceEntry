// Create floating buttons for voice recording and history
function createFloatingButtons() {
  // Remove existing buttons if they exist
  const existingButtons = document.getElementById('voice-entry-buttons');
  if (existingButtons) {
    existingButtons.remove();
  }

  // Create container
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'voice-entry-buttons';
  buttonContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  // Create record button
  const recordBtn = document.createElement('button');
  recordBtn.innerHTML = '🎙️';
  recordBtn.title = 'Record Voice Entry';
  recordBtn.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background-color: #3b82f6;
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  `;

  // Create history button
  const historyBtn = document.createElement('button');
  historyBtn.innerHTML = '📋';
  historyBtn.title = 'View History';
  historyBtn.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background-color: #10b981;
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  `;

  // Add hover effects
  recordBtn.addEventListener('mouseenter', () => {
    recordBtn.style.transform = 'scale(1.1)';
    recordBtn.style.backgroundColor = '#2563eb';
  });
  recordBtn.addEventListener('mouseleave', () => {
    recordBtn.style.transform = 'scale(1)';
    recordBtn.style.backgroundColor = '#3b82f6';
  });

  historyBtn.addEventListener('mouseenter', () => {
    historyBtn.style.transform = 'scale(1.1)';
    historyBtn.style.backgroundColor = '#059669';
  });
  historyBtn.addEventListener('mouseleave', () => {
    historyBtn.style.transform = 'scale(1)';
    historyBtn.style.backgroundColor = '#10b981';
  });

  // Add click handlers
  recordBtn.addEventListener('click', () => {
    // Send message to background script to open popup
    chrome.runtime.sendMessage({ action: 'openPopup' });
  });

  historyBtn.addEventListener('click', () => {
    // Open history in new tab
    window.open('http://localhost:8080', '_blank');
  });

  // Add buttons to container
  buttonContainer.appendChild(recordBtn);
  buttonContainer.appendChild(historyBtn);

  // Add to page
  document.body.appendChild(buttonContainer);
}

// Create buttons when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createFloatingButtons);
} else {
  createFloatingButtons();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateButtons') {
    createFloatingButtons();
  }
}); 