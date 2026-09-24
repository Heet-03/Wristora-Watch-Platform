import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  Users, 
  Tags, 
  Star, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  X
} from 'lucide-react';

/**
 * AdminLayout Component
 * 
 * Implements the professional admin sidebar shell matching the layout mockups.
 * Includes a dark sidebar with responsive state toggle, active navigation states,
 * and a header displaying notifications, date range mockups, and quick profiles.
 */
function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Helper to determine active menu item
  const getPageTitle = () => {
    if (location.pathname === '/admin') return 'Dashboard Overview';
    const segment = location.pathname.split('/').pop();
    if (!segment) return 'Admin Control';
    // Capitalize and format path
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="min-h-screen flex bg-luxury-cream-200 text-luxury-charcoal-900 font-sans">
      
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dark Fixed Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-luxury-charcoal-900 text-white flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 overflow-y-auto no-scrollbar
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Logo Header */}
          <div className="h-20 flex flex-col items-center justify-center border-b border-luxury-charcoal-800 px-6 relative shrink-0">
            <Link 
              to="/admin" 
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/logo.png?v=2" alt="Wristora Logo" className="h-16 w-auto invert mix-blend-screen" />
            </Link>
            
            {/* Close button inside mobile drawer */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-luxury-charcoal-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                               (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded text-xs tracking-wider uppercase font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-luxury-gold-300 text-luxury-charcoal-900 shadow-md font-bold' 
                      : 'hover:bg-luxury-charcoal-800 text-luxury-cream-300 hover:text-white'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Sign Out Button */}
        <div className="p-4 border-t border-luxury-charcoal-800 space-y-2 shrink-0">
          <button 
            onClick={async () => {
              await logoutUser();
              navigate('/login');
            }}
            className="flex items-center justify-center space-x-2 w-full py-3 rounded text-xs uppercase tracking-widest font-bold text-luxury-cream-300 hover:bg-luxury-charcoal-800 hover:text-white transition-all border border-luxury-charcoal-800 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame with fixed sidebar margin offset */}
      <div className="flex-grow flex flex-col min-w-0 md:ml-64">
        
        {/* Workspace Topbar Header */}
        <header className="h-20 bg-luxury-cream-50 border-b border-luxury-cream-300 flex items-center justify-between px-4 sm:px-6 md:px-8 shadow-sm shrink-0 sticky top-0 z-30">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            {/* Sidebar toggle for mobile */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-luxury-charcoal-900 focus:outline-none p-1.5 rounded-lg hover:bg-luxury-cream-200 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              <Menu size={22} />
            </button>
            
            {/* Brand Logo on Mobile Topbar */}
            <Link to="/admin" className="md:hidden flex items-center shrink-0 hover:opacity-80 transition-opacity">
              <img src="/logo.png?v=2" alt="Wristora Logo" className="h-12 w-auto mix-blend-multiply contrast-125" />
            </Link>

            <div className="hidden sm:block md:hidden h-6 w-px bg-luxury-cream-300 shrink-0" />
            
            <h1 className="text-xs sm:text-base md:text-lg font-serif text-luxury-charcoal-900 font-bold tracking-wide uppercase truncate">
              {getPageTitle()}
            </h1>
          </div>
          
          {/* Quick Actions (Notifications, Avatar) */}
          <div className="flex items-center space-x-4 md:space-x-6">

            {/* Notifications panel */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-luxury-charcoal-800 hover:text-luxury-gold-400 transition-colors cursor-pointer"
              >
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-luxury-gold-300 rounded-full border border-luxury-cream-50"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-luxury-cream-50 rounded border border-luxury-cream-200 shadow-2xl p-4 z-50 text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-luxury-cream-200 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] uppercase font-bold text-luxury-gold-400 hover:underline">Clear</button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <div className="p-2 bg-luxury-cream-200 rounded border border-luxury-cream-300 text-xs">
                      <p className="font-semibold text-luxury-charcoal-900">🔔 System Setup Success</p>
                      <p className="text-[10px] text-luxury-charcoal-500 mt-0.5">Vite project architecture complete</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center space-x-2 border-l border-luxury-cream-300 pl-4 md:pl-6">
              <div className="w-8 h-8 rounded-full bg-luxury-gold-100 border border-luxury-gold-300 flex items-center justify-center font-serif text-xs font-bold text-luxury-gold-400 shadow-inner">
                AD
              </div>
              <div className="hidden sm:block text-left text-[10px]">
                <p className="font-bold text-luxury-charcoal-900">Administrator</p>
                <p className="text-luxury-charcoal-500">System Chief</p>
              </div>
            </div>

          </div>
        </header>

        {/* Content Workspace Viewport */}
        <main className="flex-grow overflow-auto p-4 sm:p-6 md:p-8 bg-luxury-cream-200">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
