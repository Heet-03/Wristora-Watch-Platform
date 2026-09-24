import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, LogIn, LogOut, ShieldCheck, ChevronDown, Clock, Compass, Watch, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getUserWallet } from '../../firebase/dbService';

/**
 * Navbar Component
 * 
 * Provides global storefront navigation, including dynamic authentication state:
 * - Shows "Sign In" button when logged out.
 * - Shows User Avatar and Dropdown Menu (Profile, Orders, Admin, Logout) when logged in.
 * - Search bar, wishlist tracker, cart counter, and responsive mobile menu.
 */
function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, isAdmin, logoutUser } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const adminUrl = import.meta.env.VITE_ADMIN_URL || `${window.location.protocol}//${window.location.hostname}:5174/admin`;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isWalletPopoverOpen, setIsWalletPopoverOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const userMenuRef = useRef(null);
  const walletRef = useRef(null);

  // Poll active wallet balance for current user
  useEffect(() => {
    if (!currentUser) {
      setWalletBalance(0);
      return;
    }
    const fetchBalance = async () => {
      const w = await getUserWallet(currentUser.uid, currentUser.email);
      setWalletBalance(w.balance || 0);
    };
    fetchBalance();
    const timer = setInterval(fetchBalance, 2500);
    return () => clearInterval(timer);
  }, [currentUser]);

  // Close user dropdown & wallet popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (walletRef.current && !walletRef.current.contains(event.target)) {
        setIsWalletPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await logoutUser();
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Wishlist', path: '/wishlist' },
    { label: 'Orders', path: '/orders' },
  ];

  // Helper to determine if a route is currently active
  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/shop') {
      return location.pathname.startsWith('/shop') || location.pathname.startsWith('/product');
    }
    if (path === '/orders') {
      return location.pathname.startsWith('/orders') || location.pathname.startsWith('/order');
    }
    return location.pathname.startsWith(path);
  };

  // User display name helper
  const displayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Collector';
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <nav className="border-b border-luxury-cream-300 bg-luxury-cream-50 sticky top-0 z-50 shadow-sm">

        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
        
        {/* Mobile Hamburger Trigger */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-luxury-charcoal-900 focus:outline-none p-1 cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo (Centered on mobile, left on desktop) */}
        <div className="flex items-center">
          <img src="/logo.png?v=2" alt="Wristora Logo" className="h-14 md:h-16 w-auto mix-blend-multiply contrast-125" />
        </div>
        
        {/* Desktop Menu Links */}
        <div className="hidden md:flex items-center space-x-8 text-[11px] uppercase tracking-widest font-bold">
          {navLinks.map((link) => {
            const active = isLinkActive(link.path);
            return (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`group relative py-2 transition-all duration-200 ${
                  active
                    ? 'text-luxury-charcoal-950 font-extrabold'
                    : 'text-luxury-charcoal-500 hover:text-luxury-charcoal-900 font-semibold'
                }`}
              >
                <span>{link.label}</span>
                {/* Active Gold Accent Indicator Bar */}
                {active ? (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-luxury-gold-500 rounded-full shadow-xs" />
                ) : (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-luxury-gold-400/70 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center rounded-full" />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <a 
              href={adminUrl}
              className="text-luxury-gold-600 hover:text-luxury-gold-700 transition-colors duration-200 flex items-center space-x-1"
            >
              <ShieldCheck size={14} />
              <span>Admin Panel</span>
            </a>
          )}
        </div>

        {/* Utility Icon Actions */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-luxury-charcoal-800">
          
          {/* Search Trigger */}
          <div className="relative">
            {isSearchOpen ? (
              <form onSubmit={handleSearchSubmit} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-luxury-cream-50 border border-luxury-cream-300 rounded-xl shadow-md pr-2">
                <input
                  type="text"
                  placeholder="Search watches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 text-xs font-sans text-luxury-charcoal-900 focus:outline-none w-44 md:w-56"
                  autoFocus
                />
                <button type="submit" className="text-luxury-charcoal-500 hover:text-luxury-gold-500 p-1 cursor-pointer">
                  <Search size={14} />
                </button>
                <button type="button" onClick={() => setIsSearchOpen(false)} className="text-luxury-charcoal-300 hover:text-luxury-charcoal-900 p-1 cursor-pointer">
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="hover:text-luxury-gold-500 transition-colors p-2 cursor-pointer"
                title="Search watches"
              >
                <Search size={18} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Wishlist Link (Desktop only - accessible via Mobile Dock) */}
          <Link 
            to="/wishlist" 
            className="hidden md:flex relative hover:text-luxury-gold-500 transition-colors p-2"
            title="Wishlist"
          >
            <Heart size={18} strokeWidth={2} />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-luxury-gold-400 text-luxury-charcoal-900 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-luxury-cream-50 shadow">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Shopping Cart Trigger (Desktop only - accessible via Mobile Dock) */}
          <Link 
            to="/cart" 
            className="hidden md:flex relative hover:text-luxury-gold-500 transition-colors p-2"
            title="Cart"
          >
            <ShoppingBag size={18} strokeWidth={2} />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-luxury-charcoal-900 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-luxury-cream-50 shadow">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Auth Section (Desktop only - accessible via Mobile Dock) */}
          <div className="hidden md:flex items-center space-x-3">
            {currentUser ? (
              <>
                {/* Vault Wallet Header Icon Trigger */}
                <div className="relative" ref={walletRef}>
                  <button
                    type="button"
                    onClick={() => setIsWalletPopoverOpen(!isWalletPopoverOpen)}
                    className="hover:text-luxury-gold-500 transition-colors p-2 cursor-pointer text-luxury-charcoal-800 flex items-center justify-center rounded-xl hover:bg-luxury-cream-200"
                    title="Wristora Atelier Vault Wallet"
                  >
                    <Wallet size={18} strokeWidth={2} />
                  </button>

                  {/* Wallet Balance Popover Dropdown */}
                  {isWalletPopoverOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-luxury-cream-300 rounded-2xl shadow-xl p-4 z-50 animate-fadeIn font-sans space-y-3 text-left">
                      <div className="flex items-center justify-between pb-2 border-b border-luxury-cream-200">
                        <div className="flex items-center space-x-1.5 text-luxury-gold-700 font-bold">
                          <Wallet size={15} />
                          <span className="text-[11px] uppercase tracking-wider">Vault Wallet</span>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-luxury-cream-200 text-luxury-charcoal-700 rounded-full">
                          Instant
                        </span>
                      </div>

                      <div>
                        <p className="text-[10px] text-luxury-charcoal-500 uppercase font-semibold">Available Credit</p>
                        <p className="text-2xl font-mono font-extrabold text-luxury-charcoal-900 mt-0.5">
                          ₹{walletBalance.toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsWalletPopoverOpen(false);
                            navigate('/profile?tab=wallet');
                          }}
                          className="w-full text-center py-2 bg-luxury-charcoal-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-luxury-gold-500 hover:text-luxury-charcoal-950 transition-colors cursor-pointer"
                        >
                          Manage Wallet & Passbook
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Logged-In User Avatar & Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-luxury-cream-200 transition-colors cursor-pointer border border-luxury-cream-300"
                    title="Account Menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-luxury-charcoal-900 text-luxury-gold-300 flex items-center justify-center text-xs font-bold font-serif shadow-2xs">
                      {displayInitial}
                    </div>
                    <ChevronDown size={14} className="text-luxury-charcoal-500 hidden sm:block" />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-luxury-cream-300 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn font-sans">
                      <div className="px-4 py-3 border-b border-luxury-cream-200">
                        <p className="text-xs font-bold text-luxury-charcoal-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-luxury-charcoal-400 truncate">
                          {currentUser.email}
                        </p>
                        {isAdmin && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-luxury-gold-100 text-luxury-gold-800 rounded-full">
                            Administrator
                          </span>
                        )}
                      </div>

                      <div className="py-1 text-xs">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-luxury-charcoal-700 hover:bg-luxury-cream-100 hover:text-luxury-charcoal-900 transition-colors"
                        >
                          <User size={15} className="mr-2.5 text-luxury-charcoal-400" />
                          <span>My Profile</span>
                        </Link>

                        <Link
                          to="/profile?tab=wallet"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2 text-luxury-charcoal-700 hover:bg-luxury-cream-100 hover:text-luxury-charcoal-900 transition-colors"
                        >
                          <div className="flex items-center">
                            <Wallet size={15} className="mr-2.5 text-luxury-gold-600" />
                            <span className="font-medium">Vault Wallet</span>
                          </div>
                          <span className="font-mono font-bold text-luxury-gold-700 text-[11px]">
                            ₹{walletBalance.toLocaleString('en-IN')}
                          </span>
                        </Link>

                        <Link
                          to="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-luxury-charcoal-700 hover:bg-luxury-cream-100 hover:text-luxury-charcoal-900 transition-colors"
                        >
                          <Clock size={15} className="mr-2.5 text-luxury-charcoal-400" />
                          <span>Order History</span>
                        </Link>

                      {isAdmin && (
                        <a
                          href={adminUrl}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-luxury-gold-700 hover:bg-luxury-gold-50 transition-colors font-semibold"
                        >
                          <ShieldCheck size={15} className="mr-2.5 text-luxury-gold-600" />
                          <span>Admin Dashboard</span>
                        </a>
                      )}
                    </div>

                    <div className="border-t border-luxury-cream-200 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut size={15} className="mr-2.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
            ) : (
              /* Logged-Out "Sign In" Button */
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-luxury-charcoal-800 text-luxury-charcoal-900 hover:bg-luxury-charcoal-900 hover:text-white text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-2xs"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-luxury-cream-300 bg-luxury-cream-50 py-4 px-6 space-y-3 shadow-inner">
          {navLinks.map((link) => {
            const active = isLinkActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between text-xs uppercase tracking-widest py-2 px-3 rounded-xl transition-colors ${
                  active
                    ? 'bg-luxury-gold-100/90 text-luxury-charcoal-950 font-bold border border-luxury-gold-300 shadow-2xs'
                    : 'text-luxury-charcoal-600 hover:text-luxury-charcoal-900 font-semibold'
                }`}
              >
                <span>{link.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-luxury-gold-500" />}
              </Link>
            );
          })}

          {currentUser ? (
            <>
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-xs uppercase tracking-widest font-semibold text-luxury-charcoal-600 hover:text-luxury-charcoal-900 py-1 transition-colors"
              >
                My Profile ({displayName})
              </Link>
              {isAdmin && (
                <a
                  href={adminUrl}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-xs uppercase tracking-widest font-semibold text-luxury-gold-600 hover:text-luxury-gold-700 py-1 transition-colors"
                >
                  Admin Dashboard
                </a>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left text-xs uppercase tracking-widest font-bold text-red-600 py-1 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-luxury-charcoal-900 text-white text-xs uppercase tracking-widest font-bold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-luxury-charcoal-800 text-luxury-charcoal-900 text-xs uppercase tracking-widest font-bold"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
      </nav>

      {/* Floating Bottom Navigation Bar for Mobile (hidden on Product Details & Checkout to prioritize checkout CTAs) */}
      {!location.pathname.startsWith('/product/') && location.pathname !== '/checkout' && (
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-luxury-cream-300 shadow-xl px-3 py-1.5 flex justify-around items-center">
          <Link 
            to="/" 
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              location.pathname === '/' 
                ? 'text-luxury-charcoal-900 font-bold' 
                : 'text-luxury-charcoal-400 hover:text-luxury-charcoal-700'
            }`}
          >
            <Compass size={18} className={location.pathname === '/' ? 'text-luxury-gold-600' : ''} />
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Explore</span>
          </Link>

          <Link 
            to="/shop" 
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              isLinkActive('/shop') 
                ? 'text-luxury-charcoal-900 font-bold' 
                : 'text-luxury-charcoal-400 hover:text-luxury-charcoal-700'
            }`}
          >
            <Watch size={18} className={isLinkActive('/shop') ? 'text-luxury-gold-600' : ''} />
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Vault</span>
          </Link>

          <Link 
            to="/wishlist" 
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all relative ${
              location.pathname === '/wishlist' 
                ? 'text-luxury-charcoal-900 font-bold' 
                : 'text-luxury-charcoal-400 hover:text-luxury-charcoal-700'
            }`}
          >
            <Heart size={18} className={location.pathname === '/wishlist' ? 'text-luxury-gold-600 fill-luxury-gold-600' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-1 bg-luxury-gold-400 text-white font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Wishlist</span>
          </Link>

          <Link 
            to="/cart" 
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all relative ${
              location.pathname === '/cart' 
                ? 'text-luxury-charcoal-900 font-bold' 
                : 'text-luxury-charcoal-400 hover:text-luxury-charcoal-700'
            }`}
          >
            <ShoppingBag size={18} className={location.pathname === '/cart' ? 'text-luxury-gold-600' : ''} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-1 bg-luxury-charcoal-900 text-luxury-gold-300 font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs">
                {cartCount}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-wider mt-0.5">Cart</span>
          </Link>

          <Link 
            to={currentUser ? "/profile" : "/login"} 
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
              location.pathname === '/profile' || location.pathname === '/login'
                ? 'text-luxury-charcoal-900 font-bold' 
                : 'text-luxury-charcoal-400 hover:text-luxury-charcoal-700'
            }`}
          >
            <User size={18} className={location.pathname === '/profile' ? 'text-luxury-gold-600' : ''} />
            <span className="text-[9px] uppercase tracking-wider mt-0.5">{currentUser ? 'Dossier' : 'Sign In'}</span>
          </Link>
        </div>
      )}
    </>
  );
}

export default Navbar;
