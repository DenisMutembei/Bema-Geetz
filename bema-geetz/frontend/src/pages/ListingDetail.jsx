import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(r => setListing(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (!listing) return null;

  const images = listing.images?.length ? listing.images : [
    `https://images.unsplash.com/photo-${listing.type === 'car' ? '1494976388531-d1058494cdd8' : '1560448204-e02f11c3d0e2'}?auto=format&fit=crop&w=1200&q=80`
  ];

  const waNumber = import.meta.env.VITE_WHATSAPP || '254700000000';
  const waText = encodeURIComponent(`Hello! I'm interested in "${listing.title}" listed on Bema Geetz. Could you provide more details?`);

  const isVideo = (url) => /\.(mp4|mov|avi|webm)$/i.test(url);

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 pt-4">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <span>/</span>
          <Link to={`/${listing.type === 'car' ? 'cars' : 'houses'}`} className="hover:text-gold transition-colors capitalize">{listing.type === 'car' ? 'Cars' : 'Houses'}</Link>
          <span>/</span>
          <span className="text-gray-400">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Gallery + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden h-80 sm:h-[480px] cursor-pointer" onClick={() => setLightbox(true)}>
              {isVideo(images[activeImg]) ? (
                <video src={images[activeImg]} controls className="w-full h-full object-cover"/>
              ) : (
                <img src={images[activeImg]} alt={listing.title} className="w-full h-full object-cover transition-all duration-300"/>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"/>
              <div className="absolute bottom-4 right-4 bg-dark-card/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full border border-dark-border">
                {activeImg + 1} / {images.length}
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-dark-card/80 backdrop-blur text-white w-10 h-10 rounded-full flex items-center justify-center border border-dark-border hover:border-gold transition-colors">
                    ←
                  </button>
                  <button onClick={e => { e.stopPropagation(); setActiveImg(i => (i + 1) % images.length); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-dark-card/80 backdrop-blur text-white w-10 h-10 rounded-full flex items-center justify-center border border-dark-border hover:border-gold transition-colors">
                    →
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImg === i ? 'border-gold' : 'border-dark-border hover:border-gray-500'}`}>
                    {isVideo(img) ? (
                      <video src={img} className="w-full h-full object-cover"/>
                    ) : (
                      <img src={img} alt="" className="w-full h-full object-cover"/>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Details */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <span className="badge-gold px-3 py-1 rounded-full text-xs mb-2 inline-block">
                    {listing.type === 'car' ? '🚗 Car Hire' : '🏠 Accommodation'}
                  </span>
                  <h1 className="font-display text-2xl sm:text-3xl text-white font-bold">{listing.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                    {listing.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl text-gold font-bold">KES {Number(listing.price).toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">per day</div>
                </div>
              </div>

              {/* Car specs */}
              {listing.type === 'car' && (listing.make || listing.model || listing.year) && (
                <div className="grid grid-cols-3 gap-3 my-5">
                  {listing.make && <div className="bg-dark rounded-xl p-3 text-center">
                    <div className="text-gold font-semibold text-sm">{listing.make}</div>
                    <div className="text-gray-600 text-xs">Make</div>
                  </div>}
                  {listing.model && <div className="bg-dark rounded-xl p-3 text-center">
                    <div className="text-gold font-semibold text-sm">{listing.model}</div>
                    <div className="text-gray-600 text-xs">Model</div>
                  </div>}
                  {listing.year && <div className="bg-dark rounded-xl p-3 text-center">
                    <div className="text-gold font-semibold text-sm">{listing.year}</div>
                    <div className="text-gray-600 text-xs">Year</div>
                  </div>}
                </div>
              )}

              {/* House specs */}
              {listing.type === 'house' && (listing.bedrooms || listing.bathrooms) && (
                <div className="grid grid-cols-2 gap-3 my-5">
                  {listing.bedrooms && <div className="bg-dark rounded-xl p-3 text-center">
                    <div className="text-gold font-semibold text-sm">{listing.bedrooms} 🛏</div>
                    <div className="text-gray-600 text-xs">Bedrooms</div>
                  </div>}
                  {listing.bathrooms && <div className="bg-dark rounded-xl p-3 text-center">
                    <div className="text-gold font-semibold text-sm">{listing.bathrooms} 🚿</div>
                    <div className="text-gray-600 text-xs">Bathrooms</div>
                  </div>}
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

          {/* Right: Booking sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Price Card */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="font-display text-4xl text-gold font-bold">KES {Number(listing.price).toLocaleString()}</div>
                <div className="text-gray-500 text-sm">per day</div>
              </div>

              <Link
                to={`/booking?listing=${listing.id}`}
                className="btn-gold w-full block text-center py-3.5 rounded-xl font-semibold text-sm tracking-wider mb-3"
              >
                📅 Book Now
              </Link>

              <a
                href={`https://wa.me/${waNumber}?text=${waText}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all text-sm font-semibold mb-3"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
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

            {/* Share booking link */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-4">
              <div className="text-gray-400 text-xs mb-2">📎 Share booking link</div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/booking?listing=${listing.id}`}
                  className="input-dark flex-1 px-3 py-2 rounded-lg text-xs"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/booking?listing=${listing.id}`)}
                  className="btn-gold px-3 py-2 rounded-lg text-xs"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-gold">✕</button>
          {isVideo(images[activeImg]) ? (
            <video src={images[activeImg]} controls className="max-h-full max-w-full rounded-xl"/>
          ) : (
            <img src={images[activeImg]} alt="" className="max-h-full max-w-full rounded-xl object-contain"/>
          )}
        </div>
      )}
    </div>
  );
}
