import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { adminRoutes } from './adminRoutes';
import Login from '../pages/auth/Login';
import NotFound from '../pages/common/NotFound';

/**
 * Wristora Admin Application Router
 * 
 * Assembles administrative control panels, inventory management, order fulfillment,
 * analytics dashboard, and dedicated administrative authentication.
 */
export const router = createBrowserRouter([
  // Redirect root to admin dashboard
  { 
    path: '/', 
    element: <Navigate to="/admin" replace />
  },

 // Dedicated Admin Login Route
 { 
 path: '/login', 
 element: <Login /> 
 },

 // Admin Route Tree (/admin/*)
 adminRoutes,

 // Fallback
 { 
 path: '*', 
 element: <NotFound /> 
 }
]);

export default router;
