import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useVerification } from '../context/VerificationContext';
import VerificationBanner from '../components/VerificationBanner';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasRequiredVerification } = useVerification();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then((r) => setListing(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) return null;

  const images = listing.images?.length ? listing.images : [
    `https://images.unsplash.com/photo-${listing.type === 'car' ? '1494976388531-d1058494cdd8' : '1560448204-e02f11c3d0e2'}?auto=format&fit=crop&w=1200&q=80`
  ];
  const waNumber = import.meta.env.VITE_WHATSAPP || '254700000000';
  const waText = encodeURIComponent(`Hello! I'm interested in "${listing.title}" listed on Bema Geetz. Could you provide more details?`);
  const isVideo = (url) => /\.(mp4|mov|avi|webm)$/i.test(url);

  const handleBookingClick = () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/booking?listing=${listing.id}`)}`);
      return;
    }

    if (listing.requires_verification && !hasRequiredVerification(listing.verification_type)) {
      navigate('/verification');
      return;
    }

    navigate(`/booking?listing=${listing.id}`);
  };

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 pt-4">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/${listing.type === 'car' ? 'cars' : 'houses'}`} className="hover:text-gold transition-colors capitalize">
            {listing.type === 'car' ? 'Cars' : 'Houses'}
          </Link>
          <span>/</span>
          <span className="text-gray-400">{listing.title}</span>
        </div>

        {listing.requires_verification && (
          <VerificationBanner requiredType={listing.verification_type} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-2xl overflow-hidden h-80 sm:h-[480px] cursor-pointer" onClick={() => setLightbox(true)}>
              {isVideo(images[activeImg]) ? (
                <video src={images[activeImg]} controls className="w-full h-full object-cover" />
              ) : (
                <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover transition-all duration-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 right-4 bg-dark-card/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-dark-border">
                {activeImg + 1} / {images.length}
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i - 1 + images.length) % images.length); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-dark-card/80 backdrop-blur text-white w-10 h-10 rounded-full flex items-center justify-center border border-dark-border hover:border-gold transition-colors"
                  >
                    Prev
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveImg((i) => (i + 1) % images.length); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-dark-card/80 backdrop-blur text-white w-10 h-10 rounded-full flex items-center justify-center border border-dark-border hover:border-gold transition-colors"
                  >
                    Next
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-gold' : 'border-dark-border hover:border-gray-500'}`}
                  >
                    {isVideo(img) ? (
                      <video src={img} className="w-full h-full object-cover" />
                    ) : (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <span className="badge-gold px-3 py-1 rounded-full text-xs mb-2 inline-block">
                    {listing.type === 'car' ? 'Car Hire' : 'Accommodation'}
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl text-white font-bold">{listing.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">{listing.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl text-gold font-bold">KES {Number(listing.price).toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">per day</div>
                </div>
              </div>

              {listing.type === 'car' && (listing.make || listing.model || listing.year) && (
                <div className="grid grid-cols-3 gap-3 my-5">
                  {listing.make && <div className="bg-dark rounded-xl p-3 text-center"><div className="text-gold font-semibold text-sm">{listing.make}</div><div className="text-gray-600 text-xs">Make</div></div>}
                  {listing.model && <div className="bg-dark rounded-xl p-3 text-center"><div className="text-gold font-semibold text-sm">{listing.model}</div><div className="text-gray-600 text-xs">Model</div></div>}
                  {listing.year && <div className="bg-dark rounded-xl p-3 text-center"><div className="text-gold font-semibold text-sm">{listing.year}</div><div className="text-gray-600 text-xs">Year</div></div>}
                </div>
              )}

              {listing.type === 'house' && (listing.bedrooms || listing.bathrooms) && (
                <div className="grid grid-cols-2 gap-3 my-5">
                  {listing.bedrooms && <div className="bg-dark rounded-xl p-3 text-center"><div className="text-gold font-semibold text-sm">{listing.bedrooms}</div><div className="text-gray-600 text-xs">Bedrooms</div></div>}
                  {listing.bathrooms && <div className="bg-dark rounded-xl p-3 text-center"><div className="text-gold font-semibold text-sm">{listing.bathrooms}</div><div className="text-gray-600 text-xs">Bathrooms</div></div>}
                </div>
              )}

              {listing.description && (
                <div className="mt-4">
                  <h3 className="text-white font-semibold mb-2 text-sm tracking-wider uppercase">Description</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-body text-base">{listing.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="font-display text-4xl text-gold font-bold">KES {Number(listing.price).toLocaleString()}</div>
                <div className="text-gray-500 text-sm">per day</div>
              </div>

              <button
                onClick={handleBookingClick}
                className="btn-gold w-full block text-center py-3.5 rounded-xl font-semibold text-sm tracking-wider mb-3"
              >
                Book Now
              </button>

              {!user && (
                <p className="mb-3 text-xs text-gray-500 text-center">
                  You can browse freely. Login is only needed when you are ready to rent.
                </p>
              )}

              <a
                href={`https://wa.me/${waNumber}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all text-sm font-semibold mb-3"
              >
                WhatsApp Host
              </a>

              {listing.host_name && (
                <div className="pt-4 border-t border-dark-border">
                  <div className="text-gray-500 text-xs tracking-wider uppercase mb-2">Hosted by</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold font-display">
                      {listing.host_name[0]}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{listing.host_name}</div>
                      {listing.host_phone && <div className="text-gray-500 text-xs">{listing.host_phone}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-gold">Close</button>
          {isVideo(images[activeImg]) ? (
            <video src={images[activeImg]} controls className="max-h-full max-w-full rounded-xl" />
          ) : (
            <img src={images[activeImg]} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
          )}
        </div>
      )}
    </div>
  );
}
