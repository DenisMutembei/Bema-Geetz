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
    customerName: searchParams.get('name') || user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    listingId: searchParams.get('listing') || '',
    checkIn: '',
    checkOut: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/listings/index.php')
      .then((r) => {
        const listingsData = r.data?.data || r.data?.listings || [];
        console.log('Booking page - listings loaded:', listingsData.length);
        setListings(listingsData);
      })
      .catch((err) => {
        console.error('Failed to load listings:', err);
        setListings([]);
      });

    if (form.listingId) {
      api.get(`/listings/index.php?id=${form.listingId}`)
        .then((r) => setListing(r.data.data || r.data))
        .catch((err) => {
          console.error('Failed to load listing:', err);
          setListing(null);
        });
    }
  }, []);

  useEffect(() => {
    if (form.listingId) {
      api.get(`/listings/index.php?id=${form.listingId}`).then((r) => setListing(r.data.data || r.data)).catch(() => setListing(null));
    }
  }, [form.listingId]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Booking form submitted');
    console.log('Form data:', form);
    console.log('User:', user);
    console.log('Listing:', listing);

    setLoading(true);
    setError('');

    if (!user) {
      console.log('No user logged in, redirecting to login');
      setLoading(false);
      navigate(`/login?next=${encodeURIComponent(`/booking?listing=${form.listingId}`)}`);
      return;
    }

    if (listing?.requires_verification && !hasRequiredVerification(listing.verification_type)) {
      console.log('Verification required');
      setLoading(false);
      setError('Please complete the required verification before booking this listing.');
      navigate('/verification');
      return;
    }

    try {
      console.log('Sending booking request...');
      const res = await api.post('/bookings/create.php', form);
      console.log('Booking response:', res.data);
      setSubmitted(res.data);
    } catch (err) {
      console.error('Booking error:', err);
      console.error('Error response:', err.response);
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
                  <input name="customerName" required value={form.customerName} onChange={handleChange} placeholder="Your full name" className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
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
                <select name="listingId" required value={form.listingId} onChange={handleChange} className="input-dark w-full px-4 py-3 rounded-xl text-sm">
                  <option value="">Choose a listing...</option>
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>{l.title} - KES {Number(l.price).toLocaleString()}/day</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Check-in Date</label>
                  <input name="checkIn" type="date" value={form.checkIn} onChange={handleChange} min={new Date().toISOString().split('T')[0]} className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Check-out Date</label>
                  <input name="checkOut" type="date" value={form.checkOut} onChange={handleChange} min={form.checkIn || new Date().toISOString().split('T')[0]} className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
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

            <div className="bg-dark-card border border-gold/20 rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-white font-semibold text-lg">Need Help?</h3>
              <p className="text-gray-400 text-sm">Contact us directly for quick assistance with your booking.</p>

              <a href="tel:+254708771345" className="flex items-center gap-3 bg-gold/10 border border-gold/30 rounded-xl p-4 hover:bg-gold/20 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                  <svg className="w-5 h-5 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Call Us</div>
                  <div className="text-gold text-xs tracking-wider">+254 708 771345</div>
                </div>
              </a>

              <a href="https://wa.me/254708771345" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4 hover:bg-green-500/20 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">WhatsApp</div>
                  <div className="text-green-400 text-xs tracking-wider">Chat with us</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
