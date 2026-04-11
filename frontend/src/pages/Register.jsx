import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', form);
      login(res.data.token, res.data.user);
      const next = searchParams.get('next');
      if (next && res.data.user.role !== 'host') navigate(next);
      else if (res.data.user.role === 'host') navigate('/host');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
              <polygon points="20,4 32,12 32,28 20,36 8,28 8,12" stroke="#D4A017" strokeWidth="1.5" fill="none" />
              <polygon points="20,10 28,15 28,25 20,30 12,25 12,15" stroke="#D4A017" strokeWidth="1" fill="rgba(212,160,23,0.08)" />
              <line x1="20" y1="10" x2="20" y2="30" stroke="#D4A017" strokeWidth="0.8" />
              <line x1="12" y1="15" x2="28" y2="25" stroke="#D4A017" strokeWidth="0.8" />
              <line x1="28" y1="15" x2="12" y2="25" stroke="#D4A017" strokeWidth="0.8" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-white font-bold">Join Bema Geetz</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account to book rentals or manage listings</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="John Kamau"
              className="input-dark w-full px-4 py-3.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className="input-dark w-full px-4 py-3.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+254 7XX XXX XXX"
              className="input-dark w-full px-4 py-3.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 6 characters"
              className="input-dark w-full px-4 py-3.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs tracking-wider uppercase mb-3">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: 'customer' }))}
                className={`p-4 rounded-xl border text-center transition-all ${form.role === 'customer' ? 'border-gold bg-gold/10 text-gold' : 'border-dark-border text-gray-400 hover:border-gray-500'}`}
              >
                <div className="text-xs font-semibold">Browse & Book</div>
                <div className="text-xs opacity-70 mt-1">Customer</div>
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, role: 'host' }))}
                className={`p-4 rounded-xl border text-center transition-all ${form.role === 'host' ? 'border-gold bg-gold/10 text-gold' : 'border-dark-border text-gray-400 hover:border-gray-500'}`}
              >
                <div className="text-xs font-semibold">List & Earn</div>
                <div className="text-xs opacity-70 mt-1">Host</div>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gold w-full py-4 rounded-xl font-bold text-sm tracking-wider disabled:opacity-60">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-gold hover:text-gold-light transition-colors">Sign in</Link>
          </div>
        </form>

        <div className="mt-4 bg-dark-card border border-dark-border rounded-xl p-4 text-xs text-gray-500 space-y-2">
          <div className="text-gray-300 font-semibold">Registration guide</div>
          <div>Use `Browse & Book` if you want to rent cars or houses.</div>
          <div>Use `List & Earn` only if you want to upload and manage listings as a host.</div>
          <div>If you see `Email already registered`, go to <Link to="/login" className="text-gold hover:text-gold-light">Sign in</Link> instead.</div>
          <div>If you see a database/setup message, run the backend setup/seed first, then try again.</div>
        </div>
      </div>
    </div>
  );
}
