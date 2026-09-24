import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  Tag, 
  ExternalLink,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { getProducts, updateProduct, deleteProduct, getBrands, getCategories } from '../../firebase/dbService';

/**
 * AdminProducts Component (Mockup 14)
 * 
 * Comprehensive Inventory Control connected to live Firestore database:
 * - Search by model, serial, or brand.
 * - Dynamic category, brand, and stock status filter matrix.
 * - In-table stock counter adjustments synced to cloud.
/**
 * Helper to compute actionable inventory indicator (Option 3):
 * - Above 8 (> 8): ✓ Optimal
 * - At 8 (= 8): ⚡ Reorder Trigger
 * - Below 8 (< 8 and > 0): 🔥 Restock Urgency
 * - 0: ⛔ Stockout
 */
export const getStockBadge = (stock) => {
  const count = Number(stock) || 0;
  if (count === 0) {
    return {
      label: '⛔ Stockout',
      classes: 'bg-neutral-100 text-neutral-700 border border-neutral-300 font-bold',
      title: 'Sold Out — 0 pieces available in vault'
    };
  }
  if (count < 8) {
    return {
      label: '🔥 Restock Urgency',
      classes: 'bg-rose-50 text-rose-700 border border-rose-200 font-bold',
      title: `Critical allocation: only ${count} piece${count > 1 ? 's' : ''} left`
    };
  }
  if (count === 8) {
    return {
      label: '⚡ Reorder Trigger',
      classes: 'bg-amber-50 text-amber-900 border border-amber-300 font-bold',
      title: 'Threshold reached: exactly 8 pieces left. Time to reorder.'
    };
  }
  return {
    label: '✓ Optimal',
    classes: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold',
    title: 'Optimal inventory buffer (> 8 pieces in vault)'
  };
};

