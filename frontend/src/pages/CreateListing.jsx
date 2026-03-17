import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import MediaUpload from '../components/MediaUpload';

export default function CreateListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', type: 'car', price: '', location: '',
    description: '', images: [],
    make: '', model: '', year: '', bedrooms: '', bathrooms: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (form.year) payload.year = parseInt(form.year);
      if (form.bedrooms) payload.bedrooms = parseInt(form.bedrooms);
      if (form.bathrooms) payload.bathrooms = parseInt(form.bathrooms);
      await api.post('/listings', payload);
      navigate('/host');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="pt-8 mb-8">
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-4">New Listing</div>
          <h1 className="font-display text-4xl text-white">Create a <span className="text-gold">Listing</span></h1>
          <p className="text-gray-400 mt-2 font-body text-lg">List your car or property on Bema Geetz</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* Type Toggle */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <label className="block text-gray-300 text-xs tracking-wider uppercase mb-4">Listing Type</label>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: 'car', icon: '🚗', label: 'Car Hire' },
                { value: 'house', icon: '🏠', label: 'Accommodation' }
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`p-5 rounded-xl border text-center transition-all ${form.type === opt.value ? 'border-gold bg-gold/10 text-gold' : 'border-dark-border text-gray-400 hover:border-gray-500'}`}>
                  <div className="text-3xl mb-2">{opt.icon}</div>
                  <div className="text-sm font-semibold">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-5">
            <h3 className="text-white font-semibold tracking-wider uppercase text-xs">Basic Information</h3>

            <div>
              <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Title *</label>
              <input name="title" required value={form.title} onChange={handleChange}
                placeholder={form.type === 'car' ? 'e.g. 2022 Toyota Prado – Luxury SUV' : 'e.g. Modern 2BR Apartment – Westlands'}
                className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Price / Day (KES) *</label>
                <input name="price" type="number" required min="0" value={form.price} onChange={handleChange}
                  placeholder="5000"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
              </div>
              <div>
                <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Location *</label>
                <input name="location" required value={form.location} onChange={handleChange}
                  placeholder="Nairobi, Westlands"
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                placeholder="Describe your listing in detail..."
                className="input-dark w-full px-4 py-3 rounded-xl text-sm resize-none"/>
            </div>
          </div>

          {/* Car-specific */}
          {form.type === 'car' && (
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-5">
              <h3 className="text-white font-semibold tracking-wider uppercase text-xs">Vehicle Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Make</label>
                  <input name="make" value={form.make} onChange={handleChange} placeholder="Toyota"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Model</label>
                  <input name="model" value={form.model} onChange={handleChange} placeholder="Prado"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Year</label>
                  <input name="year" type="number" value={form.year} onChange={handleChange} placeholder="2022"
                    min="1990" max={new Date().getFullYear() + 1}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
                </div>
              </div>
            </div>
          )}

          {/* House-specific */}
          {form.type === 'house' && (
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-5">
              <h3 className="text-white font-semibold tracking-wider uppercase text-xs">Property Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Bedrooms</label>
                  <input name="bedrooms" type="number" value={form.bedrooms} onChange={handleChange} placeholder="2"
                    min="0"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs tracking-wider uppercase mb-2">Bathrooms</label>
                  <input name="bathrooms" type="number" value={form.bathrooms} onChange={handleChange} placeholder="1"
                    min="0"
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm"/>
                </div>
              </div>
            </div>
          )}

          {/* Media Upload */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
            <h3 className="text-white font-semibold tracking-wider uppercase text-xs mb-4">Photos & Videos</h3>
            <MediaUpload
              value={form.images}
              onChange={images => setForm(f => ({ ...f, images }))}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate('/host')}
              className="btn-outline-gold flex-1 py-4 rounded-xl text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="btn-gold flex-2 flex-grow py-4 rounded-xl font-bold text-sm tracking-wider disabled:opacity-60">
              {loading ? 'Creating...' : '✨ Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
