import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VerificationProvider } from './context/VerificationContext';
import { queryClient } from './services/apiClient';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Cars from './pages/Cars';
import Houses from './pages/Houses';
import AirportServices from './pages/AirportServices';
import ListingDetail from './pages/ListingDetail';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import Verification from './pages/Verification';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import CreateListing from './pages/CreateListing';
import HostDashboard from './pages/HostDashboard';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-dark flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <VerificationProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-dark text-white">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/cars" element={<Cars />} />
                  <Route path="/houses" element={<Houses />} />
                  <Route path="/airport" element={<AirportServices />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />
                  <Route path="/booking" element={<Booking />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
                  <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/host" element={<ProtectedRoute roles={['admin', 'host']}><HostDashboard /></ProtectedRoute>} />
                  <Route path="/create-listing" element={<ProtectedRoute roles={['admin', 'host']}><CreateListing /></ProtectedRoute>} />
                </Routes>
                <WhatsAppButton />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #D4A017',
                    },
                    success: {
                      iconTheme: {
                        primary: '#D4A017',
                        secondary: '#1a1a1a',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#1a1a1a',
                      },
                    },
                  }}
                />
              </div>
            </BrowserRouter>
          </VerificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
