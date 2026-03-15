import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'admin') navigate('/admin');
      else if (res.data.user.role === 'host') navigate('/host');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl"/>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-gold flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 40 40" className="w-10 h-10" fill="none">
              <polygon points="20,4 32,12 32,28 20,36 8,28 8,12" stroke="#D4A017" strokeWidth="1.5" fill="none"/>
              <polygon points="20,10 28,15 28,25 20,30 12,25 12,15" stroke="#D4A017" strokeWidth="1" fill="rgba(212,160,23,0.08)"/>
              <line x1="20" y1="10" x2="20" y2="30" stroke="#D4A017" strokeWidth="0.8"/>
              <line x1="12" y1="15" x2="28" y2="25" stroke="#D4A017" strokeWidth="0.8"/>
              <line x1="28" y1="15" x2="12" y2="25" stroke="#D4A017" strokeWidth="0.8"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl text-white font-bold">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your Bema Geetz account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <div>
            <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className="input-dark w-full px-4 py-3.5 rounded-xl text-sm"/>
          </div>

          <div>
            <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="input-dark w-full px-4 py-3.5 rounded-xl text-sm"/>
          </div>

          <button type="submit" disabled={loading}
            className="btn-gold w-full py-4 rounded-xl font-bold text-sm tracking-wider disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold hover:text-gold-light transition-colors">Register here</Link>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-4 bg-dark-card border border-dark-border rounded-xl p-4 text-xs text-gray-500">
          <div className="text-gray-400 font-semibold mb-2">Demo Admin:</div>
          <div>Email: admin@bemageetz.com</div>
          <div>Password: admin123</div>
        </div>
      </div>
    </div>
  );
}
