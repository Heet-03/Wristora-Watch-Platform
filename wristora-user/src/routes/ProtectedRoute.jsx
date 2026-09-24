import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

/**
 * ProtectedRoute Component
 * 
 * Guards sensitive customer routes (Checkout, My Orders, Profile).
 * - If auth is initializing, renders a centered loader.
 * - If user is unauthenticated, redirects to /login and saves the target path in location.state.
 * - If user is authenticated, renders child routes via Outlet.
 */
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader size="lg" text="Verifying vault access..." />
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login page and remember original destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
