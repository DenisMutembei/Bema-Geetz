const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./logger');
const { check, validationResult } = require('express-validator');

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port (including 127.0.0.1)
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/)) return callback(null, true);
    
    // Allow the configured frontend URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    
    // Allow Vite dev server ports (5173, 5174, etc.)
    if (origin.match(/^https?:\/\/localhost:5\d{3}$/)) return callback(null, true);
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/airport', require('./routes/airport'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/document-scan', require('./routes/document-scan'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'Bema Geetz API running', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Handle validation errors
  if (err.errors) {
    const validationErrors = err.errors.map(error => ({
      field: error.param || error.field,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: validationErrors
    });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  logger.warn('Route not found:', { url: req.url, method: req.method });
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Bema Geetz server running on port ${PORT}`);
});
