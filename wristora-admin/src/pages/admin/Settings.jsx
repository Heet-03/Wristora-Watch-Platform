import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Truck, 
  Bell, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Lock,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { getStoreSettings, updateStoreSettings, defaultHeroImages } from '../../firebase/dbService';

/**
 * AdminSettings Component
 * 
 * Central Store Configuration:
 * - Store identity, boutique concierge contacts, and currency.
 * - Homepage hero banner rotating slideshow images.
 * - Payment gateway integrations & fraud prevention limits.
 * - Armored shipping logistics defaults and complimentary thresholds.
 * - Notification dispatch settings.
 */
function AdminSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Store Identity State
  const [storeName, setStoreName] = useState('Wristora Haute Horlogerie');
  const [supportEmail, setSupportEmail] = useState('concierge@wristora.com');
  const [supportPhone, setSupportPhone] = useState('+91 (022) 8921-9900');
  const [address, setAddress] = useState('402 Luxury Avenue, Marine Drive, Mumbai 400020');
  const [currency, setCurrency] = useState('INR (₹)');

  // 1.5. Homepage Hero Slideshow Images
  const [heroImages, setHeroImages] = useState(defaultHeroImages);

  // 2. Payments & Security
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(true);
  const [codLimit, setCodLimit] = useState('100000');

  // 3. Shipping & Insurance
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('50000');
  const [shippingPartner, setShippingPartner] = useState('BlueDart Armored Express');
  const [vaultInsuranceIncluded, setVaultInsuranceIncluded] = useState(true);

  // 4. Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsTracking, setSmsTracking] = useState(true);

  // Load saved settings from database/storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await getStoreSettings();
        if (s) {
          if (s.storeName !== undefined) setStoreName(s.storeName);
          if (s.supportEmail !== undefined) setSupportEmail(s.supportEmail);
          if (s.supportPhone !== undefined) setSupportPhone(s.supportPhone);
          if (s.address !== undefined) setAddress(s.address);
          if (s.currency !== undefined) setCurrency(s.currency);
          if (s.heroImages && Array.isArray(s.heroImages) && s.heroImages.length > 0) {
            setHeroImages(s.heroImages);
          }
          if (s.razorpayEnabled !== undefined) setRazorpayEnabled(s.razorpayEnabled);
          if (s.stripeEnabled !== undefined) setStripeEnabled(s.stripeEnabled);
          if (s.twoFactorRequired !== undefined) setTwoFactorRequired(s.twoFactorRequired);
          if (s.codLimit !== undefined) setCodLimit(s.codLimit);
          if (s.freeShippingThreshold !== undefined) setFreeShippingThreshold(s.freeShippingThreshold);
          if (s.shippingPartner !== undefined) setShippingPartner(s.shippingPartner);
          if (s.vaultInsuranceIncluded !== undefined) setVaultInsuranceIncluded(s.vaultInsuranceIncluded);
          if (s.emailAlerts !== undefined) setEmailAlerts(s.emailAlerts);
          if (s.smsTracking !== undefined) setSmsTracking(s.smsTracking);
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleHeroImageChange = (index, value) => {
    setHeroImages(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleResetHeroImages = () => {
    setHeroImages(defaultHeroImages);
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      await updateStoreSettings({
        storeName,
        supportEmail,
        supportPhone,
        address,
        currency,
        heroImages,
        razorpayEnabled,
        stripeEnabled,
        twoFactorRequired,
        codLimit,
        freeShippingThreshold,
        shippingPartner,
        vaultInsuranceIncluded,
        emailAlerts,
        smsTracking
      });
      setToastMessage('Store configurations successfully updated & saved to database.');
    } catch (err) {
      console.error('Error saving settings:', err);
      setToastMessage('Failed to persist store configurations.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto text-left font-sans">
      
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
              Storefront Configurations
            </h1>
           
          </div>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
            Configure global boutique identity, payment merchant gateways, armored logistics partners, and security policies.
          </p>
        </div>

        <Button 
          onClick={handleSaveSettings}
          variant="primary" 
          size="md" 
          isLoading={isSaving}
          className="w-full sm:w-auto text-xs uppercase tracking-widest font-bold justify-center"
        >
          <Save size={14} className="mr-1.5" />
          Save Configurations
        </Button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* SECTION 1: Boutique Identity */}
        <div className="bg-luxury-cream-50 p-4 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
            <Building2 size={18} className="text-luxury-gold-600" />
            <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
              1. Boutique Identity & Concierge
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Store Public Name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                Operating Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
              >
                <option value="INR (₹)">Indian Rupee (INR ₹)</option>
                <option value="USD ($)">US Dollar (USD $)</option>
                <option value="EUR (€)">Euro (EUR €)</option>
                <option value="CHF (Fr)">Swiss Franc (CHF Fr)</option>
                <option value="GBP (£)">British Pound (GBP £)</option>
              </select>
            </div>

            <Input
              label="Concierge Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              required
            />

            <Input
              label="Concierge Direct Helpline"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              required
            />

            <div className="sm:col-span-2">
              <Input
                label="Registered Headquarters Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Homepage Hero Banner Slideshow */}
        <div className="bg-luxury-cream-50 p-4 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-luxury-cream-300 gap-2">
            <div className="flex items-center space-x-2.5 text-luxury-charcoal-900">
              <ImageIcon size={18} className="text-luxury-gold-600" />
              <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
                2. Homepage Hero Slideshow (5 Rotating Images)
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetHeroImages}
              className="text-xs text-luxury-gold-600 hover:text-luxury-gold-800 font-bold flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw size={12} />
              <span>Reset to Default Images</span>
            </button>
          </div>

          <p className="text-xs text-luxury-charcoal-500 leading-relaxed font-sans">
            Customize the 5 rotating luxury watch images displayed on the customer storefront homepage. Paste direct image URLs (from Unsplash, Cloudinary, ImgBB, or direct image files ending in <code className="bg-luxury-cream-200 px-1 py-0.5 rounded text-[11px]">.jpg</code>, <code className="bg-luxury-cream-200 px-1 py-0.5 rounded text-[11px]">.png</code>, or <code className="bg-luxury-cream-200 px-1 py-0.5 rounded text-[11px]">.webp</code>).
          </p>

          <div className="space-y-4">
            {heroImages.map((imgUrl, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-xl border border-luxury-cream-300 shadow-2xs">
                {/* Slot badge */}
                <div className="w-20 shrink-0 text-[10px] font-bold uppercase tracking-wider text-luxury-charcoal-600">
                  Slide {idx + 1} {idx === 0 && <span className="text-luxury-gold-600 block text-[9px]">Primary</span>}
                </div>

                {/* Input */}
                <div className="flex-1 w-full">
                  <input
                    type="url"
                    value={imgUrl || ''}
                    onChange={(e) => handleHeroImageChange(idx, e.target.value)}
                    placeholder={`https://images.unsplash.com/... (Image URL for Slide ${idx + 1})`}
                    className="w-full px-3.5 py-2 bg-luxury-cream-50 border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 font-mono focus:outline-none focus:border-luxury-gold-500 focus:bg-white"
                  />
                </div>

                {/* Thumbnail Preview */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-luxury-cream-300 bg-luxury-cream-100 shrink-0 relative flex items-center justify-center">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultHeroImages[idx];
                      }}
                    />
                  ) : (
                    <ImageIcon size={18} className="text-luxury-charcoal-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Payment Gateways & Fraud Security */}
        <div className="bg-luxury-cream-50 p-4 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
            <CreditCard size={18} className="text-luxury-gold-600" />
            <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
              3. Payment Gateways & Fraud Security
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-luxury-cream-300 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-luxury-charcoal-900 block">Razorpay Merchant Gateway</span>
                <span className="text-[10px] text-luxury-charcoal-500">Supports UPI, NetBanking, & Indian Credit Cards</span>
              </div>
              <input
                type="checkbox"
                checked={razorpayEnabled}
                onChange={(e) => setRazorpayEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 accent-luxury-charcoal-900 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-luxury-cream-300 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-luxury-charcoal-900 block">Stripe International Gateway</span>
                <span className="text-[10px] text-luxury-charcoal-500">Global cards (Amex, Visa, Mastercard)</span>
              </div>
              <input
                type="checkbox"
                checked={stripeEnabled}
                onChange={(e) => setStripeEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 accent-luxury-charcoal-900 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-luxury-cream-300 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-luxury-charcoal-900 block">Mandatory 2FA for Admin Portal</span>
                <span className="text-[10px] text-luxury-charcoal-500">Require OTP verification for staff logins</span>
              </div>
              <input
                type="checkbox"
                checked={twoFactorRequired}
                onChange={(e) => setTwoFactorRequired(e.target.checked)}
                className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 accent-luxury-charcoal-900 cursor-pointer"
              />
            </label>

            <Input
              label="Cash on Delivery Max Threshold (₹)"
              type="number"
              value={codLimit}
              onChange={(e) => setCodLimit(e.target.value)}
              placeholder="100000"
            />
          </div>
        </div>

        {/* SECTION 4: Logistics & Armored Transit Defaults */}
        <div className="bg-luxury-cream-50 p-4 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
            <Truck size={18} className="text-luxury-gold-600" />
            <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
              4. Logistics & Vault Insurance Defaults
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Complimentary Shipping Minimum (₹)"
              type="number"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(e.target.value)}
            />

            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-widest font-bold text-luxury-charcoal-700">
                Primary Armored Logistics Partner
              </label>
              <select
                value={shippingPartner}
                onChange={(e) => setShippingPartner(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 font-semibold focus:outline-none focus:border-luxury-gold-500 cursor-pointer"
              >
                <option value="BlueDart Armored Express">BlueDart Armored Express</option>
                <option value="Delhivery Secure Vault">Delhivery Secure Vault</option>
                <option value="FedEx Custom Critical">FedEx Custom Critical</option>
                <option value="DHL Express Luxury">DHL Express Luxury</option>
              </select>
            </div>

            <label className="sm:col-span-2 flex items-center justify-between p-4 bg-white rounded-xl border border-luxury-cream-300 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-luxury-charcoal-900 block">Full In-Transit Lloyd's Insurance Included</span>
                <span className="text-[10px] text-luxury-charcoal-500">Automatically attach 100% loss/theft insurance coverage to all dispatches</span>
              </div>
              <input
                type="checkbox"
                checked={vaultInsuranceIncluded}
                onChange={(e) => setVaultInsuranceIncluded(e.target.checked)}
                className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 accent-luxury-charcoal-900 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* SECTION 5: Notifications & Messaging */}
        <div className="bg-luxury-cream-50 p-4 sm:p-8 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-6">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-luxury-cream-300 text-luxury-charcoal-900">
            <Bell size={18} className="text-luxury-gold-600" />
            <h2 className="text-sm font-serif font-bold uppercase tracking-widest">
              5. Notifications & Messaging
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-luxury-cream-300 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-luxury-charcoal-900 block">Email Dispatch Confirmations</span>
                <span className="text-[10px] text-luxury-charcoal-500">Notify clients when packages are collected by carrier</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 accent-luxury-charcoal-900 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-luxury-cream-300 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-luxury-charcoal-900 block">SMS Dispatch Tracking Alerts</span>
                <span className="text-[10px] text-luxury-charcoal-500">Send BlueDart tracking links via SMS</span>
              </div>
              <input
                type="checkbox"
                checked={smsTracking}
                onChange={(e) => setSmsTracking(e.target.checked)}
                className="w-4 h-4 rounded border-luxury-cream-300 text-luxury-charcoal-900 accent-luxury-charcoal-900 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit"
            variant="primary" 
            size="lg" 
            isLoading={isSaving}
            className="text-xs uppercase tracking-widest font-bold px-8 py-3.5 w-full sm:w-auto justify-center"
          >
            <Save size={15} className="mr-2" />
            Save Configurations
          </Button>
        </div>

      </form>

    </div>
  );
}

export default AdminSettings;
