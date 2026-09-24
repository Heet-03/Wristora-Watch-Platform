import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  DollarSign, 
  Sliders, 
  Sparkles,
  Eye
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { getProductById, updateProduct, getBrands, getCategories } from '../../firebase/dbService';

/**
 * AdminEditProduct Component
 * 
 * Edit existing watch details with live data loaded from Firestore.
 */
function AdminEditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [existingProduct, setExistingProduct] = useState(null);

  // 1. Basic Details
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Rolex');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [category, setCategory] = useState('Luxury');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');

  // 2. Pricing & Stock
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('10');

  // 3. Technical Specifications
  const [movement, setMovement] = useState('');
  const [caseSize, setCaseSize] = useState('');
  const [caseMaterial, setCaseMaterial] = useState('');
  const [strapMaterial, setStrapMaterial] = useState('');
  const [waterResistance, setWaterResistance] = useState('');
  const [warranty, setWarranty] = useState('');

  // 4. Media URLs
  const [primaryImage, setPrimaryImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);

  // 5. Visibility Flags
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [status, setStatus] = useState('active');

  const [formErrors, setFormErrors] = useState({});

  const [brands, setBrands] = useState(['Rolex', 'Omega', 'Hublot', 'Seiko', 'Tag Heuer', 'Tissot', 'Audemars Piguet', 'Patek Philippe']);
  const [categories, setCategories] = useState(['Luxury', 'Classic', 'Sports', 'Chronograph', 'Limited']);

  // Fetch watch, brands, and categories from Firestore / Central Database
  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        const [prod, savedBrands, savedCats] = await Promise.all([
          getProductById(id),
          getBrands(),
          getCategories()
        ]);

        let activeBrands = ['Rolex', 'Omega', 'Hublot', 'Seiko', 'Tag Heuer', 'Tissot', 'Audemars Piguet', 'Patek Philippe'];
        if (savedBrands && savedBrands.length > 0) {
          const bNames = savedBrands.map(b => typeof b === 'string' ? b : b.name).filter(Boolean);
          activeBrands = Array.from(new Set([...bNames, ...activeBrands]));
          setBrands(activeBrands);
        }

        let activeCats = ['Luxury', 'Classic', 'Sports', 'Chronograph', 'Limited'];
        if (savedCats && savedCats.length > 0) {
          const cNames = savedCats.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
          activeCats = Array.from(new Set([...cNames, ...activeCats]));
          setCategories(activeCats);
        }

        setExistingProduct(prod);

        if (prod) {
          setName(prod.name || '');
          const watchBrand = prod.brand || 'Rolex';
          setBrand(watchBrand);
          setIsCustomBrand(!activeBrands.includes(watchBrand));

          const watchCategory = prod.category || 'Luxury';
          setCategory(watchCategory);
          setIsCustomCategory(!activeCats.includes(watchCategory));
          setDescription(prod.description || '');
          setPrice(prod.price?.toString() || '');
          setDiscountPrice(prod.discountPrice?.toString() || '');
          setStock(prod.stock?.toString() || '10');

          setMovement(prod.specifications?.movement || 'Automatic');
          setCaseSize(prod.specifications?.caseSize || '41mm');
          setCaseMaterial(prod.specifications?.caseMaterial || 'Stainless Steel');
          setStrapMaterial(prod.specifications?.strapMaterial || 'Leather');
          setWaterResistance(prod.specifications?.waterResistance || '100m');
          setWarranty(prod.specifications?.warranty || '2 Years');

          setPrimaryImage(prod.image || '');
          setGalleryImages(prod.images || [prod.image]);

          setIsFeatured(!!prod.isFeatured);
          setIsNewArrival(!!prod.isNewArrival);
          setStatus(prod.status || 'active');
        }
      } catch (err) {
        console.error('Error fetching watch for editing:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWatchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Retrieving Timepiece Data from Firestore..." />
      </div>
    );
  }

  if (!existingProduct) {
    return (
      <div className="p-12 max-w-4xl mx-auto">
        <EmptyState
          title="Timepiece Not Found"
          message={`No watch with ID "${id}" exists in the catalog.`}
          actionLabel="Back to Inventory"
          onActionClick={() => navigate('/admin/products')}
        />
      </div>
    );
  }

  const handleAddGalleryImage = () => {
    setGalleryImages(prev => [...prev, '']);
  };

  const handleGalleryImageChange = (index, value) => {
    const updated = [...galleryImages];
    updated[index] = value;
    setGalleryImages(updated);
  };

  const handleRemoveGalleryImage = (index) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    const errors = {};

    if (!name.trim()) errors.name = 'Timepiece model name is required';
    if (!price || isNaN(price) || Number(price) <= 0) errors.price = 'Valid price is required';
    if (!stock || isNaN(stock) || Number(stock) < 0) errors.stock = 'Valid stock quantity is required';
    if (!primaryImage.trim()) errors.primaryImage = 'Primary image URL is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setFeedback({ type: 'error', text: 'Please resolve the highlighted errors before saving.' });
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const updatePayload = {
        name: name.trim(),
        brand: brand.trim(),
        category: category.trim(),
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        stock: Number(stock),
        description: description.trim(),
        image: primaryImage.trim(),
        images: galleryImages.filter(img => img.trim() !== ''),
        specifications: {
          movement,
          caseSize,
          caseMaterial,
          strapMaterial,
          waterResistance,
          warranty
        },
        status,
        isFeatured
      };

      await updateProduct(id, updatePayload);
      setFeedback({ type: 'success', text: `Timepiece "${name}" modifications saved to Firestore!` });
      setTimeout(() => {
        navigate('/admin/products');
      }, 1200);
    } catch (err) {
      console.error('Error updating watch in Firestore:', err);
      setFeedback({ type: 'error', text: `Failed saving changes: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto text-left font-sans">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-luxury-cream-300 pb-6">
        <div>
          <button 
            onClick={() => navigate('/admin/products')}
            className="flex items-center space-x-1.5 text-xs uppercase tracking-wider font-semibold text-luxury-charcoal-500 hover:text-luxury-charcoal-900 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Inventory</span>
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
            <h1 className="text-xl sm:text-3xl font-serif font-bold text-luxury-charcoal-900 tracking-wide">
              Edit Timepiece
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-luxury-cream-200 text-luxury-charcoal-800 border border-luxury-cream-300">
              REF: #{id}
            </span>
          </div>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-0.5">
            Modify specifications, pricing adjustments, media assets, and vault inventory.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link to="/admin/products" className="flex-1 sm:flex-initial">
            <Button variant="outline" size="md" className="w-full sm:w-auto text-xs uppercase tracking-wider justify-center">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleSubmit}
            variant="primary" 
            size="md" 
            isLoading={isSubmitting}
            className="flex-1 sm:flex-initial w-full sm:w-auto text-xs uppercase tracking-widest font-bold justify-center"
          >
            <Save size={14} className="mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.text && (
        <div className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold ${
          feedback.type === 'success' 
            ? 'bg-green-50 text-green-900 border border-green-200' 
            : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} className="text-green-600 shrink-0" /> : <AlertCircle size={16} className="text-red-600 shrink-0" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* 2-Column Wizard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form Sections */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Horological Identity */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <Layers size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                1. Horological Identity
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Timepiece Model Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={formErrors.name}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Brand Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                      Watchmaker / Brand
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomBrand(!isCustomBrand);
                        if (!isCustomBrand && brands.includes(brand)) setBrand('');
                        if (isCustomBrand && !brand) setBrand('Rolex');
                      }}
                      className="text-[10px] font-bold text-luxury-gold-600 hover:text-luxury-gold-800 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {isCustomBrand ? '← Choose from List' : '+ Type Custom Brand'}
                    </button>
                  </div>

                  {isCustomBrand ? (
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g. Richard Mille, Cartier, Patek Philippe"
                      className="w-full px-3.5 py-2.5 bg-white border border-luxury-gold-400 ring-1 ring-luxury-gold-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={brand}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomBrand(true);
                          setBrand('');
                        } else {
                          setBrand(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
                    >
                      {brands.map(b => <option key={b} value={b}>{b}</option>)}
                      <option value="CUSTOM" className="font-bold text-luxury-gold-700">+ Add Custom Brand...</option>
                    </select>
                  )}
                </div>

                {/* Category Field */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                      Collection Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory && categories.includes(category)) setCategory('');
                        if (isCustomCategory && !category) setCategory('Luxury');
                      }}
                      className="text-[10px] font-bold text-luxury-gold-600 hover:text-luxury-gold-800 transition-colors cursor-pointer uppercase tracking-wider"
                    >
                      {isCustomCategory ? '← Choose from List' : '+ Type Custom Category'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Vintage, Skeleton, Tourbillon, Diver"
                      className="w-full px-3.5 py-2.5 bg-white border border-luxury-gold-400 ring-1 ring-luxury-gold-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={category}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomCategory(true);
                          setCategory('');
                        } else {
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="CUSTOM" className="font-bold text-luxury-gold-700">+ Add Custom Category...</option>
                    </select>
                  )}
                </div>

              </div>

              <div className="space-y-1">
                <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                  Curatorial Narrative & Provenance
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 focus:outline-none focus:border-luxury-gold-500 font-sans leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Valuation & Inventory */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <DollarSign size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                2. Valuation & Inventory
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Retail Price (₹)"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={formErrors.price}
                required
              />

              <Input
                label="Promotional Price (₹)"
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Optional discount"
              />

              <Input
                label="Stock Allocation"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                error={formErrors.stock}
                required
              />
            </div>
          </div>

          {/* Section 3: Technical Specifications Matrix */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <Sliders size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                3. Technical Specifications Matrix
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Caliber / Movement"
                value={movement}
                onChange={(e) => setMovement(e.target.value)}
              />
              <Input
                label="Case Dimension"
                value={caseSize}
                onChange={(e) => setCaseSize(e.target.value)}
              />
              <Input
                label="Case Material"
                value={caseMaterial}
                onChange={(e) => setCaseMaterial(e.target.value)}
              />
              <Input
                label="Strap / Bracelet"
                value={strapMaterial}
                onChange={(e) => setStrapMaterial(e.target.value)}
              />
              <Input
                label="Water Resistance"
                value={waterResistance}
                onChange={(e) => setWaterResistance(e.target.value)}
              />
              <Input
                label="Global Warranty Period"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
              />
            </div>
          </div>

          {/* Section 4: Media Gallery */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <ImageIcon size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                4. High-Resolution Media Gallery
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Primary Showcase Image URL"
                value={primaryImage}
                onChange={(e) => setPrimaryImage(e.target.value)}
                error={formErrors.primaryImage}
                required
              />

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                    Additional Perspective Angles
                  </label>
                  <button
                    type="button"
                    onClick={handleAddGalleryImage}
                    className="text-xs font-bold text-luxury-gold-600 hover:text-luxury-gold-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Angle</span>
                  </button>
                </div>

                {galleryImages.map((imgUrl, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={imgUrl}
                      onChange={(e) => handleGalleryImageChange(index, e.target.value)}
                      className="flex-grow px-3.5 py-2 text-xs bg-white border border-luxury-cream-300 rounded-xl focus:outline-none focus:border-luxury-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(index)}
                      className="p-2 text-luxury-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Visibility & Flags */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <Sparkles size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                5. Catalog Placement & Status
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-4 bg-white rounded-xl border border-luxury-cream-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 accent-luxury-charcoal-900 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-luxury-charcoal-900 block">Featured Bestseller Drop</span>
                  <span className="text-[10px] text-luxury-charcoal-500">Showcase prominently on Storefront Home Page</span>
                </div>
              </label>

              <div className="space-y-1">
                <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                  Timepiece Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
                >
                  <option value="active">Active (Visible on Storefront)</option>
                  <option value="archived">Archived (Hidden from Storefront)</option>
                </select>
              </div>
            </div>
          </div>

        </form>

        {/* Right 1 Col: Live Storefront Card Preview */}
        <div className="space-y-6">
          <div className="sticky top-28 space-y-4">
            <div className="flex items-center space-x-2 text-luxury-charcoal-900">
              <Eye size={16} className="text-luxury-gold-600" />
              <h3 className="font-serif text-sm font-bold uppercase tracking-wider">
                Storefront Live Preview
              </h3>
            </div>

            <div className="bg-white rounded-2xl border border-luxury-cream-300 overflow-hidden shadow-md text-left flex flex-col">
              <div className="relative h-64 bg-luxury-cream-200 overflow-hidden">
                <img
                  src={primaryImage || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800'}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {discountPrice && Number(discountPrice) > 0 && (
                  <span className="absolute top-3 left-3 bg-luxury-charcoal-900 text-luxury-gold-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded shadow">
                    Special Offer
                  </span>
                )}
                <span className={`absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  Number(stock) > 8 
                    ? 'bg-green-100 text-green-800' 
                    : Number(stock) > 0 
                    ? 'bg-amber-100 text-amber-900' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {Number(stock) > 8 ? 'In Stock' : Number(stock) > 0 ? `${stock} Left` : 'Sold Out'}
                </span>
              </div>

              <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold-600">
                    {brand || 'Watchmaker'}
                  </span>
                  <h4 className="font-serif text-base font-bold text-luxury-charcoal-900">
                    {name || 'Timepiece Model'}
                  </h4>
                  <p className="text-[10px] text-luxury-charcoal-500 font-sans mt-1 line-clamp-2">
                    {description || 'Curatorial description will appear here as formatted.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-luxury-cream-200 flex justify-between items-baseline">
                  <div className="flex items-baseline space-x-2">
                    {discountPrice && Number(discountPrice) > 0 ? (
                      <>
                        <span className="font-mono font-bold text-base text-luxury-charcoal-900">
                          ₹{Number(discountPrice).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-luxury-charcoal-400 font-mono line-through">
                          ₹{Number(price || 0).toLocaleString('en-IN')}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono font-bold text-base text-luxury-charcoal-900">
                        ₹{Number(price || 0).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-luxury-charcoal-400">
                    {category}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full justify-center text-xs uppercase tracking-widest font-bold py-3.5"
            >
              <Save size={15} className="mr-2" />
              Save Modifications
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
}

export default AdminEditProduct;
