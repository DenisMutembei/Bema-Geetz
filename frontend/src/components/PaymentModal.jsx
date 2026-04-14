import { useState, useEffect } from 'react';
import api from '../services/api';

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [amount, setAmount] = useState(booking?.depositAmount || booking?.balanceAmount || booking?.totalAmount || 0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [paymentLink, setPaymentLink] = useState(null);
  const [txRef, setTxRef] = useState(null);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Poll for payment status when redirected back
  useEffect(() => {
    if (!txRef || paymentComplete) return;

    const interval = setInterval(async () => {
      try {
        const response = await api.get(`/payments?tx_ref=${txRef}`);
        
        if (response.data.payment_status === 'completed') {
          setPaymentComplete(true);
          setStatus('Payment successful! 🎉');
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        } else if (response.data.payment_status === 'failed') {
          setPaymentComplete(true);
          setStatus('Payment failed. Please try again.');
        }
      } catch (err) {
        console.error('Status check failed', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [txRef, paymentComplete, onSuccess]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('Initializing secure payment...');

    try {
      const response = await api.post('/payments', {
        booking_id: booking.id,
        amount: amount
      });

      if (response.data.success) {
        setPaymentLink(response.data.payment_link);
        setTxRef(response.data.tx_ref);
        setStatus('Opening secure checkout...');
        
        // Open Flutterwave checkout in new window
        window.open(response.data.payment_link, '_blank');
        
        setStatus('Please complete payment in the new window. Waiting for confirmation...');
      } else {
        setError('Failed to initialize payment');
        setStatus('');
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-gold/20 rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-white">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="bg-gold/10 border border-gold/20 rounded-xl p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Booking:</span>
            <span className="text-white font-medium">{booking?.invoiceId}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Total Amount:</span>
            <span className="text-gold font-bold">KES {booking?.totalAmount?.toLocaleString()}</span>
          </div>
          {booking?.depositAmount < booking?.totalAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Deposit Required:</span>
              <span className="text-gold">KES {booking?.depositAmount?.toLocaleString()}</span>
            </div>
          )}
        </div>

        {!paymentLink ? (
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Amount to Pay (KES)</label>
              <input
                type="number"
                min="1"
                max={booking?.totalAmount}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                required
              />
              {booking?.balanceAmount && amount < booking.balanceAmount && (
                <p className="text-xs text-gold mt-1">
                  Paying partial amount. Balance: KES {(booking.balanceAmount - amount).toLocaleString()}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full rounded-xl py-3 font-semibold disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay KES ${amount.toLocaleString()}`}
            </button>

            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="flex-1 h-px bg-gray-700"></span>
              <span>Secure Payment Options</span>
              <span className="flex-1 h-px bg-gray-700"></span>
            </div>

            <div className="text-center text-xs text-gray-500 space-y-1">
              <p className="flex items-center justify-center gap-2">
                <span className="text-xl">💳</span> Visa / Mastercard
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-xl">📱</span> M-Pesa
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-xl">🏦</span> Bank Transfer
              </p>
              <p className="flex items-center justify-center gap-2">
                <span className="text-xl">📞</span> USSD
              </p>
            </div>

            <div className="bg-dark/50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">
                Secured by <span className="text-gold font-semibold">Flutterwave</span>
              </p>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            {!paymentComplete ? (
              <>
                <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-lg mb-2">{status}</p>
                <p className="text-gray-400 text-sm mb-4">
                  Payment window opened. Please complete payment there.
                </p>
                <button
                  onClick={() => window.open(paymentLink, '_blank')}
                  className="text-gold hover:text-gold-light text-sm underline"
                >
                  Re-open payment window
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-400 text-3xl">✓</span>
                </div>
                <p className="text-white text-lg mb-2">{status}</p>
                <p className="text-gray-400 text-sm">Receipt has been sent to your email</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
