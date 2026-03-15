import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';

export default function Cars() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const fetch = async (filters = {}) => {
    setLoading(true);
    try {
      const params = { type: 'car', ...filters };
      const res = await api.get('/listings', { params });
      setListings(res.data);
    } catch { setListings([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const location = searchParams.get('location') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    fetch({ location, maxPrice });
  }, [searchParams]);

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      {/* Header */}
      <div className="relative py-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-card to-dark opacity-60"/>
        <div className="relative z-10">
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-4">Fleet</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
            Premium <span className="text-gold">Car Hire</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto font-body text-lg">
            Choose from our curated fleet of luxury and economy vehicles in Nairobi & Nakuru
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <SearchBar onSearch={f => fetch({ ...f, type: 'car' })} initialValues={{ type: 'car' }} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-card rounded-2xl h-72 animate-pulse border border-dark-border"/>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <p className="text-gray-500 text-sm mb-6">{listings.length} vehicle{listings.length !== 1 ? 's' : ''} available</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map(l => <ListingCard key={l.id} listing={l}/>)}
            </div>
          </>
        ) : (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="font-display text-2xl text-white mb-2">No Cars Found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
