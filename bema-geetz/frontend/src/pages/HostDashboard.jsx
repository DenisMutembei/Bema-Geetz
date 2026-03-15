import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HostDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/listings/host/mine')
      .then(r => setListings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const deleteListing = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/listings/${id}`);
    setListings(l => l.filter(x => x.id !== id));
  };

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="pt-8 mb-10">
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-4">Host Portal</div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-display text-4xl text-white">Welcome, <span className="text-gold">{user?.name}</span></h1>
              <p className="text-gray-400 mt-1">Manage your listings</p>
            </div>
            <Link to="/create-listing" className="btn-gold px-6 py-3 rounded-xl text-sm font-semibold">
              + New Listing
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-dark-card rounded-2xl h-64 animate-pulse border border-dark-border"/>)}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(l => (
              <div key={l.id} className="listing-card bg-dark-card rounded-2xl overflow-hidden">
                <div className="h-44 relative overflow-hidden">
                  <img
                    src={l.images?.[0] || `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80`}
                    alt={l.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 badge-gold px-2 py-1 rounded-full text-xs">
                    {l.type === 'car' ? '🚗' : '🏠'} {l.type}
                  </span>
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${l.available ? 'bg-green-900/50 border border-green-600 text-green-400' : 'bg-red-900/50 border border-red-600 text-red-400'}`}>
                    {l.available ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-white font-semibold text-sm mb-1 line-clamp-1">{l.title}</h3>
                  <p className="text-gray-500 text-xs mb-2">📍 {l.location}</p>
                  <p className="text-gold font-bold font-display">KES {Number(l.price).toLocaleString()}<span className="text-gray-500 text-xs font-sans">/day</span></p>
                  <div className="flex gap-2 mt-4">
                    <Link to={`/listing/${l.id}`} className="btn-outline-gold flex-1 text-center py-2 rounded-lg text-xs">View</Link>
                    <button onClick={() => deleteListing(l.id)} className="bg-red-900/30 border border-red-800 text-red-400 hover:bg-red-900/50 px-4 py-2 rounded-lg text-xs transition-colors">Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-dark-card border border-dark-border rounded-2xl">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="font-display text-2xl text-white mb-2">No Listings Yet</h3>
            <p className="text-gray-500 mb-6">Start earning by listing your car or property</p>
            <Link to="/create-listing" className="btn-gold px-8 py-3.5 rounded-xl text-sm font-semibold inline-block">
              + Create First Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
