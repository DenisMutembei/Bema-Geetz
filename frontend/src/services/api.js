import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/bemageetz/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bg_token');
      localStorage.removeItem('bg_user');
      window.location.href = '/bemageetz/login';
    }
    return Promise.reject(err);
  }
);

export default api;
