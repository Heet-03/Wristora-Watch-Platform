import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

/**
 * Footer Component
 * 
 * Provides the global storefront footer menu, including custom column matrices,
 * newsletter fields with toast feedback, and brand copy.
 */
function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribed(true);
    setEmail('');
    setTimeout(() => setIsSubscribed(false), 5000);
  };

  return (
    <footer className="border-t border-luxury-cream-300 bg-luxury-cream-50 pt-16 pb-24 md:pb-12 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row md:justify-between items-start gap-8 lg:gap-12 border-b border-luxury-cream-300 pb-14 mb-8">
        
        {/* Brand Info Column */}
        <div className="space-y-4 text-left w-full md:max-w-xs">
          <div className="inline-block">
            <img src="/logo.png?v=2" alt="Wristora Logo" className="h-12 sm:h-14 w-auto mix-blend-multiply contrast-125" />
          </div>
          <p className="text-xs text-luxury-charcoal-500 leading-relaxed font-sans max-w-sm">
            Discover timeless elegance. Hand-selected luxury timepieces curated for collectors who value artistry and precision.
          </p>
        </div>

        {/* Navigation Links: Side by side on mobile & tablet, distinct columns on desktop */}
        <div className="grid grid-cols-2 gap-6 sm:gap-8 w-full md:w-auto md:contents">
          {/* Categories Column */}
          <div className="text-left space-y-3.5">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-luxury-charcoal-900">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-luxury-charcoal-500 font-medium font-sans">
              <li><Link to="/shop?category=Luxury" className="hover:text-luxury-gold-600 transition-colors">Luxury Series</Link></li>
              <li><Link to="/shop?category=Classic" className="hover:text-luxury-gold-600 transition-colors">Classic Series</Link></li>
              <li><Link to="/shop?category=Sports" className="hover:text-luxury-gold-600 transition-colors">Sports &amp; Diving</Link></li>
              <li><Link to="/shop?category=Limited" className="hover:text-luxury-gold-600 transition-colors">Limited Editions</Link></li>
            </ul>
          </div>

          {/* Customer Service Column */}
          <div className="text-left space-y-3.5">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-luxury-charcoal-900">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-luxury-charcoal-500 font-medium font-sans">
              <li><Link to="/contact" className="hover:text-luxury-gold-600 transition-colors">Contact Support</Link></li>
              <li><Link to="/shipping" className="hover:text-luxury-gold-600 transition-colors">Shipping &amp; Returns</Link></li>
              <li><Link to="/warranty" className="hover:text-luxury-gold-600 transition-colors">2-Year Warranty</Link></li>
              <li><Link to="/faq" className="hover:text-luxury-gold-600 transition-colors">FAQs &amp; Guides</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Column */}
        <div className="text-left space-y-3.5 w-full md:w-80 lg:w-96">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-luxury-charcoal-900">
            Newsletter
          </h4>
          <p className="text-xs text-luxury-charcoal-500 leading-relaxed font-sans">
            Subscribe to receive exclusive access to new releases, events, and journal updates.
          </p>
          {isSubscribed ? (
            <div className="p-3 bg-luxury-charcoal-900 text-luxury-gold-300 rounded-xl border border-luxury-charcoal-700 flex items-center space-x-2 text-xs font-bold animate-fadeIn">
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
              <span>Welcome to the Wristora Connoisseur Circle.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex space-x-2 w-full">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="bg-white border border-luxury-cream-300 rounded-xl px-3.5 py-2.5 text-xs text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-600 flex-grow font-sans transition-colors shadow-2xs"
              />
              <button 
                type="submit" 
                className="bg-luxury-charcoal-900 text-white rounded-xl px-5 py-2.5 text-[10px] uppercase font-bold tracking-widest hover:bg-luxury-gold-600 hover:text-white transition-colors duration-200 cursor-pointer shadow-2xs shrink-0"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row justify-between items-center text-[10px] text-luxury-charcoal-400 uppercase tracking-widest font-semibold font-sans space-y-3 sm:space-y-0">
        <div>
          &copy; {new Date().getFullYear()} Wristora. All rights reserved.
        </div>
        <div className="flex space-x-6">
          <Link to="/privacy" className="hover:text-luxury-gold-600 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-luxury-gold-600 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
