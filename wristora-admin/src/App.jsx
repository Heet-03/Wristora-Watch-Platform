import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/routes';
import { AuthProvider } from './context/AuthContext';

/**
 * Wristora Admin Application
 * 
 * Root component wrapping the administrative workspace with AuthProvider.
 */
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
