// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initializeDatabase, getDb } = require('./database/database');

const app = express();

// Basic middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Re-Mmogo API is running',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      health: '/health',
      test: '/api/test',
      groups: '/api/groups',
      members: '/api/members',
      contributions: '/api/contributions',
      loans: '/api/loans',
      reports: '/api/reports'
    }
  });
});

// Simple test route to verify API works
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/members', '/api/groups', '/api/contributions', '/api/loans']
  });
});

// Members endpoint (direct implementation for reliability)
app.get('/api/members', async (req, res) => {
  try {
    const db = getDb();
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
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch members' });
  }
});

app.post('/api/members', async (req, res) => {
  const { full_name, email, phone_number, group_name } = req.body;
  
  if (!full_name || !email || !phone_number || !group_name) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }
  
  try {
    const db = getDb();
    
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
  } catch (error) {
    console.error('Error creating member:', error);
    res.status(500).json({ success: false, error: 'Failed to add member' });
  }
});

// Groups endpoint
app.get('/api/groups', async (req, res) => {
  try {
    const db = getDb();
    const groups = await db.all('SELECT id, name FROM groups ORDER BY name');
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

// Dynamic route loading with better error handling
const routeFiles = ['auth', 'groups', 'members', 'contributions', 'loans', 'reports', 'uploads'];

routeFiles.forEach(routeFile => {
  try {
    const routePath = path.join(__dirname, 'routes', `${routeFile}.js`);
    const route = require(routePath);
    app.use(`/api/${routeFile}`, route);
    console.log(`Loaded route: /api/${routeFile}`);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log(`Route file not found: /api/${routeFile} (skipping)`);
    } else {
      console.error(`Failed to load route /api/${routeFile}:`, err.message);
    }
  }
});

// 404 handler for unmatched routes
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

// Start server
const PORT = process.env.PORT || 5000;

// Initialize database and start listening
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    
    // Verify database has default data
    const db = getDb();
    db.get('SELECT COUNT(*) as count FROM members')
      .then(result => {
        console.log(`Current members in database: ${result.count}`);
      })
      .catch(err => console.error('Error checking members count:', err.message));

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Test API: http://localhost:${PORT}/api/test`);
      console.log(`Members API: http://localhost:${PORT}/api/members`);
      console.log(`Groups API: http://localhost:${PORT}/api/groups`);
      console.log('Server is ready to accept requests');
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please close other applications using this port.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    console.error('Please check your database configuration');
    process.exit(1);
  });

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});