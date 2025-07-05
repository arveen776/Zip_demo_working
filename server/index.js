const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory “database”
let quotes = [];

// Serve static client files
app.use(express.static(path.join(__dirname, '../client')));

// Employee submits a quote
app.post('/api/quotes', (req, res) => {
  const { name, desc, qty } = req.body;
  const costPerUnit = 42;  // placeholder logic
  const total = qty * costPerUnit;
  const quote = { id: Date.now(), name, desc, qty, total };
  quotes.push(quote);
  res.json(quote);
});

// Manager fetches all quotes
app.get('/api/quotes', (req, res) => {
  res.json(quotes);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
