import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/routes';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

/**
 * Wristora User Application
 * 
 * Root component wrapping the customer storefront with AuthProvider and CartProvider.
 */
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
