const { body, param, query, validationResult } = require('express-validator');
const logger = require('../logger');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    
    logger.warn('Validation failed:', {
      url: req.url,
      method: req.method,
      errors: errorDetails,
      body: req.body
    });
    
    const error = new Error('Validation failed');
    error.errors = errorDetails;
    return next(error);
  }
  next();
};

// Common validation schemas
const schemas = {
  // User registration validation
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('role')
      .isIn(['customer', 'host'])
      .withMessage('Role must be either customer or host')
  ],

  // User login validation
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Listing creation validation
  createListing: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('type')
      .isIn(['car', 'house'])
      .withMessage('Type must be either car or house'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('location')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Location must be between 3 and 100 characters'),
    // Optional fields for cars
    body('make')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Make must be between 1 and 50 characters'),
    body('model')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Model must be between 1 and 50 characters'),
    body('year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be a valid year'),
    // Optional fields for houses
    body('bedrooms')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Bedrooms must be between 1 and 20'),
    body('bathrooms')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Bathrooms must be between 1 and 20'),
    // Images array
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    // Verification fields
    body('requires_verification')
      .optional()
      .isBoolean()
      .withMessage('Requires verification must be true or false'),
    body('verification_type')
      .optional()
      .isIn(['driving_license', 'national_id', null])
      .withMessage('Verification type must be driving_license or national_id')
  ],

  // Booking creation validation
  createBooking: [
    body('listingId')
      .isUUID()
      .withMessage('Valid listing ID is required'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('phone')
      .isLength({ min: 10, max: 20 })
      .withMessage('Valid phone number is required'),
    body('startDate')
      .isISO8601()
      .withMessage('Valid start date is required'),
    body('endDate')
      .isISO8601()
      .withMessage('Valid end date is required')
  ],

  // Listing update validation
  updateListing: [
    param('id')
      .isUUID()
      .withMessage('Valid listing ID is required'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('location')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Location must be between 3 and 100 characters'),
    body('type')
      .optional()
      .isIn(['car', 'house'])
      .withMessage('Type must be either car or house'),
    // Optional fields for cars
    body('make')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Make must be between 1 and 50 characters'),
    body('model')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Model must be between 1 and 50 characters'),
    body('year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be a valid year'),
    // Optional fields for houses
    body('bedrooms')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Bedrooms must be between 1 and 20'),
    body('bathrooms')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Bathrooms must be between 1 and 20'),
    // Images array
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    // Verification fields
    body('requires_verification')
      .optional()
      .isBoolean()
      .withMessage('Requires verification must be true or false'),
    body('verification_type')
      .optional()
      .isIn(['driving_license', 'national_id', null])
      .withMessage('Verification type must be driving_license or national_id'),
    body('available')
      .optional()
      .isBoolean()
      .withMessage('Available must be true or false')
  ],

  // UUID parameter validation
  uuidParam: (paramName = 'id') => [
    param(paramName)
      .isUUID()
      .withMessage(`Valid ${paramName} is required`)
  ],

  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

module.exports = {
  handleValidationErrors,
  schemas
};
