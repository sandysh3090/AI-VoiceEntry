const { useState, useEffect } = React;

const App = () => {
  console.log('App component loaded');
  const [history, setHistory] = useState({ visitors: [], general: [], expenses: [] });
  const [loading, setLoading] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [activeTab, setActiveTab] = useState('visitors');
  const [showHindi, setShowHindi] = useState(true);

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
      <h1 className="text-2xl font-bold mb-4">Voice Entry System</h1>
      
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
      
      {/* Language Toggle */}
      <div className="mb-4">
        <label className="inline-flex items-center">
          <input 
            type="checkbox" 
            checked={showHindi} 
            onChange={(e) => setShowHindi(e.target.checked)}
            className="mr-2"
          />
          <span>Show Hindi/Urdu translations</span>
        </label>
      </div>
      
      {/* Tabs */}
      <div className="flex justify-center mb-4">
        <button 
          onClick={() => setActiveTab('visitors')} 
          className={`px-4 py-2 mx-1 rounded ${activeTab === 'visitors' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          👥 Visitors ({history.visitors.length})
        </button>
        <button 
          onClick={() => setActiveTab('general')} 
          className={`px-4 py-2 mx-1 rounded ${activeTab === 'general' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          📝 General ({history.general.length})
        </button>
        <button 
          onClick={() => setActiveTab('expenses')} 
          className={`px-4 py-2 mx-1 rounded ${activeTab === 'expenses' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          💰 Expenses ({history.expenses.length})
        </button>
      </div>
      
      {/* Content based on active tab */}
      <div className="mt-4">
        {activeTab === 'visitors' && (
          <div>
            <h2 className="text-xl font-bold mb-2">Visitor Entries</h2>
            {history.visitors.length === 0 ? (
              <p className="text-gray-500">No visitor entries today</p>
            ) : (
              <ul>
                {history.visitors.map((entry, index) => (
                  <li key={index} className="border p-3 mb-2 rounded shadow text-left">
                    <strong>Name:</strong> {entry.name}<br />
                    {showHindi && entry.nameHindi && entry.nameHindi !== entry.name && (
                      <span className="text-blue-600">हिंदी: {entry.nameHindi}<br /></span>
                    )}
                    <strong>Mobile:</strong> {entry.mobile}<br />
                    <strong>Purpose:</strong> {entry.purpose}<br />
                    {showHindi && entry.purposeHindi && entry.purposeHindi !== entry.purpose && (
                      <span className="text-blue-600">हिंदी: {entry.purposeHindi}<br /></span>
                    )}
                    <small className="text-gray-500">{new Date(entry.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {activeTab === 'general' && (
          <div>
            <h2 className="text-xl font-bold mb-2">General Entries</h2>
            {history.general.length === 0 ? (
              <p className="text-gray-500">No general entries today</p>
            ) : (
              <ul>
                {history.general.map((entry, index) => (
                  <li key={index} className="border p-3 mb-2 rounded shadow text-left">
                    <strong>Details:</strong> {entry.details}<br />
                    {showHindi && entry.detailsHindi && entry.detailsHindi !== entry.details && (
                      <span className="text-blue-600">हिंदी: {entry.detailsHindi}<br /></span>
                    )}
                    <strong>DateTime:</strong> {entry.datetime}<br />
                    {showHindi && entry.datetimeHindi && entry.datetimeHindi !== entry.datetime && (
                      <span className="text-blue-600">हिंदी: {entry.datetimeHindi}<br /></span>
                    )}
                    <small className="text-gray-500">{new Date(entry.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {activeTab === 'expenses' && (
          <div>
            <h2 className="text-xl font-bold mb-2">Expense Entries</h2>
            {history.expenses.length === 0 ? (
              <p className="text-gray-500">No expense entries today</p>
            ) : (
              <ul>
                {history.expenses.map((entry, index) => (
                  <li key={index} className="border p-3 mb-2 rounded shadow text-left">
                    <strong>Item:</strong> {entry.item}<br />
                    {showHindi && entry.itemHindi && entry.itemHindi !== entry.item && (
                      <span className="text-blue-600">हिंदी: {entry.itemHindi}<br /></span>
                    )}
                    <strong>Amount:</strong> ₹{entry.amount}<br />
                    <strong>DateTime:</strong> {entry.datetime}<br />
                    {showHindi && entry.datetimeHindi && entry.datetimeHindi !== entry.datetime && (
                      <span className="text-blue-600">हिंदी: {entry.datetimeHindi}<br /></span>
                    )}
                    <small className="text-gray-500">{new Date(entry.createdAt).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}