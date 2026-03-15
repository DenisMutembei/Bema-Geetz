const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create booking (public)
router.post('/', async (req, res) => {
  try {
    const { customer_name, phone, email, listing_id, check_in, check_out, message } = req.body;
    if (!customer_name || !phone || !email || !listing_id) return res.status(400).json({ error: 'Required fields missing' });
    const listing = await pool.query('SELECT * FROM listings WHERE id=$1', [listing_id]);
    if (!listing.rows.length) return res.status(404).json({ error: 'Listing not found' });
    const invoice_id = `BG-${Date.now()}`;
    const result = await pool.query(
      `INSERT INTO bookings (customer_name, phone, email, listing_id, invoice_id, check_in, check_out, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [customer_name, phone, email, listing_id, invoice_id, check_in || null, check_out || null, message || null]
    );
    const booking = result.rows[0];
    // Build WhatsApp message
    const listingData = listing.rows[0];
    const waNumber = process.env.WHATSAPP_NUMBER || '254700000000';
    const waText = encodeURIComponent(
      `🏷️ NEW BOOKING - ${invoice_id}\n\n👤 Customer: ${customer_name}\n📞 Phone: ${phone}\n📧 Email: ${email}\n\n🏠 Listing: ${listingData.title}\n📍 Location: ${listingData.location}\n💰 Price: KES ${listingData.price}/day\n\n📅 Check-in: ${check_in || 'TBD'}\n📅 Check-out: ${check_out || 'TBD'}\n\n💬 Message: ${message || 'None'}`
    );
    const whatsappUrl = `https://wa.me/${waNumber}?text=${waText}`;
    res.status(201).json({ ...booking, whatsappUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get bookings for a listing (host)
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
