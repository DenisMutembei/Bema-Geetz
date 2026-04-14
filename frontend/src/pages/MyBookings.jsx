import { useEffect, useState } from 'react';
import api from '../services/api';
import PaymentModal from '../components/PaymentModal';

export default function MyBookings() {
  const [rentalBookings, setRentalBookings] = useState([]);
  const [airportBookings, setAirportBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/my'),
      api.get('/airport/bookings/my')
    ]).then(([rentals, airport]) => {
      setRentalBookings(rentals.data?.bookings || rentals.data || []);
      setAirportBookings(airport.data || []);
    }).catch(() => {
      setRentalBookings([]);
      setAirportBookings([]);
    }).finally(() => setLoading(false));
  }, [refreshKey]);

  const handlePaymentClick = (booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedBooking(null);
    setRefreshKey(k => k + 1);
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      paid: 'bg-green-900/30 border-green-700 text-green-400',
      unpaid: 'bg-red-900/30 border-red-700 text-red-400',
      partial: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
      refunded: 'bg-gray-900/30 border-gray-700 text-gray-400'
    };
    return styles[status] || styles.unpaid;
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-900/30 border-green-700 text-green-400',
      pending: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
      cancelled: 'bg-red-900/30 border-red-700 text-red-400'
    };
    return styles[status] || styles.pending;
  };

  if (loading) {
    return <div className="min-h-screen pt-24 flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <div>
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-4">Account</div>
          <h1 className="font-display text-4xl text-white">My <span className="text-gold">Bookings</span></h1>
          <p className="mt-2 text-gray-400">Track your rental reservations and airport transfers in one place.</p>
        </div>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-white">Rental Bookings</h2>
          {rentalBookings.length ? (
            <div className="grid gap-4">
              {rentalBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-dark-border bg-dark-card p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{booking.listing_title}</div>
                      <div className="text-gray-500 text-sm">{booking.listing_location}</div>
                      <div className="mt-2 text-xs text-gray-500">
                        Invoice: <span className="text-gold">{booking.invoice_id}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPaymentStatusBadge(booking.payment_status)}`}>
                          {booking.payment_status === 'paid' ? 'Paid' : booking.payment_status === 'partial' ? 'Partial' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div>Check-in: {booking.check_in ? String(booking.check_in).slice(0, 10) : 'TBD'}</div>
                      <div>Check-out: {booking.check_out ? String(booking.check_out).slice(0, 10) : 'TBD'}</div>
                      <div className="mt-2 text-gold font-bold">
                        KES {Number(booking.total_amount || booking.listing_price).toLocaleString()}
                      </div>
                      {booking.payment_status !== 'paid' && (
                        <div className="text-xs text-gray-400">
                          Balance: KES {Number(booking.balance_amount || booking.total_amount).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {booking.payment_status !== 'paid' ? (
                        <button
                          onClick={() => handlePaymentClick(booking)}
                          className="btn-gold px-4 py-2 rounded-xl text-sm font-semibold"
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="text-green-400 text-sm font-semibold">✓ Paid</span>
                      )}
                      <button
                        className="text-gold hover:text-gold-light text-xs"
                        onClick={() => window.open(`/api/invoices/download/${booking.invoice_id}`, '_blank')}
                      >
                        Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dark-border bg-dark-card p-8 text-gray-500">No rental bookings yet.</div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-white">Airport Transfers</h2>
          {airportBookings.length ? (
            <div className="grid gap-4">
              {airportBookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-dark-border bg-dark-card p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="text-white font-semibold">{booking.service_name}</div>
                      <div className="text-gray-500 text-sm">{booking.airport_name}</div>
                      <div className="mt-2 text-xs text-gray-500">{booking.pickup_address} to {booking.dropoff_address}</div>
                      <div className="mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div>Date: {String(booking.booking_date).slice(0, 10)}</div>
                      <div>Time: {String(booking.booking_time).slice(0, 5)}</div>
                      <div className="mt-2 text-gold font-bold">${Number(booking.total_price).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dark-border bg-dark-card p-8 text-gray-500">No airport transfers yet.</div>
          )}
        </section>

        {showPaymentModal && selectedBooking && (
          <PaymentModal
            booking={selectedBooking}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedBooking(null);
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}
