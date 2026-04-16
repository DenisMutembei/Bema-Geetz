import { useState, useCallback, useRef, useEffect } from 'react';
import api from '../services/api';
import Tesseract from 'tesseract.js';

// Custom hook for camera management
const useCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState('');
  const streamRef = useRef(null);

  const start = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().then(resolve).catch(resolve);
          };
        });
      }
      
      setIsActive(true);
      setError('');
      return true;
    } catch (err) {
      console.error('Camera error:', err);
      setError(err.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow permissions.'
        : 'Camera not available. Use file upload instead.');
      setIsActive(false);
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return { videoRef, canvasRef, isActive, error, start, stop, capture };
};

export default function DocumentScanner({
  documentType,
  onScanComplete,
  onError,
  disabled = false
}) {
  const [scanning, setScanning] = useState(false);
  const [frontScan, setFrontScan] = useState(null);
  const [backScan, setBackScan] = useState(null);
  const [activeCamera, setActiveCamera] = useState(null);

  const frontCamera = useCamera();
  const backCamera = useCamera();

  // OCR extraction using Tesseract.js
  const performOCR = useCallback(async (imageUrl) => {
    try {
      const result = await Tesseract.recognize(imageUrl, 'eng', {
        logger: (m) => console.log(m)
      });
      
      const text = result.data.text;
      const confidence = result.data.confidence / 100;
      
      // Extract document data based on type
      const extractedData = extractDocumentData(text, documentType);
      
      return {
        text: text,
        confidence: confidence,
        extractedData: extractedData,
        qualityScore: calculateQualityScore(result.data)
      };
    } catch (error) {
      console.error('OCR failed:', error);
      return {
        text: '',
        confidence: 0,
        extractedData: null,
        qualityScore: 0.5
      };
    }
  }, [documentType]);

  // Extract structured data from OCR text
  const extractDocumentData = (text, type) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    if (type === 'driving_license') {
      // Kenyan DL patterns
      const dlNumberMatch = text.match(/[A-Z]{2}\d{8,10}/i);
      const nameMatch = text.match(/(?:NAME|Name)[:\s]+([A-Z\s]+)/i);
      const dateMatch = text.match(/(\d{2}[\/\.]\d{2}[\/\.]\d{4})/g);
      
      return {
        documentType: 'driving_license',
        licenseNumber: dlNumberMatch ? dlNumberMatch[0] : null,
        fullName: nameMatch ? nameMatch[1].trim() : null,
        dates: dateMatch || [],
        rawText: text
      };
    } else {
      // Kenyan National ID patterns
      const idMatch = text.match(/\b\d{8}\b/);
      const nameMatch = text.match(/(?:NAME|Name)[:\s]+([A-Z\s]+)/i);
      
      return {
        documentType: 'national_id',
        idNumber: idMatch ? idMatch[0] : null,
        fullName: nameMatch ? nameMatch[1].trim() : null,
        rawText: text
      };
    }
  };

  // Calculate image quality score
  const calculateQualityScore = (data) => {
    // Base score on confidence and text density
    const confidenceWeight = 0.6;
    const textDensityWeight = 0.4;
    
    const confidence = data.confidence / 100;
    const textLength = data.text ? data.text.length : 0;
    const textDensity = Math.min(textLength / 500, 1); // Normalize to max 500 chars
    
    return (confidence * confidenceWeight) + (textDensity * textDensityWeight);
  };

  const scanDocument = useCallback(async (file, side) => {
    if (!file) return null;
    
    // Step 1: Upload image
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    let uploadResponse;
    try {
      const response = await api.post('/document-scan/scan.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      uploadResponse = response.data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }

    // Step 2: Perform OCR
    if (uploadResponse.imageUrl) {
      const ocrResult = await performOCR(uploadResponse.imageUrl);
      
      return {
        success: true,
        imageUrl: uploadResponse.imageUrl,
        urls: uploadResponse.urls,
        scanResult: {
          confidence: ocrResult.confidence,
          qualityAnalysis: {
            qualityScore: ocrResult.qualityScore
          }
        },
        extractedData: ocrResult.extractedData,
        rawText: ocrResult.text
      };
    }
    
    return uploadResponse;
  }, [documentType, performOCR]);

  const handleFileUpload = useCallback((side) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setScanning(true);
      try {
        const scanData = await scanDocument(file, side);
        if (side === 'front') {
          setFrontScan(scanData);
        } else {
          setBackScan(scanData);
        }
      } catch (err) {
        onError?.(err.response?.data?.error || 'Scan failed. Try again.');
      } finally {
        setScanning(false);
      }
    };

    input.click();
  }, [scanDocument, onError]);

  const handleCameraCapture = useCallback(async (side) => {
    const camera = side === 'front' ? frontCamera : backCamera;
    const canvas = camera.capture();
    
    if (!canvas) {
      onError?.('Failed to capture photo');
      return;
    }

    camera.stop();
    setActiveCamera(null);
    setScanning(true);
    
    try {
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9);
      });
      
      const file = new File([blob], `${side}-document.jpg`, { type: 'image/jpeg' });
      const scanData = await scanDocument(file, side);
      
      if (side === 'front') {
        setFrontScan(scanData);
      } else {
        setBackScan(scanData);
      }
    } catch (err) {
      onError?.('Capture failed. Try file upload instead.');
    } finally {
      setScanning(false);
    }
  }, [frontCamera, backCamera, scanDocument, onError]);

  const startCameraForSide = useCallback(async (side) => {
    frontCamera.stop();
    backCamera.stop();
    
    const camera = side === 'front' ? frontCamera : backCamera;
    const success = await camera.start();
    if (success) {
      setActiveCamera(side);
    }
  }, [frontCamera, backCamera]);

  const stopAllCameras = useCallback(() => {
    frontCamera.stop();
    backCamera.stop();
    setActiveCamera(null);
  }, [frontCamera, backCamera]);

  const handleSubmit = useCallback(() => {
    if (!frontScan || !backScan) {
      onError?.('Please scan both sides of the document');
      return;
    }

    const scanData = {
      frontScan: frontScan.scanResult,
      backScan: backScan.scanResult,
      imageUrls: {
        front: frontScan.imageUrl,
        back: backScan.imageUrl
      },
      documentQualityScore: frontScan.scanResult?.qualityAnalysis?.qualityScore || 0,
      isFrontBackMatch: true
    };

    onScanComplete?.(scanData);
  }, [frontScan, backScan, onScanComplete, onError]);

  const getQualityColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityText = (score) => {
    if (!score) return 'Unknown';
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  useEffect(() => {
    return () => {
      stopAllCameras();
    };
  }, [stopAllCameras]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-dark-card border border-dark-border rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              2-Side Document Scanner
            </h3>
            <p className="text-gray-400 text-sm">Upload or CAPTURE BOTH sides of your {documentType === 'driving_license' ? "Driver's License" : "National ID"} for verification</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gold text-xs font-semibold">COMPULSORY</span>
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-400 text-xs font-semibold ml-2">2-SIDES REQUIRED</span>
          </div>
        </div>
        
        <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m0 4v-6" />
            </svg>
            <div>
              <p className="text-red-400 text-sm font-semibold">Required for verification:</p>
              <ul className="text-red-300 text-xs mt-1 space-y-1">
                <li>• Verification Type ({documentType === 'driving_license' ? "Driver's License" : "National ID"})</li>
                <li>• Legal Name (must match account name)</li>
                <li>• Document Number</li>
                <li>• Front Document Image</li>
                <li>• Back Document Image</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Two-column layout for document sides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Front Document */}
        <div className="p-4 bg-dark-card border border-dark-border rounded-xl">
          <h4 className="text-white font-semibold mb-3">Front Side</h4>
          
          {!frontScan ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleFileUpload('front')}
                  disabled={scanning || disabled}
                  className="py-6 border-2 border-dashed border-gold/60 rounded-xl text-center hover:border-gold transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6 mx-auto mb-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gold text-xs font-medium">Upload File</p>
                </button>
                <button
                  onClick={() => startCameraForSide('front')}
                  disabled={scanning || disabled || activeCamera === 'back'}
                  className="py-6 border border-gold/60 rounded-xl text-center hover:border-gold transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6 mx-auto mb-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gold text-xs font-medium">Use Camera</p>
                </button>
              </div>

              {frontCamera.error && activeCamera === 'front' && (
                <div className="p-2 bg-red-900/20 border border-red-700/40 rounded-lg">
                  <p className="text-red-400 text-xs">{frontCamera.error}</p>
                </div>
              )}

              {activeCamera === 'front' && (
                <div className="relative">
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <video
                      ref={frontCamera.videoRef}
                      className="w-full h-64 object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas ref={frontCamera.canvasRef} className="hidden" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-gold/40 rounded-lg">
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold" />
                      </div>
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-gold text-xs bg-dark/80 px-2 py-1 rounded">
                        Position document within frame
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={stopAllCameras}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCameraCapture('front')}
                      disabled={scanning}
                      className="px-6 py-2 bg-gold text-dark rounded-lg text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
                    >
                      {scanning ? 'Processing...' : 'Capture'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-dark rounded-lg">
                <span className="text-green-400 text-xs font-semibold">✓ Front Side Scanned</span>
                <button
                  onClick={() => { setFrontScan(null); }}
                  disabled={scanning || disabled}
                  className="text-gold text-xs hover:text-gold-light transition-colors"
                >
                  Re-scan
                </button>
              </div>
              <img 
                src={frontScan.imageUrl} 
                alt="Front document" 
                className="w-full h-48 object-cover rounded-lg border border-dark-border"
              />
              {frontScan.scanResult && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Quality:</span>
                    <span className={`text-sm font-semibold ${getQualityColor(frontScan.scanResult.qualityAnalysis?.qualityScore)}`}>
                      {getQualityText(frontScan.scanResult.qualityAnalysis?.qualityScore)} ({Math.round((frontScan.scanResult.qualityAnalysis?.qualityScore || 0) * 100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">OCR Confidence:</span>
                    <span className={`text-sm font-semibold ${getQualityColor(frontScan.scanResult.confidence)}`}>
                      {Math.round((frontScan.scanResult.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              )}
              {frontScan.extractedData && (
                <div className="mt-3 p-3 bg-dark rounded-lg border border-dark-border">
                  <h5 className="text-gold text-xs font-semibold mb-2 uppercase tracking-wide">Extracted Data</h5>
                  <div className="space-y-1 text-sm">
                    {frontScan.extractedData.licenseNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">License #:</span>
                        <span className="text-white font-mono">{frontScan.extractedData.licenseNumber}</span>
                      </div>
                    )}
                    {frontScan.extractedData.idNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">ID #:</span>
                        <span className="text-white font-mono">{frontScan.extractedData.idNumber}</span>
                      </div>
                    )}
                    {frontScan.extractedData.fullName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">{frontScan.extractedData.fullName}</span>
                      </div>
                    )}
                    {frontScan.extractedData.dates && frontScan.extractedData.dates.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dates:</span>
                        <span className="text-white text-xs">{frontScan.extractedData.dates.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back Document */}
        <div className="p-4 bg-dark-card border border-dark-border rounded-xl">
          <h4 className="text-white font-semibold mb-3">Back Side</h4>
          
          {!backScan ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleFileUpload('back')}
                  disabled={scanning || disabled}
                  className="py-6 border-2 border-dashed border-gold/60 rounded-xl text-center hover:border-gold transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6 mx-auto mb-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gold text-xs font-medium">Upload File</p>
                </button>
                <button
                  onClick={() => startCameraForSide('back')}
                  disabled={scanning || disabled || activeCamera === 'front'}
                  className="py-6 border border-gold/60 rounded-xl text-center hover:border-gold transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6 mx-auto mb-2 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gold text-xs font-medium">Use Camera</p>
                </button>
              </div>

              {backCamera.error && activeCamera === 'back' && (
                <div className="p-2 bg-red-900/20 border border-red-700/40 rounded-lg">
                  <p className="text-red-400 text-xs">{backCamera.error}</p>
                </div>
              )}

              {activeCamera === 'back' && (
                <div className="relative">
                  <div className="relative bg-black rounded-xl overflow-hidden">
                    <video
                      ref={backCamera.videoRef}
                      className="w-full h-64 object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <canvas ref={backCamera.canvasRef} className="hidden" />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-4 border-2 border-gold/40 rounded-lg">
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-gold" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-gold" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-gold" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-gold" />
                      </div>
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-gold text-xs bg-dark/80 px-2 py-1 rounded">
                        Position document within frame
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={stopAllCameras}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCameraCapture('back')}
                      disabled={scanning}
                      className="px-6 py-2 bg-gold text-dark rounded-lg text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
                    >
                      {scanning ? 'Processing...' : 'Capture'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-dark rounded-lg">
                <span className="text-green-400 text-xs font-semibold">✓ Back Side Scanned</span>
                <button
                  onClick={() => { setBackScan(null); }}
                  disabled={scanning || disabled}
                  className="text-gold text-xs hover:text-gold-light transition-colors"
                >
                  Re-scan
                </button>
              </div>
              <img 
                src={backScan.imageUrl} 
                alt="Back document" 
                className="w-full h-48 object-cover rounded-lg border border-dark-border"
              />
              {backScan.scanResult && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Quality:</span>
                    <span className={`text-sm font-semibold ${getQualityColor(backScan.scanResult.qualityAnalysis?.qualityScore)}`}>
                      {getQualityText(backScan.scanResult.qualityAnalysis?.qualityScore)} ({Math.round((backScan.scanResult.qualityAnalysis?.qualityScore || 0) * 100)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">OCR Confidence:</span>
                    <span className={`text-sm font-semibold ${getQualityColor(backScan.scanResult.confidence)}`}>
                      {Math.round((backScan.scanResult.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              )}
              {backScan.extractedData && (
                <div className="mt-3 p-3 bg-dark rounded-lg border border-dark-border">
                  <h5 className="text-gold text-xs font-semibold mb-2 uppercase tracking-wide">Extracted Data</h5>
                  <div className="space-y-1 text-sm">
                    {backScan.extractedData.licenseNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">License #:</span>
                        <span className="text-white font-mono">{backScan.extractedData.licenseNumber}</span>
                      </div>
                    )}
                    {backScan.extractedData.idNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">ID #:</span>
                        <span className="text-white font-mono">{backScan.extractedData.idNumber}</span>
                      </div>
                    )}
                    {backScan.extractedData.fullName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-white">{backScan.extractedData.fullName}</span>
                      </div>
                    )}
                    {backScan.extractedData.dates && backScan.extractedData.dates.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Dates:</span>
                        <span className="text-white text-xs">{backScan.extractedData.dates.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      {frontScan && backScan && (
        <div className="p-4 bg-dark-card border border-dark-border rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-white font-semibold">Ready to Submit</h4>
              <p className="text-gray-400 text-sm">Both sides scanned successfully</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">Quality Score:</span>
              <span className="text-gold font-semibold">
                {Math.round(((frontScan.scanResult?.qualityAnalysis?.qualityScore || 0) + (backScan.scanResult?.qualityAnalysis?.qualityScore || 0)) / 2 * 100)}%
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={disabled || scanning}
            className="w-full py-3 bg-gold text-dark rounded-xl font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {scanning ? 'Processing...' : 'Use Scanned Documents'}
          </button>
        </div>
      )}
    </div>
  );
}
