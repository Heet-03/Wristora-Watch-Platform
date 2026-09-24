import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  HelpCircle, 
  FileText, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Send, 
  Award, 
  Lock,
  ArrowRight
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

/**
 * CustomerCare Component
 * 
 * Global Client Services & Concierge Hub resolving footer routes:
 * - /contact: Concierge inquiry form & salon details
 * - /shipping: Armored transit, delivery times, insurance & return policies
 * - /warranty: 2-Year International Warranty & Swiss Authenticity Guarantee
 * - /faq: Categorized interactive accordion FAQ
 * - /terms & /privacy: Legal and collector acquisition terms
 */
function CustomerCare({ defaultTab }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on pathname or prop
  const getInitialTab = () => {
    const path = location.pathname.replace('/', '').toLowerCase();
    if (['contact', 'shipping', 'warranty', 'faq', 'terms', 'privacy'].includes(path)) {
      return path === 'privacy' ? 'terms' : path;
    }
    return defaultTab || 'contact';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Sync active tab when URL changes
  useEffect(() => {
    const path = location.pathname.replace('/', '').toLowerCase();
    if (['contact', 'shipping', 'warranty', 'faq', 'terms', 'privacy'].includes(path)) {
      setActiveTab(path === 'privacy' ? 'terms' : path);
    }
  }, [location.pathname]);

  // Contact Form State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Concierge Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/${tabId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: 'General Concierge Inquiry',
        message: ''
      });
      setTimeout(() => setSubmitSuccess(false), 6000);
    }, 1000);
  };

  // FAQ Data
  const faqs = [
    {
      q: 'How does Wristora guarantee 100% Swiss authenticity?',
      a: 'Every timepiece in the Wristora Vault undergoes a multi-point verification protocol led by certified Swiss master watchmakers. We cross-verify serial numbers directly with manufacturer archives (Rolex, Patek Philippe, Audemars Piguet, Omega) and inspect movement escapements, balance wheels, dial engravings, and case metallurgy. Every timepiece is dispatched with its official manufacturer guarantee card and our certified Wristora Vault Dossier.'
    },
    {
      q: 'How does BlueDart Armored Transit work for delivery?',
      a: 'All acquisitions are dispatched in tamper-evident, serialized vault packaging via dedicated BlueDart Armored Express couriers with 100% comprehensive transit insurance. A biometric OTP is sent to your registered phone number, and packages are only released upon identity verification at your doorstep.'
    },
    {
      q: 'What is covered under the 2-Year International Warranty?',
      a: 'Our warranty covers all internal mechanical movement components, timing regulation, power reserve calibration, and manufacturer craftsmanship defects. If your watch deviates beyond COSC Swiss chronometer tolerances (-4/+6 seconds daily), our authorized horological service network will service, regulate, and pressure-test it at zero expense.'
    },
    {
      q: 'Can I request a private salon viewing before finalizing purchase?',
      a: 'Yes. VIP collectors can schedule a private viewing at our Mumbai Vault Salon in Juhu or arrange a private concierge showing in Delhi, Bengaluru, or Dubai. Simply submit a request via our Concierge inquiry form or call 1800-WRISTORA.'
    },
    {
      q: 'What is your return policy if the watch does not suit me?',
      a: 'Wristora offers a 30-day inspection period. As long as the timepiece remains unworn, in its original presentation box, and with all protective vault seals and documentation intact, you can request a complimentary armored return with a full refund.'
    },
    {
      q: 'Are all prices inclusive of taxes and GST?',
      a: 'Yes. All prices displayed on Wristora include applicable 18% Integrated Goods and Services Tax (GST) and import duties. You receive an official printable tax invoice matching Indian commercial requirements with complete HSN code 9102 declaration.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-14 text-left space-y-8 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-luxury-cream-200 via-luxury-cream-100 to-luxury-cream-200 border border-luxury-cream-300 rounded-3xl p-6 sm:p-12 text-left relative overflow-hidden shadow-xs">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-gold-600 block">
            Client Services & Horology Concierge
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif text-luxury-charcoal-900 font-bold tracking-wide leading-tight">
            Distinguished Care for Exceptional Timepieces
          </h1>
          <p className="text-xs sm:text-sm text-luxury-charcoal-600 font-sans leading-relaxed">
            From armored vault logistics to certified Swiss horological maintenance, our concierge team is at your command.
          </p>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="border-b border-luxury-cream-300 flex overflow-x-auto space-x-2 sm:space-x-8 no-scrollbar">
        {[
          { id: 'contact', label: 'Concierge Inquiry', icon: Phone },
          { id: 'shipping', label: 'Armored Transit & Returns', icon: Truck },
          { id: 'warranty', label: '2-Year Warranty', icon: ShieldCheck },
          { id: 'faq', label: 'FAQs & Horology Guide', icon: HelpCircle },
          { id: 'terms', label: 'Authenticity Terms', icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-4 px-2 text-xs sm:text-sm font-serif font-bold tracking-wider uppercase transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer border-b-2 ${
                isActive 
                  ? 'border-luxury-charcoal-900 text-luxury-charcoal-900' 
                  : 'border-transparent text-luxury-charcoal-400 hover:text-luxury-charcoal-700'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-luxury-gold-600' : 'text-luxury-charcoal-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: CONCIERGE & CONTACT INQUIRIES (/contact)
          ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          
          {/* Left Column: Inquiry Form */}
          <div className="lg:col-span-7 bg-luxury-cream-50 p-6 sm:p-10 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold-600 block mb-1">
                Private Advisory
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-luxury-charcoal-900">
                Direct Concierge Inquiry
              </h2>
              <p className="text-xs text-luxury-charcoal-500 mt-1">
                Request private salon viewings, bespoke allocations, or general watch advisory.
              </p>
            </div>

            {submitSuccess && (
              <div className="p-4 bg-green-50 border border-green-300 rounded-2xl text-green-900 text-xs flex items-center space-x-3 shadow-2xs">
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Inquiry Dispatched Successfully</p>
                  <p className="text-green-700 text-[11px] mt-0.5">
                    Our senior horology concierge will contact you within 2 business hours.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="Lord Sterling"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="collector@wristora.com"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Direct Contact Number"
                  placeholder="+91 98201 44552"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-luxury-charcoal-600 mb-1.5">
                    Nature of Inquiry
                  </label>
                  <select
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-luxury-cream-300 rounded-xl focus:outline-none focus:border-luxury-gold-500 bg-white"
                  >
                    <option value="General Concierge Inquiry">General Concierge Inquiry</option>
                    <option value="Private Salon Viewing (Mumbai)">Private Salon Viewing (Mumbai)</option>
                    <option value="Rare Watch Allocation Request">Rare Watch Allocation Request</option>
                    <option value="Order & Armored Dispatch Status">Order & Armored Dispatch Status</option>
                    <option value="Servicing & Warranty Calibration">Servicing & Warranty Calibration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-luxury-charcoal-600 mb-1.5">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Specify references of interest, desired bespoke adjustments, or questions for our specialists..."
                  className="w-full px-3 py-2 text-xs border border-luxury-cream-300 rounded-xl focus:outline-none focus:border-luxury-gold-500 bg-white"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full sm:w-auto justify-center"
              >
                <Send size={14} className="mr-2" />
                <span>Submit to Senior Concierge</span>
              </Button>
            </form>
          </div>

          {/* Right Column: Salon & Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Salon Details Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-4 text-left">
              <div className="flex items-center space-x-2 pb-3 border-b border-luxury-cream-200">
                <MapPin size={18} className="text-luxury-gold-600" />
                <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-luxury-charcoal-900">
                  Private Salon & Vault
                </h3>
              </div>
              <div className="space-y-2 text-xs text-luxury-charcoal-600">
                <p className="font-bold text-sm text-luxury-charcoal-900">Wristora Vault Mumbai</p>
                <p>Villa 14, Palm Avenue, Juhu Scheme</p>
                <p>Mumbai, Maharashtra - 400049</p>
                <p className="text-[11px] text-luxury-charcoal-400 pt-1">
                  Private viewings strictly by advance appointment.
                </p>
              </div>
            </div>

            {/* Direct Lines Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-4 text-left">
              <div className="flex items-center space-x-2 pb-3 border-b border-luxury-cream-200">
                <Clock size={18} className="text-luxury-gold-600" />
                <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-luxury-charcoal-900">
                  Concierge Operating Hours
                </h3>
              </div>
              <div className="space-y-2 text-xs text-luxury-charcoal-600">
                <p><span className="font-bold text-luxury-charcoal-900">Monday – Saturday:</span> 10:00 AM – 8:00 PM IST</p>
                <p><span className="font-bold text-luxury-charcoal-900">Sunday:</span> Private Concierge Appointments Only</p>
                <div className="pt-2 border-t border-luxury-cream-200 space-y-1">
                  <p className="flex items-center gap-2">
                    <Phone size={13} className="text-luxury-gold-600" />
                    <span className="font-mono font-bold text-luxury-charcoal-900">1800-WRISTORA / +91 22 6890 2200</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-luxury-gold-600" />
                    <span className="font-mono text-luxury-charcoal-700">concierge@wristora.com</span>
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: ARMORED SHIPPING & 30-DAY RETURNS (/shipping)
          ========================================================================= */}
      {activeTab === 'shipping' && (
        <div className="space-y-8 animate-fadeIn text-left">
          
          {/* 3 Step Protocol Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-3">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 font-serif font-bold text-lg">
                01
              </div>
              <h3 className="font-serif font-bold text-base text-luxury-charcoal-900">
                Vault Pre-Dispatch Inspection
              </h3>
              <p className="text-xs text-luxury-charcoal-600 leading-relaxed font-sans">
                Each timepiece undergoes electronic timing verification, power reserve testing, and micro-photography before placement in our sealed presentation box.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-3">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700 font-serif font-bold text-lg">
                02
              </div>
              <h3 className="font-serif font-bold text-base text-luxury-charcoal-900">
                Armored BlueDart Express
              </h3>
              <p className="text-xs text-luxury-charcoal-600 leading-relaxed font-sans">
                Dispatched in tamper-evident armored custody with 100% comprehensive transit insurance coverage. Trackable via live BlueDart satellite coordinates.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-3">
              <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 font-serif font-bold text-lg">
                03
              </div>
              <h3 className="font-serif font-bold text-base text-luxury-charcoal-900">
                White-Glove Doorstep Delivery
              </h3>
              <p className="text-xs text-luxury-charcoal-600 leading-relaxed font-sans">
                Handover requires a unique biometric SMS OTP and recipient government ID verification, ensuring timepieces reach exclusively authorized collectors.
              </p>
            </div>
          </div>

          {/* Detailed Policy Matrix */}
          <div className="bg-luxury-cream-50 p-6 sm:p-10 rounded-3xl border border-luxury-cream-300 space-y-6">
            <h3 className="font-serif font-bold text-xl text-luxury-charcoal-900">
              Complimentary Transit & 30-Day Inspection Guarantee
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-luxury-charcoal-700 leading-relaxed">
              <div className="space-y-3">
                <h4 className="font-bold text-luxury-charcoal-900 uppercase tracking-wider text-[11px]">
                  Domestic Delivery Timelines
                </h4>
                <ul className="space-y-2 list-disc list-inside text-luxury-charcoal-600">
                  <li><span className="font-bold text-luxury-charcoal-900">Tier 1 Metro (Mumbai, Delhi, Bengaluru):</span> 24 to 48 Hours</li>
                  <li><span className="font-bold text-luxury-charcoal-900">Tier 2 Capital Cities:</span> 2 to 3 Business Days</li>
                  <li><span className="font-bold text-luxury-charcoal-900">Rest of India:</span> Up to 4 Business Days</li>
                  <li><span className="font-bold text-luxury-charcoal-900">Shipping Cost:</span> Free & Fully Insured (₹0) on all acquisitions</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-luxury-charcoal-900 uppercase tracking-wider text-[11px]">
                  30-Day Return & Exchange Protocol
                </h4>
                <p>
                  You have 30 calendar days from the date of physical receipt to inspect your timepiece. If you choose to return or exchange:
                </p>
                <ul className="space-y-1.5 list-disc list-inside text-luxury-charcoal-600">
                  <li>The watch must be unworn with all factory security stickers intact.</li>
                  <li>Accompanied by all original packaging, links, manual, and warranty card.</li>
                  <li>We dispatch an armored pickup agent to collect the parcel from your home at no fee.</li>
                  <li>Full refund is settled to original payment channel within 48 hours of vault inspection.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 3: 2-YEAR WARRANTY & AUTHENTICITY ASSURANCE (/warranty)
          ========================================================================= */}
      {activeTab === 'warranty' && (
        <div className="space-y-8 animate-fadeIn text-left">
          
          <div className="bg-luxury-cream-50 p-6 sm:p-10 rounded-3xl border border-luxury-cream-300 space-y-6">
            <div className="max-w-3xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold-600 block">
                Swiss Horology Standard
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-luxury-charcoal-900">
                The Wristora 2-Year International Mechanical Warranty
              </h2>
              <p className="text-xs sm:text-sm text-luxury-charcoal-600 leading-relaxed font-sans">
                Every timepiece sold through Wristora is backed by our comprehensive 2-Year Mechanical Warranty, matching and exceeding Swiss manufacture service standards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              <div className="p-6 bg-white rounded-2xl border border-luxury-cream-300 space-y-2 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-luxury-cream-100 flex items-center justify-center text-luxury-gold-600 mb-2">
                  <Award size={20} />
                </div>
                <h4 className="font-serif font-bold text-sm text-luxury-charcoal-900">Chronometric Precision</h4>
                <p className="text-[11px] text-luxury-charcoal-500 leading-relaxed">
                  Complimentary movement regulation if your watch deviates beyond certified chronometer standards (-4/+6 sec/day).
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-luxury-cream-300 space-y-2 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-luxury-cream-100 flex items-center justify-center text-luxury-gold-600 mb-2">
                  <Lock size={20} />
                </div>
                <h4 className="font-serif font-bold text-sm text-luxury-charcoal-900">Gaskets & Water Resistance</h4>
                <p className="text-[11px] text-luxury-charcoal-500 leading-relaxed">
                  Annual hydrostatic pressure testing and free gasket renewals to ensure water resistance seals remain hermetic.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-luxury-cream-300 space-y-2 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-luxury-cream-100 flex items-center justify-center text-luxury-gold-600 mb-2">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-serif font-bold text-sm text-luxury-charcoal-900">Certified Master Watchmakers</h4>
                <p className="text-[11px] text-luxury-charcoal-500 leading-relaxed">
                  All service interventions are carried out in ISO-certified cleanrooms using genuine manufacturer replacement parts.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-base text-luxury-charcoal-900">
              How to Initiate a Service or Calibration Request
            </h3>
            <p className="text-xs text-luxury-charcoal-600 leading-relaxed">
              If your timepiece requires servicing, regulation, or battery maintenance, simply submit a ticket through our Concierge tab or call <span className="font-bold text-luxury-charcoal-900">1800-WRISTORA</span> with your order reference. Our team will arrange armored pickup from your residence.
            </p>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 4: FAQS & HOROLOGY GUIDE (/faq)
          ========================================================================= */}
      {activeTab === 'faq' && (
        <div className="space-y-6 animate-fadeIn text-left">
          
          <div className="text-center space-y-2 max-w-xl mx-auto pb-4">
            <h2 className="text-2xl font-serif font-bold text-luxury-charcoal-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-luxury-charcoal-500">
              Key insights into purchasing, authenticity, armored delivery, and horological care.
            </p>
          </div>

          <div className="space-y-3 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl border border-luxury-cream-300 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-luxury-cream-50 transition-colors"
                  >
                    <span className="font-serif font-bold text-sm text-luxury-charcoal-900 pr-4">
                      {faq.q}
                    </span>
                    <span className="text-luxury-gold-600 shrink-0">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs text-luxury-charcoal-600 font-sans leading-relaxed border-t border-luxury-cream-200 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center pt-6">
            <p className="text-xs text-luxury-charcoal-500">
              Have a specific question not covered here?{' '}
              <button 
                onClick={() => handleTabChange('contact')} 
                className="text-luxury-gold-600 font-bold hover:underline cursor-pointer"
              >
                Inquire with our Concierge team &rarr;
              </button>
            </p>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 5: LEGAL & ACQUISITION TERMS (/terms & /privacy)
          ========================================================================= */}
      {activeTab === 'terms' && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-luxury-cream-300 shadow-2xs space-y-6 text-left animate-fadeIn text-xs text-luxury-charcoal-700 leading-relaxed">
          <h2 className="text-2xl font-serif font-bold text-luxury-charcoal-900">
            Terms of Luxury Acquisition & Privacy Policy
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-luxury-charcoal-900 font-serif">1. Commercial Tax Invoicing & HSN Compliance</h4>
              <p>
                All sales through Wristora constitute legitimate commercial transactions compliant with the Central Goods and Services Tax Act. Every dispatched order carries an official tax invoice containing full GSTIN details, serial numbers, and statutory HSN code 9102 classification.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-luxury-charcoal-900 font-serif">2. Privacy & Collector Discretion</h4>
              <p>
                We observe rigorous Swiss banking confidentiality standards regarding your acquisition records. Customer details, acquisition spend, and shipping manifests are strictly encrypted using AES-256 protocols and are never commercialized, marketed to third parties, or disclosed.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-luxury-charcoal-900 font-serif">3. Vault Reservation & Stock Integrity</h4>
              <p>
                All allocated pieces on Wristora represent authentic, verifiable vault stock. Placing an order reserves the specific physical watch unit in our climate-controlled vault facility pending armored courier handover.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CustomerCare;
