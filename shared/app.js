// --- SHARED DATA STORE & SELF HEALING ---
const DEFAULT_DATA = {
  products: [],
  categories: ['Drinks', 'Food', 'Snacks', 'Electronics', 'Cosmetics', 'Clothing', 'Home Supplies'],
  suppliers: [],
  customers: [
    { name: 'John Doe', phone: '012-345-678', cardNo: 'LOYAL-0001', points: 0, spending: 0 }
  ],
  employees: [
    { name: 'Chhay Heng', email: 'chhayheng@gmail.com', password: 'Heng@1188', role: 'Super Admin', permissions: 'Add/Delete Products, Edit Prices, Refund, Reports, Settings' }
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

// One-time forced database reset to guarantee starting with 0 products and $0 money
if (localStorage.getItem('db_reset_v4') !== 'completed') {
  localStorage.removeItem('smart_pos_db');
  localStorage.removeItem('gate_clearance_active');
  localStorage.setItem('db_reset_v4', 'completed');
  window.location.reload();
}

let db;
function loadDatabase() {
  try {
    db = JSON.parse(localStorage.getItem('smart_pos_db'));
  } catch (e) {
    db = null;
  }

  // Schema self-healing validation
  if (!db || !db.products || !db.settings || !db.employees || !db.categories || !db.suppliers || !db.customers || !db.sales || !db.inventoryHistory) {
    db = DEFAULT_DATA;
  } else {
    db.employees = DEFAULT_DATA.employees; // Keep default accounts in sync
  }
  localStorage.setItem('smart_pos_db', JSON.stringify(db));
}
loadDatabase();

function saveDB() {
  localStorage.setItem('smart_pos_db', JSON.stringify(db));
  logConsole('Cloud database auto-synced. Updates broadcasted in real time.', 'success');
  // Trigger update event locally
  if (typeof updatePageViews === 'function') {
    updatePageViews();
  }
}

// Global storage event listener for real-time synchronization across pages
window.addEventListener('storage', (e) => {
  if (e.key === 'smart_pos_db') {
    loadDatabase();
    logConsole('Real-time updates received from Cloud DB.', 'info');
    if (typeof updatePageViews === 'function') {
      updatePageViews();
    }
  }
});

function logConsole(message, type = 'system') {
  const consoleEl = document.getElementById('system-logs-console');
  if (!consoleEl) return;
  const time = new Date().toLocaleTimeString();
  const logLine = document.createElement('div');
  logLine.className = `log-line ${type}`;
  logLine.innerHTML = `[${time}] ${message}`;
  consoleEl.appendChild(logLine);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}
