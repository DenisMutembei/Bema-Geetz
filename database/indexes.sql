-- Performance Indexes for Bema Geetz Database
-- Run these indexes to improve query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Listings table indexes
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_available ON listings(available);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_title_search ON listings USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_listings_description_search ON listings USING gin(to_tsvector('english', description));

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_type_available ON listings(type, available);
CREATE INDEX IF NOT EXISTS idx_listings_host_available ON listings(host_id, available);
CREATE INDEX IF NOT EXISTS idx_listings_price_range ON listings(price, available) WHERE available = true;

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Index for availability checks (prevent double bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_listing_dates ON bookings(listing_id, check_in, check_out) 
WHERE status != 'cancelled';

-- Full-text search index for combined search
CREATE INDEX IF NOT EXISTS idx_listings_fulltext ON listings USING gin(
  to_tsvector('english', title || ' ' || description || ' ' || location)
);

-- Partial indexes for better performance on active data
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(created_at DESC) 
WHERE available = true;

CREATE INDEX IF NOT EXISTS idx_bookings_recent ON bookings(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_listings_admin_stats ON listings(type, available, created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_admin_stats ON bookings(status, created_at);

-- Analyze tables after creating indexes
ANALYZE users;
ANALYZE listings;
ANALYZE bookings;
ANALYZE reviews;

-- Query to check index usage (run this to verify indexes are being used)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_scan DESC;
