const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../logger');
const { schemas, handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Get reviews for a listing with pagination
router.get('/listing/:listingId', ...schemas.uuidParam('listingId'), ...schemas.pagination, handleValidationErrors, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Get total count and reviews in parallel
    const [countResult, reviewsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM reviews WHERE listing_id = $1', [listingId]),
      pool.query(
        `SELECT r.*, u.name, u.email
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.listing_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [listingId, limit, offset]
      )
    ]);

    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    res.json({
      reviews: reviewsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    logger.error('Failed to fetch reviews:', { error: error.message, listingId: req.params.listingId });
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create or update a review
router.post('/', authMiddleware, [
  body('listing_id').isUUID().withMessage('Valid listing ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { listing_id, rating, comment } = req.body;

    // Check if user has booked this listing (optional validation)
    const bookingCheck = await pool.query(
      'SELECT id FROM bookings WHERE listing_id = $1 AND user_email = (SELECT email FROM users WHERE id = $2)',
      [listing_id, req.user.id]
    );

    if (bookingCheck.rows.length === 0) {
      logger.warn('User trying to review without booking:', { userId: req.user.id, listingId: listing_id });
      return res.status(403).json({ error: 'You can only review listings you have booked' });
    }

    const result = await pool.query(
      `INSERT INTO reviews (listing_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (listing_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [listing_id, req.user.id, rating, comment || null]
    );

    logger.info('Review created/updated:', { 
      reviewId: result.rows[0].id, 
      listingId: listing_id, 
      userId: req.user.id, 
      rating 
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to save review:', { error: error.message, userId: req.user.id, body: req.body });
    res.status(500).json({ error: 'Failed to save review' });
  }
});

module.exports = router;
