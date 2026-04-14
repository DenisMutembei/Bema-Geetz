import { useState } from 'react';
import api from '../services/api';

export default function PaymentModal({ booking, onClose, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState(booking?.depositAmount || booking?.totalAmount || 0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('Initiating M-Pesa payment...');

    try {
      const response = await api.post('/payments/mpesa', {
        booking_id: booking.id,
        phone: phone,
        amount: amount
      });

      setCheckoutRequestId(response.data.checkout_request_id);
      setStatus(response.data.message || 'Enter M-Pesa PIN on your phone');

      // Poll for payment status
      pollPaymentStatus(response.data.checkout_request_id);

    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (checkoutId) => {
    let attempts = 0;
    const maxAttempts = 30; // 2.5 minutes (5 seconds × 30)

    const checkStatus = async () => {
      if (attempts >= maxAttempts) {
        setStatus('Payment status unknown. Please check your M-Pesa messages.');
        return;
      }

      try {
        const response = await api.get(`/payments/mpesa?checkout_request_id=${checkoutId}`);
        
        if (response.data.payment_status === 'completed') {
          setStatus('Payment successful! 🎉');
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
          return;
        } else if (response.data.payment_status === 'failed') {
          setStatus('Payment failed. Please try again.');
          return;
        }

        attempts++;
        setTimeout(checkStatus, 5000); // Check every 5 seconds

      } catch (err) {
        attempts++;
        setTimeout(checkStatus, 5000);
      }
    };

    checkStatus();
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

        {!checkoutRequestId ? (
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">M-Pesa Phone Number</label>
              <input
                type="tel"
                placeholder="e.g., 0712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: 07XX XXX XXX or 2547XX XXX XXX</p>
            </div>

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
              <span>Secure M-Pesa Payment</span>
              <span className="flex-1 h-px bg-gray-700"></span>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>You will receive an STK push on your phone</p>
              <p>Enter your M-Pesa PIN to complete</p>
            </div>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg mb-2">{status}</p>
            <p className="text-gray-400 text-sm">Please check your phone for the M-Pesa prompt</p>
            
            <button
              onClick={() => {
                setCheckoutRequestId(null);
                setStatus('');
              }}
              className="mt-6 text-gold hover:text-gold-light text-sm"
            >
              Try different number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
