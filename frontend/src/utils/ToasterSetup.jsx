import { Toaster } from 'react-hot-toast';

export function ToasterSetup() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        top: 80,
        right: 20,
      }}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#141414',
          color: '#fff',
          border: '1px solid #2A2A2A',
          padding: '16px 20px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        },

        // Success toast styling
        success: {
          duration: 3000,
          style: {
            background: '#141414',
            color: '#fff',
            border: '1px solid #FFD700',
          },
          iconTheme: {
            primary: '#FFD700',
            secondary: '#000',
          },
        },

        // Error toast styling
        error: {
          duration: 5000,
          style: {
            background: '#141414',
            color: '#fff',
            border: '1px solid #EF4444',
          },
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
        },

        // Loading toast styling
        loading: {
          style: {
            background: '#141414',
            color: '#fff',
            border: '1px solid #2A2A2A',
          },
          iconTheme: {
            primary: '#FFD700',
            secondary: '#141414',
          },
        },
      }}
    />
  );
}

// Add this to your App.jsx:
// import { ToasterSetup } from './utils/ToasterSetup';
// 
// function App() {
//   return (
//     <>
//       <ToasterSetup />
//       <YourRoutes />
//     </>
//   );
// }
