import { useNavigate } from 'react-router-dom';
import { useVerification } from '../context/VerificationContext';

export default function VerificationBanner({ requiredType }) {
  const navigate = useNavigate();
  const { isVerified, verification, hasRequiredVerification } = useVerification();

  if (hasRequiredVerification(requiredType)) return null;

  const message = requiredType === 'driving_license'
    ? 'Driving License required to book cars'
    : 'National ID required to book houses';

  const pendingSameType = verification?.status === 'pending' && verification?.verification_type === requiredType;
  const approvedDifferentType = isVerified && verification?.verification_type !== requiredType;

  const statusMessage = pendingSameType
    ? 'Verification pending approval'
    : approvedDifferentType
      ? `${message}. Your current verification does not match this category.`
      : message;

  return (
    <div className="mb-8 rounded-2xl border border-gold/40 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] px-5 py-4 text-[#1A1A1A] shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold">{statusMessage}</div>
        {!pendingSameType && (
          <button
            onClick={() => navigate('/verification')}
            className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-[#D4AF37] transition hover:opacity-90"
          >
            Verify Now
          </button>
        )}
      </div>
    </div>
  );
}
