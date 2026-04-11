const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Jimp = require('jimp');
const fs = require('fs').promises;
const logger = require('../logger');

// Helper functions for generating realistic document data
const generateDLNumber = () => {
  const prefix = 'DL';
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}/${year}/${random}`;
};

const generateIDNumber = () => {
  // Generate realistic Kenyan ID format
  const year = String(1960 + Math.floor(Math.random() * 40));
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  const serial = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${year}${month}${day}${serial}`;
};

const generateRandomName = () => {
  const firstNames = ['John', 'Mary', 'Joseph', 'Grace', 'David', 'Faith', 'Michael', 'Sarah', 'James', 'Esther', 'Robert', 'Ann', 'William', 'Lucy', 'Thomas', 'Jane'];
  const lastNames = ['Kamau', 'Wanjiru', 'Otieno', 'Achieng', 'Mutua', 'Mwikali', 'Kiprop', 'Chebet', 'Waweru', 'Njeri', 'Omondi', 'Akinyi', 'Karanja', 'Muthoni', 'Kirui'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return `${firstName} ${lastName}`;
};

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

// Document quality analysis
const analyzeDocumentQuality = async (imagePath) => {
  try {
    const image = await Jimp.read(imagePath);
    const { width, height } = image.bitmap;
    
    // Basic quality metrics
    const resolution = width * height;
    const aspectRatio = width / height;
    const isGoodResolution = resolution >= 300000; // Minimum 300K pixels
    const isGoodAspectRatio = aspectRatio >= 0.6 && aspectRatio <= 2.0; // Standard document ratios
    
    // Calculate quality score (0.0 to 1.0)
    let qualityScore = 0.0;
    
    if (isGoodResolution) qualityScore += 0.4;
    if (isGoodAspectRatio) qualityScore += 0.3;
    if (resolution >= 1000000) qualityScore += 0.2; // High resolution bonus
    if (width >= 800 && height >= 600) qualityScore += 0.1; // Minimum dimensions
    
    return {
      qualityScore: Math.min(qualityScore, 1.0),
      resolution,
      aspectRatio,
      dimensions: { width, height },
      recommendations: getQualityRecommendations(qualityScore, resolution, aspectRatio)
    };
  } catch (error) {
    logger.error('Document quality analysis failed:', { error: error.message, imagePath });
    return {
      qualityScore: 0.0,
      resolution: 0,
      aspectRatio: 0,
      dimensions: { width: 0, height: 0 },
      recommendations: ['Unable to analyze image quality']
    };
  }
};

const getQualityRecommendations = (score, resolution, aspectRatio) => {
  const recommendations = [];
  
  if (score < 0.5) {
    recommendations.push('Image quality is too low - please use a clearer photo');
  }
  if (resolution < 300000) {
    recommendations.push('Resolution too low - use higher resolution camera');
  }
  if (aspectRatio < 0.6 || aspectRatio > 2.0) {
    recommendations.push('Document appears distorted - ensure proper alignment');
  }
  
  return recommendations;
};

// Simulated OCR and document validation
const scanDocument = async (imagePath, documentType) => {
  try {
    // In a real implementation, you would use OCR services like Tesseract.js, Google Vision API, or AWS Textract
    // For now, we'll simulate the scanning process
    
    const qualityAnalysis = await analyzeDocumentQuality(imagePath);
    
    // Simulate OCR results based on document type
    let extractedData = {};
    let confidence = 0.0;
    
    if (documentType === 'driving_license') {
      // Generate realistic DL data
      const dlNumber = generateDLNumber();
      const issueYear = new Date().getFullYear() - Math.floor(Math.random() * 5);
      const expiryYear = issueYear + 10;
      
      extractedData = {
        documentNumber: dlNumber,
        documentType: 'Driving License',
        name: generateRandomName(),
        issueDate: `${issueYear}-01-01`,
        expiryDate: `${expiryYear}-12-31`,
        class: ['A', 'B', 'C', 'AB'][Math.floor(Math.random() * 4)],
        restrictions: Math.random() > 0.7 ? 'None' : 'Corrective Lenses Required',
        bloodType: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)],
        organDonor: Math.random() > 0.5
      };
      confidence = 0.85 + Math.random() * 0.1; // 85-95% confidence
    } else if (documentType === 'national_id') {
      // Generate realistic ID data
      const idNumber = generateIDNumber();
      const birthYear = 1960 + Math.floor(Math.random() * 40);
      const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
      const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
      
      extractedData = {
        documentNumber: idNumber,
        documentType: 'National ID',
        name: generateRandomName(),
        dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        nationality: 'Kenyan',
        district: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika'][Math.floor(Math.random() * 6)],
        county: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu'][Math.floor(Math.random() * 6)],
        serialNumber: Math.random().toString(36).substr(2, 8).toUpperCase()
      };
      confidence = 0.80 + Math.random() * 0.15; // 80-95% confidence
    }
    
    return {
      success: true,
      extractedData,
      confidence,
      qualityAnalysis,
      scanTimestamp: new Date().toISOString(),
      warnings: qualityAnalysis.recommendations
    };
  } catch (error) {
    logger.error('Document scanning failed:', { error: error.message, imagePath, documentType });
    return {
      success: false,
      error: 'Scanning failed',
      extractedData: {},
      confidence: 0.0,
      qualityAnalysis: {},
      warnings: ['Scanning process failed']
    };
  }
};

