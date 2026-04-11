const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware, hostMiddleware } = require('../middleware/auth');
const logger = require('../logger');
const { schemas, handleValidationErrors } = require('../middleware/validation');

// Get all listings (public) with pagination
router.get('/', ...schemas.pagination, handleValidationErrors, async (req, res) => {
  try {
    const { type, location, minPrice, maxPrice, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    
    // Count query for pagination
    let countQuery = 'SELECT COUNT(DISTINCT l.id) as total FROM listings l WHERE l.available = true';
    let dataQuery = `
      SELECT
        l.*,
        u.name as host_name,
        u.phone as host_phone,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,\n        COUNT(r.id)::int as review_count
      FROM listings l
      JOIN users u ON l.host_id = u.id
      LEFT JOIN reviews r ON r.listing_id = l.id
      WHERE l.available = true
    `;
    
    const params = [];
    let idx = 1;
    
    // Build WHERE conditions
    const conditions = [];
    if (type) { conditions.push(`l.type = $${idx++}`); params.push(type); }
    if (location) { conditions.push(`LOWER(l.location) LIKE $${idx++}`); params.push(`%${location.toLowerCase()}%`); }
    if (minPrice) { conditions.push(`l.price >= $${idx++}`); params.push(minPrice); }
    if (maxPrice) { conditions.push(`l.price <= $${idx++}`); params.push(maxPrice); }
    if (search) { conditions.push(`(LOWER(l.title) LIKE $${idx} OR LOWER(l.description) LIKE $${idx++})`); params.push(`%${search.toLowerCase()}%`); }
    
    if (conditions.length > 0) {
      const whereClause = ' AND ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
    }
    
    dataQuery += ' GROUP BY l.id, u.id ORDER BY l.created_at DESC LIMIT $' + (idx++) + ' OFFSET $' + idx;
    params.push(limit, offset);
    
    // Execute both queries
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params.slice(0, -2)), // Remove limit and offset for count
      pool.query(dataQuery, params)
    ]);
    
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);
    
    logger.info('Listings fetched:', { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      total, 
      filters: { type, location, minPrice, maxPrice, search } 
    });
    
    res.json({
      listings: dataResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    logger.error('Failed to fetch listings:', { error: err.message, query: req.query });
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// Get single listing
router.get('/:id', ...schemas.uuidParam(), handleValidationErrors, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         l.*,
         u.name as host_name,
         u.phone as host_phone,
         u.email as host_email,
         COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,\n         COUNT(r.id)::int as review_count
       FROM listings l
       JOIN users u ON l.host_id = u.id
       LEFT JOIN reviews r ON r.listing_id = l.id
       WHERE l.id = $1
       GROUP BY l.id, u.id`,
      [req.params.id]
    );
    if (!result.rows.length) {
      logger.warn('Listing not found:', { id: req.params.id });
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Failed to fetch listing:', { error: err.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// Create listing
router.post('/', hostMiddleware, ...schemas.createListing, handleValidationErrors, async (req, res) => {
  try {
    const { title, type, price, location, images, description, make, model } = req.body;
    let { year, bedrooms, bathrooms, requires_verification, verification_type } = req.body;

    year = year ? parseInt(year, 10) : null;
    bedrooms = bedrooms ? parseInt(bedrooms, 10) : null;
    bathrooms = bathrooms ? parseInt(bathrooms, 10) : null;
    requires_verification = typeof requires_verification === 'boolean' ? requires_verification : ['car', 'house'].includes(type);
    verification_type = verification_type || (type === 'car' ? 'driving_license' : type === 'house' ? 'national_id' : null);

    const result = await pool.query(
      `INSERT INTO listings (title, type, price, location, images, description, host_id, make, model, year, bedrooms, bathrooms, requires_verification, verification_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [title, type, price, location, images || [], description, req.user.id, make, model, year, bedrooms, bathrooms, requires_verification, verification_type]
    );
    
    logger.info('Listing created:', { 
      listingId: result.rows[0].id, 
      title, 
      type, 
      hostId: req.user.id 
    });
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Failed to create listing:', { error: err.message, userId: req.user.id, body: req.body });
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// Update listing
router.put('/:id', hostMiddleware, ...schemas.updateListing, handleValidationErrors, async (req, res) => {
  try {
    const { title, type, price, location, images, description, available, make, model, year, bedrooms, bathrooms, requires_verification, verification_type } = req.body;
    const existing = await pool.query('SELECT * FROM listings WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
    if (existing.rows[0].host_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Not authorized' });
    const result = await pool.query(
      `UPDATE listings SET title=$1, type=$2, price=$3, location=$4, images=$5, description=$6, available=$7, make=$8, model=$9, year=$10, bedrooms=$11, bathrooms=$12, requires_verification=$13, verification_type=$14 WHERE id=$15 RETURNING *`,
      [title, type, price, location, images, description, available, make, model, year, bedrooms, bathrooms, requires_verification, verification_type, req.params.id]
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
    const result = await pool.query(
      `SELECT l.*, COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,\n        COUNT(r.id)::int as review_count
       FROM listings l
       LEFT JOIN reviews r ON r.listing_id = l.id
       WHERE l.host_id=$1
       GROUP BY l.id
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

module.exports = router;
