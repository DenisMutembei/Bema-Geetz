const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ url: `${baseUrl}/uploads/${req.file.filename}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { 
      verificationType, 
      legalName, 
      documentNumber, 
      documentImageUrl, 
      documentFrontUrl,
      documentBackUrl,
      selfieImageUrl,
      scanResults,
      documentQualityScore,
      isFrontBackMatch
    } = req.body;
    const userId = req.user.id;

    // Enforce 2-side document upload requirement
    const hasFrontBack = documentFrontUrl && documentBackUrl;
    
    if (!verificationType || !legalName || !documentNumber || !hasFrontBack) {
      return res.status(400).json({ 
        message: 'Verification type, legal name, document number, and BOTH front and back document images are required for 2-side verification' 
      });
    }

    await pool.query('BEGIN');

    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    const registeredName = (userResult.rows[0]?.name || '').trim().toLowerCase();
    const submittedName = legalName.trim().toLowerCase();
    const isMatch = registeredName === submittedName;

    await pool.query(
      'UPDATE users SET is_verified = false, verification_id = NULL WHERE id = $1',
      [userId]
    );

    const result = await pool.query(
      `INSERT INTO verifications (
         user_id,
         verification_type,
         legal_name,
         document_number,
         document_image_url,
         document_front_url,
         document_back_url,
         selfie_image_url,
         scan_results,
         document_quality_score,
         is_front_back_match,
         status,
         match_status,
         admin_notes,
         reviewed_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        userId,
        verificationType,
        legalName.trim(),
        documentNumber,
        hasFrontBack ? null : documentImageUrl, // Use single image if no front/back
        hasFrontBack ? documentFrontUrl : null,
        hasFrontBack ? documentBackUrl : null,
        selfieImageUrl || null,
        scanResults ? JSON.stringify(scanResults) : null,
        documentQualityScore || null,
        isFrontBackMatch || false,
        isMatch ? 'approved' : (isFrontBackMatch === false ? 'rejected' : 'pending'),
        isMatch ? 'matched' : (isFrontBackMatch === false ? 'mismatch' : 'pending'),
        isMatch ? 'Matched registered client credentials automatically.' : 
                 (isFrontBackMatch === false ? 'Front and back documents do not match.' : 'Verification submitted for review.')
      ]
    );

    if (isMatch) {
      await pool.query(
        `UPDATE users
         SET is_verified = true, verification_id = $1
         WHERE id = $2`,
        [result.rows[0].id, userId]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({
      message: isMatch ? 'Verification approved automatically' : 'Verification rejected because the submitted legal name does not match your account name',
      verification: result.rows[0]
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT is_verified FROM users WHERE id = $1',
      [req.user.id]
    );

    const verificationResult = await pool.query(
      `SELECT *
       FROM verifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    res.json({
      isVerified: userResult.rows[0]?.is_verified || false,
      verification: verificationResult.rows[0] || null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/pending', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, u.email, u.name
       FROM verifications v
       JOIN users u ON v.user_id = u.id
       WHERE v.status = 'pending' OR v.match_status = 'mismatch'
       ORDER BY v.submitted_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/admin/:id/review', adminMiddleware, async (req, res) => {
  const verificationId = req.params.id;
  const { status, notes } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be approved or rejected' });
  }

  try {
    await pool.query('BEGIN');

    const verificationResult = await pool.query(
      'SELECT id, user_id FROM verifications WHERE id = $1 FOR UPDATE',
      [verificationId]
    );

    if (!verificationResult.rows.length) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Verification not found' });
    }

    const verification = verificationResult.rows[0];

    await pool.query(
      `UPDATE verifications
       SET status = $1, admin_notes = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, notes || null, verificationId]
    );

    if (status === 'approved') {
      await pool.query(
        `UPDATE users
         SET is_verified = true, verification_id = $1
         WHERE id = $2`,
        [verificationId, verification.user_id]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET is_verified = CASE WHEN verification_id = $1 THEN false ELSE is_verified END,
             verification_id = CASE WHEN verification_id = $1 THEN NULL ELSE verification_id END
         WHERE id = $2`,
        [verificationId, verification.user_id]
      );
    }

    await pool.query('COMMIT');
    res.json({ message: `Verification ${status}` });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
