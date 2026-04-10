import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { exec, prepare, transaction } from './db-wrapper';

export function initializeDatabase(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','manager','staff','viewer')),
      department TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      revoked INTEGER NOT NULL DEFAULT 0
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      name TEXT NOT NULL DEFAULT 'Myanmar Supply Chain Co., Ltd.',
      phone TEXT DEFAULT '+95-9-123456789',
      email TEXT DEFAULT 'info@myanmarscm.mm',
      address TEXT DEFAULT 'No. 123, Bogyoke Aung San Road, Pabedan Tsp, Yangon',
      currency TEXT DEFAULT 'MMK',
      language TEXT DEFAULT 'en_mm',
      fiscal_year_start TEXT DEFAULT 'January',
      logo_path TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity TEXT,
      manager TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_mm TEXT,
      location TEXT,
      township TEXT,
      city TEXT,
      category TEXT,
      rating REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      phone TEXT,
      email TEXT,
      on_time_delivery REAL DEFAULT 0,
      avg_lead_time INTEGER DEFAULT 0,
      region TEXT CHECK(region IN ('upper','lower')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      sku TEXT UNIQUE NOT NULL,
      name_en TEXT NOT NULL,
      name_mm TEXT,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      unit TEXT NOT NULL,
      min_stock INTEGER NOT NULL DEFAULT 0,
      warehouse_name TEXT,
      unit_price REAL NOT NULL DEFAULT 0,
      supplier_name TEXT,
      stock_status TEXT NOT NULL DEFAULT 'sufficient' CHECK(stock_status IN ('sufficient','low','critical')),
      last_updated TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT UNIQUE NOT NULL,
      supplier_name TEXT NOT NULL,
      order_date TEXT NOT NULL,
      expected_delivery TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      items_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','approved','received','delivered','cancelled')),
      warehouse TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id TEXT PRIMARY KEY,
      po_id TEXT NOT NULL,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS purchase_receipts (
      id TEXT PRIMARY KEY,
      po_id TEXT UNIQUE NOT NULL,
      received_at TEXT NOT NULL DEFAULT (datetime('now')),
      posted_by TEXT
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      so_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      order_date TEXT NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0,
      items_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('draft','confirmed','fulfilled','cancelled')),
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS sales_order_items (
      id TEXT PRIMARY KEY,
      so_id TEXT NOT NULL,
      inventory_item_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      sales_order_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid','partial','paid','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('in','out')),
      qty INTEGER NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS accounting_entries (
      id TEXT PRIMARY KEY,
      entry_type TEXT NOT NULL CHECK(entry_type IN ('inflow','outflow')),
      category TEXT NOT NULL,
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      entry_date TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      shipment_id TEXT UNIQUE NOT NULL,
      from_en TEXT NOT NULL,
      from_mm TEXT,
      to_en TEXT NOT NULL,
      to_mm TEXT,
      carrier TEXT,
      dispatch_date TEXT,
      eta TEXT,
      status TEXT NOT NULL DEFAULT 'ordered' CHECK(status IN ('ordered','dispatched','in_transit','customs','delivered')),
      tracking_number TEXT,
      days_remaining INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS shipment_items (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      description TEXT NOT NULL
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS gps_locations (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      speed REAL,
      heading REAL,
      accuracy REAL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(shipment_id)
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      payment_id TEXT UNIQUE NOT NULL,
      supplier_name TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL CHECK(method IN ('Bank Transfer','Check','Cash','Mobile Banking')),
      reference TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('completed','pending','failed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      low_stock_email INTEGER DEFAULT 1,
      low_stock_sms INTEGER DEFAULT 0,
      new_po_email INTEGER DEFAULT 1,
      new_po_sms INTEGER DEFAULT 1,
      shipment_delayed_email INTEGER DEFAULT 1,
      shipment_delayed_sms INTEGER DEFAULT 1,
      payment_due_email INTEGER DEFAULT 1,
      payment_due_sms INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      feature TEXT NOT NULL,
      allowed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(role, feature)
    )
  `);

  exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Indexes
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory_items(sku)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_items(warehouse_name)',
    'CREATE INDEX IF NOT EXISTS idx_inventory_stock_status ON inventory_items(stock_status)',
    'CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_po_receipts_po_id ON purchase_receipts(po_id)',
    'CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_name)',
    'CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)',
    'CREATE INDEX IF NOT EXISTS idx_so_status ON sales_orders(status)',
    'CREATE INDEX IF NOT EXISTS idx_so_customer ON sales_orders(customer_name)',
    'CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoices(status)',
    'CREATE INDEX IF NOT EXISTS idx_invoice_so ON invoices(sales_order_id)',
    'CREATE INDEX IF NOT EXISTS idx_inv_mov_item ON inventory_movements(item_id)',
    'CREATE INDEX IF NOT EXISTS idx_inv_mov_ref ON inventory_movements(reference_type, reference_id)',
    'CREATE INDEX IF NOT EXISTS idx_acct_type ON accounting_entries(entry_type)',
    'CREATE INDEX IF NOT EXISTS idx_acct_ref ON accounting_entries(reference_type, reference_id)',
    'CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category)',
    'CREATE INDEX IF NOT EXISTS idx_suppliers_region ON suppliers(region)',
    'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
    'CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date)',
    'CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)',
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)',
  ];
  for (const idx of indexes) {
    exec(idx);
  }
}

export function seedDatabase(): void {
  const userCount = prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  transaction(() => {
    // Users
    const adminHash = bcrypt.hashSync('csm!@#1256', 12);
    const defaultHash = bcrypt.hashSync('Change@Me2024!', 12);
    const users = [
      [uuidv4(), 'csmmaster', 'admin@myanmarscm.mm', adminHash, 'Aung Min', 'admin', 'Management', 'active', '2024-01-15 09:30'],
      [uuidv4(), 'khinmar', 'khinmar@myanmarscm.mm', defaultHash, 'Khin Mar', 'manager', 'Inventory', 'active', '2024-01-15 08:15'],
      [uuidv4(), 'zawhtet', 'zawhtet@myanmarscm.mm', defaultHash, 'Zaw Htet', 'staff', 'Warehouse', 'active', '2024-01-14 16:45'],
      [uuidv4(), 'myatnoe', 'myatnoe@myanmarscm.mm', defaultHash, 'Myat Noe', 'viewer', 'Finance', 'inactive', '2024-01-10 11:00'],
      [uuidv4(), 'thidawin', 'thidawin@myanmarscm.mm', defaultHash, 'Thida Win', 'staff', 'Procurement', 'active', '2024-01-15 07:00'],
    ];
    for (const u of users) {
      prepare('INSERT INTO users (id, username, email, password_hash, full_name, role, department, status, last_login) VALUES (?,?,?,?,?,?,?,?,?)').run(...u);
    }

    // Company settings
    prepare(`INSERT OR IGNORE INTO company_settings (id, name, phone, email, address, currency, language, fiscal_year_start)
      VALUES ('default', 'Myanmar Supply Chain Co., Ltd.', '+95-9-123456789', 'info@myanmarscm.mm',
              'No. 123, Bogyoke Aung San Road, Pabedan Tsp, Yangon', 'MMK', 'en_mm', 'January')`).run();

    // Warehouses
    const warehouseData = [
      ['Yangon Main', 'Insein Township, Yangon', '10,000 sqft', 'U Kyaw Zin'],
      ['Mandalay Hub', 'Chanmyathazi, Mandalay', '8,000 sqft', 'U Aung Naing'],
      ['Bago Depot', 'Bago Township, Bago', '5,000 sqft', 'U Min Thu'],
      ['Mawlamyine Store', 'Mawlamyine, Mon State', '3,000 sqft', 'U Soe Lin'],
    ];
    for (const w of warehouseData) {
      prepare('INSERT INTO warehouses (id, name, location, capacity, manager) VALUES (?,?,?,?,?)').run(uuidv4(), ...w);
    }

    // Suppliers
    const suppliersData = [
      ['Myanmar Rice Corp', 'မြန်မာဆန်ကုမ္ပဏီ', 'Insein', 'Insein', 'Yangon', 'Food', 4.5, 45, '+95-9-123456789', 'contact@myanmarrice.mm', 92, 5, 'lower'],
      ['Shwe Yadanar Trading', 'ရွှေရတနာကုန်သည်', 'Bayintnaung', 'Mayangone', 'Yangon', 'General', 4.2, 38, '+95-9-987654321', 'info@shweyadanar.mm', 88, 7, 'lower'],
      ['KBZ Wholesale', 'ကမ္ဘောဇလက်ကား', 'Chanmyathazi', 'Chanmyathazi', 'Mandalay', 'General', 4.7, 62, '+95-9-111222333', 'wholesale@kbz.mm', 95, 4, 'upper'],
      ['Amarapura Textiles', 'အမရပူရပိုးထည်', 'Amarapura', 'Amarapura', 'Mandalay', 'Textile', 4.8, 28, '+95-9-444555666', 'sales@amarapura-tex.mm', 97, 10, 'upper'],
      ['Shan Tea Garden', 'ရှမ်းလက်ဖက်ခြံ', 'Namhsan', 'Namhsan', 'Taunggyi', 'Food', 4.3, 22, '+95-9-777888999', 'info@shantea.mm', 85, 8, 'upper'],
      ['Delta Fisheries', 'ဒေးလ်တာငါးလုပ်ငန်း', 'Myaungmya', 'Myaungmya', 'Pathein', 'Food', 3.9, 31, '+95-9-222333444', 'sales@deltafisheries.mm', 78, 6, 'lower'],
      ['Bagan Lacquer Works', 'ပုဂံယွန်းထည်', 'Myinkaba', 'Nyaung-U', 'Bagan', 'Handicraft', 4.9, 15, '+95-9-555666777', 'order@baganlacquer.mm', 90, 14, 'upper'],
      ['Mon Rubber Co', 'မွန်ရာဘာကုမ္ပဏီ', 'Mawlamyine', 'Mawlamyine', 'Mawlamyine', 'Raw Material', 4.1, 19, '+95-9-888999000', 'info@monrubber.mm', 82, 9, 'lower'],
      ['Sagaing Timber Co', 'စစ်ကိုင်းသစ်ကုမ္ပဏီ', 'Sagaing', 'Sagaing', 'Sagaing', 'Raw Material', 4.0, 12, '+95-9-333444555', 'sales@sagaingtimber.mm', 80, 12, 'upper'],
      ['Meiktila Spice Co', 'မိတ္ထီလာအမွှေးအကြိုင်', 'Meiktila', 'Meiktila', 'Meiktila', 'Spices', 4.4, 27, '+95-9-666777888', 'info@meiktilaspice.mm', 91, 6, 'upper'],
      ['Shwe Oil Trading', 'ရွှေဆီကုန်သည်', 'Hlaingthaya', 'Hlaingthaya', 'Yangon', 'Food', 3.8, 41, '+95-9-999000111', 'contact@shweoil.mm', 75, 5, 'lower'],
      ['Ayeyarwady Palm Co', 'ဧရာဝတီထန်းကုမ္ပဏီ', 'Pathein', 'Pathein', 'Pathein', 'Food', 4.0, 18, '+95-9-112233445', 'info@ayepalm.mm', 83, 7, 'lower'],
      ['Shwebo Thanaka Co', 'ရွှေဘိုသနပ်ခါး', 'Shwebo', 'Shwebo', 'Shwebo', 'Cosmetics', 4.6, 33, '+95-9-556677889', 'sales@shwebothanaka.mm', 93, 8, 'upper'],
      ['Bago Cheroot Mfg', 'ပဲခူးဆေးလိပ်', 'Bago', 'Bago', 'Bago', 'Tobacco', 3.7, 20, '+95-9-998877665', 'info@bagocheroot.mm', 79, 5, 'lower'],
    ];
    for (const s of suppliersData) {
      prepare('INSERT INTO suppliers (id, name_en, name_mm, location, township, city, category, rating, total_orders, phone, email, on_time_delivery, avg_lead_time, region) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(uuidv4(), ...s);
    }

    // Inventory
    const inventoryData = [
      ['RICE-001', 'Jasmine Rice', 'ဆန် (ပေါင်းမ)', 'Food', 5000, 'kg', 1000, 'Yangon Main', 2500, 'Myanmar Rice Corp', 'sufficient', '2024-01-15'],
      ['OIL-001', 'Cooking Oil', 'ဆီ', 'Food', 200, 'liter', 500, 'Yangon Main', 5000, 'Shwe Oil Trading', 'critical', '2024-01-14'],
      ['LGY-001', 'Longyi (Men)', 'လုံချည် (ယောက်ျားသုံး)', 'Textile', 350, 'pcs', 100, 'Mandalay Hub', 15000, 'Amarapura Textiles', 'sufficient', '2024-01-13'],
      ['THK-001', 'Thanaka', 'သနပ်ခါး', 'Cosmetics', 80, 'kg', 100, 'Mandalay Hub', 8000, 'Shwebo Thanaka Co', 'low', '2024-01-12'],
      ['TEA-001', 'Green Tea Leaves', 'လက်ဖက်ခြောက်', 'Food', 1500, 'kg', 300, 'Yangon Main', 12000, 'Shan Tea Garden', 'sufficient', '2024-01-11'],
      ['NUT-001', 'Betel Nut', 'ကွမ်းသီး', 'Food', 45, 'kg', 200, 'Bago Depot', 6000, 'Bago Cheroot Mfg', 'critical', '2024-01-10'],
      ['CHR-001', 'Cheroot Cigars', 'ဆေးလိပ်', 'Tobacco', 2000, 'pcs', 500, 'Bago Depot', 500, 'Bago Cheroot Mfg', 'sufficient', '2024-01-09'],
      ['FIS-001', 'Dried Fish', 'ငါးခြောက်', 'Food', 150, 'kg', 200, 'Yangon Main', 18000, 'Delta Fisheries', 'low', '2024-01-08'],
      ['SPN-001', 'Shrimp Paste', 'ငါးပိ', 'Food', 800, 'kg', 200, 'Yangon Main', 7000, 'Delta Fisheries', 'sufficient', '2024-01-07'],
      ['TRM-001', 'Turmeric Powder', 'နန်နံဖြူမှုန့်', 'Spices', 300, 'kg', 100, 'Mandalay Hub', 9000, 'Meiktila Spice Co', 'sufficient', '2024-01-06'],
      ['JGY-001', 'Jaggery (Palm Sugar)', 'ထန်းလျက်', 'Food', 90, 'kg', 150, 'Bago Depot', 4000, 'Ayeyarwady Palm Co', 'low', '2024-01-05'],
      ['LAC-001', 'Lacquerware Bowl', 'ယွန်းထည်', 'Handicraft', 60, 'pcs', 20, 'Mandalay Hub', 35000, 'Bagan Lacquer Works', 'sufficient', '2024-01-04'],
      ['SLK-001', 'Silk Fabric', 'ပိုးထည်', 'Textile', 25, 'meter', 50, 'Mandalay Hub', 45000, 'Amarapura Textiles', 'critical', '2024-01-03'],
      ['RBR-001', 'Natural Rubber', 'ရာဘာ', 'Raw Material', 2000, 'kg', 500, 'Mawlamyine Store', 3500, 'Mon Rubber Co', 'sufficient', '2024-01-02'],
      ['TKW-001', 'Teak Wood Planks', 'ကျွန်းသစ်ခုံ', 'Raw Material', 120, 'pcs', 50, 'Mandalay Hub', 120000, 'Sagaing Timber Co', 'sufficient', '2024-01-01'],
      ['CHL-001', 'Chili Flakes', 'ငရုတ်သီးအကြွပ်', 'Spices', 400, 'kg', 100, 'Yangon Main', 11000, 'Meiktila Spice Co', 'sufficient', '2024-01-15'],
    ];
    for (const item of inventoryData) {
      prepare('INSERT INTO inventory_items (id, sku, name_en, name_mm, category, quantity, unit, min_stock, warehouse_name, unit_price, supplier_name, stock_status, last_updated) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(uuidv4(), ...item);
    }

    // Purchase Orders
    const poData = [
      ['PO-2024-001', 'Myanmar Rice Corp', '2024-01-15', '2024-01-25', 12500000, 3, 'pending'],
      ['PO-2024-002', 'Shwe Yadanar Trading', '2024-01-14', '2024-01-22', 8750000, 5, 'confirmed'],
      ['PO-2024-003', 'KBZ Wholesale', '2024-01-12', '2024-01-20', 3200000, 2, 'delivered'],
      ['PO-2024-004', 'Amarapura Textiles', '2024-01-10', '2024-01-28', 6800000, 4, 'approved'],
      ['PO-2024-005', 'Shan Tea Garden', '2024-01-08', '2024-01-18', 4500000, 2, 'received'],
      ['PO-2024-006', 'Delta Fisheries', '2024-01-06', '2024-01-16', 2100000, 3, 'cancelled'],
      ['PO-2024-007', 'Bagan Lacquer Works', '2024-01-05', '2024-02-01', 5600000, 6, 'pending'],
      ['PO-2024-008', 'Mon Rubber Co', '2024-01-04', '2024-01-24', 7000000, 1, 'confirmed'],
      ['PO-2024-009', 'Sagaing Timber Co', '2024-01-03', '2024-01-30', 14400000, 2, 'approved'],
      ['PO-2024-010', 'Meiktila Spice Co', '2024-01-02', '2024-01-12', 1800000, 4, 'delivered'],
      ['PO-2024-011', 'Shwe Oil Trading', '2024-01-01', '2024-01-15', 9200000, 2, 'pending'],
    ];
    for (const po of poData) {
      const poId = uuidv4();
      prepare('INSERT INTO purchase_orders (id, po_number, supplier_name, order_date, expected_delivery, total_amount, items_count, status) VALUES (?,?,?,?,?,?,?,?)').run(poId, ...po);
      if (po[0] === 'PO-2024-001') {
        prepare('INSERT INTO purchase_order_items (id, po_id, name, qty, unit_price, total) VALUES (?,?,?,?,?,?)').run(uuidv4(), poId, 'Jasmine Rice', 5000, 2500, 12500000);
      }
    }

    // Shipments
    const shipmentData = [
      ['SHP-001', 'Yangon', 'ရန်ကုန်', 'Mandalay', 'မန္တလေး', 'Myanmar Express Logistics', '2024-01-14', '2024-01-17', 'in_transit', 'MEL-20240114-001', 2],
      ['SHP-002', 'Mandalay', 'မန္တလေး', 'Naypyidaw', 'နေပြည်တော်', 'KBZ Express', '2024-01-13', '2024-01-15', 'customs', 'KBZ-20240113-002', 1],
      ['SHP-003', 'Bago', 'ပဲခူး', 'Yangon', 'ရန်ကုန်', 'Golden Truck Co', '2024-01-12', '2024-01-13', 'delivered', 'GTC-20240112-003', 0],
      ['SHP-004', 'Mawlamyine', 'မော်လမြိုင်', 'Yangon', 'ရန်ကုန်', 'Delta Shipping', '2024-01-15', '2024-01-20', 'dispatched', 'DS-20240115-004', 5],
      ['SHP-005', 'Taunggyi', 'တောင်ကြီး', 'Mandalay', 'မန္တလေး', 'Shan Express', '2024-01-10', '2024-01-14', 'in_transit', 'SE-20240110-005', 0],
      ['SHP-006', 'Yangon', 'ရန်ကုန်', 'Bago', 'ပဲခူး', 'Myanmar Express Logistics', '2024-01-16', '2024-01-18', 'ordered', 'MEL-20240116-006', 3],
    ];
    const shipmentItems: Record<string, string[]> = {
      'SHP-001': ['Jasmine Rice x5000kg'],
      'SHP-002': ['Longyi x350pcs'],
      'SHP-003': ['Cheroot Cigars x2000pcs'],
      'SHP-004': ['Natural Rubber x2000kg'],
      'SHP-005': ['Green Tea x1500kg'],
      'SHP-006': ['Cooking Oil x500L'],
    };
    for (const s of shipmentData) {
      const id = uuidv4();
      prepare('INSERT INTO shipments (id, shipment_id, from_en, from_mm, to_en, to_mm, carrier, dispatch_date, eta, status, tracking_number, days_remaining) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(id, ...s);
      const items = shipmentItems[s[0] as string] || [];
      for (const item of items) {
        prepare('INSERT INTO shipment_items (id, shipment_id, description) VALUES (?,?,?)').run(uuidv4(), id, item);
      }
    }

    // Payments
    const paymentData = [
      ['PAY-001', 'Myanmar Rice Corp', '2024-01-15', 12500000, 'Bank Transfer', 'KBZ-TXN-001', 'completed'],
      ['PAY-002', 'Shwe Yadanar Trading', '2024-01-14', 8750000, 'Check', 'CHK-2024-002', 'pending'],
      ['PAY-003', 'Amarapura Textiles', '2024-01-12', 6800000, 'Bank Transfer', 'AYA-TXN-003', 'completed'],
      ['PAY-004', 'Delta Fisheries', '2024-01-10', 2100000, 'Cash', 'CASH-004', 'completed'],
      ['PAY-005', 'Shan Tea Garden', '2024-01-08', 4500000, 'Bank Transfer', 'CB-TXN-005', 'failed'],
      ['PAY-006', 'KBZ Wholesale', '2024-01-06', 3200000, 'Mobile Banking', 'WAVE-006', 'completed'],
      ['PAY-007', 'Mon Rubber Co', '2024-01-04', 7000000, 'Bank Transfer', 'KBZ-TXN-007', 'pending'],
    ];
    for (const p of paymentData) {
      prepare('INSERT INTO payments (id, payment_id, supplier_name, date, amount, method, reference, status) VALUES (?,?,?,?,?,?,?,?)').run(uuidv4(), ...p);
    }

    // Role permissions
    const permData = [
      { feature: 'Dashboard', admin: 1, manager: 1, staff: 1, viewer: 1 },
      { feature: 'Inventory', admin: 1, manager: 1, staff: 1, viewer: 0 },
      { feature: 'Purchase Orders', admin: 1, manager: 1, staff: 0, viewer: 0 },
      { feature: 'Shipments', admin: 1, manager: 1, staff: 1, viewer: 1 },
      { feature: 'Reports', admin: 1, manager: 1, staff: 0, viewer: 0 },
      { feature: 'Settings', admin: 1, manager: 0, staff: 0, viewer: 0 },
    ];
    for (const p of permData) {
      for (const role of ['admin', 'manager', 'staff', 'viewer'] as const) {
        prepare('INSERT OR IGNORE INTO role_permissions (id, role, feature, allowed) VALUES (?,?,?,?)').run(uuidv4(), role, p.feature, p[role]);
      }
    }

    // Notification preferences for admin
    const adminUser = prepare('SELECT id FROM users WHERE role = ?').get('admin') as { id: string } | undefined;
    if (adminUser) {
      prepare('INSERT OR IGNORE INTO notification_preferences (id, user_id) VALUES (?,?)').run(uuidv4(), adminUser.id);
    }
  });

  console.log('Database seeded successfully.');
}
