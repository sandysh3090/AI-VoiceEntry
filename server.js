const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const express = require('express');
const {parser} = require('./parser');


const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

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