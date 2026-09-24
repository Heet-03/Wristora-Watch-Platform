import React from 'react';
import UserLayout from '../components/user/UserLayout';
import ProtectedRoute from './ProtectedRoute';

// User Pages
import Home from '../pages/user/Home';
import Shop from '../pages/user/Shop';
import ProductDetails from '../pages/user/ProductDetails';
import Wishlist from '../pages/user/Wishlist';
import Cart from '../pages/user/Cart';
import Checkout from '../pages/user/Checkout';
import Orders from '../pages/user/Orders';
import Profile from '../pages/user/Profile';
import CustomerCare from '../pages/user/CustomerCare';
import Login from '../pages/user/Login';
import Register from '../pages/user/Register';
import NotFound from '../pages/common/NotFound';

/**
 * User / Storefront Route Tree
 * 
 * Encapsulates all public storefront, customer catalog, authenticated collector,
 * customer care concierge, and account routes inside UserLayout.
 */
export const userRoutes = {
  path: '/',
  element: <UserLayout />,
  children: [
    { path: '', element: <Home /> },
    { path: 'shop', element: <Shop /> },
    { path: 'product/:id', element: <ProductDetails /> },
    { path: 'wishlist', element: <Wishlist /> },
    { path: 'cart', element: <Cart /> },
    
    // Protected Customer Routes
    { 
      path: 'checkout', 
      element: (
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      ) 
    },
    { 
      path: 'orders', 
      element: (
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      ) 
    },
    { 
      path: 'profile', 
      element: (
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      ) 
    },
    
    // Customer Care & Concierge Routes
    { path: 'contact', element: <CustomerCare defaultTab="contact" /> },
    { path: 'shipping', element: <CustomerCare defaultTab="shipping" /> },
    { path: 'warranty', element: <CustomerCare defaultTab="warranty" /> },
    { path: 'faq', element: <CustomerCare defaultTab="faq" /> },
    { path: 'terms', element: <CustomerCare defaultTab="terms" /> },
    { path: 'privacy', element: <CustomerCare defaultTab="terms" /> },
    
    // Auth Routes
    { path: 'login', element: <Login /> },
    { path: 'register', element: <Register /> },

    // Fallback 404 Not Found
    { path: '*', element: <NotFound /> },
  ],
};

export default userRoutes;
