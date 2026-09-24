import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { useCart } from '../../context/CartContext';

/**
 * Wishlist Page Component
 * 
 * Renders user's bookmarked watches from CartContext.
 * Allows removing items or migrating them directly to the shopping cart.
 */
function Wishlist() {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();

  // Move To Cart Handler
  const handleMoveToCart = (item) => {
    addToCart(item, 1);
    removeFromWishlist(item.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-24 sm:pb-12 text-left space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="border-b border-luxury-cream-300 pb-4 sm:pb-6">
        <h2 className="text-2xl sm:text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
          My Wishlist
        </h2>
        <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
          Keep track of your favorite luxury timepieces.
        </p>
      </div>

      {/* Grid List or Empty State */}
      {wishlistItems.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Your wishlist is empty"
            message="Explore our watch collections and click the heart icon to save your favorites."
            icon={Heart}
            actionLabel="Continue Shopping"
            onActionClick={() => navigate('/shop')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {wishlistItems.map((watch) => (
            <div 
              key={watch.id}
              className="bg-luxury-cream-50 rounded-2xl border border-luxury-cream-200 overflow-hidden shadow-2xs flex flex-col justify-between group hover:shadow-md transition-shadow duration-300"
            >
              
              {/* Image Frame */}
              <div 
                className="h-44 sm:h-64 bg-luxury-cream-200 overflow-hidden relative cursor-pointer"
                onClick={() => navigate(`/product/${watch.id}`)}
              >
                <img 
                  src={watch.image} 
                  alt={watch.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(watch.id);
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-white/90 rounded-full text-luxury-charcoal-500 hover:text-red-600 transition-colors shadow cursor-pointer border border-luxury-cream-200"
                  title="Remove from Wishlist"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Watch Details */}
              <div className="p-3 sm:p-5 text-left flex-grow flex flex-col justify-between space-y-2.5 sm:space-y-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-luxury-gold-600 font-bold block truncate">
                    {watch.brand}
                  </span>
                  <h3 
                    onClick={() => navigate(`/product/${watch.id}`)}
                    className="text-xs sm:text-sm font-serif font-bold text-luxury-charcoal-900 hover:text-luxury-gold-600 transition-colors cursor-pointer truncate"
                    title={watch.name}
                  >
                    {watch.name}
                  </h3>
                  <span className="text-[11px] sm:text-xs font-bold font-mono text-luxury-charcoal-900 block mt-0.5 sm:mt-1">
                    ₹{(watch.discountPrice || watch.price).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 border-t border-luxury-cream-200">
                  <Button
                    onClick={() => handleMoveToCart(watch)}
                    variant="primary"
                    size="sm"
                    className="w-full flex items-center justify-center space-x-1 sm:space-x-1.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                  >
                    <ShoppingBag size={11} className="shrink-0" />
                    <span className="truncate">Move To Cart</span>
                  </Button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default Wishlist;
