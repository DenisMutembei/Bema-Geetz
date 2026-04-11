import { useEffect, useState } from 'react';
import api from '../services/api';

export default function MyBookings() {
  const [rentalBookings, setRentalBookings] = useState([]);
  const [airportBookings, setAirportBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookings/my'),
      api.get('/airport/bookings/my')
    ]).then(([rentals, airport]) => {
      setRentalBookings(rentals.data);
      setAirportBookings(airport.data);
    }).catch(() => {
      setRentalBookings([]);
      setAirportBookings([]);
    }).finally(() => setLoading(false));
  }, []);

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
                    <div>
                      <div className="text-white font-semibold">{booking.listing_title}</div>
                      <div className="text-gray-500 text-sm">{booking.listing_location}</div>
                      <div className="mt-2 text-xs text-gray-500">Invoice: <span className="text-gold">{booking.invoice_id}</span></div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div>Status: <span className="text-gold">{booking.status}</span></div>
                      <div>Check-in: {booking.check_in ? String(booking.check_in).slice(0, 10) : 'TBD'}</div>
                      <div>Check-out: {booking.check_out ? String(booking.check_out).slice(0, 10) : 'TBD'}</div>
                    </div>
                    <div className="text-gold font-bold">KES {Number(booking.listing_price).toLocaleString()}/day</div>
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
                    <div>
                      <div className="text-white font-semibold">{booking.service_name}</div>
                      <div className="text-gray-500 text-sm">{booking.airport_name}</div>
                      <div className="mt-2 text-xs text-gray-500">{booking.pickup_address} to {booking.dropoff_address}</div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div>Status: <span className="text-gold">{booking.status}</span></div>
                      <div>Date: {String(booking.booking_date).slice(0, 10)}</div>
                      <div>Time: {String(booking.booking_time).slice(0, 5)}</div>
                    </div>
                    <div className="text-gold font-bold">${Number(booking.total_price).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dark-border bg-dark-card p-8 text-gray-500">No airport transfers yet.</div>
          )}
        </section>
      </div>
    </div>
  );
}
