import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { addProduct, getBrands, getCategories } from '../../firebase/dbService';

/**
 * AdminAddProduct Component (Mockup 15)
 * 
 * Multi-section wizard to curate and publish new luxury timepieces:
 * - 1. Horological Identity (Name, Brand, Category, Narrative).
 * - 2. Valuation & Inventory (Retail Price, Promotional Discount, Stock Units).
 * - 3. Technical Specifications Matrix (Movement, Case, Strap, Water Resistance, Warranty).
 * - 4. Media & Gallery (Primary Image URL, Multi-Angle Thumbnails with Live Preview).
 * - 5. Catalog Placement (Featured Drop, New Arrival, Active Status).
 */
function AdminAddProduct() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

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
  const [movement, setMovement] = useState('Automatic (In-House Calibre)');
  const [caseSize, setCaseSize] = useState('41mm');
  const [caseMaterial, setCaseMaterial] = useState('Oystersteel & 18K Gold');
  const [strapMaterial, setStrapMaterial] = useState('Stainless Steel Bracelet');
  const [waterResistance, setWaterResistance] = useState('100m (330ft)');
  const [warranty, setWarranty] = useState('2 Years Global Guarantee');

  // 4. Media URLs
  const [primaryImage, setPrimaryImage] = useState(
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800'
  );
  const [galleryImages, setGalleryImages] = useState([
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800&zoom=1',
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800&zoom=2'
  ]);

  // 5. Visibility Flags
  const [isFeatured, setIsFeatured] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [status, setStatus] = useState('active');

  const [formErrors, setFormErrors] = useState({});

  const [brands, setBrands] = useState(['Rolex', 'Omega', 'Hublot', 'Seiko', 'Tag Heuer', 'Tissot', 'Audemars Piguet', 'Patek Philippe']);
  const [categories, setCategories] = useState(['Luxury', 'Classic', 'Sports', 'Chronograph', 'Limited']);

  // Fetch registered brands and categories from central registry
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const [savedBrands, savedCats] = await Promise.all([getBrands(), getCategories()]);
        if (savedBrands && savedBrands.length > 0) {
          const brandNames = savedBrands.map(b => typeof b === 'string' ? b : b.name).filter(Boolean);
          setBrands(prev => Array.from(new Set([...brandNames, ...prev])));
        }
        if (savedCats && savedCats.length > 0) {
          const catNames = savedCats.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);
          setCategories(prev => Array.from(new Set([...catNames, ...prev])));
        }
      } catch (err) {
        console.warn('Error loading dynamic brands/categories in AddProduct:', err);
      }
    };
    fetchTaxonomy();
  }, []);

  // Gallery URL handlers
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

  // Form Submission
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
      setFeedback({ type: 'error', text: 'Please correct the highlighted fields before saving.' });
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const productPayload = {
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
        status: status || 'active',
        isFeatured: !!isFeatured,
        isNewArrival: !!isNewArrival
      };

      await addProduct(productPayload);
      setFeedback({ type: 'success', text: `Timepiece "${name}" published successfully to cloud catalog!` });
      setTimeout(() => {
        navigate('/admin/products');
      }, 1200);
    } catch (err) {
      console.error('Error adding product to Firestore:', err);
      setFeedback({ type: 'error', text: `Failed publishing watch: ${err.message}` });
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
          <h1 className="text-xl sm:text-3xl font-serif font-bold text-luxury-charcoal-900 tracking-wide">
            Add New Timepiece to Catalog
          </h1>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-0.5">
            Configure specifications, high-resolution media galleries, and initial inventory allocations.
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
            Publish Timepiece
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center space-x-2.5 ${
          feedback.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className="font-semibold">{feedback.text}</span>
        </div>
      )}

      {/* Main Form Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: Form Configuration Blocks */}
        <div className="lg:col-span-2 space-y-8">
          
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
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={formErrors.name}
                placeholder="e.g. Rolex Datejust 41, Omega Speedmaster"
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
                      placeholder="e.g. Tourbillon, Aviator, Diver"
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
                  Curator Narrative Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the horological significance, movement craftsmanship, dial finish, and heritage of this timepiece..."
                  className="w-full px-3.5 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 focus:ring-1 focus:ring-luxury-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Valuation & Stock Allocation */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <DollarSign size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                2. Valuation & Inventory
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Retail Price (INR ₹)"
                name="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                error={formErrors.price}
                placeholder="745000"
                required
              />

              <Input
                label="Promotional Price (INR ₹)"
                name="discountPrice"
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="699000 (Optional)"
              />

              <Input
                label="Initial Stock Units"
                name="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                error={formErrors.stock}
                placeholder="10"
                required
              />
            </div>
          </div>

          {/* Section 3: Technical Specifications Matrix */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <Sliders size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                3. Technical Specifications
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Movement / Calibre"
                value={movement}
                onChange={(e) => setMovement(e.target.value)}
                placeholder="e.g. Automatic (Calibre 3235)"
              />
              <Input
                label="Case Diameter / Size"
                value={caseSize}
                onChange={(e) => setCaseSize(e.target.value)}
                placeholder="e.g. 41mm"
              />
              <Input
                label="Case Material"
                value={caseMaterial}
                onChange={(e) => setCaseMaterial(e.target.value)}
                placeholder="e.g. Oystersteel & 18K Gold"
              />
              <Input
                label="Strap / Bracelet"
                value={strapMaterial}
                onChange={(e) => setStrapMaterial(e.target.value)}
                placeholder="e.g. Jubilee Steel Bracelet"
              />
              <Input
                label="Water Resistance"
                value={waterResistance}
                onChange={(e) => setWaterResistance(e.target.value)}
                placeholder="e.g. 100m (330ft)"
              />
              <Input
                label="Global Warranty"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 2 Years Global"
              />
            </div>
          </div>

          {/* Section 4: Media & Image Gallery */}
          <div className="bg-luxury-cream-50 p-6 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <ImageIcon size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                4. Media Gallery
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Primary Showcase Image URL"
                value={primaryImage}
                onChange={(e) => setPrimaryImage(e.target.value)}
                error={formErrors.primaryImage}
                placeholder="https://images.unsplash.com/photo-..."
                required
              />

              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                  Additional Multi-Angle Thumbnails
                </label>
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={img}
                      onChange={(e) => handleGalleryImageChange(idx, e.target.value)}
                      placeholder={`Gallery angle #${idx + 1} URL`}
                      className="flex-grow px-3.5 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 focus:outline-none focus:border-luxury-gold-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="p-2 text-luxury-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove Angle"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddGalleryImage}
                  className="mt-2 text-xs font-bold text-luxury-gold-600 hover:text-luxury-gold-800 flex items-center space-x-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Another Angle URL</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT 1 COLUMN: Live Preview & Placement Settings */}
        <div className="space-y-6">
          
          {/* Catalog Placement Card */}
          <div className="bg-luxury-cream-50 p-6 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <Sparkles size={16} className="text-luxury-gold-600" />
              <h3 className="text-xs font-serif font-bold uppercase tracking-widest">
                Catalog Placement
              </h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-luxury-cream-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-luxury-charcoal-900 block">Featured Drop</span>
                  <span className="text-[10px] text-luxury-charcoal-400">Display on Home page bestsellers</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 focus:ring-luxury-gold-400 accent-luxury-charcoal-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-luxury-cream-200 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-luxury-charcoal-900 block">New Arrival</span>
                  <span className="text-[10px] text-luxury-charcoal-400">Showcase with New tag</span>
                </div>
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 focus:ring-luxury-gold-400 accent-luxury-charcoal-900 cursor-pointer"
                />
              </label>

              <div className="pt-2">
                <label className="block text-[11px] uppercase tracking-wider font-bold text-luxury-charcoal-700 mb-1">
                  Catalog Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
                >
                  <option value="active">Active (Visible in Store)</option>
                  <option value="draft">Draft / Archived (Hidden)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Live Storefront Preview Card */}
          <div className="bg-luxury-cream-50 p-6 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
              <Eye size={16} className="text-luxury-gold-600" />
              <h3 className="text-xs font-serif font-bold uppercase tracking-widest">
                Storefront Card Preview
              </h3>
            </div>

            {/* Mock Watch Card Preview */}
            <div className="bg-white rounded-xl border border-luxury-cream-300 overflow-hidden shadow-sm">
              <div className="h-48 bg-luxury-cream-200 relative overflow-hidden">
                {primaryImage ? (
                  <img src={primaryImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-luxury-charcoal-400 text-xs">
                    No Image Specified
                  </div>
                )}
                {isNewArrival && (
                  <span className="absolute top-2.5 left-2.5 bg-luxury-charcoal-900 text-luxury-gold-300 text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded shadow">
                    New Arrival
                  </span>
                )}
              </div>
              <div className="p-4 space-y-1.5 text-left">
                <span className="text-[9px] uppercase tracking-widest font-bold text-luxury-gold-600">
                  {brand}
                </span>
                <h4 className="text-xs font-bold text-luxury-charcoal-900 truncate">
                  {name || 'Untitled Timepiece'}
                </h4>
                <div className="flex items-baseline space-x-2 pt-1">
                  <span className="font-mono font-bold text-sm text-luxury-charcoal-900">
                    ₹{price ? Number(price).toLocaleString('en-IN') : '0'}
                  </span>
                  {discountPrice && (
                    <span className="text-[10px] text-luxury-charcoal-400 font-mono line-through">
                      ₹{Number(discountPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button 
              type="submit"
              variant="primary" 
              size="lg" 
              isLoading={isSubmitting}
              className="w-full justify-center text-xs uppercase tracking-widest font-bold py-3.5"
            >
              <Save size={14} className="mr-1.5" />
              Publish Timepiece
            </Button>
            <Link to="/admin/products" className="block">
              <Button variant="outline" size="md" className="w-full justify-center text-xs uppercase">
                Cancel
              </Button>
            </Link>
          </div>

        </div>

      </form>

    </div>
  );
}

export default AdminAddProduct;
