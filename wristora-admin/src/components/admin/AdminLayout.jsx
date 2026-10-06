import React, { useState, useEffect, useRef } from 'react';
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
  Calendar as CalendarIcon, 
  Search, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * AdminLayout Component
 * 
 * Implements the professional admin sidebar shell matching the layout mockups.
 * Includes a dark sidebar with responsive state toggle, active navigation states,
 * and an executive header displaying live calendar highlight with month navigation.
 */
function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthIdx = today.getMonth();
  const currentYear = today.getFullYear();

  const [viewYear, setViewYear] = useState(currentYear);
  const [viewMonth, setViewMonth] = useState(currentMonthIdx);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formattedHeaderDate = `${dayNames[today.getDay()].slice(0, 3)}, ${currentDay} ${monthNames[currentMonthIdx].slice(0, 3)} ${currentYear}`;

  // Mini calendar generator for navigated month
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

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
          
          {/* Quick Actions (Calendar Highlight Widget, Profile Avatar) */}
          <div className="flex items-center space-x-4 md:space-x-6">

            {/* Calendar Highlight Widget */}
            <div className="relative" ref={calendarRef}>
              <button 
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-luxury-cream-300 rounded-xl hover:border-luxury-gold-400 transition-all cursor-pointer shadow-2xs text-luxury-charcoal-900"
                title="Executive Calendar & Current Date Tracker"
              >
                <CalendarIcon size={15} className="text-luxury-gold-600" />
                <span className="text-xs font-mono font-bold tracking-tight">
                  {formattedHeaderDate}
                </span>
              </button>

              {/* Calendar Popover modal highlighting current date & month navigation */}
              {showCalendar && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-luxury-cream-300 shadow-2xl p-4 z-50 text-left font-sans space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-luxury-cream-200">
                    <div className="flex items-center space-x-1">
                      <button 
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1 text-luxury-charcoal-600 hover:text-luxury-charcoal-900 hover:bg-luxury-cream-200 rounded-md transition-colors cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-serif font-bold text-luxury-charcoal-900 min-w-[105px] text-center">
                        {monthNames[viewMonth]} {viewYear}
                      </span>
                      <button 
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1 text-luxury-charcoal-600 hover:text-luxury-charcoal-900 hover:bg-luxury-cream-200 rounded-md transition-colors cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        setViewYear(currentYear);
                        setViewMonth(currentMonthIdx);
                      }}
                      className="text-[10px] font-mono font-bold px-2 py-0.5 bg-luxury-gold-100 text-luxury-gold-900 hover:bg-luxury-gold-200 rounded-md uppercase cursor-pointer transition-colors"
                      title="Jump to Today"
                    >
                      Today: {currentDay}
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-luxury-charcoal-400 uppercase tracking-wider">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
                    {/* Blank offset days */}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`blank-${i}`} className="h-7" />
                    ))}

                    {/* Days in navigated month */}
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
                      const isToday = 
                        dayNum === currentDay && 
                        viewMonth === currentMonthIdx && 
                        viewYear === currentYear;
                      return (
                        <div
                          key={dayNum}
                          className={`h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            isToday
                              ? 'bg-luxury-charcoal-900 text-luxury-gold-300 shadow-md ring-2 ring-luxury-gold-400 scale-105'
                              : 'text-luxury-charcoal-800 hover:bg-luxury-cream-100'
                          }`}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
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
