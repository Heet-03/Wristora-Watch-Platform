import React from 'react';
import { Navigate, useLocation, useNavigate, Outlet, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';

/**
 * AdminRoute Component
 * 
 * Guards the entire /admin/* dashboard hierarchy:
 * - If auth is initializing, renders a centered loader.
 * - If user is unauthenticated, redirects to /login.
 * - If user is authenticated but lacks admin privileges (role !== 'admin'), displays a 403 Forbidden screen.
 * - If user is an authorized admin, renders the admin child routes.
 */
function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userUrl = import.meta.env.VITE_USER_URL || `${window.location.protocol}//${window.location.hostname}:5173`;

  if (loading) {
    return (
      <div className="min-h-screen bg-luxury-charcoal-900 flex items-center justify-center text-white">
        <Loader size="lg" text="Authenticating administrative clearance..." />
      </div>
    );
  }

  // Not logged in at all -> redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in as regular customer, not an admin -> show 403 Access Denied
  if (!isAdmin || currentUser.email?.toLowerCase().trim() !== 'wristora@gmail.com') {
    return (
      <div className="min-h-screen bg-luxury-cream-100 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-luxury-cream-50 p-8 sm:p-10 rounded-2xl border border-luxury-cream-300 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-serif font-bold text-luxury-charcoal-900">
              Access Restricted
            </h1>
            <p className="text-xs text-luxury-charcoal-500 leading-relaxed">
              You are currently logged in as <strong className="text-luxury-charcoal-800">{currentUser.email}</strong>. This administrative portal is strictly restricted to the store administrator (<strong className="text-luxury-charcoal-800">wristora@gmail.com</strong>).
            </p>
          </div>

          <div className="pt-2">
            <Button 
              variant="primary" 
              className="w-full justify-center text-xs uppercase"
              onClick={async () => {
                await logoutUser();
                navigate('/login');
              }}
            >
              Sign In as Administrator
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Administrator
  return children ? children : <Outlet />;
}

export default AdminRoute;
