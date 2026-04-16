import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'HOME' },
    { to: '/cars', label: 'CAR HIRE' },
    { to: '/houses', label: 'ACCOMMODATIONS' },
    { to: '/airport', label: 'AIRPORT' },
    { to: '/booking', label: 'CONTACT' }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-dark/95 backdrop-blur-md border-b border-dark-border shadow-2xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0 z-10">
            <img
              src="/bemageetz/logo_bema.jpeg"
              alt="Bema Geetz"
              className="h-10 w-10 rounded-full border-2 border-gold object-cover shadow-[0_0_16px_rgba(212,175,55,0.25)]"
            />
            <div className="flex flex-col">
              <div className="font-display text-gold font-bold text-base tracking-widest leading-none">BEMA GEETZ</div>
              <div className="text-[9px] tracking-[0.3em] text-gray-400 uppercase">Rentals</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8 flex-1 justify-center px-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-xs tracking-[0.15em] font-sans font-medium transition-colors hover:text-gold whitespace-nowrap ${location.pathname === link.to ? 'text-gold' : 'text-gray-300'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                {(user.role === 'admin' || user.role === 'host') && (
                  <Link to={user.role === 'admin' ? '/admin' : '/host'} className="text-xs tracking-wider text-gold hover:text-gold-light transition-colors whitespace-nowrap hidden lg:block">
                    {user.role === 'admin' ? 'Admin' : 'Host'}
                  </Link>
                )}
                <Link to="/verification" className="text-xs tracking-wider text-gray-300 hover:text-gold transition-colors whitespace-nowrap hidden lg:block">
                  Verify
                </Link>
                <span className="text-gray-400 text-xs truncate max-w-[80px] lg:max-w-[100px] hidden md:block">{user.name}</span>
                <button onClick={handleLogout} className="btn-outline-gold px-3 py-1.5 rounded-full text-xs tracking-wider whitespace-nowrap">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-xs tracking-wider text-gray-300 hover:text-gold transition-colors whitespace-nowrap hidden lg:block">Sign In</Link>
                <Link to="/register" className="btn-gold px-4 py-2 rounded-full text-xs tracking-wider whitespace-nowrap">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-gold flex-shrink-0 z-20" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-dark-card border-b border-dark-border px-4 py-6 space-y-4 shadow-2xl">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="block text-sm tracking-wider text-gray-300 hover:text-gold transition-colors py-1">{link.label}</Link>
          ))}
          <div className="border-t border-dark-border pt-4 space-y-3">
            {user ? (
              <>
                <Link to="/verification" className="block text-sm text-gold">Verification</Link>
                {(user.role === 'admin' || user.role === 'host') && (
                  <Link to={user.role === 'admin' ? '/admin' : '/host'} className="block text-sm text-gold">{user.role === 'admin' ? 'Admin Dashboard' : 'Host Dashboard'}</Link>
                )}
                <button onClick={handleLogout} className="btn-outline-gold w-full py-2 rounded-full text-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-center text-sm text-gray-300 hover:text-gold py-1">Sign In</Link>
                <Link to="/register" className="btn-gold block text-center py-2.5 rounded-full text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
