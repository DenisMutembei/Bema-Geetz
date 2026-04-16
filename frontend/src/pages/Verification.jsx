import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import DocumentScanner from '../components/DocumentScanner';

export default function Verification() {
  const { user } = useAuth();
  const [type, setType] = useState('driving_license');
  const [legalName, setLegalName] = useState(user?.name || '');
  const [docNumber, setDocNumber] = useState('');
  const [docImage, setDocImage] = useState('');
  const [selfie, setSelfie] = useState('');
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scannedDocuments, setScannedDocuments] = useState(null);
  const [useScanner, setUseScanner] = useState(true); // Smart Scanner is now compulsory
  const { refresh, verification, hasRequiredVerification } = useVerification();
  const navigate = useNavigate();

  const uploadImage = async (file, setter) => {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/verification/upload.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setter(res.data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleScanComplete = (scanData) => {
    setScannedDocuments(scanData);
    // Auto-fill document number if extracted from OCR
    if (scanData.frontScan.extractedData.documentNumber) {
      setDocNumber(scanData.frontScan.extractedData.documentNumber);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        verificationType: type,
        legalName,
        documentNumber: docNumber,
        selfieImageUrl: selfie || null
      };

      // Add scanned documents data if available
      if (scannedDocuments) {
        payload.documentFrontUrl = scannedDocuments.imageUrls.front;
        payload.documentBackUrl = scannedDocuments.imageUrls.back;
        payload.scanResults = {
          frontScan: scannedDocuments.frontScan,
          backScan: scannedDocuments.backScan,
          comparison: scannedDocuments.comparison
        };
        payload.documentQualityScore = scannedDocuments.documentQualityScore;
        payload.isFrontBackMatch = scannedDocuments.isFrontBackMatch;
      } else {
        // Fallback to single image upload
        payload.documentImageUrl = docImage;
      }

      const res = await api.post('/verification/submit.php', payload);
      await refresh();
      setSuccess(res.data.message || 'Verification submitted successfully!');
      // Stay on verification page to show success message instead of redirecting
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gold/20 bg-dark-card p-8 shadow-2xl">
        <h1 className="font-display text-4xl text-gold">Identity Verification</h1>
        <p className="mt-3 text-gray-400">Your submitted legal name must match the name on your Bema Geetz account for instant approval.</p>

        {verification?.status === 'approved' && (
          <div className="mt-6 rounded-2xl border border-green-700 bg-green-900/20 px-4 py-3 text-sm text-green-300">
            Your latest verification is approved.
          </div>
        )}

        {verification?.match_status === 'mismatch' && (
          <div className="mt-6 rounded-2xl border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            The submitted legal name did not match your account name. Please enter the same name used on this account.
          </div>
        )}

        {verification && (
          <div className="mt-6 rounded-2xl border border-gold/20 bg-dark-card p-6">
            <h3 className="text-white font-semibold mb-4">Your Uploaded Documents</h3>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Verification Type: <span className="text-gold capitalize">{verification.verification_type?.replace('_', ' ')}</span></p>
                <p className="text-gray-400 text-sm mb-2">Status: <span className={`capitalize ${verification.status === 'approved' ? 'text-green-400' : verification.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{verification.status}</span></p>
                <p className="text-gray-400 text-sm mb-2">Submitted: {new Date(verification.created_at).toLocaleDateString()}</p>
              </div>
              
              {verification.document_image_url && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Document Image:</p>
                  <img 
                    src={verification.document_image_url} 
                    alt="Verification document" 
                    className="w-full max-w-sm rounded-lg border border-dark-border cursor-pointer hover:border-gold transition-colors"
                    onClick={() => window.open(verification.document_image_url, '_blank')}
                  />
                  <p className="text-gray-500 text-xs mt-1">Click to view full size</p>
                </div>
              )}
              
              {verification.selfie_image_url && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Selfie Image:</p>
                  <img 
                    src={verification.selfie_image_url} 
                    alt="Selfie" 
                    className="w-full max-w-sm rounded-lg border border-dark-border cursor-pointer hover:border-gold transition-colors"
                    onClick={() => window.open(verification.selfie_image_url, '_blank')}
                  />
                  <p className="text-gray-500 text-xs mt-1">Click to view full size</p>
                </div>
              )}
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-2xl border border-green-700 bg-green-900/20 px-4 py-3 text-sm text-green-300">
            {success}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-700 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="mt-8 space-y-4">
            <button
              onClick={() => { setType('driving_license'); setStep(2); }}
              className={`block w-full rounded-2xl border px-5 py-5 text-left transition ${type === 'driving_license' ? 'border-gold bg-gold text-[#1A1A1A]' : 'border-gold/40 bg-[#1A1A1A] text-white'}`}
            >
              <div className="text-lg font-semibold">Driving License</div>
              <div className="text-sm opacity-80">Required for car rentals</div>
            </button>
            <button
              onClick={() => { setType('national_id'); setStep(2); }}
              className={`block w-full rounded-2xl border px-5 py-5 text-left transition ${type === 'national_id' ? 'border-gold bg-gold text-[#1A1A1A]' : 'border-gold/40 bg-[#1A1A1A] text-white'}`}
            >
              <div className="text-lg font-semibold">National ID</div>
              <div className="text-sm opacity-80">Required for house rentals</div>
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-gold hover:text-gold-light">
              Back
            </button>

            <div className="rounded-2xl border border-gold/20 bg-dark px-4 py-3 text-sm text-gray-300">
              Account name on file: <span className="text-gold font-semibold">{user?.name}</span>
            </div>

            {/* Scanner Toggle */}
            <div className="flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-xl">
              <div>
                <h3 className="text-white font-semibold">Upload Method</h3>
                <p className="text-gray-400 text-sm">Choose how to upload your documents</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useScanner}
                  onChange={(e) => setUseScanner(e.target.checked)}
                  className="w-4 h-4 text-gold bg-dark border-gold rounded focus:ring-gold"
                />
                <span className="text-gray-300 text-sm">Use Smart Scanner</span>
              </label>
            </div>

            {useScanner ? (
              <DocumentScanner
                documentType={type}
                onScanComplete={handleScanComplete}
                onError={setError}
                disabled={submitting}
              />
            ) : (
              /* Traditional Upload Method */
              <>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">Legal Name On Document</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    required
                    className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">Document Number</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                    className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                    placeholder={type === 'driving_license' ? 'DL123456789' : 'ID123456789'}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">Document Image</label>
                  <div className="border-2 border-dashed border-gold/40 rounded-xl p-6 text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => uploadImage(e.target.files[0], setDocImage)}
                      className="hidden"
                      id="doc-upload"
                    />
                    <label htmlFor="doc-upload" className="cursor-pointer">
                      {docImage ? (
                        <div className="space-y-3">
                          <img src={docImage} alt="Document" className="w-full h-48 object-cover rounded-lg" />
                          <p className="text-gold text-sm">Click to change image</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto mb-3 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-gold">Upload Document Image</p>
                          <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP (Max 10MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Selfie Upload (same for both methods) */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-400">Upload Selfie (Optional)</label>
              <div className="border-2 border-dashed border-gold/40 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => uploadImage(e.target.files[0], setSelfie)}
                  className="hidden"
                  id="selfie-upload"
                />
                <label htmlFor="selfie-upload" className="cursor-pointer">
                  {selfie ? (
                    <div className="space-y-3">
                      <img src={selfie} alt="Selfie" className="w-full h-48 object-cover rounded-lg" />
                      <p className="text-gold text-sm">Click to change image</p>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-12 h-12 mx-auto mb-3 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <p className="text-gold">Upload Selfie (Optional)</p>
                      <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP (Max 10MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || (useScanner ? !scannedDocuments : !docImage)}
              className="btn-gold w-full rounded-xl py-4 text-sm font-bold tracking-wider disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
