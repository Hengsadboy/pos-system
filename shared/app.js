// --- SHARED DATA STORE & REALTIME VPS SYNC ---
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

let db = DEFAULT_DATA;
let serverMode = false;
let lastScanTimestamp = 0;

// Load database initially from localStorage (fallback)
function initLocalDatabase() {
  try {
    const local = JSON.parse(localStorage.getItem('smart_pos_db'));
    if (local && local.products) {
      db = local;
    } else {
      db = DEFAULT_DATA;
      localStorage.setItem('smart_pos_db', JSON.stringify(db));
    }
  } catch (e) {
    db = DEFAULT_DATA;
  }
}
initLocalDatabase();

// Fetch database from VPS backend
async function fetchServerDB() {
  try {
    const res = await fetch('/api/db');
    if (res.ok) {
      const data = await res.json();
      serverMode = true;
      
      // If server database is different, update local database
      if (JSON.stringify(db) !== JSON.stringify(data)) {
        db = data;
        localStorage.setItem('smart_pos_db', JSON.stringify(db));
        if (typeof updatePageViews === 'function') {
          updatePageViews();
        }
      }
    }
  } catch (err) {
    serverMode = false; // Fallback to localStorage offline mode
  }
}

// Push local database updates to VPS backend
async function saveDB() {
  localStorage.setItem('smart_pos_db', JSON.stringify(db));
  
  if (typeof updatePageViews === 'function') {
    updatePageViews();
  }
  
  if (serverMode) {
    try {
      await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db)
      });
      logConsole('VPS Backend database synced successfully.', 'success');
    } catch (e) {
      logConsole('VPS Sync failed. Saved locally.', 'warning');
    }
  } else {
    logConsole('Saved locally (Offline Mode).', 'info');
  }
}

// Background sync loop (1.5 seconds intervals)
setInterval(() => {
  fetchServerDB();
  syncRemoteScans();
  syncGateClearances();
}, 1500);

// Sync mobile scans via VPS API
async function syncRemoteScans() {
  if (!serverMode) return;
  try {
    const res = await fetch('/api/scan');
    if (res.ok) {
      const data = await res.json();
      if (data.event && data.event.timestamp > lastScanTimestamp) {
        lastScanTimestamp = data.event.timestamp;
        
        // Trigger storage event locally to notify active page
        localStorage.setItem('remote_scan_event', JSON.stringify(data.event));
      }
    }
  } catch (e) {}
}

// Sync exit gate clearance status via VPS API
async function syncGateClearances() {
  if (!serverMode) return;
  try {
    // If gate status changes locally, upload it
    const localGateVal = localStorage.getItem('gate_clearance_active');
    const res = await fetch('/api/gate-clearance');
    if (res.ok) {
      const serverState = await res.json();
      
      if (localGateVal !== String(serverState.active)) {
        // Sync matching states
        if (localGateVal === 'true') {
          // Push local clearance to server
          await fetch('/api/gate-clearance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: true })
          });
        } else {
          // Load server clearance state locally
          localStorage.setItem('gate_clearance_active', String(serverState.active));
        }
      }
    }
  } catch (e) {}
}

// Global storage event listener
window.addEventListener('storage', (e) => {
  if (e.key === 'smart_pos_db') {
    try {
      db = JSON.parse(e.newValue);
      if (typeof updatePageViews === 'function') {
        updatePageViews();
      }
    } catch(err) {}
  }
});

function logConsole(message, type = 'system') {
  const consoleEl = document.getElementById('system-logs-console');
  if (!consoleEl) return;
  const time = new Date().toLocaleTimeString();
  const logLine = document.createElement('div');
  logLine.className = `log-line log-${type}`;
  logLine.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${message}</span>`;
  consoleEl.appendChild(logLine);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}
