import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * CartContext
 * 
 * Global State for Shopping Cart and Wishlist:
 * - Persistent across sessions via localStorage
 * - Reactive live item counters in Navbar badges
 * - Full quantity adjustments, totals, and express checkout bindings
 */
const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

const CART_STORAGE_KEY = 'wristora_cart_items';
const WISHLIST_STORAGE_KEY = 'wristora_wishlist_items';
const COUPON_STORAGE_KEY = 'wristora_applied_coupon';

export const AVAILABLE_COUPONS = [
  {
    code: 'WRISTORA10',
    title: '10% Luxury Welcome Privilege',
    discountPercent: 10,
    type: 'percentage',
    minSubtotal: 0,
    description: '10% concession across all haute horlogerie timepieces.'
  },
  {
    code: 'ROYALTY',
    title: '15% Royal Vault Privilege',
    discountPercent: 15,
    type: 'percentage',
    minSubtotal: 50000,
    description: '15% concession for acquisitions valued at ₹50,000 or greater.'
  },
  {
    code: 'NOBLESSE',
    title: '₹15,000 Horology Grant',
    flatDiscount: 15000,
    type: 'flat',
    minSubtotal: 100000,
    description: 'Direct ₹15,000 collector grant on premier orders over ₹1,00,000.'
  },
  {
    code: 'FIRSTTIME',
    title: '5% First-time Collector Welcome',
    discountPercent: 5,
    type: 'percentage',
    minSubtotal: 0,
    description: '5% welcome allocation for newly registered connoisseurs.'
  }
];

export function CartProvider({ children }) {
  // 1. Initialize Cart state from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 2. Initialize Wishlist state from localStorage
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 3. Initialize Applied Coupon from localStorage
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlistItems]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save applied coupon to localStorage', e);
    }
  }, [appliedCoupon]);

  // Add timepiece to Cart with stock-limit detection and feedback
  const addToCart = (product, quantity = 1) => {
    if (!product) return { success: false, reason: 'NO_PRODUCT' };
    const maxStock = Number(product.stock) ?? 99;

    if (maxStock <= 0) {
      return {
        success: false,
        reason: 'OUT_OF_STOCK',
        maxStock: 0,
        message: `"${product.name}" is currently out of stock.`
      };
    }

    let feedback = { success: true };

    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const currentQty = prev[existingIdx].quantity;
        if (currentQty >= maxStock) {
          feedback = {
            success: false,
            reason: 'MAX_LIMIT_REACHED',
            maxStock,
            currentQty,
            message: `Stock limit reached: You already have all ${maxStock} available unit${maxStock > 1 ? 's' : ''} of "${product.name}" in your cart.`
          };
          return prev;
        }

        const desiredQty = currentQty + quantity;
        if (desiredQty > maxStock) {
          const added = maxStock - currentQty;
          feedback = {
            success: true,
            reason: 'PARTIALLY_ADDED',
            maxStock,
            addedCount: added,
            currentQty: maxStock,
            message: `Stock limit: Only ${added} more unit${added > 1 ? 's' : ''} available. Added ${added} to reach the maximum vault allocation of ${maxStock} pieces.`
          };
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: maxStock
          };
          return updated;
        }

        feedback = {
          success: true,
          reason: 'ADDED',
          maxStock,
          addedCount: quantity,
          currentQty: desiredQty,
          message: `Added ${quantity}x "${product.name}" to your shopping cart!`
        };
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: desiredQty
        };
        return updated;
      } else {
        const finalQty = Math.min(quantity, maxStock);
        if (quantity > maxStock) {
          feedback = {
            success: true,
            reason: 'PARTIALLY_ADDED',
            maxStock,
            addedCount: finalQty,
            currentQty: finalQty,
            message: `Stock limit: Only ${maxStock} unit${maxStock > 1 ? 's' : ''} available. Added ${finalQty} units to your cart.`
          };
        } else {
          feedback = {
            success: true,
            reason: 'ADDED',
            maxStock,
            addedCount: finalQty,
            currentQty: finalQty,
            message: `Added ${finalQty}x "${product.name}" to your shopping cart!`
          };
        }
        return [...prev, { product, quantity: finalQty }];
      }
    });

    return feedback;
  };

  // Update item quantity with stock limit boundary feedback
  const updateCartQuantity = (productId, delta) => {
    let result = { success: true };
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const maxStock = Number(item.product.stock) ?? 99;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (delta > 0 && item.quantity >= maxStock) {
              result = {
                success: false,
                reason: 'MAX_LIMIT_REACHED',
                maxStock,
                name: item.product.name,
                message: `Stock limit reached: We only have ${maxStock} unit${maxStock > 1 ? 's' : ''} of "${item.product.name}" in vault allocation.`
              };
              return item;
            }
            const finalQty = Math.min(newQty, maxStock);
            return { ...item, quantity: finalQty };
          }
          return item;
        })
        .filter(Boolean)
    );
    return result;
  };

  // Remove from Cart
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {}
  };

  // Toggle in Wishlist
  const toggleWishlist = (product) => {
    if (!product) return;
    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        return prev.filter(item => item.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Remove from Wishlist
  const removeFromWishlist = (productId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  // Check if item is in Wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.id === productId);
  };

  // Counters & Calculations
  const cartCount = cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  const wishlistCount = wishlistItems.length;

  const cartSubtotal = cartItems.reduce((acc, item) => {
    const price = item.product.discountPrice || item.product.price || 0;
    return acc + price * (item.quantity || 1);
  }, 0);

  // Promo Privilege Voucher Mechanics
  const applyCoupon = (rawCode, currentSubtotal = cartSubtotal) => {
    if (!rawCode || !rawCode.trim()) {
      return { success: false, message: 'Please enter a valid privilege voucher code.' };
    }
    const cleanCode = rawCode.trim().toUpperCase();
    const foundCoupon = AVAILABLE_COUPONS.find(c => c.code === cleanCode);
    if (!foundCoupon) {
      return { 
        success: false, 
        message: `Privilege code "${cleanCode}" was not found or is no longer eligible.` 
      };
    }
    if (currentSubtotal < foundCoupon.minSubtotal) {
      return {
        success: false,
        message: `Privilege "${foundCoupon.code}" requires a minimum acquisition subtotal of ₹${foundCoupon.minSubtotal.toLocaleString('en-IN')}.`
      };
    }
    setAppliedCoupon(foundCoupon);
    return {
      success: true,
      coupon: foundCoupon,
      message: `Privilege "${foundCoupon.code}" successfully applied.`
    };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const getCouponDiscount = (subtotal = cartSubtotal) => {
    if (!appliedCoupon) return 0;
    if (subtotal < (appliedCoupon.minSubtotal || 0)) return 0;
    if (appliedCoupon.type === 'percentage') {
      return Math.round((subtotal * appliedCoupon.discountPercent) / 100);
    }
    if (appliedCoupon.type === 'flat') {
      return Math.min(appliedCoupon.flatDiscount, subtotal);
    }
    return 0;
  };

  const value = {
    cartItems,
    wishlistItems,
    cartCount,
    wishlistCount,
    cartSubtotal,
    appliedCoupon,
    availableCoupons: AVAILABLE_COUPONS,
    applyCoupon,
    removeCoupon,
    getCouponDiscount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    removeFromWishlist,
    isInWishlist
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartContext;
