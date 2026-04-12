import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRequiredVerification } = useVerification();
  const [listing, setListing] = useState(null);
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({
    customer_name: searchParams.get('name') || '',
    phone: '',
    email: '',
    listing_id: searchParams.get('listing') || '',
    check_in: '',
    check_out: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/listings')
      .then((r) => {
        const listingsData = r.data?.listings || [];
        console.log('Booking page - listings loaded:', listingsData.length);
        setListings(listingsData);
      })
      .catch((err) => {
        console.error('Failed to load listings:', err);
        setListings([]);
      });
    
    if (form.listing_id) {
      api.get(`/listings/${form.listing_id}`)
        .then((r) => setListing(r.data))
        .catch((err) => {
          console.error('Failed to load listing:', err);
          setListing(null);
        });
    }
  }, []);

  useEffect(() => {
    if (form.listing_id) {
      api.get(`/listings/${form.listing_id}`).then((r) => setListing(r.data)).catch(() => setListing(null));
    }
  }, [form.listing_id]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!user) {
      setLoading(false);
      navigate(`/login?next=${encodeURIComponent(`/booking?listing=${form.listing_id}`)}`);
      return;
    }

    if (listing?.requires_verification && !hasRequiredVerification(listing.verification_type)) {
      setLoading(false);
      setError('Please complete the required verification before booking this listing.');
      navigate('/verification');
      return;
    }

    try {
      const res = await api.post('/bookings', form);
      setSubmitted(res.data);
      if (res.data.whatsappUrl) {
        setTimeout(() => window.open(res.data.whatsappUrl, '_blank'), 800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-dark-card border border-gold/30 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-3xl text-white mb-2">Booking Confirmed!</h2>
            <div className="badge-gold inline-block px-4 py-2 rounded-full text-base font-bold mb-4">{submitted.invoice_id}</div>
            <p className="text-gray-400 text-sm mb-6 font-body text-base">
              Your booking has been received. WhatsApp is opening to confirm your reservation with our team.
            </p>
            <div className="space-y-3">
              <a
                href={submitted.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
              >
                Open WhatsApp to Confirm
              </a>
              <Link to="/" className="btn-outline-gold w-full block text-center py-3 rounded-xl text-sm">Back to Home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-4">Book Now</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
            Make a <span className="text-gold">Reservation</span>
          </h1>
          <p className="text-gray-400 font-body text-lg">Fill the form below and we&apos;ll confirm via WhatsApp</p>
        </div>

        {!user && (
          <div className="mb-6 rounded-2xl border border-gold/30 bg-dark-card px-5 py-4 text-sm text-gray-300">
            You can browse houses and cars without logging in. Login only happens when you start the rental process.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl p-8 space-y-5">
              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Full Name *</label>
                  <input name="customer_name" required value={form.customer_name} onChange={handleChange} placeholder="Your full name" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Phone *</label>
                  <input name="phone" required value={form.phone} onChange={handleChange} placeholder="+254 7XX XXX XXX" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Email *</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
              </div>

              <div>
                <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Select Listing *</label>
                <select name="listing_id" required value={form.listing_id} onChange={handleChange} className="input-dark w-full px-4 py-3 rounded-xl text-sm">
                  <option value="">Choose a listing...</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>{l.title} - KES {Number(l.price).toLocaleString()}/day</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Check-in Date</label>
                  <input name="check_in" type="date" value={form.check_in} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Check-out Date</label>
                  <input name="check_out" type="date" value={form.check_out} onChange={handleChange} min={form.check_in || new Date().toISOString().split('T')[0]} className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Message</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="Any special requirements or questions..." className="input-dark w-full px-4 py-3 rounded-xl text-sm resize-none" />
              </div>

              <button type="submit" disabled={loading} className="btn-gold w-full py-4 rounded-xl font-bold text-sm tracking-wider disabled:opacity-60 disabled:cursor-not-allowed">
                {loading ? 'Processing...' : user ? 'Submit Booking & Open WhatsApp' : 'Login To Continue Rental'}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {listing && (
              <div className="bg-dark-card border border-gold/20 rounded-2xl overflow-hidden">
                {listing.images?.[0] && <img src={listing.images[0]} alt={listing.title} className="w-full h-40 object-cover" />}
                <div className="p-4">
                  <h3 className="font-display text-white font-semibold mb-1">{listing.title}</h3>
                  <div className="text-gray-400 text-xs mb-2">{listing.location}</div>
                  <div className="text-gold font-bold font-display text-xl">KES {Number(listing.price).toLocaleString()}<span className="text-gray-500 text-xs font-sans">/day</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
