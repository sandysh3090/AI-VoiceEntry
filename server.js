const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const express = require('express');
const {parser} = require('./parser');
const { OpenAI } = require('openai');

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const upload = multer({ dest: 'uploads/' });
const VISITOR_LOG = path.join(__dirname, 'visitor_log.json');

// Ensure visitor log file exists
if (!fs.existsSync(VISITOR_LOG)) {
  fs.writeFileSync(VISITOR_LOG, JSON.stringify([]));
}

app.get('/', (req, res) => {
  res.json({ message: 'this is root server you can try GET /demo and Post /demo...........' });
});

// Demo GET endpoint
app.get('/demo', (req, res) => {
  res.json({ message: 'GET request received!' });
});

// Demo POST endpoint
app.post('/demo', (req, res) => {
  const data = req.body;
  res.json({ message: 'POST request received!', data });
});

app.post('/ledger_parser', async (req, res) => {
  const data = req.body;
  const result = await parser(data.currentLedgersNames, data.lastYearLedgersNames);
  res.json(result);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 

// POST /api/voice - handle audio upload and processing
app.post('/voice', upload.single('audio'), async (req, res) => {
  try {
    console.log('Voice endpoint hit');
    console.log('Request file:', req.file);
    console.log('Request body:', req.body);
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No audio file uploaded' });
    }
    
    const audioPath = req.file.path;
    console.log('Audio path:', audioPath);

    // Send to OpenAI Whisper API
    console.log('Sending to OpenAI Whisper API...');
    
    // Create FormData for OpenAI API using form-data library
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath), {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-1');
    
    const whisperResponse = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        }
      }
    );
    console.log('Whisper response:', whisperResponse.data);

    const text = whisperResponse.data.text;
    console.log('Transcribed text:', text);

    // Extract structured data with GPT using structured JSON output
    const prompt = `
    You are a helpful assistant that extracts visitor information from transcribed voice recordings.

    Extract the visitor's name, mobile number, and purpose from the given text.
    The text may contain variations like:
    - "Visitor [Name], mobile number is [number] to [purpose]"
    - "[Name], mobile number is [number] to [purpose]"
    - "[Name], mobile [number], purpose [purpose]"
    - "purpose [purpose], [Name], mobile [number]"
    - "[number], purpose [purpose], [Name]"

    Return the result strictly in this JSON format:
    {
      "name": "visitor name",
      "mobile": "mobile number",
      "purpose": "visit purpose"
    }

    Here is the transcribed text: "${text}"

    Return only the result JSON and nothing else.
    `;

    console.log('Sending to GPT for extraction...');
    
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });

    const responseText = gptResponse.choices[0].message.content;
    console.log('GPT response:', responseText);
    
    // Try to parse JSON from the response
    let extractedData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to extract information using regex
        const nameMatch = responseText.match(/name["\s]*:["\s]*"([^"]+)"/i);
        const mobileMatch = responseText.match(/mobile["\s]*:["\s]*"([^"]+)"/i);
        const purposeMatch = responseText.match(/purpose["\s]*:["\s]*"([^"]+)"/i);
        
        extractedData = {
          name: nameMatch ? nameMatch[1] : 'Unknown',
          mobile: mobileMatch ? mobileMatch[1] : 'Unknown',
          purpose: purposeMatch ? purposeMatch[1] : 'Unknown'
        };
      }
    } catch (error) {
      console.log('Failed to parse JSON, using fallback extraction');
      // Fallback extraction from original text
      const nameMatch = text.match(/([A-Za-z\s]+)(?:,|\s+visiting|\s+visitor)/i);
      const mobileMatch = text.match(/mobile\s*number\s*is\s*(\d[\d\s]+)/i);
      const purposeMatch = text.match(/(?:to\s+|purpose\s+)([^.]+)/i);
      
      extractedData = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        mobile: mobileMatch ? mobileMatch[1].trim() : 'Unknown',
        purpose: purposeMatch ? purposeMatch[1].trim() : 'Unknown'
      };
    }
    
    console.log('Extracted data:', extractedData);
    // Create entry from extracted data
    const entry = {
      id: uuidv4(),
      name: extractedData.name,
      mobile: extractedData.mobile,
      purpose: extractedData.purpose,
      createdAt: new Date().toISOString()
    };

    console.log('Created entry:', entry);

    // Append to file
    const existing = JSON.parse(fs.readFileSync(VISITOR_LOG));
    existing.push(entry);
    fs.writeFileSync(VISITOR_LOG, JSON.stringify(existing, null, 2));

    res.json({ message: 'Visitor entry logged successfully.', entry });
  } catch (err) {
    console.error('Full error:', err);
    if (err.response) {
      console.error('OpenAI API Error:', err.response.data);
      res.status(500).json({ message: `OpenAI API Error: ${err.response.data.error?.message || 'Unknown error'}` });
    } else {
      res.status(500).json({ message: 'Error processing voice input.' });
    }
  }
});

// GET /api/history - return today's entries
app.get('/history', (req, res) => {
  const all = JSON.parse(fs.readFileSync(VISITOR_LOG));
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = all.filter(e => e.createdAt.startsWith(today));
  res.json(todayEntries);
});

