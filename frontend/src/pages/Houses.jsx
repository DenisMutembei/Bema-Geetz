import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useListings } from '../hooks/useApi';
import ListingCard from '../components/ListingCard';
import AdvancedSearch from '../components/AdvancedSearch';
import VerificationBanner from '../components/VerificationBanner';
import Pagination from '../components/Pagination';

export default function Houses() {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    type: 'house',
    page: currentPage,
    limit: 12,
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest'
  }), [searchParams, currentPage]);

  const { data, isLoading, error } = useListings(filters);
  
  // Extract listings and pagination with safe defaults
  const listings = data?.listings || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 };
  
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl text-white mb-2">Error loading listings</h3>
          <p className="text-gray-400">{error.message || 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="relative py-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-card to-dark opacity-60" />
        <div className="relative z-10">
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-4">Stays</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">
            Luxury <span className="text-gold">Accommodations</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto font-body text-lg">
            Find your perfect home away from home across Nairobi, Nakuru, Naivasha, and other places
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <VerificationBanner requiredType="national_id" />

        <div className="mb-10">
          <AdvancedSearch onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-2xl h-72 animate-pulse border border-gray-700" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-400 text-sm">
                {pagination.totalItems} propert{pagination.totalItems !== 1 ? 'ies' : 'y'} available
              </p>
              <p className="text-gray-500 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing, index) => (
                <ListingCard key={listing.id} listing={listing} priority={index < 4} />
              ))}
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </>
        ) : (
          <div className="text-center py-32">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="font-display text-2xl text-white mb-2">No Properties Found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
