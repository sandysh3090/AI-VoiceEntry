const { useState, useEffect } = React;

function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-hide alert after 1 second
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
        setAlertMessage('');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleRecordAndSend = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
    let silenceTimer = null;
    let isRecording = false;

    // Create audio context for analyzing audio levels
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      if (!isRecording) return;
      
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // If audio level is low (silence), start timer
      if (average < 10) {
        if (!silenceTimer) {
          silenceTimer = setTimeout(() => {
            console.log('Silence detected for 2 seconds, stopping recording');
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
          }, 2000); // 2 seconds of silence
        }
      } else {
        // Clear silence timer if audio is detected
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
      }
      
      // Continue checking if still recording
      if (isRecording) {
        requestAnimationFrame(checkAudioLevel);
      }
    };

    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      isRecording = false;
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'audio.webm');

      console.log('Sending audio blob:', blob);
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      setLoading(true);
      try {
        const response = await axios.post('http://localhost:3000/voice', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setLoading(false);
        setAlertMessage(response.data.message);
        setShowAlert(true);
        
        // Automatically fetch and display updated history after successful entry
        await fetchHistory();
      } catch (error) {
        setLoading(false);
        console.error('Error:', error.response?.data || error.message);
        setAlertMessage('Error: ' + (error.response?.data?.message || error.message));
        setShowAlert(true);
      }
    };

    mediaRecorder.start();
    isRecording = true;
    checkAudioLevel(); // Start monitoring audio levels
  };

  const fetchHistory = async () => {
    const res = await axios.get('http://localhost:3000/history');
    setHistory(res.data);
  };

  return (
    <div className="p-6 font-sans text-center">
      <h1 className="text-2xl font-bold mb-4">Visitor Voice Entry</h1>
      
      {/* Toast Alert */}
      {showAlert && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          alertMessage.includes('Error') ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {alertMessage}
        </div>
      )}
      
      <button onClick={handleRecordAndSend} className="bg-blue-500 text-white p-2 rounded mb-4">
        {loading ? 'Processing...' : '🎙️ Tap to Speak'}
      </button>
      <br />
      <button onClick={fetchHistory} className="bg-green-500 text-white p-2 rounded mb-4">View Today's History</button>
      <ul className="mt-4">
        {history.map((entry, index) => (
          <li key={index} className="border p-2 mb-2 rounded shadow">
            <strong>Name:</strong> {entry.name}, <strong>Mobile:</strong> {entry.mobile}, <strong>Purpose:</strong> {entry.purpose}
          </li>
        ))}
      </ul>
    </div>
  );
}