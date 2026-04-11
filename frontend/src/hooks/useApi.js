import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../services/apiClient';
import { toast } from 'react-hot-toast';

// Generic query hook with error handling
export const useApiQuery = (queryKey, queryFn, options = {}) => {
  return useQuery({
    queryKey,
    queryFn,
    onError: (error) => {
      console.error('Query error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        // Redirect to login or trigger logout
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(error.response?.data?.error || 'An error occurred');
      }
    },
    ...options,
  });
};

// Generic mutation hook with success/error handling
export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      toast.success(options.successMessage || 'Operation successful');
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(error.response?.data?.error || 'Operation failed');
      }
    },
    ...options,
  });
};

// Specific hooks for different endpoints
export const useListings = (params = {}) => {
  return useApiQuery(
    ['listings', params],
    () => api.listings.getAll(params).then(res => res.data),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes for listings
    }
  );
};

export const useListing = (id) => {
  return useApiQuery(
    ['listing', id],
    () => api.listings.getById(id).then(res => res.data),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes for single listing
    }
  );
};

export const useMyListings = () => {
  return useApiQuery(
    ['myListings'],
    () => api.listings.getMyListings().then(res => res.data),
    {
      enabled: !!localStorage.getItem('token'),
    }
  );
};

export const useCreateListing = () => {
  return useApiMutation(
    api.listings.create,
    {
      successMessage: 'Listing created successfully',
      invalidateQueries: [['myListings'], ['listings']],
    }
  );
};

export const useUpdateListing = () => {
  return useApiMutation(
    ({ id, data }) => api.listings.update(id, data),
    {
      successMessage: 'Listing updated successfully',
      invalidateQueries: [['myListings'], ['listings']],
    }
  );
};

export const useDeleteListing = () => {
  return useApiMutation(
    api.listings.delete,
    {
      successMessage: 'Listing deleted successfully',
      invalidateQueries: [['myListings'], ['listings']],
    }
  );
};

export const useBookings = (params = {}) => {
  return useApiQuery(
    ['bookings', params],
    () => api.bookings.getAll(params).then(res => res.data)
  );
};

export const useMyBookings = () => {
  return useApiQuery(
    ['myBookings'],
    () => api.bookings.getMyBookings().then(res => res.data),
    {
      enabled: !!localStorage.getItem('token'),
    }
  );
};

export const useCreateBooking = () => {
  return useApiMutation(
    api.bookings.create,
    {
      successMessage: 'Booking created successfully',
      invalidateQueries: [['myBookings'], ['bookings']],
    }
  );
};

export const useAdminStats = () => {
  return useApiQuery(
    ['adminStats'],
    () => api.admin.getStats().then(res => res.data),
    {
      enabled: !!localStorage.getItem('token'),
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    }
  );
};

export const useAdminUsers = () => {
  return useApiQuery(
    ['adminUsers'],
    () => api.admin.getUsers().then(res => res.data),
    {
      enabled: !!localStorage.getItem('token'),
    }
  );
};

export const useAuth = () => {
  const queryClient = useQueryClient();
  
  const loginMutation = useApiMutation(
    api.auth.login,
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        queryClient.setQueryData(['currentUser'], data.user);
        window.location.href = '/';
      },
      invalidateQueries: [['currentUser']],
    }
  );
  
  const registerMutation = useApiMutation(
    api.auth.register,
    {
      onSuccess: (data) => {
        localStorage.setItem('token', data.token);
        queryClient.setQueryData(['currentUser'], data.user);
        window.location.href = '/';
      },
      invalidateQueries: [['currentUser']],
    }
  );
  
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.clear();
    window.location.href = '/login';
  };
  
  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
  };
};

export const useCurrentUser = () => {
  return useApiQuery(
    ['currentUser'],
    () => api.auth.getMe().then(res => res.data),
    {
      enabled: !!localStorage.getItem('token'),
      staleTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    }
  );
};
