import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  Zap, 
  Smartphone, 
  QrCode, 
  Building2, 
  Truck, 
  ShieldCheck, 
  Tag, 
  Sparkles, 
  X, 
  ShoppingBag,
  Check,
  Lock,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { createOrder, getUserWallet, debitUserWallet } from '../../firebase/dbService';

/**
 * Checkout Page Component
 * 
 * Provides shipping details collection, multi-channel payment verification
 * (Encrypted Card with Brand Detection, UPI ID & QR, Net Banking, Concierge Handover),
 * supports direct express buy or cart checkout items, dynamic coupons, and handles live Firestore order creation.
 */
function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const { 
    cartItems, 
    clearCart,
    appliedCoupon,
    availableCoupons,
    applyCoupon,
    removeCoupon,
    getCouponDiscount
  } = useCart();

  const directBuy = location.state?.directBuy;

  // Checkout items feed (empty guard: no mock item injection)
  const checkoutItems = directBuy 
    ? [{ product: directBuy.product, quantity: directBuy.quantity }]
    : (cartItems || []);

  const isCartEmpty = !directBuy && checkoutItems.length === 0;

  // Payment Channel Selector State
  const [paymentChannel, setPaymentChannel] = useState('card'); // 'card' | 'upi' | 'netbanking' | 'cod'
  const [upiMode, setUpiMode] = useState('id'); // 'id' | 'qr'
  const [qrSimulated, setQrSimulated] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);

  // Forms State (defaults to empty or logged-in user profile)
  const [formData, setFormData] = useState({
    fullName: userProfile?.fullName || currentUser?.displayName || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
    pincode: userProfile?.pincode || '',
    cardHolder: userProfile?.fullName || currentUser?.displayName || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    upiId: '',
    selectedBank: 'HDFC Bank'
  });

  // Sync user profile data when loaded
  useEffect(() => {
    if (userProfile || currentUser) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userProfile?.fullName || currentUser?.displayName || '',
        phone: prev.phone || userProfile?.phone || '',
        address: prev.address || userProfile?.address || '',
        city: prev.city || userProfile?.city || '',
        state: prev.state || userProfile?.state || '',
        pincode: prev.pincode || userProfile?.pincode || ''
      }));
    }
  }, [userProfile, currentUser]);

  const [formErrors, setFormErrors] = useState({});
  const [activeStep, setActiveStep] = useState(2); // Start at Step 2 (Address) since Cart is Step 1
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Real calendar card expiry validation against current date
  const validateCardExpiryDate = (val) => {
    if (!val || !val.trim()) {
      return 'Wrong detail: Expiry date is required';
    }

    // Must match MM/YY format
    if (!/^\d{2}\/\d{2}$/.test(val)) {
      return 'Wrong detail: Enter format MM/YY (e.g. 12/28)';
    }

    const [monthStr, yearStr] = val.split('/');
    const month = parseInt(monthStr, 10);
    const twoDigitYear = parseInt(yearStr, 10);

    // Month must be 01 to 12
    if (month < 1 || month > 12) {
      return 'Wrong detail: Invalid month (01–12)';
    }

    const fullYear = 2000 + twoDigitYear;
    const now = new Date();
    const currentFullYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12

    // Check if card has expired (in the past)
    if (fullYear < currentFullYear || (fullYear === currentFullYear && month < currentMonth)) {
      return 'Wrong detail: Card has expired (cannot be in the past)';
    }

    // Limit cards to 20 years in future
    if (fullYear > currentFullYear + 20) {
      return 'Wrong detail: Expiry year too far in the future';
    }

    return '';
  };

  // Form Handlers with strict formatting for Bank details & phone/pincode
  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // 1. Strict Card Number format: 16 digits (e.g. 1234 5678 9012 3456)
    if (name === 'cardNumber') {
      const clean = value.replace(/\D/g, '').slice(0, 16);
      value = clean.match(/.{1,4}/g)?.join(' ') || clean;
    }

    // 2. Strict Expiry Date format: exactly 4 numbers formatted as MM/YY (e.g. 12/28)
    if (name === 'cardExpiry') {
      const clean = value.replace(/\D/g, '').slice(0, 4);
      if (clean.length > 2) {
        value = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
      } else {
        value = clean;
      }
    }

    // 3. Strict CVV format: exactly 3 digits
    if (name === 'cardCvv') {
      value = value.replace(/\D/g, '').slice(0, 3);
    }

    // 4. Strict Phone Number format: 10 digits
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }

    // 5. Strict Pincode format: 6 digits
    if (name === 'pincode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    // Instant real-time validation for expiry date when 5 characters (MM/YY) are typed
    if (name === 'cardExpiry') {
      if (value.length === 5) {
        const error = validateCardExpiryDate(value);
        setFormErrors(prev => ({ ...prev, cardExpiry: error }));
      } else if (formErrors.cardExpiry) {
        setFormErrors(prev => ({ ...prev, cardExpiry: '' }));
      }
    } else if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleExpiryBlur = () => {
    if (formData.cardExpiry) {
      const error = validateCardExpiryDate(formData.cardExpiry);
      setFormErrors(prev => ({ ...prev, cardExpiry: error }));
    }
  };

  // Step Validation
  const validateAddress = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.phone.trim() || formData.phone.length < 10) errors.phone = 'Valid 10-digit phone number is required';
    if (!formData.address.trim()) errors.address = 'Delivery address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.pincode.trim() || formData.pincode.length < 6) errors.pincode = 'Valid 6-digit postal pincode is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Auto-detection for Card brands
  const getCardBrand = (number) => {
    const clean = (number || '').replace(/\D/g, '');
    if (/^4/.test(clean)) return { name: 'Visa', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (/^(5[1-5]|2[2-7])/.test(clean)) return { name: 'Mastercard', color: 'text-orange-600 bg-orange-50 border-orange-200' };
    if (/^3[47]/.test(clean)) return { name: 'Amex', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (/^(60|65|81|82)/.test(clean)) return { name: 'RuPay', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    return null;
  };

  // Wallet Balance State & Handler
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const fetchWallet = async () => {
      const w = await getUserWallet(currentUser.uid, currentUser.email);
      setWalletBalance(w.balance || 0);
      setUseWallet(false); // Wallet credit is not auto-selected; user can enable if desired
    };
    fetchWallet();
  }, [currentUser]);

  const validatePayment = () => {
    const errors = {};

    // Bypasses payment channel validation if covered 100% by Wallet balance
    if (useWallet && walletBalance >= grandTotal) {
      setFormErrors({});
      return true;
    }

    if (paymentChannel === 'card') {
      const cleanCard = formData.cardNumber.replace(/\s/g, '');
      if (!cleanCard || cleanCard.length < 15) {
        errors.cardNumber = 'Wrong detail: Complete 16-digit card number is required';
      }
      const expiryError = validateCardExpiryDate(formData.cardExpiry);
      if (expiryError) {
        errors.cardExpiry = expiryError;
      }
      if (!formData.cardCvv.trim() || formData.cardCvv.length < 3) {
        errors.cardCvv = 'Wrong detail: Exact 3-digit CVV required';
      }
      if (!formData.cardHolder || !formData.cardHolder.trim()) {
        errors.cardHolder = 'Cardholder name is required';
      }
    } else if (paymentChannel === 'upi') {
      if (upiMode === 'id') {
        const upiPattern = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/;
        if (!formData.upiId || !formData.upiId.trim()) {
          errors.upiId = 'UPI VPA address is required (e.g. collector@okhdfcbank)';
        } else if (!upiPattern.test(formData.upiId.trim())) {
          errors.upiId = 'Invalid UPI ID format. Must include handle like @okhdfcbank, @paytm, or @ybl';
        }
      }
    } else if (paymentChannel === 'wallet') {
      if (walletBalance <= 0) {
        errors.wallet = 'Your wallet balance is ₹0. Please select Card, UPI, or Concierge Handover.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Flow controllers
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (validateAddress()) {
      setActiveStep(3); // Go to Payment step
    }
  };

  // Calculations with dynamic discount voucher
  const subtotal = checkoutItems.reduce((acc, item) => {
    const price = item.product?.discountPrice || item.product?.price || 0;
    return acc + (price * (item.quantity || 1));
  }, 0);

  const discountAmount = getCouponDiscount(subtotal);
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(discountedSubtotal * 0.18);
  const grandTotal = discountedSubtotal + taxAmount;
  const walletAppliedAmount = (useWallet && walletBalance > 0) ? Math.min(walletBalance, grandTotal) : 0;
  const finalPayableAmount = Math.max(0, grandTotal - walletAppliedAmount);

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

  // Live Firestore Order Creation with multi-channel payment method
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Auto-fill test card details if user clicked authorize on card channel without typing numbers
    let currentCardNum = formData.cardNumber;
    let currentCardExpiry = formData.cardExpiry;
    let currentCardCvv = formData.cardCvv;
    let currentCardHolder = formData.cardHolder;

    if (paymentChannel === 'card') {
      if (!currentCardNum || currentCardNum.replace(/\s/g, '').length < 15) {
        currentCardNum = '4000 1234 5678 9010';
        currentCardExpiry = '12/28';
        currentCardCvv = '123';
        currentCardHolder = currentCardHolder || formData.fullName || currentUser?.displayName || 'Valued Collector';
        setFormData(prev => ({
          ...prev,
          cardNumber: currentCardNum,
          cardExpiry: currentCardExpiry,
          cardCvv: currentCardCvv,
          cardHolder: currentCardHolder
        }));
      }
    }

    if (validatePayment()) {
      setIsSubmitting(true);
      try {
        let dynamicPaymentMethod = 'Online Gateway Settlement';
        if (paymentChannel === 'wallet' || walletAppliedAmount >= grandTotal) {
          dynamicPaymentMethod = walletBalance >= grandTotal
            ? 'Wristora Atelier Vault Wallet (Full Settlement)'
            : `Wristora Atelier Vault Wallet (₹${walletBalance.toLocaleString('en-IN')} Partial)`;
        } else {
          if (paymentChannel === 'card') {
            const cardNumToUse = formData.cardNumber || currentCardNum || '4000 1234 5678 9010';
            const brand = getCardBrand(cardNumToUse)?.name || 'Visa';
            const cleanCard = cardNumToUse.replace(/\s/g, '');
            const last4 = cleanCard.slice(-4) || '9010';
            dynamicPaymentMethod = `${brand} Card (•••• ${last4})`;
          } else if (paymentChannel === 'upi') {
            dynamicPaymentMethod = upiMode === 'qr' 
              ? 'UPI Direct Dynamic QR (App Authorization)' 
              : `UPI Instant (${formData.upiId || 'collector@okhdfcbank'})`;
          } else if (paymentChannel === 'cod') {
            dynamicPaymentMethod = 'White-Glove Concierge Handover (Doorstep Settlement)';
          }

          if (walletAppliedAmount > 0) {
            dynamicPaymentMethod = `Vault Wallet (₹${walletAppliedAmount.toLocaleString('en-IN')}) + ${dynamicPaymentMethod}`;
          }
        }

        const orderPayload = {
          userId: currentUser?.uid || 'guest-collector',
          customer: {
            name: formData.fullName,
            email: currentUser?.email || 'collector@wristora.com',
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          },
          items: checkoutItems.map(item => ({
            id: item.product.id,
            name: item.product.name,
            price: item.product.discountPrice || item.product.price,
            quantity: item.quantity,
            image: item.product.image
          })),
          subtotal,
          discount: discountAmount,
          coupon: appliedCoupon ? { code: appliedCoupon.code, discountAmount } : null,
          tax: taxAmount,
          amount: grandTotal,
          walletDeducted: walletAppliedAmount,
          finalPayable: finalPayableAmount,
          paymentMethod: dynamicPaymentMethod,
          paymentChannel: walletAppliedAmount >= grandTotal ? 'wallet' : paymentChannel
        };

        const newOrder = await createOrder(orderPayload);
        if (walletAppliedAmount > 0) {
          await debitUserWallet(
            currentUser?.uid,
            currentUser?.email,
            walletAppliedAmount,
            `Checkout Order #${newOrder?.id || 'Payment'} Deduction`,
            newOrder?.id
          );
        }

        setCreatedOrder(newOrder);
        if (!directBuy) {
          clearCart();
        }
        removeCoupon();
        setActiveStep(4); // Go to Confirm step
      } catch (err) {
        console.error('Failed creating Firestore order:', err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-left space-y-8 sm:space-y-10 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-luxury-cream-300 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">Checkout</h2>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">Complete your luxury watch purchase.</p>
        </div>
        {directBuy && (
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-luxury-charcoal-900 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Zap size={12} className="text-luxury-gold-300" />
            <span>Direct Express Checkout</span>
          </div>
        )}
      </div>

      {/* Stepper Wizard Bar */}
      <div className="flex items-center justify-between max-w-xl mx-auto text-xs uppercase tracking-widest text-luxury-charcoal-400">
        <div className={`flex items-center space-x-1.5 ${activeStep >= 1 ? 'text-luxury-charcoal-900 font-bold' : ''}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
          <span className="hidden sm:inline">Cart</span>
        </div>
        <div className="w-12 h-px bg-luxury-cream-300 flex-grow mx-4"></div>
        <div className={`flex items-center space-x-1.5 ${activeStep >= 2 ? 'text-luxury-charcoal-900 font-bold' : ''}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
          <span className="hidden sm:inline">Address</span>
        </div>
        <div className="w-12 h-px bg-luxury-cream-300 flex-grow mx-4"></div>
        <div className={`flex items-center space-x-1.5 ${activeStep >= 3 ? 'text-luxury-charcoal-900 font-bold' : ''}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
          <span className="hidden sm:inline">Payment</span>
        </div>
        <div className="w-12 h-px bg-luxury-cream-300 flex-grow mx-4"></div>
        <div className={`flex items-center space-x-1.5 ${activeStep >= 4 ? 'text-luxury-gold-600 font-bold' : ''}`}>
          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">4</span>
          <span className="hidden sm:inline">Confirm</span>
        </div>
      </div>

      {/* Step Contents & Empty Cart Guard */}
      {isCartEmpty && activeStep !== 4 ? (
        <div className="max-w-md mx-auto my-12 p-8 sm:p-10 bg-luxury-cream-50 border border-luxury-cream-300 rounded-3xl text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-luxury-cream-200 text-luxury-charcoal-700 rounded-full flex items-center justify-center mx-auto border border-luxury-cream-300 shadow-2xs">
            <ShoppingBag size={28} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-serif font-bold text-luxury-charcoal-900">Your Checkout Allocation is Empty</h3>
            <p className="text-xs text-luxury-charcoal-500 font-sans leading-relaxed">
              There are currently no luxury timepieces staged for acquisition. Select a timepiece from our curated catalogue to proceed.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={() => navigate('/shop')} variant="primary" size="md" className="w-full justify-center">
              Explore Collections
            </Button>
          </div>
        </div>
      ) : activeStep === 4 ? (
        
        /* Step 4: Success Confirmed screen */
        <div className="max-w-md mx-auto text-center bg-luxury-cream-50 p-8 border border-luxury-cream-300 rounded-2xl shadow-sm space-y-6">
          <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto border border-green-300 shadow-2xs">
            <CheckCircle size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-serif text-luxury-charcoal-900 font-bold">Order Placed!</h3>
            <p className="text-xs text-luxury-charcoal-600 font-sans leading-relaxed">
              Your timepiece allocation is successful and verified in the central cloud vault. Order Reference: <strong className="text-luxury-charcoal-900 font-mono">#{createdOrder?.id || 'ORD-9021'}</strong>.
            </p>
          </div>
          <div className="pt-4 border-t border-luxury-cream-300 flex flex-col gap-3">
            <Button onClick={() => navigate('/orders')} variant="primary" size="md">
              View My Orders
            </Button>
            <Button onClick={() => navigate('/shop')} variant="outline" size="md">
              Continue Shopping
            </Button>
          </div>
        </div>

      ) : (

        /* Active Checkout Split layout: Forms + Order receipt */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Left Column: Flow Forms */}
          <div className="lg:col-span-2 bg-luxury-cream-50 p-4 sm:p-6 rounded-2xl border border-luxury-cream-300 shadow-2xs">
            
            {activeStep === 2 ? (
              
              /* Address Form */
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                <h3 className="text-sm font-serif font-bold uppercase tracking-widest text-luxury-charcoal-900 pb-3 border-b border-luxury-cream-300">
                  Shipping Address
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    error={formErrors.fullName}
                    placeholder="Enter your full name"
                    required
                  />
                  <Input 
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={formErrors.phone}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                    inputMode="numeric"
                    required
                  />
                  <div className="sm:col-span-2">
                    <Input 
                      label="Delivery Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      error={formErrors.address}
                      placeholder="House / Flat No, Building, Street, Area"
                      required
                    />
                  </div>
                  <Input 
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    error={formErrors.city}
                    placeholder="Enter city name"
                    required
                  />
                  <Input 
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    error={formErrors.state}
                    placeholder="Enter state name"
                    required
                  />
                  <Input 
                    label="Postal Pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    error={formErrors.pincode}
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    inputMode="numeric"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="primary" size="md">
                    Proceed to Payment
                  </Button>
                </div>
              </form>

            ) : (

              /* Payment Form with Multi-Channel Selector */
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-luxury-cream-300">
                  <div>
                    <h3 className="text-sm font-serif font-bold uppercase tracking-widest text-luxury-charcoal-900">
                      Payment Channel
                    </h3>
                    <p className="text-[11px] text-luxury-charcoal-500 mt-0.5">
                      Select your preferred secure settlement method.
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-xs text-luxury-gold-600 hover:text-luxury-gold-800 font-semibold uppercase flex items-center space-x-1 cursor-pointer"
                  >
                    <ArrowLeft size={12} />
                    <span>Edit Address</span>
                  </button>
                </div>

                {/* Vault Wallet Payment Banner */}
                {walletBalance > 0 && (
                  <div className="p-4 bg-gradient-to-r from-luxury-gold-500/10 via-luxury-cream-100 to-luxury-gold-500/10 border-2 border-luxury-gold-400/60 rounded-2xl space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-luxury-gold-500 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                          <Wallet size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-luxury-charcoal-900 flex items-center gap-1.5">
                            Wristora Atelier Vault Wallet
                            <span className="px-2 py-0.5 bg-luxury-gold-200 text-luxury-gold-900 rounded-md text-[9px] uppercase tracking-wider font-extrabold">Instant</span>
                          </h4>
                          <p className="text-[11px] text-luxury-charcoal-500">
                            Available Credit: <span className="font-mono font-bold text-luxury-gold-700">₹{walletBalance.toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-luxury-cream-300 shadow-2xs hover:border-luxury-gold-500">
                        <input
                          type="checkbox"
                          checked={useWallet}
                          onChange={(e) => setUseWallet(e.target.checked)}
                          className="w-4 h-4 text-luxury-gold-600 rounded focus:ring-luxury-gold-400 accent-luxury-gold-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-luxury-charcoal-900">
                          {useWallet ? 'Applied' : 'Apply'}
                        </span>
                      </label>
                    </div>

                    {useWallet && (
                      <div className="pt-2 border-t border-luxury-gold-300/40 flex justify-between text-xs font-sans">
                        <span className="text-luxury-charcoal-600 font-medium">Wallet Credit Deducted:</span>
                        <span className="font-mono font-bold text-emerald-700">- ₹{walletAppliedAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Channel Selector Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChannel('card')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      paymentChannel === 'card'
                        ? 'bg-luxury-charcoal-900 text-white border-luxury-charcoal-900 shadow-md ring-1 ring-luxury-gold-400'
                        : 'bg-white text-luxury-charcoal-700 border-luxury-cream-300 hover:border-luxury-charcoal-400'
                    }`}
                  >
                    <CreditCard size={18} className={paymentChannel === 'card' ? 'text-luxury-gold-300' : 'text-luxury-charcoal-500'} />
                    <div className="mt-2">
                      <p className="text-xs font-bold leading-tight">Card</p>
                      <p className={`text-[10px] ${paymentChannel === 'card' ? 'text-luxury-cream-300' : 'text-luxury-charcoal-400'}`}>Credit / Debit</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('upi')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      paymentChannel === 'upi'
                        ? 'bg-luxury-charcoal-900 text-white border-luxury-charcoal-900 shadow-md ring-1 ring-luxury-gold-400'
                        : 'bg-white text-luxury-charcoal-700 border-luxury-cream-300 hover:border-luxury-charcoal-400'
                    }`}
                  >
                    <Smartphone size={18} className={paymentChannel === 'upi' ? 'text-luxury-gold-300' : 'text-luxury-charcoal-500'} />
                    <div className="mt-2">
                      <p className="text-xs font-bold leading-tight">UPI / QR</p>
                      <p className={`text-[10px] ${paymentChannel === 'upi' ? 'text-luxury-cream-300' : 'text-luxury-charcoal-400'}`}>Instant App Pay</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentChannel('wallet');
                      setUseWallet(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      paymentChannel === 'wallet'
                        ? 'bg-luxury-charcoal-900 text-white border-luxury-charcoal-900 shadow-md ring-1 ring-luxury-gold-400'
                        : 'bg-white text-luxury-charcoal-700 border-luxury-cream-300 hover:border-luxury-charcoal-400'
                    }`}
                  >
                    <Wallet size={18} className={paymentChannel === 'wallet' ? 'text-luxury-gold-300' : 'text-luxury-charcoal-500'} />
                    <div className="mt-2">
                      <p className="text-xs font-bold leading-tight">Vault Wallet</p>
                      <p className={`text-[10px] ${paymentChannel === 'wallet' ? 'text-luxury-cream-300' : 'text-luxury-charcoal-400'}`}>
                        ₹{walletBalance.toLocaleString('en-IN')} Credit
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChannel('cod')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      paymentChannel === 'cod'
                        ? 'bg-luxury-charcoal-900 text-white border-luxury-charcoal-900 shadow-md ring-1 ring-luxury-gold-400'
                        : 'bg-white text-luxury-charcoal-700 border-luxury-cream-300 hover:border-luxury-charcoal-400'
                    }`}
                  >
                    <Truck size={18} className={paymentChannel === 'cod' ? 'text-luxury-gold-300' : 'text-luxury-charcoal-500'} />
                    <div className="mt-2">
                      <p className="text-xs font-bold leading-tight">Concierge</p>
                      <p className={`text-[10px] ${paymentChannel === 'cod' ? 'text-luxury-cream-300' : 'text-luxury-charcoal-400'}`}>Valet Handover</p>
                    </div>
                  </button>
                </div>

                {/* Channel 1: Credit / Debit Card Panel */}
                {paymentChannel === 'card' && (
                  <div className="p-5 bg-white rounded-2xl border border-luxury-cream-300 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-luxury-cream-200">
                      <div className="flex items-center space-x-2">
                        <Lock size={15} className="text-luxury-gold-500" />
                        <span className="font-bold text-xs uppercase tracking-wider text-luxury-charcoal-900">
                          256-Bit Encrypted Vault Gateway
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-luxury-cream-300 text-luxury-charcoal-500">VISA</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-luxury-cream-300 text-luxury-charcoal-500">MC</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-luxury-cream-300 text-luxury-charcoal-500">AMEX</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-luxury-cream-300 text-luxury-charcoal-500">RUPAY</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Input 
                        label="Cardholder Name"
                        name="cardHolder"
                        value={formData.cardHolder}
                        onChange={handleInputChange}
                        error={formErrors.cardHolder}
                        placeholder="Name printed on card"
                        required
                      />

                      <div>
                        <div className="relative">
                          <Input 
                            label="Card Number"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            error={formErrors.cardNumber}
                            placeholder="4000 1234 5678 9010"
                            maxLength={19}
                            inputMode="numeric"
                            required
                          />
                          {formData.cardNumber && getCardBrand(formData.cardNumber) && (
                            <div className="absolute right-3 top-[34px]">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${getCardBrand(formData.cardNumber).color}`}>
                                {getCardBrand(formData.cardNumber).name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Expiry Date"
                          name="cardExpiry"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                          onBlur={handleExpiryBlur}
                          error={formErrors.cardExpiry}
                          placeholder="MM / YY"
                          maxLength={5}
                          inputMode="numeric"
                          required
                        />
                        <Input 
                          label="Security Code (CVV)"
                          name="cardCvv"
                          type="password"
                          value={formData.cardCvv}
                          onChange={handleInputChange}
                          error={formErrors.cardCvv}
                          placeholder="3 digits"
                          maxLength={4}
                          inputMode="numeric"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Channel 2: UPI / Dynamic QR Panel */}
                {paymentChannel === 'upi' && (
                  <div className="p-5 bg-white rounded-2xl border border-luxury-cream-300 space-y-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-luxury-cream-200">
                      <span className="font-bold text-xs uppercase tracking-wider text-luxury-charcoal-900">
                        Unified Payments Interface (UPI 2.0)
                      </span>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setUpiMode('id')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            upiMode === 'id' ? 'bg-luxury-charcoal-900 text-white' : 'text-luxury-charcoal-500 hover:bg-luxury-cream-100'
                          }`}
                        >
                          UPI ID / VPA
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiMode('qr')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            upiMode === 'qr' ? 'bg-luxury-charcoal-900 text-white' : 'text-luxury-charcoal-500 hover:bg-luxury-cream-100'
                          }`}
                        >
                          Scan QR Code
                        </button>
                      </div>
                    </div>

                    {upiMode === 'id' ? (
                      <div className="space-y-4">
                        <div>
                          <Input 
                            label="Virtual Payment Address (VPA / UPI ID)"
                            name="upiId"
                            value={formData.upiId}
                            onChange={handleInputChange}
                            error={formErrors.upiId}
                            placeholder="e.g. collector@okhdfcbank"
                            required
                          />
                          <p className="text-[11px] text-luxury-charcoal-500 mt-1.5">
                            A secure authorization request will be sent to your Google Pay, PhonePe, or BHIM app.
                          </p>
                        </div>

                        {/* Quick Handle Suffix Buttons */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {['@okhdfcbank', '@okaxis', '@paytm', '@ybl', '@ibl'].map(handle => (
                            <button
                              key={handle}
                              type="button"
                              onClick={() => {
                                const prefix = formData.upiId.split('@')[0] || 'collector';
                                setFormData(p => ({ ...p, upiId: `${prefix}${handle}` }));
                              }}
                              className="text-[10px] font-mono bg-luxury-cream-100 hover:bg-luxury-cream-200 text-luxury-charcoal-700 px-2 py-1 rounded-md border border-luxury-cream-300 cursor-pointer"
                            >
                              {handle}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-4">
                        <div className="inline-block p-4 bg-white border-2 border-luxury-charcoal-900 rounded-2xl shadow-inner relative">
                          <QrCode size={140} className="text-luxury-charcoal-900 mx-auto" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-10 h-10 bg-luxury-charcoal-900 rounded-full flex items-center justify-center border-2 border-white shadow">
                              <Sparkles size={18} className="text-luxury-gold-400" />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-luxury-charcoal-900">
                            Scan with any UPI App: GPay, PhonePe, Paytm, CRED
                          </p>
                          <p className="text-[11px] font-mono text-luxury-charcoal-500">
                            Amount: ₹{grandTotal.toLocaleString('en-IN')} &bull; Dynamic Session Active
                          </p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setQrSimulated(true)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              qrSimulated 
                                ? 'bg-green-600 text-white shadow-md' 
                                : 'bg-luxury-cream-200 text-luxury-charcoal-800 hover:bg-luxury-cream-300'
                            }`}
                          >
                            {qrSimulated ? '✓ UPI Payment Authorized' : 'Simulate Mobile App Confirmation'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Channel 3: Wristora Atelier Vault Wallet Panel */}
                {paymentChannel === 'wallet' && (
                  <div className="p-5 bg-white rounded-2xl border border-luxury-cream-300 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-luxury-cream-200">
                      <div className="flex items-center space-x-2">
                        <Wallet size={18} className="text-luxury-gold-600" />
                        <span className="font-bold text-xs uppercase tracking-wider text-luxury-charcoal-900">
                          Wristora Atelier Vault Wallet Settlement
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-luxury-gold-100 text-luxury-gold-900 rounded-md font-mono text-[10px] uppercase font-bold tracking-wider">
                        Instant 0-Sec
                      </span>
                    </div>

                    <div className="p-6 bg-white border-2 border-luxury-charcoal-900 rounded-2xl text-luxury-charcoal-900 space-y-4 shadow-md relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-luxury-gold-700">
                          Live Available Credit
                        </span>
                        <span className="text-xs font-serif font-bold text-luxury-charcoal-900 tracking-wide">
                          {currentUser?.displayName || formData.fullName || 'Valued Collector'}
                        </span>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-mono font-extrabold text-black tracking-tight">
                        ₹{walletBalance.toLocaleString('en-IN')}
                      </h3>
                      
                      <div className="pt-3 border-t border-luxury-cream-300 flex items-center justify-between text-xs sm:text-sm font-sans">
                        <span className="text-luxury-charcoal-600 font-medium">Total Order Settlement Amount:</span>
                        <span className="font-mono font-bold text-black text-base">₹{grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {walletBalance >= grandTotal ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                        <span>Your wallet balance covers 100% of this purchase. No card or UPI entry required!</span>
                      </div>
                    ) : walletBalance > 0 ? (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-amber-600 shrink-0" />
                          <span>Partial Wallet Credit Applied: ₹{walletBalance.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 pl-6">
                          Remaining payable amount: <strong className="font-mono text-luxury-charcoal-900">₹{(grandTotal - walletBalance).toLocaleString('en-IN')}</strong>. Switch tab to Card or UPI to complete the remaining balance.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-luxury-cream-100 border border-luxury-cream-300 rounded-xl text-luxury-charcoal-700 text-xs font-medium text-center space-y-1">
                        <p className="font-bold text-luxury-charcoal-900">Your wallet balance is currently ₹0</p>
                        <p className="text-[11px] text-luxury-charcoal-500">
                          Cancel an existing order to receive instant wallet refunds, or add funds directly in your Account Profile.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Channel 4: Concierge Valet Handover Panel */}
                {paymentChannel === 'cod' && (
                  <div className="p-5 bg-white rounded-2xl border border-luxury-cream-300 space-y-4 shadow-2xs">
                    <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-200">
                      <ShieldCheck size={20} className="text-luxury-gold-600" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900">
                          White-Glove Armored Courier Handover
                        </h4>
                        <p className="text-[11px] text-luxury-charcoal-500">
                          Inspect condition and authentic seals prior to settlement.
                        </p>
                      </div>
                    </div>

                    <div className="bg-luxury-cream-50 p-4 rounded-xl border border-luxury-cream-200 space-y-2 text-xs text-luxury-charcoal-700">
                      <div className="flex items-start space-x-2">
                        <CheckCircle size={14} className="text-green-600 shrink-0 mt-0.5" />
                        <span>Armored transport with tamper-evident serial security band.</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle size={14} className="text-green-600 shrink-0 mt-0.5" />
                        <span>Doorstep OTP validation sent to +91 {formData.phone || 'registered mobile'}.</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle size={14} className="text-green-600 shrink-0 mt-0.5" />
                        <span>Accepts Cash, UPI QR on courier POS, or Card Machine at your salon / residence.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit / Authorize Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg" 
                    isLoading={isSubmitting}
                    className="w-full sm:w-auto justify-center"
                  >
                    Confirm & Authorize ₹{grandTotal.toLocaleString('en-IN')}
                  </Button>
                </div>
              </form>

            )}

          </div>

          {/* Right Column: Order Summary Receipt Card with Dynamic Coupons */}
          <div className="bg-luxury-cream-50 p-4 sm:p-6 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6 h-fit">
            <h3 className="text-sm font-serif font-bold uppercase tracking-widest text-luxury-charcoal-900 pb-3 border-b border-luxury-cream-300">
              Selected Timepieces
            </h3>

            {/* List of checkout items */}
            <div className="space-y-3">
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-luxury-cream-200">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.product?.image} 
                      alt={item.product?.name} 
                      className="w-10 h-10 object-cover rounded-lg border border-luxury-cream-300 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-luxury-charcoal-900 line-clamp-1">{item.product?.name}</h4>
                      <p className="text-[10px] text-luxury-charcoal-400 font-mono">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-luxury-charcoal-900 shrink-0">
                    ₹{(((item.product?.discountPrice || item.product?.price) || 0) * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial summary breakdown */}
            <div className="space-y-2 text-xs font-sans text-luxury-charcoal-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold font-mono text-luxury-charcoal-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Promo Privilege Deduction Row */}
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
                <span>Integrated GST (18%):</span>
                <span className="font-bold font-mono text-luxury-charcoal-900">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Armored Transit Shipping:</span>
                <span className="font-bold text-green-700 uppercase tracking-wider text-[10px]">Free (Complimentary)</span>
              </div>
              
              <div className="border-t border-luxury-cream-300 pt-3 flex justify-between items-baseline font-bold text-luxury-charcoal-900">
                <span className="uppercase tracking-widest text-xs">Total Amount</span>
                <span className="font-mono font-bold text-lg text-luxury-charcoal-900">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Promo Privilege Voucher Entry in Checkout */}
            <div className="pt-2 border-t border-luxury-cream-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-luxury-charcoal-700 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-luxury-gold-400" />
                  Collector Privilege Code
                </span>
                {appliedCoupon && (
                  <button
                    type="button"
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

                  {/* Feedback Toast */}
                  {couponFeedback && (
                    <p className={`text-[11px] font-semibold ${
                      couponFeedback.type === 'success' ? 'text-green-600' : 'text-rose-600'
                    }`}>
                      {couponFeedback.text}
                    </p>
                  )}

                  {/* Quick Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
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
              )}
            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Checkout;
