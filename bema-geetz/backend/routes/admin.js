const express = require('express');
const router = express.Router();
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');

router.use(adminMiddleware);

// Stats
router.get('/stats', async (req, res) => {
  try {
    const [users, listings, bookings] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM listings'),
      pool.query('SELECT COUNT(*) FROM bookings')
    ]);
    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalListings: parseInt(listings.rows[0].count),
      totalBookings: parseInt(bookings.rows[0].count)
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// All users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// All listings
router.get('/listings', async (req, res) => {
  try {
    const result = await pool.query('SELECT l.*, u.name as host_name FROM listings l JOIN users u ON l.host_id = u.id ORDER BY l.created_at DESC');
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Delete listing
router.delete('/listings/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM listings WHERE id=$1', [req.params.id]);
    res.json({ message: 'Listing deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// All bookings
router.get('/bookings', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, l.title as listing_title, l.type as listing_type, l.price as listing_price FROM bookings b JOIN listings l ON b.listing_id = l.id ORDER BY b.created_at DESC'
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
router.patch('/bookings/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

module.exports = router;