// Compare front and back documents
const compareDocuments = async (frontScan, backScan) => {
  try {
    if (!frontScan.success || !backScan.success) {
      return {
        isMatch: false,
        confidence: 0.0,
        issues: ['One or both scans failed']
      };
    }
    
    // Simulate document matching logic
    // In real implementation, you would compare:
    // - Document numbers
    // - Names (if present on both sides)
    // - Security features
    // - Watermarks
    // - Holograms
    
    const issues = [];
    let matchScore = 1.0;
    
    // Quality comparison
    const qualityDiff = Math.abs(frontScan.qualityAnalysis.qualityScore - backScan.qualityAnalysis.qualityScore);
    if (qualityDiff > 0.3) {
      issues.push('Quality difference between front and back is significant');
      matchScore -= 0.2;
    }
    
    // Simulate document number matching
    const frontNumber = frontScan.extractedData.documentNumber || frontScan.extractedData.idNumber;
    const backNumber = backScan.extractedData.documentNumber || backScan.extractedData.idNumber;
    
    if (frontNumber && backNumber) {
      // In real implementation, you'd extract and compare actual numbers
      // For simulation, we'll assume they match with high probability
      const numberMatch = Math.random() > 0.1; // 90% chance of match
      if (!numberMatch) {
        issues.push('Document numbers do not match');
        matchScore -= 0.4;
      }
    }
    
    return {
      isMatch: matchScore >= 0.7,
      confidence: Math.max(0.0, matchScore),
      issues,
      recommendations: issues.length > 0 ? ['Please re-upload clearer images of both sides'] : []
    };
  } catch (error) {
    logger.error('Document comparison failed:', { error: error.message });
    return {
      isMatch: false,
      confidence: 0.0,
      issues: ['Comparison process failed'],
      recommendations: ['Please try scanning again']
    };
  }
};

// Upload and scan single document
router.post('/scan', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }
    
    const { documentType } = req.body;
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    const scanResult = await scanDocument(req.file.path, documentType);
    
    // Clean up temporary file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      logger.warn('Failed to cleanup temporary file:', { error: cleanupError.message });
    }
    
    res.json({
      success: true,
      scanResult,
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    });
  } catch (error) {
    logger.error('Document scan endpoint error:', { error: error.message });
    res.status(500).json({ error: 'Scanning failed' });
  }
});

// Upload and scan front and back documents
router.post('/scan-both', upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files.front || !req.files.back) {
      return res.status(400).json({ error: 'Both front and back documents are required' });
    }
    
    const { documentType } = req.body;
    if (!documentType) {
      return res.status(400).json({ error: 'Document type is required' });
    }
    
    // Scan both documents
    const frontScan = await scanDocument(req.files.front[0].path, documentType);
    const backScan = await scanDocument(req.files.back[0].path, documentType);
    
    // Compare documents
    const comparison = await compareDocuments(frontScan, backScan);
    
    // Clean up temporary files
    try {
      await fs.unlink(req.files.front[0].path);
      await fs.unlink(req.files.back[0].path);
    } catch (cleanupError) {
      logger.warn('Failed to cleanup temporary files:', { error: cleanupError.message });
    }
    
    res.json({
      success: true,
      frontScan,
      backScan,
      comparison,
      imageUrls: {
        front: `${req.protocol}://${req.get('host')}/uploads/${req.files.front[0].filename}`,
        back: `${req.protocol}://${req.get('host')}/uploads/${req.files.back[0].filename}`
      }
    });
  } catch (error) {
    logger.error('Document both-scan endpoint error:', { error: error.message });
    res.status(500).json({ error: 'Scanning failed' });
  }
});

module.exports = router;
