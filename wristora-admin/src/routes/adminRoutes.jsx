import React from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import AdminRoute from './AdminRoute';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import AdminAddProduct from '../pages/admin/AddProduct';
import AdminEditProduct from '../pages/admin/EditProduct';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/Orders';
import AdminUsers from '../pages/admin/Users';
import AdminReviews from '../pages/admin/Reviews';
import AdminSettings from '../pages/admin/Settings';

/**
 * Admin Route Tree
 * 
 * Encapsulates all administrative control panels, inventory management, order fulfillment,
 * user permissions, and settings guarded by AdminRoute and inside AdminLayout.
 */
export const adminRoutes = {
  path: '/admin',
  element: (
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  ),
  children: [
    { path: '', element: <AdminDashboard /> },
    { path: 'products', element: <AdminProducts /> },
    { path: 'products/add', element: <AdminAddProduct /> },
    { path: 'products/new', element: <AdminAddProduct /> },
    { path: 'products/edit/:id', element: <AdminEditProduct /> },
    { path: 'categories', element: <AdminCategories /> },
    { path: 'orders', element: <AdminOrders /> },
    { path: 'users', element: <AdminUsers /> },
    { path: 'reviews', element: <AdminReviews /> },
    { path: 'settings', element: <AdminSettings /> },
  ],
};

export default adminRoutes;
