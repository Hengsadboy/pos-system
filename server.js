const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'database.db');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Connect to SQLite Database
const dbConnection = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', DB_FILE);
    initializeDatabase();
  }
});

// Default database template if db is empty
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

// Initialize SQLite table and default dataset
function initializeDatabase() {
  dbConnection.serialize(() => {
    dbConnection.run(`
      CREATE TABLE IF NOT EXISTS store_data (
        key TEXT PRIMARY KEY,
        val TEXT
      )
    `);

    // Check if default data is already inserted
    dbConnection.get("SELECT val FROM store_data WHERE key = 'pos_dataset'", (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      if (!row) {
        dbConnection.run(
          "INSERT INTO store_data (key, val) VALUES ('pos_dataset', ?)",
          [JSON.stringify(DEFAULT_DATA)],
          (insertErr) => {
            if (insertErr) console.error('Failed to initialize default store dataset:', insertErr.message);
            else console.log('SQLite database initialized with default template accounts.');
          }
        );
      }
    });
  });
}

// API: Get Database from SQLite
app.get('/api/db', (req, res) => {
  dbConnection.get("SELECT val FROM store_data WHERE key = 'pos_dataset'", (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.json(DEFAULT_DATA);
    }
    try {
      res.json(JSON.parse(row.val));
    } catch (e) {
      res.json(DEFAULT_DATA);
    }
  });
});

// API: Save Database to SQLite
app.post('/api/db', (req, res) => {
  const jsonStr = JSON.stringify(req.body);
  dbConnection.run(
    "INSERT OR REPLACE INTO store_data (key, val) VALUES ('pos_dataset', ?)",
    [jsonStr],
    (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    }
  );
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
  console.log(`Smart POS SQLite Backend running at http://localhost:${PORT}`);
});