function AdminProducts() {
  const navigate = useNavigate();
  const userUrl = import.meta.env.VITE_USER_URL || `${window.location.protocol}//${window.location.hostname}:5173`;

  // Products state loaded from Firestore
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [registeredBrands, setRegisteredBrands] = useState([]);
  const [registeredCategories, setRegisteredCategories] = useState([]);

  // Deletion Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Fetch live products, brands, and categories
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [data, brandData, catData] = await Promise.all([
          getProducts(),
          getBrands(),
          getCategories()
        ]);
        setProducts(data || []);
        if (brandData && brandData.length > 0) {
          const bNames = brandData.map(b => typeof b === 'string' ? b : b.name).filter(Boolean);
          setRegisteredBrands(bNames);
        }
        if (catData && catData.length > 0) {
          const cNames = catData.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
          setRegisteredCategories(cNames);
        }
      } catch (err) {
        console.error('Error fetching admin products catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const brands = ['All', ...new Set([
    'Rolex', 'Omega', 'Hublot', 'Seiko', 'Tag Heuer', 'Tissot', 'i-Watch', 'Patek Philippe', 'Audemars Piguet',
    ...registeredBrands,
    ...products.map(p => p.brand).filter(Boolean)
  ])];
  const categories = ['All', ...new Set([
    'Luxury', 'Classic', 'Sports', 'Chronograph', 'Limited',
    ...registeredCategories,
    ...products.map(p => p.category).filter(Boolean)
  ])];

  // Filtered Products Logic
  const filteredProducts = products.filter((product) => {
    // 1. Search Query Match
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Category Filter
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    // 3. Brand Filter (flexible for casing and hyphens e.g. "i-watch", "i-Watch")
    const matchesBrand = 
      selectedBrand === 'All' || 
      product.brand?.toLowerCase() === selectedBrand.toLowerCase() ||
      product.brand?.toLowerCase().replace(/[\s-]/g, '') === selectedBrand.toLowerCase().replace(/[\s-]/g, '');

    // 4. Stock Status Filter
    let matchesStock = true;
    if (selectedStockStatus === 'Optimal' || selectedStockStatus === 'InStock') {
      matchesStock = Number(product.stock) > 8;
    } else if (selectedStockStatus === 'ReorderTrigger') {
      matchesStock = Number(product.stock) === 8;
    } else if (selectedStockStatus === 'RestockUrgency') {
      matchesStock = Number(product.stock) > 0 && Number(product.stock) < 8;
    } else if (selectedStockStatus === 'LowStock') {
      matchesStock = Number(product.stock) > 0 && Number(product.stock) <= 8;
    } else if (selectedStockStatus === 'Stockout' || selectedStockStatus === 'OutOfStock') {
      matchesStock = Number(product.stock) === 0;
    }

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  // Handle Quick Stock Adjustments in Firestore
  const handleStockAdjust = async (id, delta) => {
    const target = products.find(p => p.id === id);
    if (!target) return;

    const newStock = Math.max(0, Number(target.stock) + delta);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));

    try {
      await updateProduct(id, { stock: newStock });
      setToastMessage(`Updated stock for ${target.name} to ${newStock} units.`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed updating stock in Firestore:', err);
    }
  };

  // Handle Status Toggle (Active / Archived) in Firestore
  const handleToggleStatus = async (id) => {
    const target = products.find(p => p.id === id);
    if (!target) return;

    const newStatus = target.status === 'active' ? 'archived' : 'active';
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

    try {
      await updateProduct(id, { status: newStatus });
      setToastMessage(`${target.name} marked as ${newStatus}.`);
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Failed updating status in Firestore:', err);
    }
  };

  // Handle Product Deletion Confirmation in Firestore
  const confirmDelete = async () => {
    if (productToDelete) {
      const deletedName = productToDelete.name;
      const deletedId = productToDelete.id;
      
      setProducts(prev => prev.filter(p => p.id !== deletedId));
      setProductToDelete(null);

      try {
        await deleteProduct(deletedId);
        setToastMessage(`"${deletedName}" permanently removed from vault catalog.`);
        setTimeout(() => setToastMessage(''), 4000);
      } catch (err) {
        console.error('Failed deleting product from Firestore:', err);
      }
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setSelectedStockStatus('All');
  };

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Syncing Catalog from Firestore Database..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto text-left font-sans">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="p-4 bg-luxury-charcoal-900 text-luxury-gold-300 rounded-xl border border-luxury-charcoal-700 shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 size={16} className="text-green-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-luxury-charcoal-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-luxury-cream-300 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
            <h1 className="text-xl sm:text-3xl font-serif font-bold text-luxury-charcoal-900 tracking-wide">
              Timepiece Catalog Inventory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-luxury-charcoal-900 text-luxury-gold-300">
              {products.length} Models Active
            </span>
          </div>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
            Manage vault stock allocations, technical specifications, pricing, and live storefront visibility.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link to="/admin/products/new" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold justify-center">
              <Plus size={15} className="mr-1.5" />
              Add New Watch
            </Button>
          </Link>
        </div>
      </div>

      {/* Multi-tier Filter & Search Matrix */}
      <div className="bg-luxury-cream-50 p-4 sm:p-6 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-4">
        
        {/* Row 1: Search & Reset */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by model, brand, or caliber..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 transition-colors"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 bg-white hover:bg-luxury-cream-200 border border-luxury-cream-300 text-luxury-charcoal-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category, Brand, Stock filters pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-luxury-cream-200">
          
          {/* Category dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-luxury-charcoal-500">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-800 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat} Collection</option>
              ))}
            </select>
          </div>

          {/* Brand dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-luxury-charcoal-500">Brand Maker</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-800 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
            >
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand === 'All' ? 'All Watchmakers' : brand}</option>
              ))}
            </select>
          </div>

          {/* Stock status dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-widest text-luxury-charcoal-500">Stock Availability</label>
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-800 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
            >
              <option value="All">All Inventory Levels</option>
              <option value="Optimal">✓ Optimal (&gt; 8 units)</option>
              <option value="ReorderTrigger">⚡ Reorder Trigger (= 8 units)</option>
              <option value="RestockUrgency">🔥 Restock Urgency (&lt; 8 units)</option>
              <option value="Stockout">⛔ Stockout (0 units)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Products Catalog */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-4">
          
          {/* Mobile Touch Cards View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredProducts.map((product) => {
              const stockBadge = getStockBadge(product.stock);

              return (
                <div 
                  key={product.id}
                  className="bg-luxury-cream-50 rounded-2xl border border-luxury-cream-300 p-4 shadow-2xs space-y-3"
                >
                  {/* Top: Image + Info */}
                  <div className="flex items-start space-x-3">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-16 h-16 rounded-xl object-cover border border-luxury-cream-300 shadow-2xs shrink-0" 
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold-600">
                          {product.brand}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-luxury-cream-200 text-luxury-charcoal-800 border border-luxury-cream-300 shrink-0">
                          {product.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-luxury-charcoal-900 text-xs truncate mt-0.5">
                        {product.name}
                      </h4>
                      <div className="flex items-baseline space-x-2 mt-1">
                        <span className="font-mono font-bold text-sm text-luxury-charcoal-900">
                          ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
                        </span>
                        {product.discountPrice && (
                          <span className="text-[10px] text-luxury-charcoal-400 font-mono line-through">
                            ₹{product.price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Stock Stepper & Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-luxury-cream-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-luxury-charcoal-400">Stock:</span>
                      <div className="flex items-center bg-white border border-luxury-cream-300 rounded-lg overflow-hidden shadow-2xs">
                        <button
                          onClick={() => handleStockAdjust(product.id, -1)}
                          disabled={product.stock <= 0}
                          className="px-2.5 py-1 hover:bg-luxury-cream-200 text-luxury-charcoal-600 disabled:opacity-30 cursor-pointer font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-bold text-luxury-charcoal-900 font-mono">
                          {product.stock}
                        </span>
                        <button
                          onClick={() => handleStockAdjust(product.id, 1)}
                          className="px-2.5 py-1 hover:bg-luxury-cream-200 text-luxury-charcoal-600 cursor-pointer font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span 
                        title={stockBadge.title}
                        className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider shrink-0 ${stockBadge.classes}`}
                      >
                        {stockBadge.label}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(product.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        product.status === 'active' 
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                          : 'bg-luxury-cream-200 text-luxury-charcoal-500 border border-luxury-cream-300 hover:bg-luxury-cream-300'
                      }`}
                    >
                      {product.status === 'active' ? 'Active' : 'Archived'}
                    </button>
                  </div>

                  {/* Bottom: Action Toolbar */}
                  <div className="flex items-center justify-between pt-2 border-t border-luxury-cream-200">
                    <span className="text-[10px] font-mono text-luxury-charcoal-400">
                      REF #{product.id.slice(0, 8)}...
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => window.open(`${userUrl}/product/${product.id}`, '_blank')}
                        className="p-1.5 bg-white hover:bg-luxury-cream-200 text-luxury-charcoal-600 border border-luxury-cream-300 rounded-lg transition-colors cursor-pointer"
                        title="Inspect on Storefront"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-luxury-charcoal-900 text-luxury-gold-300 hover:bg-luxury-charcoal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Edit Watch Details"
                      >
                        <Edit size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-1.5 bg-white hover:bg-red-50 text-luxury-charcoal-400 hover:text-red-600 border border-luxury-cream-300 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                        title="Delete Timepiece"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Products Catalog Table (hidden md:block) */}
          <div className="hidden md:block bg-luxury-cream-50 rounded-2xl border border-luxury-cream-300 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-luxury-cream-300 bg-luxury-cream-100 text-luxury-charcoal-600 uppercase tracking-widest text-[10px] font-bold">
                    <th className="py-4 px-6">Timepiece</th>
                    <th className="py-4 px-4">Category</th>
                    <th className="py-4 px-4">Valuation (Price)</th>
                    <th className="py-4 px-4">Vault Stock</th>
                    <th className="py-4 px-4">Visibility</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-cream-200">
                  {filteredProducts.map((product) => {
                    const stockBadge = getStockBadge(product.stock);

                    return (
                      <tr key={product.id} className="hover:bg-luxury-cream-100/80 transition-colors group">
                        
                        {/* Product details */}
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3.5">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-luxury-cream-300 shadow-2xs shrink-0"
                            />
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold-600">
                                {product.brand}
                              </span>
                              <h4 className="font-bold text-luxury-charcoal-900 text-xs line-clamp-1">
                                {product.name}
                              </h4>
                              <p className="text-[10px] text-luxury-charcoal-400 font-mono">
                                REF: #{product.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-luxury-cream-200 text-luxury-charcoal-800 border border-luxury-cream-300">
                            {product.category}
                          </span>
                        </td>

                        {/* Valuation / Price */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <p className="font-mono font-bold text-sm text-luxury-charcoal-900">
                              ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
                            </p>
                            {product.discountPrice && (
                              <p className="text-[10px] text-luxury-charcoal-400 font-mono line-through">
                                ₹{product.price.toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Stock Adjustment Controls */}
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center bg-white border border-luxury-cream-300 rounded-lg overflow-hidden shadow-2xs">
                              <button
                                onClick={() => handleStockAdjust(product.id, -1)}
                                disabled={product.stock <= 0}
                                className="px-2 py-1 hover:bg-luxury-cream-200 text-luxury-charcoal-600 disabled:opacity-30 cursor-pointer font-bold"
                              >
                                -
                              </button>
                              <span className="px-2.5 text-xs font-bold text-luxury-charcoal-900 font-mono">
                                {product.stock}
                              </span>
                              <button
                                onClick={() => handleStockAdjust(product.id, 1)}
                                className="px-2 py-1 hover:bg-luxury-cream-200 text-luxury-charcoal-600 cursor-pointer font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Stock pill */}
                            <span 
                              title={stockBadge.title}
                              className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider shrink-0 ${stockBadge.classes}`}
                            >
                              {stockBadge.label}
                            </span>
                          </div>
                        </td>

                        {/* Visibility Status */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleToggleStatus(product.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              product.status === 'active' 
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                                : 'bg-luxury-cream-200 text-luxury-charcoal-500 border border-luxury-cream-300 hover:bg-luxury-cream-300'
                            }`}
                          >
                            {product.status === 'active' ? 'Active' : 'Archived'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Storefront View */}
                            <button
                              onClick={() => window.open(`${userUrl}/product/${product.id}`, '_blank')}
                              className="p-1.5 hover:bg-luxury-cream-200 text-luxury-charcoal-500 hover:text-luxury-charcoal-900 rounded-lg transition-colors cursor-pointer"
                              title="Inspect on Storefront"
                            >
                              <ExternalLink size={14} />
                            </button>

                            {/* Edit Product */}
                            <button
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                              className="p-1.5 hover:bg-luxury-cream-200 text-luxury-charcoal-700 hover:text-luxury-charcoal-900 rounded-lg transition-colors cursor-pointer"
                              title="Edit Watch Details"
                            >
                              <Edit size={14} />
                            </button>

                            {/* Delete Modal Trigger */}
                            <button
                              onClick={() => setProductToDelete(product)}
                              className="p-1.5 hover:bg-red-50 text-luxury-charcoal-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Delete Timepiece"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-luxury-cream-50 p-12 rounded-2xl border border-luxury-cream-300 text-center">
          <EmptyState
            title="No Timepieces Found"
            message="No watches match your search criteria or active filter parameters."
            actionLabel="Reset Filters"
            onActionClick={handleResetFilters}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <Modal
          isOpen={!!productToDelete}
          onClose={() => setProductToDelete(null)}
          size="md"
          title="Confirm Timepiece Deletion"
        >
          <div className="space-y-4 text-left text-xs font-sans">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-900">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-xs">Permanent Vault Deletion</p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  Are you sure you want to remove <strong className="font-bold">"{productToDelete.name}"</strong>? This will permanently delete this document from Google Cloud Firestore.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setProductToDelete(null)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDelete}
                className="flex-1 justify-center text-xs uppercase bg-red-700 hover:bg-red-800 text-white font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default AdminProducts;
