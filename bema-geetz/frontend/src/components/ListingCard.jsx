import { Link } from 'react-router-dom';

export default function ListingCard({ listing }) {
  const img = listing.images?.[0] || `https://images.unsplash.com/photo-${listing.type === 'car' ? '1494976388531-d1058494cdd8' : '1560448204-e02f11c3d0e2'}?auto=format&fit=crop&w=800&q=80`;

  return (
    <Link to={`/listing/${listing.id}`} className="listing-card block rounded-2xl overflow-hidden bg-dark-card group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={img}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { e.target.src = `https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80`; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
        <span className="absolute top-3 left-3 badge-gold px-3 py-1 rounded-full">
          {listing.type === 'car' ? '🚗 Car' : '🏠 House'}
        </span>
        {listing.images?.length > 1 && (
          <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            +{listing.images.length - 1} photos
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-base font-semibold text-white leading-tight line-clamp-1 mb-1">{listing.title}</h3>

        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <svg className="w-3 h-3 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          {listing.location}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-gold font-bold text-lg font-display">KES {Number(listing.price).toLocaleString()}</span>
            <span className="text-gray-500 text-xs ml-1">/day</span>
          </div>
          <span className="btn-gold px-3 py-1.5 rounded-full text-xs">View →</span>
        </div>

        {listing.host_name && (
          <div className="mt-3 pt-3 border-t border-dark-border flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-xs text-gold font-bold">
              {listing.host_name[0]}
            </div>
            <span className="text-gray-500 text-xs">{listing.host_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
