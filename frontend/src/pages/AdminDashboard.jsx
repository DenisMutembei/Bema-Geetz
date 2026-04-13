import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TABS = ['overview', 'listings', 'bookings', 'users', 'airport'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [airportServices, setAirportServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    vehicle_type: 'sedan',
    price: '',
    max_passengers: 4,
    max_luggage: 2
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/listings'),
      api.get('/admin/bookings'),
      api.get('/admin/users'),
      api.get('/airport/services'),
    ]).then(([s, l, b, u, a]) => {
      setStats(s.data);
      setListings(l.data);
      setBookings(b.data);
      setUsers(u.data);
      setAirportServices(a.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const deleteListing = async (id) => {
    if (!confirm('Delete?')) return;
    await api.delete(`/admin/listings/${id}`);
    setListings(l => l.filter(x => x.id !== id));
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete user?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(u => u.filter(x => x.id !== id));
  };

  const updateBookingStatus = async (id, status) => {
    await api.patch(`/admin/bookings/${id}`, { status });
    setBookings(bs => bs.map(b => b.id === id ? { ...b, status } : b));
  };

  const saveAirportService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        const res = await api.put(`/airport/services/${editingService.id}`, {
          ...serviceForm,
          is_active: true
        });
        setAirportServices(services => services.map(s => s.id === editingService.id ? res.data : s));
      } else {
        const res = await api.post('/airport/services', serviceForm);
        setAirportServices(services => [...services, res.data]);
      }
      setEditingService(null);
      setServiceForm({
        name: '',
        description: '',
        vehicle_type: 'sedan',
        price: '',
        max_passengers: 4,
        max_luggage: 2
      });
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
  };

  const deleteAirportService = async (id) => {
    if (!confirm('Delete this airport service?')) return;
    try {
      await api.delete(`/airport/services/${id}`);
      setAirportServices(services => services.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.message || err.message));
    }
  };

  const editAirportService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      vehicle_type: service.vehicle_type,
      price: service.price,
      max_passengers: service.max_passengers,
      max_luggage: service.max_luggage
    });
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: '👥', color: 'text-blue-400' },
    { label: 'Total Listings', value: stats.totalListings || 0, icon: '🏠', color: 'text-gold' },
    { label: 'Total Bookings', value: stats.totalBookings || 0, icon: '📅', color: 'text-green-400' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="pt-8 mb-8">
          <div className="badge-gold inline-block px-3 py-1 rounded-full mb-3">Admin</div>
          <h1 className="font-display text-4xl text-white">Admin <span className="text-gold">Dashboard</span></h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-full text-xs tracking-wider uppercase font-semibold whitespace-nowrap transition-all ${tab === t ? 'btn-gold' : 'btn-outline-gold'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {statCards.map((s, i) => (
                    <div key={i} className="bg-dark-card border border-dark-border rounded-2xl p-6 text-center">
                      <div className="text-4xl mb-2">{s.icon}</div>
                      <div className={`font-display text-4xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-gray-500 text-xs tracking-wider uppercase mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent bookings */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                  <h3 className="font-display text-xl text-white mb-4">Recent Bookings</h3>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-3 bg-dark rounded-xl">
                        <div>
                          <div className="text-white text-sm font-medium">{b.customer_name}</div>
                          <div className="text-gray-500 text-xs">{b.listing_title} — {b.invoice_id}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs border ${b.status === 'confirmed' ? 'bg-green-900/30 border-green-700 text-green-400' : b.status === 'cancelled' ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-yellow-900/30 border-yellow-700 text-yellow-400'}`}>
                            {b.status}
                          </span>
                          <div className="text-gold font-bold text-sm">KES {Number(b.listing_price).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Listings */}
            {tab === 'listings' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">{listings.length} listings total</span>
                  <Link to="/create-listing" className="btn-gold px-5 py-2 rounded-xl text-sm font-semibold">+ Add Listing</Link>
                </div>
                <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-border">
                          {['Title', 'Type', 'Location', 'Price', 'Host', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs tracking-wider uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {listings.map(l => (
                          <tr key={l.id} className="hover:bg-dark/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-white font-medium">{l.title}</td>
                            <td className="px-4 py-3"><span className="badge-gold px-2 py-1 rounded-full text-xs">{l.type}</span></td>
                            <td className="px-4 py-3 text-gray-400 text-sm">{l.location}</td>
                            <td className="px-4 py-3 text-gold font-bold text-sm">KES {Number(l.price).toLocaleString()}</td>
                            <td className="px-4 py-3 text-gray-400 text-sm">{l.host_name}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${l.available ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-red-900/30 border border-red-700 text-red-400'}`}>
                                {l.available ? 'Active' : 'Off'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Link to={`/listing/${l.id}`} className="text-gold hover:underline text-xs">View</Link>
                                <button onClick={() => deleteListing(l.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings */}
            {tab === 'bookings' && (
              <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        {['Invoice', 'Customer', 'Phone', 'Listing', 'Dates', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs tracking-wider uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-dark/50 transition-colors">
                          <td className="px-4 py-3"><span className="text-gold font-bold text-xs">{b.invoice_id}</span></td>
                          <td className="px-4 py-3">
                            <div className="text-white text-sm">{b.customer_name}</div>
                            <div className="text-gray-500 text-xs">{b.email}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">{b.phone}</td>
                          <td className="px-4 py-3 text-gray-300 text-sm">{b.listing_title}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {b.check_in && <div>In: {b.check_in?.split('T')[0]}</div>}
                            {b.check_out && <div>Out: {b.check_out?.split('T')[0]}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs border ${b.status === 'confirmed' ? 'bg-green-900/30 border-green-700 text-green-400' : b.status === 'cancelled' ? 'bg-red-900/30 border-red-700 text-red-400' : 'bg-yellow-900/30 border-yellow-700 text-yellow-400'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="text-green-400 hover:text-green-300 text-xs px-2 py-1 bg-green-900/20 rounded">✓</button>
                              <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-900/20 rounded">✕</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Users */}
            {tab === 'users' && (
              <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs tracking-wider uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-dark/50 transition-colors">
                          <td className="px-4 py-3 text-white text-sm font-medium">{u.name}</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                          <td className="px-4 py-3 text-gray-400 text-sm">{u.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs border ${u.role === 'admin' ? 'bg-gold/20 border-gold/50 text-gold' : u.role === 'host' ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-dark border-dark-border text-gray-400'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => deleteUser(u.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Airport Services */}
            {tab === 'airport' && (
              <div className="space-y-6">
                {/* Add/Edit Form */}
                <div className="bg-dark-card border border-dark-border rounded-2xl p-6">
                  <h3 className="font-display text-xl text-white mb-4">
                    {editingService ? 'Edit Service' : 'Add New Airport Service'}
                  </h3>
                  <form onSubmit={saveAirportService} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Service Name (e.g., Airport Sedan)"
                      required
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                      className="input-dark rounded-xl px-4 py-3 text-sm"
                    />
                    <select
                      value={serviceForm.vehicle_type}
                      onChange={(e) => setServiceForm({...serviceForm, vehicle_type: e.target.value})}
                      className="input-dark rounded-xl px-4 py-3 text-sm"
                    >
                      <option value="sedan">Sedan</option>
                      <option value="luxury">Luxury</option>
                      <option value="van">Van</option>
                      <option value="suv">SUV</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Price (USD)"
                      required
                      min="0"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                      className="input-dark rounded-xl px-4 py-3 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max Passengers"
                      required
                      min="1"
                      value={serviceForm.max_passengers}
                      onChange={(e) => setServiceForm({...serviceForm, max_passengers: parseInt(e.target.value)})}
                      className="input-dark rounded-xl px-4 py-3 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max Luggage"
                      required
                      min="0"
                      value={serviceForm.max_luggage}
                      onChange={(e) => setServiceForm({...serviceForm, max_luggage: parseInt(e.target.value)})}
                      className="input-dark rounded-xl px-4 py-3 text-sm"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="btn-gold px-6 py-3 rounded-xl text-sm font-semibold flex-1">
                        {editingService ? 'Update Service' : 'Add Service'}
                      </button>
                      {editingService && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingService(null);
                            setServiceForm({
                              name: '',
                              description: '',
                              vehicle_type: 'sedan',
                              price: '',
                              max_passengers: 4,
                              max_luggage: 2
                            });
                          }}
                          className="btn-outline-gold px-4 py-3 rounded-xl text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Description"
                      rows="2"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                      className="input-dark rounded-xl px-4 py-3 text-sm md:col-span-2 lg:col-span-3"
                    />
                  </form>
                </div>

                {/* Services List */}
                <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-dark-border">
                    <span className="text-gray-400 text-sm">{airportServices.length} services</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark-border">
                          {['Name', 'Vehicle', 'Price', 'Passengers', 'Luggage', 'Status', 'Actions'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-gray-500 text-xs tracking-wider uppercase">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {airportServices.map(s => (
                          <tr key={s.id} className="hover:bg-dark/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-white text-sm font-medium">{s.name}</div>
                              <div className="text-gray-500 text-xs truncate max-w-[200px]">{s.description}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="badge-gold px-2 py-1 rounded-full text-xs">{s.vehicle_type}</span>
                            </td>
                            <td className="px-4 py-3 text-gold font-bold text-sm">${s.price}</td>
                            <td className="px-4 py-3 text-gray-400 text-sm">{s.max_passengers}</td>
                            <td className="px-4 py-3 text-gray-400 text-sm">{s.max_luggage}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${s.is_active ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-red-900/30 border border-red-700 text-red-400'}`}>
                                {s.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => editAirportService(s)} className="text-gold hover:text-gold-light text-xs">Edit</button>
                                <button onClick={() => deleteAirportService(s.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
