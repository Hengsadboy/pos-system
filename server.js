const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 80;

const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static(__dirname));

// Default database template if file doesn't exist
const DEFAULT_DATA = {
  products: [],
  categories: ['Drinks', 'Food', 'Snacks', 'Electronics', 'Cosmetics', 'Clothing', 'Home Supplies'],
  suppliers: [],
  customers: [
    { name: 'John Doe', phone: '012-345-678', cardNo: 'LOYAL-0001', points: 0, spending: 0 }
  ],
  employees: [
    { name: 'Chhay Heng', email: 'chhayheng@gmail.com', password: 'Heng@1188', role: 'Super Admin', permissions: 'Add/Delete Products, Edit Prices, Refund, Reports, Settings' },
    { name: 'POS-1 Terminal', email: 'pos1@test.com', password: 'Heng@1188', role: 'POS Kiosk', permissions: 'POS Scan, Self Checkout' },
    { name: 'POS-2 Terminal', email: 'pos2@test.com', password: 'Heng@1188', role: 'POS Kiosk', permissions: 'POS Scan, Self Checkout' },
    { name: 'Cashier-1 Terminal', email: 'cashier1@test.com', password: 'Heng@1188', role: 'Cashier', permissions: 'POS Scan, Checkout' }
  ],
  sales: [],
  inventoryHistory: [],
  settings: {
    storeName: 'StoreFront Pro',
    taxRate: 10,
    currency: '$',
    language: 'en'
  }
};

let gateClearanceActive = false;
let remoteScanEvent = null;

// Read database from file
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
      return DEFAULT_DATA;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return DEFAULT_DATA;
  }
}

// Write database to file
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

// API: Get Database
app.get('/api/db', (req, res) => {
  res.json(readDB());
});

// API: Save Database
app.post('/api/db', (req, res) => {
  const success = writeDB(req.body);
  res.json({ success });
});

// API: Remote Scanning Event Sync
app.get('/api/scan', (req, res) => {
  res.json({ event: remoteScanEvent });
});

app.post('/api/scan', (req, res) => {
  remoteScanEvent = req.body;
  res.json({ success: true });
});

// API: Exit Gate Clearance State
app.get('/api/gate-clearance', (req, res) => {
  res.json({ active: gateClearanceActive });
});

app.post('/api/gate-clearance', (req, res) => {
  gateClearanceActive = req.body.active;
  res.json({ success: true });
});

// Root route redirects to landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Smart POS Backend running at http://localhost:${PORT}`);
});
