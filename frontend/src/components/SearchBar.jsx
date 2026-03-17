import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ onSearch, initialValues = {} }) {
  const [type, setType] = useState(initialValues.type || '');
  const [location, setLocation] = useState(initialValues.location || '');
  const [maxPrice, setMaxPrice] = useState(initialValues.maxPrice || '');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ type, location, maxPrice });
    } else {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (location) params.set('location', location);
      if (maxPrice) params.set('maxPrice', maxPrice);
      navigate(`/${type === 'car' ? 'cars' : type === 'house' ? 'houses' : 'cars'}?${params}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="bg-dark-card border border-dark-border rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl">
      <select
        value={type}
        onChange={e => setType(e.target.value)}
        className="input-dark flex-1 px-4 py-3 rounded-xl text-sm"
      >
        <option value="">All Types</option>
        <option value="car">🚗 Car Hire</option>
        <option value="house">🏠 Accommodation</option>
      </select>

      <input
        type="text"
        placeholder="📍 Location (Nairobi, Nakuru...)"
        value={location}
        onChange={e => setLocation(e.target.value)}
        className="input-dark flex-1 px-4 py-3 rounded-xl text-sm"
      />

      <input
        type="number"
        placeholder="💰 Max price / day"
        value={maxPrice}
        onChange={e => setMaxPrice(e.target.value)}
        className="input-dark flex-1 px-4 py-3 rounded-xl text-sm"
      />

      <button type="submit" className="btn-gold px-8 py-3 rounded-xl text-sm font-semibold tracking-wider whitespace-nowrap">
        Search
      </button>
    </form>
  );
}
