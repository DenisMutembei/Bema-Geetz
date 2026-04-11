import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';
import { useListingPreloader } from '../hooks/useImagePreloader';

const HERO_BG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1920&q=80';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [cars, setCars] = useState([]);
  const [houses, setHouses] = useState([]);

  useEffect(() => {
    api.get('/listings').then((r) => {
      const all = r.data.listings || [];
      setFeatured(all.slice(0, 6));
      setCars(all.filter((l) => l.type === 'car').slice(0, 3));
      setHouses(all.filter((l) => l.type === 'house').slice(0, 3));
    }).catch(() => {});
  }, []);

  // Preload images for instant display
  const { preloadedCount } = useListingPreloader(featured);

  const stats = [
    { num: '500+', label: 'Premium Vehicles' },
    { num: '200+', label: 'Luxury Stays' },
    { num: '4+', label: 'Service Areas' },
    { num: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="Bema Geetz hero background" className="w-full h-full object-cover" />
          <div className="hero-overlay absolute inset-0" />
        </div>

        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2 bg-dark-card/80 border border-gold/30 backdrop-blur px-4 py-2 rounded-full text-gold text-xs tracking-[0.15em] font-sans">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            NAIROBI, NAKURU, NAIVASHA & MORE
          </div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto" style={{ marginTop: '4rem' }}>
          <div className="fade-in-up flex justify-center mb-8" style={{ animationDelay: '0s' }}>
            <img
              src="/logo_bema.jpeg"
              alt="Bema Geetz"
              className="w-[150px] h-[150px] rounded-full border-4 border-gold object-cover shadow-[0_0_30px_rgba(212,175,55,0.5)]"
            />
          </div>

          <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-gold text-xl sm:text-2xl font-display mb-4">Redefining Excellence</div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] mb-6">
              <span className="text-white">Premium </span>
              <span className="gold-shimmer">Car Hire</span>
              <br />
              <span className="text-white">& </span>
              <span className="gold-shimmer">Accommodations</span>
            </h1>
          </div>

          <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
            <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 font-body text-xl leading-relaxed">
              Experience luxury and comfort with Bema Geetz. We offer premium car rentals and stylish accommodations
              across Nairobi, Nakuru, Naivasha, and other destinations.
            </p>
          </div>

          <div className="fade-in-up flex flex-wrap items-center justify-center gap-4 mb-12" style={{ animationDelay: '0.5s' }}>
            <Link to="/cars" className="btn-gold px-8 py-3.5 rounded-full font-sans font-semibold text-sm tracking-wider flex items-center gap-2">
              Car Hire
            </Link>
            <Link to="/houses" className="btn-outline-gold px-8 py-3.5 rounded-full font-sans font-semibold text-sm tracking-wider flex items-center gap-2">
              Accommodations
            </Link>
          </div>

          <div className="fade-in-up flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: '0.7s' }}>
            <Link to="/cars" className="btn-gold px-8 py-3.5 rounded-full font-sans font-semibold text-sm tracking-wider">
              Browse Cars
            </Link>
            <Link to="/houses" className="btn-outline-gold px-8 py-3.5 rounded-full font-sans font-semibold text-sm tracking-wider">
              Browse Stays
            </Link>
            <Link to="/booking" className="btn-outline-gold px-8 py-3.5 rounded-full font-sans font-semibold text-sm tracking-wider">
              Get Quote
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400">
          <span className="text-xs tracking-[0.2em]">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-gold to-transparent animate-pulse" />
        </div>
      </section>

      <section className="py-16 px-4 bg-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl text-white mb-2">Find Your Perfect <span className="text-gold">Experience</span></h2>
          </div>
          <SearchBar />
        </div>
      </section>

      <section className="py-12 px-4 border-y border-dark-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-display text-3xl gold-shimmer font-bold mb-1">{s.num}</div>
              <div className="text-gray-400 text-xs tracking-wider uppercase font-sans">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="badge-gold inline-block px-3 py-1 rounded-full mb-3">Featured</div>
                <h2 className="font-display text-3xl sm:text-4xl text-white">Top <span className="text-gold">Listings</span></h2>
              </div>
              <Link to="/cars" className="text-gold text-sm hover:text-gold-light transition-colors">View all</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((l, i) => <ListingCard key={l.id} listing={l} priority={i < 4} />)}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 px-4 bg-dark-card border-y border-dark-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="badge-gold inline-block px-3 py-1 rounded-full mb-3">Car Hire</div>
              <h2 className="font-display text-3xl sm:text-4xl text-white">Premium <span className="text-gold">Vehicles</span></h2>
            </div>
            <Link to="/cars" className="text-gold text-sm hover:text-gold-light transition-colors">Browse all</Link>
          </div>
          {cars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.map((l, i) => <ListingCard key={l.id} listing={l} priority={i < 2} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <div className="text-5xl mb-4">Cars</div>
              <p>No car listings yet. <Link to="/register" className="text-gold hover:underline">List yours!</Link></p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="badge-gold inline-block px-3 py-1 rounded-full mb-3">Accommodations</div>
              <h2 className="font-display text-3xl sm:text-4xl text-white">Luxury <span className="text-gold">Stays</span></h2>
            </div>
            <Link to="/houses" className="text-gold text-sm hover:text-gold-light transition-colors">Browse all</Link>
          </div>
          {houses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((l, i) => <ListingCard key={l.id} listing={l} priority={i < 2} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <div className="text-5xl mb-4">Homes</div>
              <p>No accommodation listings yet. <Link to="/register" className="text-gold hover:underline">List yours!</Link></p>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark-card to-dark border-y border-dark-border" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-6">
            <img src="/logo_bema.jpeg" alt="Bema Geetz" className="w-14 h-14 rounded-full object-cover" />
          </div>
          <h2 className="font-display text-4xl text-white mb-4">
            <span className="gold-shimmer">Redefining</span> Excellence
          </h2>
          <p className="text-gray-400 text-base mb-8 font-body text-lg">
            Join customers who trust Bema Geetz for premium experiences across Nairobi, Nakuru, Naivasha, and other places.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register" className="btn-gold px-8 py-3.5 rounded-full font-semibold text-sm tracking-wider">
              Get Started
            </Link>
            <a
              href={`https://wa.me/${import.meta.env.VITE_WHATSAPP || '254700000000'}?text=${encodeURIComponent('Hello! I want to learn more about Bema Geetz')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-gold px-8 py-3.5 rounded-full font-semibold text-sm tracking-wider"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-dark-border py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-8">
          <div>
            <div className="font-display text-gold font-bold text-lg tracking-widest mb-3">BEMA GEETZ</div>
            <p className="text-gray-500 text-xs leading-relaxed">Premium car hire and accommodations in Nairobi, Nakuru, Naivasha, and other places in Kenya.</p>
          </div>
          <div>
            <div className="text-gray-300 font-semibold text-xs tracking-wider uppercase mb-4">Services</div>
            <div className="space-y-2">
              <Link to="/cars" className="block text-gray-500 hover:text-gold text-xs transition-colors">Car Hire</Link>
              <Link to="/houses" className="block text-gray-500 hover:text-gold text-xs transition-colors">Accommodations</Link>
              <Link to="/booking" className="block text-gray-500 hover:text-gold text-xs transition-colors">Bookings</Link>
            </div>
          </div>
          <div>
            <div className="text-gray-300 font-semibold text-xs tracking-wider uppercase mb-4">Company</div>
            <div className="space-y-2">
              <Link to="/register" className="block text-gray-500 hover:text-gold text-xs transition-colors">Become a Host</Link>
              <Link to="/login" className="block text-gray-500 hover:text-gold text-xs transition-colors">Sign In</Link>
            </div>
          </div>
          <div>
            <div className="text-gray-300 font-semibold text-xs tracking-wider uppercase mb-4">Contact</div>
            <div className="space-y-2 text-gray-500 text-xs">
              <div>Nairobi, Nakuru, Naivasha and other places, Kenya</div>
              <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP || '254700000000'}`} className="block hover:text-gold transition-colors">WhatsApp Us</a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-dark-border text-center text-gray-600 text-xs">
          © {new Date().getFullYear()} Bema Geetz Rentals
        </div>
      </footer>
    </div>
  );
}
