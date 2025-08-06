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
    
    // Check if text contains non-English characters and needs translation
    const hasNonEnglish = /[^\x00-\x7F]/.test(text);
    if (hasNonEnglish) {
      console.log('Detected non-English text, requesting translation...');
    }

    // Extract structured data with GPT using structured JSON output
    const prompt = `
    You are a helpful assistant that categorizes and extracts information from voice recordings.

    IMPORTANT: First translate the input to English if it's in any other language, then categorize and extract information.

    Categorize the entry into one of these types:
    1. "visitor" - for visitor entries (e.g., "sandeep came here for checkout our flats")
    2. "general" - for general tasks/meetings (e.g., "need to connect with bhavna on app status at 4 PM")
    3. "expense" - for expense entries (e.g., "Buy 2 kg Milk in 50 Rs")

    For each type, extract the relevant information in ENGLISH:

    VISITOR ENTRIES:
    - Extract: name, mobile, purpose
    - Example: "sandeep came here for checkout our flats" → type: "visitor", name: "sandeep", purpose: "checkout our flats"

    GENERAL ENTRIES:
    - Extract: details, datetime
    - Example: "need to connect with bhavna on app status at 4 PM" → type: "general", details: "need to connect with bhavna on app status", datetime: "4 PM"

    EXPENSE ENTRIES:
    - Extract: item, amount, datetime
    - Example: "Buy 2 kg Milk in 50 Rs" → type: "expense", item: "2 kg Milk", amount: "50", datetime: "now"

    INSTRUCTIONS:
    1. If the input is in Hindi, Urdu, or any other language, provide both original and English translation
    2. Categorize and extract the information
    3. Return the information in both original language and English
    4. For dates/times, provide both formats (e.g., "کل پانچ بجے" and "tomorrow at 5 PM")
    5. For the example you provided: "دھونا سے بات کرنی انٹریو کرلے کل پانچ بجے پائی پی ایم" should become:
       - type: "general"
       - details: "need to talk to Dhona for interview"
       - detailsHindi: "دھونا سے بات کرنی انٹریو کرلے"
       - datetime: "tomorrow at 5 PM"
       - datetimeHindi: "کل پانچ بجے"

    Return the result strictly in this JSON format:
    {
      "type": "visitor|general|expense",
      "name": "name (for visitor entries)",
      "nameHindi": "name in Hindi/Urdu (for visitor entries)",
      "mobile": "mobile number (for visitor entries)",
      "purpose": "purpose (for visitor entries)",
      "purposeHindi": "purpose in Hindi/Urdu (for visitor entries)",
      "details": "details (for general entries)",
      "detailsHindi": "details in Hindi/Urdu (for general entries)",
      "datetime": "datetime (for general/expense entries)",
      "datetimeHindi": "datetime in Hindi/Urdu (for general/expense entries)",
      "item": "item description (for expense entries)",
      "itemHindi": "item in Hindi/Urdu (for expense entries)",
      "amount": "amount in Rs (for expense entries)"
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
        // Fallback: try to extract information using regex for all types
        const typeMatch = responseText.match(/type["\s]*:["\s]*"([^"]+)"/i);
        const nameMatch = responseText.match(/name["\s]*:["\s]*"([^"]+)"/i);
        const mobileMatch = responseText.match(/mobile["\s]*:["\s]*"([^"]+)"/i);
        const purposeMatch = responseText.match(/purpose["\s]*:["\s]*"([^"]+)"/i);
        const detailsMatch = responseText.match(/details["\s]*:["\s]*"([^"]+)"/i);
        const datetimeMatch = responseText.match(/datetime["\s]*:["\s]*"([^"]+)"/i);
        const itemMatch = responseText.match(/item["\s]*:["\s]*"([^"]+)"/i);
        const amountMatch = responseText.match(/amount["\s]*:["\s]*"([^"]+)"/i);
        
        extractedData = {
          type: typeMatch ? typeMatch[1] : 'visitor',
          name: nameMatch ? nameMatch[1] : 'Unknown',
          mobile: mobileMatch ? mobileMatch[1] : 'Unknown',
          purpose: purposeMatch ? purposeMatch[1] : 'Unknown',
          details: detailsMatch ? detailsMatch[1] : 'Unknown',
          datetime: datetimeMatch ? datetimeMatch[1] : 'Unknown',
          item: itemMatch ? itemMatch[1] : 'Unknown',
          amount: amountMatch ? amountMatch[1] : 'Unknown'
        };
      }
    } catch (error) {
      console.log('Failed to parse JSON, using fallback extraction');
      // Fallback extraction from original text - try to determine type
      let type = 'visitor';
      
      // Check for common words in different languages
      const lowerText = text.toLowerCase();
      if (lowerText.includes('buy') || lowerText.includes('rs') || lowerText.includes('rupee') || 
          lowerText.includes('خرید') || lowerText.includes('روپے') || lowerText.includes('खरीद')) {
        type = 'expense';
      } else if (lowerText.includes('connect') || lowerText.includes('meeting') || lowerText.includes('call') ||
                 lowerText.includes('بات') || lowerText.includes('ملاقات') || lowerText.includes('कॉल')) {
        type = 'general';
      }
      
      if (type === 'visitor') {
        const nameMatch = text.match(/([A-Za-z\s]+)(?:,|\s+visiting|\s+visitor)/i);
        const mobileMatch = text.match(/mobile\s*number\s*is\s*(\d[\d\s]+)/i);
        const purposeMatch = text.match(/(?:to\s+|purpose\s+)([^.]+)/i);
        
        extractedData = {
          type: 'visitor',
          name: nameMatch ? nameMatch[1].trim() : 'Unknown',
          mobile: mobileMatch ? mobileMatch[1].trim() : 'Unknown',
          purpose: purposeMatch ? purposeMatch[1].trim() : 'Unknown'
        };
      } else if (type === 'general') {
        const detailsMatch = text.match(/(.+?)(?:\s+at\s+\d+|\s+on\s+)/i);
        const datetimeMatch = text.match(/(?:at\s+|on\s+)(.+)/i);
        
        extractedData = {
          type: 'general',
          details: detailsMatch ? detailsMatch[1].trim() : text,
          datetime: datetimeMatch ? datetimeMatch[1].trim() : 'Unknown'
        };
      } else if (type === 'expense') {
        const itemMatch = text.match(/(?:buy\s+|get\s+)(.+?)(?:\s+in\s+\d+|\s+for\s+\d+)/i);
        const amountMatch = text.match(/(?:in\s+|for\s+)(\d+)/i);
        
        extractedData = {
          type: 'expense',
          item: itemMatch ? itemMatch[1].trim() : 'Unknown',
          amount: amountMatch ? amountMatch[1].trim() : 'Unknown',
          datetime: 'now'
        };
      }
    }
    
    console.log('Extracted data:', extractedData);
    
    // Create entry based on type
    let entry;
    const currentTime = new Date().toISOString();
    
    if (extractedData.type === 'visitor') {
      entry = {
        id: uuidv4(),
        type: 'visitor',
        name: extractedData.name || 'Unknown',
        nameHindi: extractedData.nameHindi || extractedData.name || 'Unknown',
        mobile: extractedData.mobile || 'Unknown',
        purpose: extractedData.purpose || 'Unknown',
        purposeHindi: extractedData.purposeHindi || extractedData.purpose || 'Unknown',
        createdAt: currentTime
      };
    } else if (extractedData.type === 'general') {
      entry = {
        id: uuidv4(),
        type: 'general',
        details: extractedData.details || 'Unknown',
        detailsHindi: extractedData.detailsHindi || extractedData.details || 'Unknown',
        datetime: extractedData.datetime || 'Unknown',
        datetimeHindi: extractedData.datetimeHindi || extractedData.datetime || 'Unknown',
        createdAt: currentTime
      };
    } else if (extractedData.type === 'expense') {
      entry = {
        id: uuidv4(),
        type: 'expense',
        item: extractedData.item || 'Unknown',
        itemHindi: extractedData.itemHindi || extractedData.item || 'Unknown',
        amount: extractedData.amount || 'Unknown',
        datetime: extractedData.datetime || 'Unknown',
        datetimeHindi: extractedData.datetimeHindi || extractedData.datetime || 'Unknown',
        createdAt: currentTime
      };
    } else {
      // Fallback to visitor entry if type is not recognized
      entry = {
        id: uuidv4(),
        type: 'visitor',
        name: extractedData.name || 'Unknown',
        nameHindi: extractedData.nameHindi || extractedData.name || 'Unknown',
        mobile: extractedData.mobile || 'Unknown',
        purpose: extractedData.purpose || 'Unknown',
        purposeHindi: extractedData.purposeHindi || extractedData.purpose || 'Unknown',
        createdAt: currentTime
      };
    }

    console.log('Created entry:', entry);

    // Append to file
    const existing = JSON.parse(fs.readFileSync(VISITOR_LOG));
    existing.push(entry);
    fs.writeFileSync(VISITOR_LOG, JSON.stringify(existing, null, 2));

    const typeMessages = {
      'visitor': 'Visitor entry logged successfully.',
      'general': 'General entry logged successfully.',
      'expense': 'Expense entry logged successfully.'
    };

    res.json({ message: typeMessages[entry.type] || 'Entry logged successfully.', entry });
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

// GET /api/history - return today's entries categorized by type
app.get('/history', (req, res) => {
  const all = JSON.parse(fs.readFileSync(VISITOR_LOG));
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = all.filter(e => e.createdAt.startsWith(today));
  
  // Categorize entries by type
  const categorized = {
    visitors: todayEntries.filter(e => e.type === 'visitor'),
    general: todayEntries.filter(e => e.type === 'general'),
    expenses: todayEntries.filter(e => e.type === 'expense')
  };
  
  res.json(categorized);
});

