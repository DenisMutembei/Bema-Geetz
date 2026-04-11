import toast from 'react-hot-toast';

// Custom toast styles matching the premium theme
const defaultOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#141414',
    color: '#fff',
    border: '1px solid #2A2A2A',
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
  },
  success: {
    iconTheme: {
      primary: '#FFD700',
      secondary: '#000',
    },
  },
  error: {
    iconTheme: {
      primary: '#EF4444',
      secondary: '#fff',
    },
  },
  loading: {
    iconTheme: {
      primary: '#FFD700',
      secondary: '#141414',
    },
  },
};

// Success toast
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
    icon: '✓',
  });
};

// Error toast
export const showError = (message, options = {}) => {
  return toast.error(message, {
    ...defaultOptions,
    ...options,
    icon: '✕',
  });
};

// Loading toast (returns ID for dismissal)
export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...defaultOptions,
    ...options,
  });
};

// Promise toast (handles loading, success, error automatically)
export const showPromise = (promise, messages, options = {}) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading || 'Loading...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong',
    },
    {
      ...defaultOptions,
      ...options,
    }
  );
};

// Custom toast with any content
export const showCustom = (content, options = {}) => {
  return toast.custom(content, {
    ...defaultOptions,
    ...options,
  });
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};

// Dismiss specific toast by ID
export const dismissToast = (id) => {
  toast.dismiss(id);
};

// Update toast by ID
export const updateToast = (id, options) => {
  toast.success(options.message || 'Updated!', {
    id,
    ...defaultOptions,
    ...options,
  });
};

// Premium styled notification with icon
export const showNotification = (title, message, type = 'info') => {
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  const colors = {
    info: '#3B82F6',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-dark-card shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-dark-border`}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">{icons[type]}</span>
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="mt-1 text-sm text-gray-400">{message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="bg-dark-card rounded-md inline-flex text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div
          className="h-1 w-full"
          style={{ backgroundColor: colors[type] }}
        />
      </div>
    ),
    { duration: 5000 }
  );
};

// Usage examples:
// showSuccess('Booking confirmed!');
// showError('Failed to process payment');
// const loadingId = showLoading('Processing...');
// dismissToast(loadingId);
// showPromise(apiCall(), { loading: 'Saving...', success: 'Saved!', error: 'Failed to save' });
// showNotification('New Message', 'You have a new booking request', 'info');
