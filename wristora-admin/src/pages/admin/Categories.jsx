import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tags, 
  Layers, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ExternalLink, 
  Crown, 
  Search, 
  Package 
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { 
  getCategories, 
  addCategory, 
  updateCategory,
  deleteCategory, 
  getProducts,
  getBrands,
  addBrand,
  deleteBrand 
} from '../../firebase/dbService';

/**
 * AdminCategories Component (Mockup 16)
 * 
 * Central Taxonomy & Brand Hub connected to Firestore:
 * - Manage category collections, banner photography, and narrative descriptions.
 * - Dynamic product assignment counts computed from live catalog.
 * - Brand directory manager with active model tallies and persistent database storage.
 * - Add/Edit category modal with real-time banner preview.
 */
function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [brandToDelete, setBrandToDelete] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Quick Brand Add State
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('');
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);

  // Fetch taxonomy and brand registry from Firestore & Local Persistence
  useEffect(() => {
    const fetchTaxonomy = async () => {
      try {
        const [cats, prods, brandList] = await Promise.all([
          getCategories(), 
          getProducts(),
          getBrands()
        ]);
        setCategories(cats || []);
        setProducts(prods || []);
        setBrands(brandList || []);
      } catch (err) {
        console.error('Error loading admin categories/brands:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTaxonomy();
  }, []);

  // Compute live timepiece count per category
  const getItemCount = (categoryName) => {
    return products.filter(p => p.category?.toLowerCase() === categoryName?.toLowerCase()).length;
  };

  // Open modal for new category
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setImage('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing existing category
  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setImage(category.image);
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Category (Create / Update) in Firestore
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category title is required.');
      return;
    }
    if (!image.trim()) {
      setFormError('Banner image URL is required.');
      return;
    }

    if (editingCategory) {
      const updatedData = {
        name: name.trim(),
        description: description.trim() || 'Curated luxury horological collection',
        image: image.trim()
      };
      setCategories(prev => prev.map(c => {
        if (c.id === editingCategory.id) {
          return { ...c, ...updatedData };
        }
        return c;
      }));
      try {
        await updateCategory(editingCategory.id, updatedData);
        setToastMessage(`Category "${name}" updated and saved permanently.`);
      } catch (err) {
        console.error('Failed updating category in database:', err);
      }
    } else {
      const newCat = {
        name: name.trim(),
        description: description.trim() || 'Curated luxury horological collection',
        image: image.trim()
      };
      const created = await addCategory(newCat);
      setCategories(prev => [...prev, created]);
      setToastMessage(`New category "${name}" established in cloud database.`);
    }

    setIsModalOpen(false);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Delete Category in Firestore
  const confirmDeleteCategory = async () => {
    if (categoryToDelete) {
      const deletedId = categoryToDelete.id;
      const deletedName = categoryToDelete.name;
      setCategories(prev => prev.filter(c => c.id !== deletedId));
      setCategoryToDelete(null);

      try {
        await deleteCategory(deletedId);
        setToastMessage(`Category "${deletedName}" removed from Firestore.`);
        setTimeout(() => setToastMessage(''), 4000);
      } catch (err) {
        console.error('Failed deleting category:', err);
      }
    }
  };

  // Add Brand to Database (Firestore & LocalStorage)
  const handleAddBrand = async (e) => {
    e.preventDefault();
    const trimmedName = newBrandName.trim();
    if (!trimmedName) return;

    if (brands.some(b => b.name?.toLowerCase() === trimmedName.toLowerCase())) {
      alert('This brand already exists in your registry.');
      return;
    }

    const brandPayload = {
      name: trimmedName,
      country: newBrandCountry.trim() || 'Global',
      founded: 'Est. Modern'
    };

    setIsSubmittingBrand(true);
    try {
      const savedBrand = await addBrand(brandPayload);
      setBrands(prev => [...prev.filter(b => b.name?.toLowerCase() !== trimmedName.toLowerCase()), savedBrand]);
      setToastMessage(`Brand "${trimmedName}" registered and saved permanently.`);
      setNewBrandName('');
      setNewBrandCountry('');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Failed saving brand:', err);
      setToastMessage(`Error saving brand: ${err.message}`);
    } finally {
      setIsSubmittingBrand(false);
    }
  };

  // Delete Brand from Database
  const confirmDeleteBrand = async () => {
    if (brandToDelete) {
      const brandIdOrName = brandToDelete.id || brandToDelete.name;
      const brandName = brandToDelete.name;
      setBrands(prev => prev.filter(b => (b.id ? b.id !== brandIdOrName : b.name !== brandName)));
      setBrandToDelete(null);

      try {
        await deleteBrand(brandIdOrName);
        setToastMessage(`Brand "${brandName}" removed from registry.`);
        setTimeout(() => setToastMessage(''), 4000);
      } catch (err) {
        console.error('Failed deleting brand:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Syncing Categories & Brands from Cloud..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 max-w-7xl mx-auto text-left font-sans">
      
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
              Taxonomy & Collection Hierarchy
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-luxury-charcoal-900 text-luxury-gold-300">
              {categories.length} Collections
            </span>
          </div>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
            Organize watch classification tiers, showcase photography banners, and watchmaker registries.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Button 
            onClick={handleOpenAddModal}
            variant="primary" 
            size="md" 
            className="w-full sm:w-auto text-xs uppercase tracking-wider font-bold justify-center"
          >
            <Plus size={15} className="mr-1.5" />
            Create Category
          </Button>
        </div>
      </div>

      {/* Categories Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => {
          const count = getItemCount(cat.name);
          return (
            <div 
              key={cat.id}
              className="group bg-white rounded-2xl border border-luxury-cream-300 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between text-left"
            >
              {/* Category Banner Image with overlay */}
              <div className="relative h-48 bg-luxury-cream-200 overflow-hidden">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end text-white">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-luxury-gold-300">
                      Collection
                    </span>
                    <h3 className="text-lg font-serif font-bold tracking-wide leading-tight">
                      {cat.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold">
                    {count} Models
                  </span>
                </div>
              </div>

              {/* Category Body & Actions */}
              <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <p className="text-xs text-luxury-charcoal-600 font-sans leading-relaxed line-clamp-2">
                  {cat.description || 'Curated luxury horological collection featuring mechanical movements.'}
                </p>

                <div className="pt-3 border-t border-luxury-cream-200 flex justify-between items-center">
                  <a 
                    href={`/shop?category=${cat.name}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] font-bold text-luxury-gold-600 hover:text-luxury-gold-800 flex items-center space-x-1"
                  >
                    <span>View in Store</span>
                    <ExternalLink size={11} />
                  </a>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 hover:bg-luxury-cream-200 text-luxury-charcoal-700 hover:text-luxury-charcoal-900 rounded-lg transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => setCategoryToDelete(cat)}
                      className="p-1.5 hover:bg-red-50 text-luxury-charcoal-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Brand Registry Manager */}
      <div className="bg-luxury-cream-50 p-4 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-luxury-cream-300">
          <div>
            <div className="flex items-center space-x-2 text-luxury-charcoal-900">
              <Crown size={18} className="text-luxury-gold-600" />
              <h2 className="text-base font-serif font-bold uppercase tracking-wider">
                Watchmaker Brand Registry
              </h2>
            </div>
            <p className="text-xs text-luxury-charcoal-500 mt-0.5">
              Verified haute horlogerie houses registered in Wristora central catalog.
            </p>
          </div>

          <form onSubmit={handleAddBrand} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="e.g. Richard Mille"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="px-3.5 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500"
            />
            <input
              type="text"
              list="country-places-list"
              placeholder="Country, City, Place"
              value={newBrandCountry}
              onChange={(e) => setNewBrandCountry(e.target.value)}
              className="px-3.5 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 focus:outline-none focus:border-luxury-gold-500"
            />
            <datalist id="country-places-list">
              <option value="Switzerland" />
              <option value="Geneva, Switzerland" />
              <option value="Le Locle, Switzerland" />
              <option value="La Chaux-de-Fonds, Switzerland" />
              <option value="Japan" />
              <option value="Tokyo, Japan" />
              <option value="Germany" />
              <option value="Glashütte, Germany" />
              <option value="France" />
              <option value="Paris, France" />
              <option value="United Kingdom" />
              <option value="London, UK" />
              <option value="Italy" />
              <option value="Milan, Italy" />
              <option value="United States" />
              <option value="India" />
            </datalist>
            <Button 
              type="submit" 
              variant="primary" 
              size="sm" 
              isLoading={isSubmittingBrand}
              className="text-xs uppercase font-bold tracking-wider shrink-0 w-full sm:w-auto justify-center"
            >
              <Plus size={14} className="mr-1" />
              Add Brand
            </Button>
          </form>
        </div>

        {/* Brands Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {brands.map((b) => {
            const count = products.filter(p => p.brand?.toLowerCase() === b.name?.toLowerCase()).length;
            return (
              <div 
                key={b.id || b.name} 
                className="group relative p-3.5 bg-white rounded-xl border border-luxury-cream-300 shadow-2xs space-y-1 text-center hover:border-luxury-gold-400 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setBrandToDelete(b)}
                  className="absolute top-1.5 right-1.5 text-luxury-charcoal-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer rounded-lg hover:bg-red-50"
                  title={`Remove ${b.name} from registry`}
                >
                  <Trash2 size={12} />
                </button>
                <h4 className="font-serif font-bold text-xs text-luxury-charcoal-900">{b.name}</h4>
                <p className="text-[10px] text-luxury-charcoal-400 font-sans">{b.country || 'Global'}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-luxury-cream-100 text-luxury-charcoal-700">
                  {count} {count === 1 ? 'Model' : 'Models'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Collection Category'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 text-left font-sans text-xs">
          
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label="Category Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Vintage Heritage"
            required
          />

          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
              Curatorial Narrative
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the aesthetic and mechanical design focus of this collection..."
              className="w-full p-3 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 focus:outline-none focus:border-luxury-gold-500 font-sans"
            />
          </div>

          <Input
            label="Showcase Banner Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            required
          />

          {/* Banner Live Preview */}
          {image && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-luxury-charcoal-500 block">
                Banner Live Preview
              </span>
              <div className="relative h-36 rounded-xl overflow-hidden border border-luxury-cream-300">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4 text-white">
                  <h4 className="font-serif font-bold text-base">{name || 'Collection Title'}</h4>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-3 border-t border-luxury-cream-300">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 justify-center text-xs uppercase"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 justify-center text-xs uppercase font-bold"
            >
              {editingCategory ? 'Update Category' : 'Publish Category'}
            </Button>
          </div>

        </form>
      </Modal>

      {/* Delete Category Modal */}
      {categoryToDelete && (
        <Modal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          size="md"
          title="Confirm Category Deletion"
        >
          <div className="space-y-4 text-left text-xs font-sans">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-900">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-xs">Delete Taxonomy Collection</p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  Are you sure you want to delete <strong className="font-bold">"{categoryToDelete.name}"</strong>? This will remove this category from both the Admin and User storefronts.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDeleteCategory}
                className="flex-1 justify-center text-xs uppercase bg-red-700 hover:bg-red-800 text-white font-bold"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Brand Modal */}
      {brandToDelete && (
        <Modal
          isOpen={!!brandToDelete}
          onClose={() => setBrandToDelete(null)}
          size="md"
          title="Confirm Brand Removal"
        >
          <div className="space-y-4 text-left text-xs font-sans">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-900">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold text-xs">Remove Watchmaker Brand</p>
                <p className="text-[11px] text-red-700 mt-0.5">
                  Are you sure you want to remove <strong className="font-bold">"{brandToDelete.name}"</strong> from the central watchmaker brand registry?
                </p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setBrandToDelete(null)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDeleteBrand}
                className="flex-1 justify-center text-xs uppercase bg-red-700 hover:bg-red-800 text-white font-bold"
              >
                Confirm Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default AdminCategories;
