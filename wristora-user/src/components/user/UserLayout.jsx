import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * UserLayout Component
 * 
 * Provides the global storefront layout, including the sticky navigation bar,
 * central content window, automatic scroll-to-top on route changes, and global page footer.
 */
function UserLayout() {
  const { pathname } = useLocation();

  // Automatically scroll to top whenever the user changes pages
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-luxury-cream-100 text-luxury-charcoal-900">
      
      {/* Dynamic Header Navbar */}
      <Navbar />
      
      {/* Page Content Viewport */}
      <main className="flex-grow pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Dynamic Multi-column Footer */}
      <Footer />
    </div>
  );
}

export default UserLayout;
