const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

let db;

// Use /tmp for Render production, local directory for development
const getDbPath = () => {
  if (process.env.NODE_ENV === 'production') {
    // Render uses /tmp directory which is writable
    return '/tmp/re_mmogo.db';
  }
  return path.join(__dirname, '../../re_mmogo.db');
};

const initializeDatabase = async () => {
  const dbPath = getDbPath();
  console.log(`Initializing database at: ${dbPath}`);
  
  // Ensure directory exists for local development
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir) && dbDir !== '/tmp') {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Create tables
  await createTables();
  
  // Insert default data
  await seedDefaultData();

  console.log('Database initialized successfully at:', dbPath);
  return db;
};

const createTables = async () => {
  // Groups table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      registration_number VARCHAR(100) UNIQUE,
      description TEXT,
      monthly_contribution DECIMAL(10,2) DEFAULT 1000.00,
      interest_rate DECIMAL(5,2) DEFAULT 20.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Members table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      group_id INTEGER NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      join_date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    )
  `);

  // Users table (for authentication)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      is_signatory BOOLEAN DEFAULT 0,
      group_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
    )
  `);

  // Contributions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      month INTEGER,
      year INTEGER,
      payment_date DATE,
      proof_of_payment VARCHAR(500),
      status VARCHAR(50) DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // Loans table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      principal_amount DECIMAL(10,2) NOT NULL,
      balance DECIMAL(10,2) NOT NULL,
      interest_rate DECIMAL(5,2) DEFAULT 20.00,
      monthly_interest DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'pending',
      application_date DATE DEFAULT CURRENT_DATE,
      approval_date DATE,
      approved_by_signatory1 INTEGER,
      approved_by_signatory2 INTEGER,
      disbursement_date DATE,
      total_paid DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by_signatory1) REFERENCES users(id),
      FOREIGN KEY (approved_by_signatory2) REFERENCES users(id)
    )
  `);

  // Loan payments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS loan_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      interest_paid DECIMAL(10,2),
      principal_paid DECIMAL(10,2),
      payment_date DATE,
      proof_of_payment VARCHAR(500),
      status VARCHAR(50) DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
    CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_contributions_member ON contributions(member_id);
    CREATE INDEX IF NOT EXISTS idx_loans_member ON loans(member_id);
    CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
  `);

  console.log('Database tables created successfully');
};

const seedDefaultData = async () => {
  // Check if Bujumbura group exists
  const groupExists = await db.get('SELECT id FROM groups WHERE name = ?', ['Bujumbura']);
  
  if (!groupExists) {
    await db.run(
      'INSERT INTO groups (name, registration_number, description) VALUES (?, ?, ?)',
      ['Bujumbura', 'REG001', 'Bujumbura savings group']
    );
    console.log('Bujumbura group created');
  }

  // Add sample member for testing
  const memberExists = await db.get('SELECT id FROM members WHERE email = ?', ['phakowikabeng@gmail.com']);
  
  if (!memberExists) {
    const group = await db.get('SELECT id FROM groups WHERE name = ?', ['Bujumbura']);
    if (group) {
      await db.run(
        'INSERT INTO members (full_name, email, phone_number, group_id, status) VALUES (?, ?, ?, ?, ?)',
        ['Phakow Ikabeng', 'phakowikabeng@gmail.com', '75 497 611', group.id, 'active']
      );
      console.log('Sample member added');
    }
  }

  // Create default admin user with hashed password (password: Admin@123)
  const adminExists = await db.get('SELECT id FROM users WHERE email = ?', ['admin@remmogo.com']);
  
  if (!adminExists) {
    // This is a bcrypt hash of "Admin@123"
    const hashedPassword = '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.JZ5PJZwY5QvqRg6Q3YxVpV7wYfK';
    await db.run(
      'INSERT INTO users (email, password, full_name, role, is_signatory) VALUES (?, ?, ?, ?, ?)',
      ['admin@remmogo.com', hashedPassword, 'System Administrator', 'admin', 1]
    );
    console.log('Default admin user created');
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

module.exports = { initializeDatabase, getDb };