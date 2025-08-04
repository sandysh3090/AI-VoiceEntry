document.addEventListener('DOMContentLoaded', function() {
  const recordBtn = document.getElementById('recordBtn');
  const historyBtn = document.getElementById('historyBtn');
  const statusDiv = document.getElementById('status');

  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let currentStream = null;

  function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000); // Show for 5 seconds
  }

  // Function to release microphone stream
  function releaseMicrophone() {
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        track.stop();
        console.log('Released microphone track:', track.label);
      });
      currentStream = null;
    }
  }

  // Function to be injected into the webpage to request microphone permission
  function requestMicrophonePermission() {
    return new Promise(async (resolve) => {
      try {
        console.log('Requesting microphone permission from webpage...');
        
        // Check if MediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          resolve({ success: false, error: 'MediaDevices API not supported' });
          return;
        }
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        console.log('Microphone permission granted in webpage');
        
        // Stop the stream immediately since we just wanted to test permission
        stream.getTracks().forEach(track => track.stop());
        
        resolve({ success: true, message: 'Microphone permission granted' });
        
      } catch (error) {
        console.error('Microphone permission error:', error);
        resolve({ 
          success: false, 
          error: error.name,
          message: error.message 
        });
      }
    });
  }

  async function startRecording() {
    try {
      showStatus('🎤 Requesting microphone access from webpage...', 'success');
      
      // Get the current active tab
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }
      
      // Execute script in the active tab to request microphone permission
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: requestMicrophonePermission
      });
      
      const result = results[0];
      if (result.result && result.result.success) {
        showStatus('✅ Microphone permission granted! Starting recording...', 'success');
        
        // Now start recording in the popup
        await startRecordingInPopup();
      } else {
        throw new Error(result.result?.error || 'Failed to get microphone permission');
      }
      
    } catch (error) {
      console.error('Microphone error:', error);
      
      if (error.message.includes('No active tab found')) {
        showStatus('❌ Please open a webpage first, then try recording.', 'error');
      } else if (error.message.includes('NotAllowedError') || error.message.includes('PermissionDeniedError')) {
        showStatus('❌ Microphone access denied. Please:\n1. Click the camera icon in address bar\n2. Select "Allow" for microphone\n3. Try again', 'error');
      } else {
        showStatus('❌ Error accessing microphone: ' + error.message, 'error');
      }
    }
  }

  async function startRecordingInPopup() {
    try {
      // Request microphone access directly in popup (should work now that permission is granted)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      currentStream = stream;
      console.log('Microphone stream obtained:', stream.getTracks());
      
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await sendAudioToServer(audioBlob);
        releaseMicrophone();
      };

      mediaRecorder.start();
      isRecording = true;
      recordBtn.textContent = '⏹️ Stop Recording';
      recordBtn.disabled = false;
      showStatus('✅ Recording started... Speak now!', 'success');
    } catch (error) {
      console.error('Recording error:', error);
      showStatus('❌ Error starting recording: ' + error.message, 'error');
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      isRecording = false;
      recordBtn.textContent = '🎙️ Record Voice Entry';
      showStatus('Processing audio...', 'success');
    }
  }

  async function sendAudioToServer(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const response = await fetch('http://localhost:3000/voice', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        showStatus('✅ ' + result.message, 'success');
      } else {
        showStatus('❌ ' + (result.message || 'Error processing audio'), 'error');
      }
    } catch (error) {
      showStatus('❌ Network error: ' + error.message, 'error');
    }
  }

  recordBtn.addEventListener('click', () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  });

  historyBtn.addEventListener('click', () => {
    // Open the full history view in a new tab
    chrome.tabs.create({
      url: 'http://localhost:8080'
    });
  });

  // Clean up when popup closes
  window.addEventListener('beforeunload', () => {
    releaseMicrophone();
  });
}); 