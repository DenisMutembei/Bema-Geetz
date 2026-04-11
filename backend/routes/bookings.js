const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

const getOptionalUserId = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
};

router.post('/', async (req, res) => {
  try {
    const { customer_name, phone, email, listing_id, check_in, check_out, message } = req.body;
    if (!customer_name || !phone || !email || !listing_id) return res.status(400).json({ error: 'Required fields missing' });
    const listing = await pool.query('SELECT * FROM listings WHERE id=$1', [listing_id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    const invoice_id = `BG-${Date.now()}`;
    const userId = getOptionalUserId(req);
    const result = await pool.query(
      `INSERT INTO bookings (user_id, customer_name, phone, email, listing_id, invoice_id, check_in, check_out, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, customer_name, phone, email, listing_id, invoice_id, check_in || null, check_out || null, message || null]
    );
    const booking = result.rows[0];
    const listingData = listing.rows[0];
    const waNumber = process.env.WHATSAPP_NUMBER || '254700000000';
    const waText = encodeURIComponent(
      `NEW BOOKING - ${invoice_id}\n\nCustomer: ${customer_name}\nPhone: ${phone}\nEmail: ${email}\n\nListing: ${listingData.title}\nLocation: ${listingData.location}\nPrice: KES ${listingData.price}/day\n\nCheck-in: ${check_in || 'TBD'}\nCheck-out: ${check_out || 'TBD'}\n\nMessage: ${message || 'None'}`
    );
    const whatsappUrl = `https://wa.me/${waNumber}?text=${waText}`;
    res.status(201).json({ ...booking, whatsappUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         b.*,
         l.title AS listing_title,
         l.location AS listing_location,
         l.type AS listing_type,
         l.price AS listing_price,
         l.images AS listing_images
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch your bookings' });
  }
});

router.get('/listing/:listingId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT b.*, l.title as listing_title FROM bookings b JOIN listings l ON b.listing_id = l.id WHERE b.listing_id=$1 ORDER BY b.created_at DESC',
      [req.params.listingId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
