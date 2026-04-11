import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

// Create axios instance with retry configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for retry logic and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry if it's a 4xx error (client errors)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return Promise.reject(error);
    }
    
    // Retry logic for 5xx errors and network errors
    if (!originalRequest._retry && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, originalRequest._retryCount - 1);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Retrying request (attempt ${originalRequest._retryCount}/${MAX_RETRIES})...`);
      return apiClient(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Create React Query client with default configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: MAX_RETRIES,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// API methods
export const api = {
  // Auth endpoints
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    getMe: () => apiClient.get('/auth/me'),
  },
  
  // Listings endpoints
  listings: {
    getAll: (params = {}) => apiClient.get('/listings', { params }),
    getById: (id) => apiClient.get(`/listings/${id}`),
    create: (data) => apiClient.post('/listings', data),
    update: (id, data) => apiClient.put(`/listings/${id}`, data),
    delete: (id) => apiClient.delete(`/listings/${id}`),
    getMyListings: () => apiClient.get('/listings/host/mine'),
  },
  
  // Bookings endpoints
  bookings: {
    create: (data) => apiClient.post('/bookings', data),
    getAll: (params = {}) => apiClient.get('/admin/bookings', { params }),
    getMyBookings: () => apiClient.get('/bookings/my'),
  },
  
  // Admin endpoints
  admin: {
    getStats: () => apiClient.get('/admin/stats'),
    getUsers: () => apiClient.get('/admin/users'),
    getAllListings: () => apiClient.get('/admin/listings'),
    getAllBookings: () => apiClient.get('/admin/bookings'),
  },
  
  // Upload endpoint
  upload: {
    uploadFile: (formData) => apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  },
};

export default apiClient;
