import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';

export default function Houses() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const fetchListings = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/listings', { params: { type: 'house', ...filters } });
      setListings(res.data);
    } catch { setListings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchListings({
      location: searchParams.get('location') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    });
  }, [searchParams]);

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="relative py-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-card to-dark opacity-60"/>
        <div className="relative z-10">
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-4">Stays</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
            Luxury <span className="text-gold">Accommodations</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto font-body text-lg">
            Find your perfect home away from home across Nairobi & Nakuru
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <SearchBar onSearch={f => fetchListings({ ...f, type: 'house' })} initialValues={{ type: 'house' }} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-card rounded-2xl h-72 animate-pulse border border-dark-border"/>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <p className="text-gray-500 text-sm mb-6">{listings.length} propert{listings.length !== 1 ? 'ies' : 'y'} available</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(l => <ListingCard key={l.id} listing={l}/>)}
            </div>
          </>
        ) : (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="font-display text-2xl text-white mb-2">No Properties Found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
