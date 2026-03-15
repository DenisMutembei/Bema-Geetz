const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, hostMiddleware } = require('../middleware/auth');

// Get all listings (public)
router.get('/', async (req, res) => {
  try {
    const { type, location, minPrice, maxPrice, search } = req.query;
    let query = 'SELECT l.*, u.name as host_name, u.phone as host_phone FROM listings l JOIN users u ON l.host_id = u.id WHERE l.available = true';
    const params = [];
    let idx = 1;
    if (type) { query += ` AND l.type = $${idx++}`; params.push(type); }
    if (location) { query += ` AND LOWER(l.location) LIKE $${idx++}`; params.push(`%${location.toLowerCase()}%`); }
    if (minPrice) { query += ` AND l.price >= $${idx++}`; params.push(minPrice); }
    if (maxPrice) { query += ` AND l.price <= $${idx++}`; params.push(maxPrice); }
    if (search) { query += ` AND (LOWER(l.title) LIKE $${idx} OR LOWER(l.description) LIKE $${idx++})`; params.push(`%${search.toLowerCase()}%`); }
    query += ' ORDER BY l.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT l.*, u.name as host_name, u.phone as host_phone, u.email as host_email FROM listings l JOIN users u ON l.host_id = u.id WHERE l.id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Listing not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create listing
router.post('/', hostMiddleware, async (req, res) => {
  try {
    const { title, type, price, location, images, description, make, model, year, bedrooms, bathrooms } = req.body;
    if (!title || !type || !price || !location) return res.status(400).json({ error: 'Required fields missing' });
    const result = await pool.query(
      `INSERT INTO listings (title, type, price, location, images, description, host_id, make, model, year, bedrooms, bathrooms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [title, type, price, location, images || [], description, req.user.id, make, model, year, bedrooms, bathrooms]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing
router.put('/:id', hostMiddleware, async (req, res) => {
  try {
    const { title, type, price, location, images, description, available, make, model, year, bedrooms, bathrooms } = req.body;
    const existing = await pool.query('SELECT * FROM listings WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
    if (existing.rows[0].host_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    const result = await pool.query(
      `UPDATE listings SET title=$1, type=$2, price=$3, location=$4, images=$5, description=$6, available=$7, make=$8, model=$9, year=$10, bedrooms=$11, bathrooms=$12 WHERE id=$13 RETURNING *`,
      [title, type, price, location, images, description, available, make, model, year, bedrooms, bathrooms, req.params.id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// Delete listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM listings WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
    if (existing.rows[0].host_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    await pool.query('DELETE FROM listings WHERE id=$1', [req.params.id]);
    res.json({ message: 'Listing deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// My listings (for host)
router.get('/host/mine', hostMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM listings WHERE host_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

module.exports = router;
