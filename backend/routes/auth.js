const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const logger = require('../logger');
const { schemas, handleValidationErrors } = require('../middleware/validation');

// Register
router.post('/register', ...schemas.register, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedName = name?.trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [normalizedEmail]);
    if (existing.rows.length) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const userRole = ['host', 'customer'].includes(role) ? role : 'customer';
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role',
      [normalizedName, normalizedEmail, hashed, userRole, phone?.trim() || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    logger.error('Registration error:', { error: err.message, email: normalizedEmail });
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    if (err.code === '42P01' || err.code === '42703') {
      return res.status(500).json({ error: 'Database setup is incomplete. Run the setup/seed script, then try again.' });
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(500).json({ error: 'Cannot reach the database right now. Please try again in a moment.' });
    }
    res.status(500).json({ error: 'Registration failed. Please check your details and try again.' });
  }
});

// Login
router.post('/login', ...schemas.login, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    logger.error('Login error:', { error: err.message, email });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, phone FROM users WHERE id=$1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Get user error:', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
