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
  recordBtn.addEventListener('click', async () => {
    try {
      console.log('Requesting microphone access...');
      
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not supported in this browser');
      }
      
      // Check current permission status
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      console.log('Current microphone permission:', permissionStatus.state);
      
      if (permissionStatus.state === 'denied') {
        alert('❌ Microphone access was previously denied. Please:\n1. Go to chrome://settings/content/microphone\n2. Remove any blocked sites\n3. Try again');
        return;
      }
      
      // Try to get microphone access directly first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // If we get here, permission was granted
      console.log('Microphone permission granted');
      
      // Stop the stream immediately since we just wanted to test permission
      stream.getTracks().forEach(track => track.stop());
      
      // Now open the popup for actual recording
      try {
        const response = await chrome.runtime.sendMessage({ action: 'openPopup' });
        console.log('Popup response:', response);
      } catch (error) {
        console.error('Failed to open popup:', error);
        // Fallback: just open the extension popup manually
        alert('✅ Microphone access granted! Please click the extension icon to record voice.');
      }
      
    } catch (error) {
      console.error('Microphone permission error:', error);
      
      if (error.message.includes('MediaDevices API not supported')) {
        alert('❌ This browser does not support microphone access. Please use Chrome, Firefox, or Safari.');
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert('❌ Microphone access denied. Please follow these steps:\n\n1. Click the camera/microphone icon in the address bar\n2. Select "Allow" for microphone access\n3. Refresh this page and try again\n\nOR\n\n1. Go to chrome://settings/content/microphone\n2. Remove any blocked sites\n3. Try again');
      } else if (error.name === 'NotFoundError') {
        alert('❌ No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        alert('❌ Microphone is in use by another application. Please close other apps using microphone.');
      } else {
        alert('❌ Error accessing microphone: ' + error.message);
      }
    }
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