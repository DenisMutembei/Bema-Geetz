import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const VerificationContext = createContext(null);

export function VerificationProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState({ isVerified: false, verification: null, loading: true });

  const checkStatus = async () => {
    if (!user) {
      setStatus({ isVerified: false, verification: null, loading: false });
      return;
    }

    try {
      const res = await api.get('/verification/status');
      setStatus({ ...res.data, loading: false });
    } catch {
      setStatus({ isVerified: false, verification: null, loading: false });
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  const hasRequiredVerification = (requiredType) => {
    if (!requiredType) return true;
    if (!status.verification) return false;
    return status.isVerified && status.verification.status === 'approved' && status.verification.verification_type === requiredType;
  };

  return (
    <VerificationContext.Provider value={{ ...status, refresh: checkStatus, hasRequiredVerification }}>
      {children}
    </VerificationContext.Provider>
  );
}

export const useVerification = () => useContext(VerificationContext);
