import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, RotateCcw, Search, Star, Heart, ShoppingBag, CheckCircle2, SlidersHorizontal, X, Eye, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { getProducts, getCategories, getBrands } from '../../firebase/dbService';

/**
 * Shop Page Component
 * 
 * Provides watch collection browsing with category, brand, strap type,
 * search term filters, sorting selectors, quick-hover actions, and toast alerts.
 * Features an interactive slide-out luxury Filter Drawer for a full-width watch catalog.
 */
function Shop() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  
  // Products & Registry from Database
  const [products, setProducts] = useState([]);
  const [registeredBrands, setRegisteredBrands] = useState([]);
  const [registeredCategories, setRegisteredCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Filter Drawer & Quick View States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewQty, setQuickViewQty] = useState(1);

  // State variables for filter inputs
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStrap, setSelectedStrap] = useState('All');
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [sortBy, setSortBy] = useState('featured');

  // Prevent background scrolling when filter drawer is open
  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isFilterOpen]);

  // Load products, brands, and categories from database
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [data, brandData, catData] = await Promise.all([
          getProducts(),
          getBrands(),
          getCategories()
        ]);
        const catalog = data || [];
        setProducts(catalog);
        if (brandData && brandData.length > 0) {
          const bNames = brandData.map(b => typeof b === 'string' ? b : b.name).filter(Boolean);
          setRegisteredBrands(bNames);
        }
        if (catData && catData.length > 0) {
          const cNames = catData.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
          setRegisteredCategories(cNames);
        }
        if (catalog.length > 0) {
          const maxP = Math.max(...catalog.map(p => Number(p.discountPrice || p.price || 0)));
          const dynamicCeiling = Math.max(10000000, Math.ceil(maxP / 1000000) * 1000000);
          setMaxPrice(dynamicCeiling);
        }
      } catch (err) {
        console.error('Failed fetching shop catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Sync URL search queries (e.g. from navbar searches, home categories, or brand showcase)
  useEffect(() => {
    const searchVal = searchParams.get('search') || '';
    const catVal = searchParams.get('category') || 'All';
    const brandVal = searchParams.get('brand') || 'All';
    setSearchTerm(searchVal);
    setSelectedCategory(catVal);
    setSelectedBrand(brandVal);
  }, [searchParams]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (searchTerm) {
        prev.set('search', searchTerm);
      } else {
        prev.delete('search');
      }
      return prev;
    });
  };

  // Catalog price ceiling (at least 1 Crore / ₹1,00,00,000 or highest product price)
  const highestCatalogPrice = products.length > 0
    ? Math.max(...products.map(p => Number(p.discountPrice || p.price || 0)))
    : 10000000;
  const ceilingPrice = Math.max(10000000, Math.ceil(highestCatalogPrice / 1000000) * 1000000);

  // Dynamic Categories from registered taxonomy and catalog
  const categories = ['All', ...new Set([
    'Luxury', 'Classic', 'Sports', 'Chronograph', 'Limited',
    ...registeredCategories,
    ...products.map(p => p.category).filter(Boolean)
  ])];
  
  // Dynamic Brands from registry, catalog, and core watchmakers (including i-Watch, Patek Philippe, etc.)
  const brands = ['All', ...new Set([
    'Rolex', 'Patek Philippe', 'Omega', 'Hublot', 'Tag Heuer', 'Seiko', 'Tissot', 'i-Watch', 'Casio G-SHOCK', 'Audemars Piguet',
    ...registeredBrands,
    ...products.map(p => p.brand).filter(Boolean)
  ])];

  // Dynamic Straps from catalog
  const straps = ['All', ...new Set([
    'Leather', 'Oystersteel', 'Rubber', 'Steel Bracelet', 'Rose Gold', 'White Gold',
    ...products.map(p => p.specifications?.strapMaterial).filter(Boolean)
  ])];

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedStrap('All');
    setMaxPrice(ceilingPrice);
    setSortBy('featured');
    setSearchParams({});
  };

  // Quick Action Handlers
  const handleQuickAddToCart = (e, product) => {
    e.stopPropagation();
    if ((Number(product.stock) ?? 10) <= 0) {
      setToastMessage(`"${product.name}" is currently out of stock.`);
      setTimeout(() => setToastMessage(''), 3500);
      return;
    }
    const res = addToCart(product, 1);
    if (res && res.message) {
      setToastMessage(res.message);
    } else {
      setToastMessage(`Added "${product.name}" to your cart!`);
    }
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleQuickWishlist = (e, product) => {
    e.stopPropagation();
    const willBeInWishlist = !isInWishlist(product.id);
    toggleWishlist(product);
    setToastMessage(willBeInWishlist ? `Saved "${product.name}" to wishlist!` : `Removed "${product.name}" from wishlist.`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 1. Dynamic Filtering Logic
  const filteredProducts = products.filter((product) => {
    if (product.status === 'archived') return false;

    // Automatically remove timepiece from catalog display when stock is 0 (or less)
    if ((Number(product.stock) ?? 0) <= 0) return false;

    // Search query match (smart multi-word tokenization and typo tolerance)
    const cleanSearch = searchTerm.trim().toLowerCase();
    let matchesSearch = cleanSearch === '';

    if (!matchesSearch) {
      const targetText = `${product.name || ''} ${product.brand || ''} ${product.category || ''} ${product.description || ''} ${product.specifications?.strapMaterial || ''}`.toLowerCase();

      // Direct substring match
      if (targetText.includes(cleanSearch)) {
        matchesSearch = true;
      } else {
        // Multi-word and prefix/typo-tolerant token search (e.g. "patek phillp", "patek nautilus")
        const tokens = cleanSearch.split(/\s+/).filter(t => t.length > 1);
        if (tokens.length > 0) {
          const matchesAllTokens = tokens.every(token => {
            if (targetText.includes(token)) return true;
            if (token.length >= 4) {
              const words = targetText.split(/\s+/);
              return words.some(w => w.startsWith(token.slice(0, 4)) || token.startsWith(w.slice(0, 4)));
            }
            return false;
          });

          const matchesAnyStrongToken = tokens.some(token => {
            return token.length >= 4 && (
              product.brand?.toLowerCase().includes(token) ||
              product.name?.toLowerCase().includes(token)
            );
          });

          matchesSearch = matchesAllTokens || matchesAnyStrongToken;
        }
      }
    }

    // Category match
    const matchesCategory = 
      selectedCategory === 'All' || 
      product.category?.toLowerCase() === selectedCategory.toLowerCase();

    // Brand match (supports case-insensitivity and formatting variations e.g. "i-watch", "i-Watch", "iWatch")
    const matchesBrand = 
      selectedBrand === 'All' || 
      product.brand?.toLowerCase() === selectedBrand.toLowerCase() ||
      product.brand?.toLowerCase().replace(/[\s-]/g, '') === selectedBrand.toLowerCase().replace(/[\s-]/g, '');

    // Strap Type match
    const matchesStrap = 
      selectedStrap === 'All' || 
      (product.specifications?.strapMaterial && 
       product.specifications.strapMaterial.toLowerCase().includes(selectedStrap.toLowerCase()));

    // Price range match (when at ceiling, no price cap)
    const productPrice = Number(product.discountPrice || product.price || 0);
    const matchesPrice = maxPrice >= ceilingPrice ? true : productPrice <= maxPrice;

    return matchesSearch && matchesCategory && matchesBrand && matchesStrap && matchesPrice;
  });

  // 2. Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const priceA = a.discountPrice || a.price;
    const priceB = b.discountPrice || b.price;

    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0; // Default featured sort
  });

  // Active Filter Count calculation
  const activeFilterCount = 
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedBrand !== 'All' ? 1 : 0) +
    (selectedStrap !== 'All' ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0) +
    (maxPrice < ceilingPrice ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8 font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 bg-luxury-charcoal-900 text-luxury-gold-300 rounded-2xl border border-luxury-charcoal-700 shadow-xl flex items-center justify-between animate-fadeIn text-left">
          <div className="flex items-center space-x-2.5 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={16} className="text-green-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-luxury-charcoal-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Title Section */}
      <div className="text-left space-y-2 border-b border-luxury-cream-300 pb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-gold-600">
          Curated Catalog
        </span>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-serif text-luxury-charcoal-900 font-bold tracking-wide">
            Haute Horlogerie
          </h1>
          <span className="text-xs text-luxury-charcoal-500 font-sans">
            Showing <strong className="text-luxury-charcoal-900">{sortedProducts.length}</strong> authenticated models
          </span>
        </div>
      </div>

      {/* Slide-Out Backdrop Overlay */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] transition-opacity animate-fadeIn"
          onClick={() => setIsFilterOpen(false)}
        />
      )}

      {/* Slide-Out Luxury Filter Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 z-[70] w-[76vw] max-w-[290px] sm:max-w-sm md:max-w-md bg-luxury-cream-50 shadow-2xl border-r border-luxury-cream-300 rounded-r-2xl sm:rounded-r-none flex flex-col transform transition-transform duration-300 ease-in-out ${
          isFilterOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:p-5 border-b border-luxury-cream-300 bg-white">
          <div className="flex items-center space-x-2 text-luxury-charcoal-900">
            <SlidersHorizontal size={16} className="text-luxury-gold-600" />
            <h3 className="font-serif text-sm sm:text-base font-bold uppercase tracking-wider">
              Filter & Refine
            </h3>
            {activeFilterCount > 0 && (
              <span className="bg-luxury-gold-400 text-luxury-charcoal-900 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                {activeFilterCount} Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && (
              <button 
                onClick={handleResetFilters}
                className="text-[11px] text-luxury-gold-600 hover:text-luxury-gold-800 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-1 rounded-lg hover:bg-luxury-cream-200 text-luxury-charcoal-500 hover:text-luxury-charcoal-900 transition-colors cursor-pointer"
              title="Close filters"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:p-6 space-y-4 sm:space-y-6 text-left">
          {/* 1. Keyword Search */}
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900 block">
              Search Timepieces
            </label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Search watches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-2 sm:py-2.5 bg-white text-xs border border-luxury-cream-300 rounded-xl focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500"
              />
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400 hover:text-luxury-charcoal-700"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* 2. Collection Category */}
          <div className="space-y-2">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900">
              Collection Category
            </h4>
            <div className="grid grid-cols-2 gap-1.5 font-sans">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-left px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex justify-between items-center text-[11px] sm:text-xs ${
                    selectedCategory === cat 
                      ? 'bg-luxury-charcoal-900 text-luxury-gold-300 font-bold shadow-sm' 
                      : 'bg-white border border-luxury-cream-300 text-luxury-charcoal-700 hover:bg-luxury-cream-200'
                  }`}
                >
                  <span className="truncate">{cat}</span>
                  {selectedCategory === cat && <span className="text-[10px] ml-1">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Manufacture / Brand */}
          <div className="space-y-2">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900">
              Manufacture / Brand
            </h4>
            <div className="flex flex-wrap gap-1.5 font-sans">
              {brands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center space-x-1 text-[11px] sm:text-xs ${
                    selectedBrand === brand 
                      ? 'bg-luxury-charcoal-900 text-luxury-gold-300 font-bold shadow-sm' 
                      : 'bg-white border border-luxury-cream-300 text-luxury-charcoal-700 hover:bg-luxury-cream-200'
                  }`}
                >
                  <span>{brand}</span>
                  {selectedBrand === brand && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Strap / Bracelet */}
          <div className="space-y-2">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900">
              Strap / Bracelet
            </h4>
            <div className="flex flex-wrap gap-1.5 font-sans">
              {straps.map((strap) => (
                <button
                  key={strap}
                  onClick={() => setSelectedStrap(strap)}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer flex items-center space-x-1 text-[11px] sm:text-xs ${
                    selectedStrap === strap 
                      ? 'bg-luxury-charcoal-900 text-luxury-gold-300 font-bold shadow-sm' 
                      : 'bg-white border border-luxury-cream-300 text-luxury-charcoal-700 hover:bg-luxury-cream-200'
                  }`}
                >
                  <span>{strap}</span>
                  {selectedStrap === strap && <span className="text-[10px]">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Max Price Range */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900">
              <span>Max Price Range</span>
              <span className="text-luxury-gold-600 font-mono text-xs sm:text-sm font-bold">
                {maxPrice >= ceilingPrice 
                  ? `All Prices (Up to ₹${(ceilingPrice / 100000).toFixed(0)}L)` 
                  : `₹${maxPrice.toLocaleString('en-IN')}`}
              </span>
            </div>
            <input 
              type="range"
              min="5000"
              max={ceilingPrice}
              step="50000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-luxury-charcoal-900 cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[9px] sm:text-[10px] text-luxury-charcoal-400 font-mono">
              <span>₹5,000</span>
              <span>{ceilingPrice >= 10000000 ? `₹${(ceilingPrice / 10000000).toFixed(0)} Crore` : `₹${(ceilingPrice / 100000).toFixed(0)} Lakhs`}</span>
            </div>
          </div>
        </div>

        {/* Drawer Sticky Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-luxury-cream-300">
          <Button
            onClick={() => setIsFilterOpen(false)}
            variant="primary"
            className="w-full justify-center text-[11px] sm:text-xs uppercase tracking-widest font-bold py-2.5 sm:py-3"
          >
            Show {sortedProducts.length} Timepieces
          </Button>
        </div>
      </div>

      {/* Top Controls Toolbar: Filter Trigger Button + Active Chips + Sort */}
      <div className="bg-luxury-cream-50 p-3.5 sm:p-4 rounded-2xl border border-luxury-cream-300 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 text-xs">
        
        {/* Left: Filter Toggle Button + Active Filter Chips */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-luxury-charcoal-900 text-luxury-gold-300 hover:bg-black rounded-xl text-xs uppercase font-bold tracking-wider transition-all shadow-sm cursor-pointer shrink-0"
          >
            <SlidersHorizontal size={14} />
            <span>Filter & Refine</span>
            {activeFilterCount > 0 && (
              <span className="bg-luxury-gold-400 text-luxury-charcoal-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Active Filter Chips */}
          {selectedCategory !== 'All' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-luxury-cream-300 rounded-full font-bold text-[11px] text-luxury-charcoal-800 shadow-2xs">
              <span>Category: {selectedCategory}</span>
              <button onClick={() => setSelectedCategory('All')} className="hover:text-red-500 cursor-pointer p-0.5" title="Remove filter"><X size={12} /></button>
            </span>
          )}
          {selectedBrand !== 'All' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-luxury-cream-300 rounded-full font-bold text-[11px] text-luxury-charcoal-800 shadow-2xs">
              <span>Brand: {selectedBrand}</span>
              <button onClick={() => setSelectedBrand('All')} className="hover:text-red-500 cursor-pointer p-0.5" title="Remove filter"><X size={12} /></button>
            </span>
          )}
          {selectedStrap !== 'All' && (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-luxury-cream-300 rounded-full font-bold text-[11px] text-luxury-charcoal-800 shadow-2xs">
              <span>Strap: {selectedStrap}</span>
              <button onClick={() => setSelectedStrap('All')} className="hover:text-red-500 cursor-pointer p-0.5" title="Remove filter"><X size={12} /></button>
            </span>
          )}
          {searchTerm && (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-luxury-cream-300 rounded-full font-bold text-[11px] text-luxury-charcoal-800 shadow-2xs">
              <span>"{searchTerm}"</span>
              <button onClick={() => setSearchTerm('')} className="hover:text-red-500 cursor-pointer p-0.5" title="Clear search"><X size={12} /></button>
            </span>
          )}
          {maxPrice < ceilingPrice && (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-luxury-cream-300 rounded-full font-bold text-[11px] text-luxury-charcoal-800 shadow-2xs">
              <span className="font-mono">&le; ₹{(maxPrice/100000).toFixed(1)}L</span>
              <button onClick={() => setMaxPrice(ceilingPrice)} className="hover:text-red-500 cursor-pointer p-0.5" title="Reset price"><X size={12} /></button>
            </span>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-luxury-gold-600 hover:text-luxury-gold-800 font-bold underline cursor-pointer ml-1"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Right: Quick Search + Sort By Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-44">
            <input
              type="text"
              placeholder="Quick search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs focus:outline-none focus:border-luxury-charcoal-900"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400 hover:text-luxury-charcoal-700 p-0.5 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-1.5 justify-between sm:justify-start">
            <span className="text-luxury-charcoal-500 font-semibold uppercase tracking-wider text-[10px] shrink-0">Sort:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-luxury-cream-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-luxury-charcoal-900 cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="featured">Featured Curations</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

      </div>


      {/* Full-Width Product Grid Viewport */}
      {isLoading ? (
        <div className="py-24 flex justify-center items-center">
          <Loader size="lg" text="Retrieving Curated Catalog..." />
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="py-12">
          <EmptyState 
            title="No timepieces matched"
            message="We couldn't find any watches matching your filters. Try resetting or adjusting your criteria."
            actionLabel="Reset All Filters"
            onActionClick={handleResetFilters}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {sortedProducts.map((product) => (
            <div 
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              className="group bg-white rounded-2xl border border-luxury-cream-300 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col text-left cursor-pointer relative"
            >
              {/* Photo Display */}
              <div className="relative h-44 sm:h-64 bg-luxury-cream-200 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {Number(product.stock) <= 0 ? (
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-rose-700 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded shadow">
                    Out of Stock
                  </span>
                ) : product.discountPrice ? (
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-luxury-charcoal-900 text-luxury-gold-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded shadow">
                    Special Offer
                  </span>
                ) : null}

                {/* Quick Action Pill: Wishlist & Quick View */}
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1.5 z-10">
                  <button
                    onClick={(e) => handleQuickWishlist(e, product)}
                    title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm ${
                      isInWishlist(product.id)
                        ? 'bg-luxury-charcoal-900 text-luxury-gold-300'
                        : 'bg-white/80 hover:bg-white text-luxury-charcoal-600 hover:text-luxury-charcoal-900'
                    }`}
                  >
                    <Heart size={13} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickViewProduct(product);
                      setQuickViewQty(1);
                    }}
                    title="Quick View Watch Dossier"
                    className="p-1.5 sm:p-2 rounded-full bg-white/80 hover:bg-luxury-charcoal-900 hover:text-luxury-gold-300 text-luxury-charcoal-600 backdrop-blur-md transition-all cursor-pointer shadow-sm"
                  >
                    <Eye size={13} />
                  </button>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-3 sm:p-5 flex-grow flex flex-col justify-between space-y-2 sm:space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold-600">
                      {product.brand}
                    </span>
                    <div className="flex items-center space-x-1 text-[11px] text-luxury-gold-500 font-bold">
                      <Star size={12} fill="currentColor" />
                      <span>{product.rating || 5.0}</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-sm font-bold text-luxury-charcoal-900 group-hover:text-luxury-gold-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                </div>

                {/* Price and Stock status + Quick Add to Cart */}
                <div className="pt-2 border-t border-luxury-cream-200 flex justify-between items-center">
                  <div className="flex items-baseline space-x-2">
                    {product.discountPrice ? (
                      <>
                        <span className="font-mono font-bold text-sm text-luxury-charcoal-900">
                          ₹{product.discountPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-luxury-charcoal-400 font-mono line-through">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono font-bold text-sm text-luxury-charcoal-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleQuickAddToCart(e, product)}
                    disabled={(Number(product.stock) ?? 10) <= 0}
                    title={(Number(product.stock) ?? 10) > 0 ? 'Quick Add to Cart' : 'Out of Stock'}
                    className="p-2 rounded-xl bg-luxury-cream-100 hover:bg-luxury-charcoal-900 hover:text-luxury-gold-300 text-luxury-charcoal-800 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={14} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setQuickViewProduct(null)}
        >
          <div 
            className="bg-luxury-cream-50 max-w-2xl w-full rounded-3xl border border-luxury-cream-300 shadow-2xl overflow-hidden relative text-left flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-luxury-charcoal-700 hover:text-luxury-charcoal-900 transition-colors cursor-pointer shadow-sm"
              title="Close Quick View"
            >
              <X size={16} />
            </button>

            {/* Left Column: Watch Image */}
            <div className="md:w-1/2 bg-gradient-to-b from-luxury-cream-100 to-luxury-cream-200 p-6 flex items-center justify-center relative min-h-[260px] md:min-h-full">
              <img 
                src={quickViewProduct.image} 
                alt={quickViewProduct.name} 
                className="max-h-64 md:max-h-80 w-auto object-contain drop-shadow-xl select-none"
              />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-mono text-luxury-charcoal-600 border border-luxury-cream-300 shadow-2xs">
                Ref. {quickViewProduct.id}
              </div>
            </div>

            {/* Right Column: Dossier Details & Instant Actions */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold-600">
                    {quickViewProduct.brand}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    (Number(quickViewProduct.stock) ?? 10) > 0 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {(Number(quickViewProduct.stock) ?? 10) > 0 ? `In Stock (${quickViewProduct.stock})` : 'Out of Stock'}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-luxury-charcoal-900 leading-snug">
                  {quickViewProduct.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center space-x-1 text-xs text-luxury-gold-500 font-bold">
                  <Star size={13} fill="currentColor" />
                  <span>{quickViewProduct.rating || 5.0}</span>
                  <span className="text-luxury-charcoal-400 font-normal ml-1 text-[11px]">
                    &bull; Certified Chronometer
                  </span>
                </div>

                {/* Price Display */}
                <div className="pt-2 flex items-baseline space-x-2.5 border-t border-luxury-cream-200">
                  {quickViewProduct.discountPrice ? (
                    <>
                      <span className="font-mono font-bold text-xl text-luxury-charcoal-900">
                        ₹{quickViewProduct.discountPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-luxury-charcoal-400 font-mono line-through">
                        ₹{quickViewProduct.price.toLocaleString('en-IN')}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono font-bold text-xl text-luxury-charcoal-900">
                      ₹{quickViewProduct.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Micro Specs */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-luxury-charcoal-600">
                  <div className="bg-white p-2 rounded-xl border border-luxury-cream-200">
                    <span className="text-[9px] text-luxury-charcoal-400 uppercase block font-semibold">Movement</span>
                    <span className="font-bold text-luxury-charcoal-800 truncate block">
                      {quickViewProduct.movement || quickViewProduct.specifications?.movement || 'Automatic Mechanical'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-luxury-cream-200">
                    <span className="text-[9px] text-luxury-charcoal-400 uppercase block font-semibold">Strap</span>
                    <span className="font-bold text-luxury-charcoal-800 truncate block">
                      {quickViewProduct.strap || quickViewProduct.specifications?.strap || 'Alligator Leather'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-luxury-charcoal-500 line-clamp-2 pt-1 font-sans leading-relaxed">
                  {quickViewProduct.description || 'Masterfully engineered Swiss mechanical architecture with anti-reflective sapphire crystal and hermetic crown.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-luxury-cream-200">
                <Button
                  onClick={() => {
                    const res = addToCart(quickViewProduct, quickViewQty);
                    setToastMessage(res.message || `Added ${quickViewProduct.name} to cart.`);
                    setTimeout(() => setToastMessage(''), 4000);
                    setQuickViewProduct(null);
                  }}
                  disabled={(Number(quickViewProduct.stock) ?? 10) <= 0}
                  variant="primary"
                  size="md"
                  className="w-full justify-center text-xs py-2.5"
                >
                  <ShoppingBag size={14} className="mr-1.5" />
                  <span>{(Number(quickViewProduct.stock) ?? 10) > 0 ? 'Add to Vault Cart' : 'Out of Stock'}</span>
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    const targetId = quickViewProduct.id;
                    setQuickViewProduct(null);
                    navigate(`/product/${targetId}`);
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-luxury-charcoal-700 hover:text-luxury-charcoal-950 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                >
                  <span>View Full Horology Dossier</span>
                  <ArrowRight size={12} />
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Shop;
