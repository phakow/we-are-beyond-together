const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint (required by Render)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Re-Mmogo API is running',
    version: '1.0.0',
    status: 'active',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      test: '/api/test',
      members: '/api/members',
      groups: '/api/groups'
    }
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/members', '/api/groups']
  });
});

// Initialize database with error handling
let db = null;

const initDatabase = async () => {
  try {
    const { initializeDatabase, getDb } = require('./database/database');
    await initializeDatabase();
    db = getDb();
    console.log('Database initialized successfully');
    
    // Test database connection
    const test = await db.get('SELECT 1 as test');
    console.log('Database connection verified:', test);
    
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.log('Running without database - using in-memory storage');
    return false;
  }
};

// In-memory storage fallback
let inMemoryMembers = [];

// Members endpoints
app.get('/api/members', async (req, res) => {
  try {
    if (db) {
      const members = await db.all(`
        SELECT 
          m.id,
          m.full_name as name,
          m.email,
          m.phone_number,
          g.name as group_name,
          m.status,
          m.join_date,
          m.created_at
        FROM members m
        LEFT JOIN groups g ON m.group_id = g.id
        ORDER BY m.created_at DESC
      `);
      res.json({ success: true, data: members });
    } else {
      // Fallback to in-memory storage
      res.json({ success: true, data: inMemoryMembers, fallback: true });
    }
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/members', async (req, res) => {
  const { full_name, email, phone_number, group_name } = req.body;
  
  if (!full_name || !email || !phone_number || !group_name) {
    return res.status(400).json({ 
      success: false, 
      error: 'All fields are required: full_name, email, phone_number, group_name' 
    });
  }
  
  try {
    if (db) {
      // Get group ID
      const group = await db.get('SELECT id FROM groups WHERE name = ?', [group_name]);
      if (!group) {
        return res.status(400).json({ success: false, error: 'Group not found' });
      }
      
      // Check if email exists
      const existingMember = await db.get('SELECT id FROM members WHERE email = ?', [email]);
      if (existingMember) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }
      
      // Insert member
      const result = await db.run(`
        INSERT INTO members (full_name, email, phone_number, group_id, status) 
        VALUES (?, ?, ?, ?, 'active')
      `, [full_name, email, phone_number, group.id]);
      
      // Get the new member
      const newMember = await db.get(`
        SELECT 
          m.id,
          m.full_name as name,
          m.email,
          m.phone_number,
          g.name as group_name,
          m.status,
          m.join_date
        FROM members m
        LEFT JOIN groups g ON m.group_id = g.id
        WHERE m.id = ?
      `, [result.lastID]);
      
      res.status(201).json({ success: true, data: newMember, message: 'Member added successfully' });
    } else {
      // Fallback to in-memory storage
      const newMember = {
        id: inMemoryMembers.length + 1,
        name: full_name,
        email: email,
        phone_number: phone_number,
        group_name: group_name,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0]
      };
      inMemoryMembers.push(newMember);
      res.status(201).json({ success: true, data: newMember, message: 'Member added (in-memory)' });
    }
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    if (db) {
      await db.run('DELETE FROM members WHERE id = ?', [req.params.id]);
      res.json({ success: true, message: 'Member deleted successfully' });
    } else {
      // In-memory deletion
      const index = inMemoryMembers.findIndex(m => m.id == req.params.id);
      if (index !== -1) {
        inMemoryMembers.splice(index, 1);
        res.json({ success: true, message: 'Member deleted successfully' });
      } else {
        res.status(404).json({ success: false, error: 'Member not found' });
      }
    }
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Groups endpoint
app.get('/api/groups', async (req, res) => {
  try {
    if (db) {
      const groups = await db.all('SELECT id, name FROM groups ORDER BY name');
      res.json({ success: true, data: groups });
    } else {
      // Fallback groups
      res.json({ success: true, data: [{ id: 1, name: 'Bujumbura' }] });
    }
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: `Route ${req.method} ${req.url} not found`,
    availableEndpoints: ['/health', '/api/test', '/api/members', '/api/groups']
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Start server with database initialization
const startServer = async () => {
  await initDatabase();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Test API: http://localhost:${PORT}/api/test`);
    console.log(`Members API: http://localhost:${PORT}/api/members`);
    console.log(`Groups API: http://localhost:${PORT}/api/groups`);
  });
};

startServer();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});