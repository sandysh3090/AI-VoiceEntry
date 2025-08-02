document.addEventListener('DOMContentLoaded', function() {
  const recordBtn = document.getElementById('recordBtn');
  const historyBtn = document.getElementById('historyBtn');
  const statusDiv = document.getElementById('status');

  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];

  function showStatus(message, type = 'success') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await sendAudioToServer(audioBlob);
      };

      mediaRecorder.start();
      isRecording = true;
      recordBtn.textContent = '⏹️ Stop Recording';
      recordBtn.disabled = false;
      showStatus('Recording started... Speak now!', 'success');
    } catch (error) {
      showStatus('Error accessing microphone: ' + error.message, 'error');
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
}); 