import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, AlertTriangle, CheckCircle2, Tag, Sparkles, X } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { useCart } from '../../context/CartContext';

/**
 * Cart Page Component
 * 
 * Manages shopping cart line items, displays pricing breakdowns 
 * (subtotal, shipping, 18% GST), luxury promo voucher deductions, and triggers checkouts with reactive CartContext.
 */
function Cart() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    updateCartQuantity, 
    removeFromCart, 
    cartSubtotal,
    appliedCoupon,
    availableCoupons,
    applyCoupon,
    removeCoupon,
    getCouponDiscount
  } = useCart();
  
  const [toastMessage, setToastMessage] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);

  const subtotal = cartSubtotal;
  const discountAmount = getCouponDiscount(subtotal);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingFee = 0; // Complimentary Armored Shipping
  const taxRate = 0.18; // 18% GST
  const taxAmount = Math.round(discountedSubtotal * taxRate);
  const grandTotal = discountedSubtotal + shippingFee + taxAmount;
  const hasOutOfStockItems = cartItems.some(i => (Number(i.product?.stock) ?? 99) <= 0);

  const handleApplyPromo = (codeToApply) => {
    const code = codeToApply || couponCodeInput;
    const res = applyCoupon(code, subtotal);
    setCouponFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message
    });
    if (res.success) {
      setCouponCodeInput('');
    }
    setTimeout(() => {
      setCouponFeedback(null);
    }, 4000);
  };

  const handleIncrement = (product, currentQty) => {
    const maxStock = Number(product.stock) ?? 99;
    if (currentQty >= maxStock) {
      setToastMessage(`Stock limit reached: Only ${maxStock} unit${maxStock > 1 ? 's' : ''} available for "${product.name}".`);
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }
    const res = updateCartQuantity(product.id, 1);
    if (res && !res.success) {
      setToastMessage(res.message);
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left space-y-8">
      
      {/* Header */}
      <div className="border-b border-luxury-cream-300 pb-6">
        <h2 className="text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
          My Cart
        </h2>
        <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
          Review and adjust your selected masterpieces.
        </p>
      </div>

      {/* Toast Warning Banner */}
      {toastMessage && (
        <div className="p-3.5 bg-amber-950 text-amber-200 rounded-xl border border-amber-800 shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-amber-400 hover:text-white text-xs cursor-pointer ml-3 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Cart Grid or Empty Fallback */}
      {cartItems.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title="Your cart is empty"
            message="Looks like you haven't added any luxury watches to your cart yet."
            icon={ShoppingBag}
            actionLabel="Start Shopping"
            onActionClick={() => navigate('/shop')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Side: Items list */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map(({ product, quantity }) => {
              const currentPrice = product.discountPrice || product.price || 0;
              const maxStock = Number(product.stock) ?? 99;
              const isItemOutOfStock = maxStock <= 0;
              const isAtMaxStock = quantity >= maxStock;

              return (
                <div 
                  key={product.id}
                  className={`flex items-center bg-luxury-cream-50 p-3.5 sm:p-6 rounded-2xl border shadow-2xs gap-3 sm:gap-6 ${
                    isItemOutOfStock ? 'border-rose-300 bg-rose-50/40' : 'border-luxury-cream-200'
                  }`}
                >
                  
                  {/* Photo Thumbnail */}
                  <div 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="w-16 h-16 sm:w-24 sm:h-24 bg-luxury-cream-200 rounded-xl border border-luxury-cream-300 overflow-hidden shrink-0 cursor-pointer relative"
                  >
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    {isItemOutOfStock && (
                      <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-bold text-white uppercase text-center px-1">
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Watch Info */}
                  <div className="flex-grow min-w-0 text-left space-y-0.5 sm:space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-luxury-gold-600 font-bold block">
                      {product.brand}
                    </span>
                    <h3 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="text-xs sm:text-sm font-serif font-bold text-luxury-charcoal-900 truncate cursor-pointer hover:text-luxury-gold-600 transition-colors"
                    >
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-luxury-charcoal-500 font-mono font-bold">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </p>

                    {/* Stock status tag */}
                    {isItemOutOfStock ? (
                      <span className="text-[9px] font-bold text-rose-700 uppercase bg-rose-100 px-2 py-0.5 rounded tracking-wider border border-rose-200 inline-block mt-0.5">
                        🚨 Out of Stock (0 in vault)
                      </span>
                    ) : isAtMaxStock ? (
                      <span className="text-[9px] font-bold text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded tracking-wider border border-amber-200 inline-block mt-0.5">
                        ⚡ Max vault allocation ({maxStock})
                      </span>
                    ) : null}
                  </div>

                  {/* Quantity adjustment */}
                  <div className="flex items-center border border-luxury-cream-300 rounded-xl bg-white shrink-0 shadow-2xs">
                    <button 
                      onClick={() => updateCartQuantity(product.id, -1)}
                      className="px-2.5 py-1.5 text-xs hover:bg-luxury-cream-200 text-luxury-charcoal-600 cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-semibold font-mono text-luxury-charcoal-900">{quantity}</span>
                    <button 
                      onClick={() => handleIncrement(product, quantity)}
                      disabled={isItemOutOfStock}
                      className={`px-2.5 py-1.5 text-xs hover:bg-luxury-cream-200 cursor-pointer font-bold transition-colors ${
                        isAtMaxStock ? 'text-amber-600 hover:bg-amber-100/50' : 'text-luxury-charcoal-600'
                      }`}
                      title={isAtMaxStock ? `Max limit (${maxStock})` : 'Add more'}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="flex flex-col items-end space-y-1.5 shrink-0 min-w-[70px] sm:min-w-[100px]">
                    <span className="text-xs sm:text-sm font-bold text-luxury-charcoal-900 font-mono">
                      ₹{(currentPrice * quantity).toLocaleString('en-IN')}
                    </span>
                    <button 
                      onClick={() => removeFromCart(product.id)}
                      className="text-luxury-charcoal-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      title="Remove watch"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Right Side: Order Receipt Summary */}
          <div>
            <div className="bg-luxury-cream-50 p-6 rounded-2xl border border-luxury-cream-200 shadow-sm space-y-6">
              
              <h3 className="text-sm font-serif font-bold uppercase tracking-widest text-luxury-charcoal-900 pb-3 border-b border-luxury-cream-200">
                Order Summary
              </h3>

              <div className="space-y-3.5 text-xs font-semibold text-luxury-charcoal-500 font-sans">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-luxury-charcoal-900 font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Promo Code Deduction Row */}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-luxury-gold-400 bg-luxury-gold-300/10 px-2.5 py-1.5 rounded-lg border border-luxury-gold-300/20 items-center">
                    <div className="flex items-center space-x-1.5">
                      <Tag size={12} className="text-luxury-gold-400" />
                      <span className="font-bold text-[11px] tracking-wide">Privilege ({appliedCoupon?.code})</span>
                    </div>
                    <span className="font-mono font-bold text-xs">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Armored Transit</span>
                  <span className="text-green-600 uppercase font-bold text-[10px] tracking-wider">Free (Complimentary)</span>
                </div>
                <div className="flex justify-between">
                  <span>Integrated GST (18%)</span>
                  <span className="text-luxury-charcoal-900 font-mono font-bold">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-4 border-t border-luxury-cream-200 flex justify-between text-sm text-luxury-charcoal-900 font-bold">
                  <span>Grand Total</span>
                  <span className="font-mono font-bold text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Promo Privilege Voucher Entry */}
              <div className="pt-2 border-t border-luxury-cream-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-luxury-charcoal-700 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-luxury-gold-400" />
                    Collector Privilege Code
                  </span>
                  {appliedCoupon && (
                    <button
                      onClick={removeCoupon}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer flex items-center gap-0.5"
                    >
                      <X size={11} /> Remove
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="p-3 bg-luxury-charcoal-900 text-white rounded-xl border border-luxury-gold-300/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-luxury-gold-300 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] bg-luxury-gold-300/20 text-luxury-gold-200 px-2 py-0.5 rounded-full font-bold uppercase">
                          Applied
                        </span>
                      </div>
                      <p className="text-[11px] text-luxury-cream-300 mt-0.5">
                        {appliedCoupon.title}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. WRISTORA10"
                        className="flex-grow bg-white border border-luxury-cream-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-luxury-charcoal-900 placeholder:text-luxury-charcoal-300 focus:outline-none focus:border-luxury-charcoal-900 uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPromo()}
                        className="bg-luxury-charcoal-900 text-white rounded-xl px-3.5 text-[10px] font-bold uppercase tracking-wider hover:bg-luxury-gold-400 hover:text-luxury-charcoal-950 transition-colors cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Feedback Toast message */}
                    {couponFeedback && (
                      <p className={`text-[11px] font-semibold ${
                        couponFeedback.type === 'success' ? 'text-green-600' : 'text-rose-600'
                      }`}>
                        {couponFeedback.text}
                      </p>
                    )}

                    {/* Quick Select Badges */}
                    <div className="pt-1">
                      <p className="text-[10px] text-luxury-charcoal-400 uppercase tracking-wider mb-1.5 font-semibold">
                        Available Privileges:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons.map((coupon) => (
                          <button
                            key={coupon.code}
                            type="button"
                            onClick={() => handleApplyPromo(coupon.code)}
                            className="text-[10px] font-mono font-bold bg-white border border-luxury-cream-300 hover:border-luxury-gold-400 hover:text-luxury-gold-500 text-luxury-charcoal-700 px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          >
                            {coupon.code}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {hasOutOfStockItems && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start space-x-2 animate-fadeIn">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>One or more timepieces in your cart are currently out of stock. Please remove them to proceed.</span>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={() => navigate('/checkout')}
                  variant="primary"
                  size="lg"
                  disabled={hasOutOfStockItems}
                  className="w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{hasOutOfStockItems ? 'Resolve Out-of-Stock Items' : 'Proceed to Checkout'}</span>
                  <ArrowRight size={14} />
                </Button>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default Cart;
