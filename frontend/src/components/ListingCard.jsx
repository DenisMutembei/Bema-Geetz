import { Link } from 'react-router-dom';
import { memo } from 'react';
import FastImage from './FastImage';

// Pre-computed fallback images (instant load)
const FALLBACK_IMAGES = {
  car: '/placeholder-car.jpg',
  house: '/placeholder-house.jpg'
};

// Inline SVG fallbacks for zero network requests
const SVG_FALLBACKS = {
  car: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23141414' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23FFD700' font-size='48'%3E🚗%3C/text%3E%3Ctext x='50%25' y='70%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3ELuxury Car%3C/text%3E%3C/svg%3E`,
  house: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23141414' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23FFD700' font-size='48'%3E🏠%3C/text%3E%3Ctext x='50%25' y='70%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3EPremium Home%3C/text%3E%3C/svg%3E`
};

const ListingCard = memo(function ListingCard({ listing, priority = false }) {
  // Use actual uploaded image or inline SVG fallback (zero network delay)
  const hasValidImage = listing.images?.[0] && listing.images[0].startsWith('http');
  const img = hasValidImage 
    ? listing.images[0] 
    : SVG_FALLBACKS[listing.type] || SVG_FALLBACKS.house;

  return (
    <Link to={`/listing/${listing.id}`} className="listing-card block rounded-xl overflow-hidden bg-dark-card border border-dark-border hover:border-gold/50 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-1 group">
      {/* Image - Optimized for instant display */}
      <div className="relative h-48 overflow-hidden bg-dark">
        <FastImage
          src={img}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          priority={priority}
          fallback={SVG_FALLBACKS[listing.type]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>
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
});

export default ListingCard;
