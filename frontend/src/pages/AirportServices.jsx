import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const VEHICLE_ICON = {
  sedan: 'Sedan',
  luxury: 'Luxury',
  van: 'Van',
  suv: 'SUV'
};

export default function AirportServices() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    flightNumber: '',
    airportName: '',
    pickupAddress: '',
    dropoffAddress: '',
    bookingDate: '',
    bookingTime: '',
    passengerCount: 1,
    luggageCount: 0,
    specialRequests: ''
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/airport/services.php').then((res) => setServices(res.data)).catch(() => setServices([]));
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      navigate('/register?next=/airport');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/airport/bookings.php', { serviceId: selectedService.id, ...formData });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedService) {
    return (
      <div className="min-h-screen px-4 pt-24 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="badge-gold inline-block rounded-full px-3 py-1">Airport</div>
            <h1 className="mt-4 font-display text-4xl text-white sm:text-5xl">
              Airport <span className="text-gold">Transfer Services</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
              Reliable transfers for arrivals, departures, and executive travel.
            </p>
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-gold/20 bg-dark-card px-5 py-4 text-sm text-gray-300">
              Airport transfer does not require a driving license or national ID verification.
              Just create an account or sign in, then complete your booking.
              {!user && (
                <div className="mt-3 flex flex-wrap justify-center gap-3">
                  <Link to="/register" className="btn-gold px-5 py-2 rounded-full text-xs tracking-wider">Sign Up</Link>
                  <Link to="/login?next=%2Fairport" className="btn-outline-gold px-5 py-2 rounded-full text-xs tracking-wider">Sign In</Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="rounded-3xl border border-gold/20 bg-dark-card p-6 text-left transition hover:-translate-y-1 hover:border-gold/50"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-gold">{VEHICLE_ICON[service.vehicle_type] || service.vehicle_type}</div>
                <h3 className="mt-3 font-display text-2xl text-white">{service.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{service.description}</p>
                <div className="mt-6 text-3xl font-bold text-gold">${service.price}</div>
                <div className="mt-3 text-sm text-gray-500">
                  {service.max_passengers} passengers • {service.max_luggage} luggage
                </div>
                <div className="mt-6 inline-flex rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold tracking-wider text-gold">
                  Select Service
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-24 pb-16">
      <div className="mx-auto max-w-2xl rounded-3xl border border-gold/20 bg-dark-card p-8">
        <button onClick={() => setSelectedService(null)} className="text-sm text-gold hover:text-gold-light">
          Back to services
        </button>

        <h2 className="mt-4 font-display text-3xl text-white">Book {selectedService.name}</h2>
        <p className="mt-2 text-gray-400">Complete the form below to reserve your airport transfer. No ID or driving license verification is needed here.</p>

        {error && <div className="mt-6 rounded-2xl border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-300">{error}</div>}

        <form onSubmit={handleBooking} className="mt-8 space-y-4">
          <input placeholder="Flight Number" value={formData.flightNumber} onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })} className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
          <input placeholder="Airport Name" required value={formData.airportName} onChange={(e) => setFormData({ ...formData, airportName: e.target.value })} className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
          <input placeholder="Pickup Address" required value={formData.pickupAddress} onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })} className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
          <input placeholder="Drop-off Address" required value={formData.dropoffAddress} onChange={(e) => setFormData({ ...formData, dropoffAddress: e.target.value })} className="input-dark w-full rounded-xl px-4 py-3 text-sm" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input type="date" required value={formData.bookingDate} onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })} className="input-dark rounded-xl px-4 py-3 text-sm" />
            <input type="time" required value={formData.bookingTime} onChange={(e) => setFormData({ ...formData, bookingTime: e.target.value })} className="input-dark rounded-xl px-4 py-3 text-sm" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input type="number" min="1" max={selectedService.max_passengers} value={formData.passengerCount} onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value, 10) || 1 })} className="input-dark rounded-xl px-4 py-3 text-sm" />
            <input type="number" min="0" max={selectedService.max_luggage} value={formData.luggageCount} onChange={(e) => setFormData({ ...formData, luggageCount: parseInt(e.target.value, 10) || 0 })} className="input-dark rounded-xl px-4 py-3 text-sm" />
          </div>

          <textarea placeholder="Special Requests (optional)" value={formData.specialRequests} onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })} className="input-dark min-h-[120px] w-full rounded-xl px-4 py-3 text-sm" />

          <div className="rounded-2xl border border-gold/20 bg-dark px-4 py-4">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">Total</div>
            <div className="mt-1 text-3xl font-bold text-gold">${selectedService.price}</div>
          </div>

          <button type="submit" disabled={submitting} className="btn-gold w-full rounded-xl py-4 text-sm font-bold tracking-wider disabled:opacity-60">
            {submitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
