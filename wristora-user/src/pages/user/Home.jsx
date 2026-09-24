import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CreditCard, 
  Award, 
  Sparkles, 
  Star, 
  Quote, 
  Compass, 
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { getProducts, getCategories, getStoreSettings, defaultHeroImages, subscribeToReviews } from '../../firebase/dbService';
import { formatDate } from '../../utils/dateFormatter';

// Fallback curated collector reviews in case fewer than 3 live reviews exist in database
const fallbackCuratedReviews = [
  {
    id: 'curated-1',
    customerName: 'Vikramaditya S.',
    location: 'Mumbai • Verified Vault Collector',
    watchBrand: 'Rolex',
    watchName: 'Rolex Submariner Date',
    rating: 5,
    title: 'Uncompromised Authenticity',
    comment: 'Acquired the Rolex Submariner Date. The armored courier transit with sealed serial locks and pristine COSC documentation exceeded every high-value expectation.',
    date: '15/09/2026'
  },
  {
    id: 'curated-2',
    customerName: 'Julian von Bern',
    location: 'Zurich • Horology Patron',
    watchBrand: 'Audemars Piguet',
    watchName: 'Royal Oak Selfwinding',
    rating: 5,
    title: 'Masterful Calibre Regulation',
    comment: 'Wristora brings auction-house scrutiny to modern e-commerce. The mechanical accuracy is within +1.2 seconds per day. Flawless presentation.',
    date: '10/09/2026'
  },
  {
    id: 'curated-3',
    customerName: 'Alistair Chen',
    location: 'Singapore • Private Collector',
    watchBrand: 'Patek Philippe',
    watchName: 'Calatrava Clous de Paris',
    rating: 5,
    title: 'White-Glove Express Handover',
    comment: 'Direct express checkout with instant card authorization was seamless. The timepiece arrived in an armored security box within 48 hours.',
    date: '04/09/2026'
  }
];

// Helper to normalize dates for sorting newest reviews first
const parseReviewTime = (d) => {
  if (!d) return 0;
  if (d?.toDate && typeof d.toDate === 'function') return d.toDate().getTime();
  if (d?.seconds) return d.seconds * 1000;
  if (typeof d === 'string') {
    const trimmed = d.trim();
    const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      return new Date(year, month, day).getTime() || 0;
    }
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) return parsed;
  }
  if (d instanceof Date) return d.getTime();
  return 0;
};

// Review Card component optimized for both desktop grid and mobile horizontal swipe carousel
function ReviewCard({ review, isMobile = false, onWatchClick }) {
  const rating = Math.round(Number(review.rating) || 5);
  const comment = (review.comment || '').trim();

  return (
    <div 
      className={`bg-luxury-cream-50 ${
        isMobile ? 'p-4 sm:p-5 rounded-2xl' : 'p-6 sm:p-8 rounded-3xl'
      } border border-luxury-cream-300 shadow-2xs space-y-3.5 flex flex-col justify-between hover:shadow-md hover:border-luxury-gold-400/50 transition-all duration-300 group h-full`}
    >
      <div className="space-y-3">
        {/* Header: Dynamic Star Rating & Verified Collector Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex text-amber-500 space-x-0.5 shrink-0">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={isMobile ? 13 : 14} 
                fill={star <= rating ? 'currentColor' : 'none'} 
                className={star <= rating ? 'text-amber-500' : 'text-luxury-charcoal-300'}
              />
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
            <CheckCircle2 size={11} className="text-emerald-600" />
            Verified Collector
          </span>
        </div>

        {/* Acquired Watch Pill / Preview Link */}
        {review.watchName && (
          <div 
            onClick={() => review.watchId && onWatchClick && onWatchClick(review.watchId)}
            className={`flex items-center gap-2.5 p-2 bg-white rounded-xl border border-luxury-cream-200/90 transition-all ${
              review.watchId ? 'cursor-pointer hover:border-luxury-gold-400 hover:bg-luxury-cream-100/60' : ''
            }`}
            title={review.watchId ? `View ${review.watchName}` : undefined}
          >
            {review.watchImage ? (
              <img 
                src={review.watchImage} 
                alt={review.watchName} 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover border border-luxury-cream-200 shrink-0 bg-white"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-luxury-gold-100/70 text-luxury-gold-700 flex items-center justify-center shrink-0 border border-luxury-gold-200">
                <Sparkles size={15} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[9px] uppercase tracking-wider text-luxury-gold-600 font-bold truncate">
                {review.watchBrand || 'Acquired Watch'}
              </p>
              <p className="text-xs font-serif font-bold text-luxury-charcoal-900 truncate">
                {review.watchName}
              </p>
            </div>
            {review.watchId && (
              <ArrowRight size={13} className="text-luxury-charcoal-400 group-hover:text-luxury-gold-600 shrink-0 transition-colors" />
            )}
          </div>
        )}

        {/* Review Title & Body */}
        <div className="space-y-1.5">
          {review.title && (
            <h4 className="font-serif font-bold text-sm text-luxury-charcoal-900 leading-snug">
              {review.title}
            </h4>
          )}
          <p className="text-xs text-luxury-charcoal-700 font-sans italic leading-relaxed">
            &ldquo;{comment}&rdquo;
          </p>
        </div>
      </div>

      {/* Footer: Customer Name, Verified status, and Formatted Date */}
      <div className="pt-3 border-t border-luxury-cream-200 flex items-center justify-between text-left gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-luxury-charcoal-900 truncate">
            {review.customerName || review.author || 'Valued Collector'}
          </p>
          <p className="text-[10px] text-luxury-charcoal-400 font-mono truncate">
            {review.location || 'Verified Vault Collector'}
          </p>
        </div>
        {review.date && (
          <span className="text-[10px] text-luxury-charcoal-500 font-mono shrink-0">
            {formatDate(review.date)}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Home Page Component
 * 
 * Main landing page for Wristora.
 * Features an automated luxury hero watch image slideshow (rotates every 5s)
 * dynamically loaded from store configurations or fallback vault imagery,
 * dynamically loads featured timepieces and categories from Firestore database,
 * and renders live verified collector reviews synchronized in real-time.
 */
function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroImages, setHeroImages] = useState(defaultHeroImages);
  const [liveReviews, setLiveReviews] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile horizontal swipe carousel ref & state
  const mobileCarouselRef = useRef(null);
  const [activeMobileReview, setActiveMobileReview] = useState(0);

  const handleMobileScroll = () => {
    if (!mobileCarouselRef.current) return;
    const { scrollLeft, offsetWidth } = mobileCarouselRef.current;
    if (offsetWidth > 0) {
      const cardWidth = offsetWidth * 0.84 + 14;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveMobileReview(Math.min(Math.max(0, index), displayedReviews.length - 1));
    }
  };

  const scrollToMobileReview = (index) => {
    if (!mobileCarouselRef.current) return;
    const cardWidth = mobileCarouselRef.current.offsetWidth * 0.84 + 14;
    mobileCarouselRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    setActiveMobileReview(index);
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance watch image every 3 seconds
  useEffect(() => {
    if (!heroImages || heroImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Fetch live products, categories, and dynamic hero banner images from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, cats, settings] = await Promise.all([
          getProducts(),
          getCategories(),
          getStoreSettings().catch(() => null)
        ]);
        setProducts(prods || []);
        setCategories(cats || []);
        if (settings?.heroImages && Array.isArray(settings.heroImages) && settings.heroImages.length > 0) {
          const valid = settings.heroImages.filter(url => typeof url === 'string' && url.trim().length > 0);
          if (valid.length > 0) {
            setHeroImages(valid);
          }
        }
      } catch (err) {
        console.error('Error loading storefront home data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Subscribe to live collector reviews from Firestore with real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToReviews((rawReviews) => {
      const valid = (rawReviews || [])
        .filter(r => r && r.status !== 'Flagged' && r.status !== 'Rejected')
        .sort((a, b) => {
          const timeA = parseReviewTime(a.date || a.createdAt);
          const timeB = parseReviewTime(b.date || b.createdAt);
          if (timeB !== timeA) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        });
      setLiveReviews(valid);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Compute displayed reviews: if live reviews exist, prefer them and blend with fallback if < 3
  const displayedReviews = liveReviews.length >= 3 
    ? liveReviews 
    : [...liveReviews, ...fallbackCuratedReviews.slice(liveReviews.length)];

  // Slice currently visible 3 reviews for the carousel/grid
  const visibleReviews = displayedReviews.slice(reviewIndex, reviewIndex + 3);
  
  // Filter products for featured items (Golden Rule: exactly 3 in-stock watches on Home page)
  const featuredProducts = products
    .filter(p => p.status !== 'archived' && (Number(p.stock) ?? 0) > 0)
    .slice(0, 3);

  const policies = [
    { icon: Truck, title: 'Free Shipping', desc: 'On all orders worldwide' },
    { icon: ShieldCheck, title: '2 Years Warranty', desc: 'Guaranteed global authenticity' },
    { icon: RotateCcw, title: '30 Days Return', desc: '100% money back guarantee' },
    { icon: CreditCard, title: 'Secure Payment', desc: 'Fully encrypted checkouts' }
  ];


  // Concrete Real-World Collector Guarantees
  const collectorGuarantees = [
    {
      icon: ShieldCheck,
      title: '100% Certified Authentic',
      desc: 'Every timepiece undergoes a multi-point physical & mechanical inspection by certified master horologists, accompanied by official serial verification.'
    },
    {
      icon: Truck,
      title: 'Armored & Insured Logistics',
      desc: 'Complimentary priority courier transit with tamper-evident security locks, comprehensive transit insurance, and doorstep identity verification.'
    },
    {
      icon: Award,
      title: '2-Year Mechanical Warranty',
      desc: 'Complete global movement coverage, complimentary chronometric calibration, and gasket water-resistance servicing backed by our certified workshops.'
    },
    {
      icon: RotateCcw,
      title: 'Guaranteed Trade-In Value',
      desc: 'Enjoy guaranteed appraisal liquidity and flexible trade-in credit toward future vault additions whenever you choose to evolve your collection.'
    }
  ];

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Loading Wristora Vault Collections..." />
      </div>
    );
  }

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. Hero Section */}
      <section className="bg-luxury-cream-200 border-b border-luxury-cream-300 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center text-left">
          
          {/* Left Text */}
          <div className="space-y-6 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-gold-600">
              Timeless Collection
            </span>
            <h1 className="text-4xl md:text-6xl font-serif text-luxury-charcoal-900 leading-tight font-medium">
              TIME, REDEFINED
            </h1>
            <p className="text-sm md:text-base text-luxury-charcoal-500 font-sans leading-relaxed">
              Discover flawless elegance crafted for those who value every second. Our curated timepieces fuse mechanical sophistication with unmatched luxury design.
            </p>
            <div className="pt-2">
              <Button 
                onClick={() => navigate('/shop')} 
                variant="primary" 
                size="lg"
              >
                Explore Collection
              </Button>
            </div>
          </div>

          {/* Right Hero Image Overlay with 5-Second Automatic Image Transitions (Pure Images Only) */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-luxury-gold-100/50 rounded-full blur-3xl -z-10 w-72 h-72 md:w-96 md:h-96 mx-auto my-auto"></div>
            
            <div 
              onClick={() => navigate('/shop')}
              className="relative w-full max-w-sm md:max-w-md h-72 sm:h-80 md:h-96 rounded-lg shadow-2xl border-4 border-luxury-cream-50 overflow-hidden bg-luxury-cream-200 cursor-pointer"
            >
              {heroImages.map((imgUrl, idx) => (
                <img 
                  key={idx}
                  src={imgUrl} 
                  alt="Luxury Wristwatch" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = defaultHeroImages[idx % defaultHeroImages.length];
                  }}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                    idx === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                />
              ))}

              {/* Minimal Slide Dots Indicator */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center items-center gap-1.5 z-10">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      idx === currentSlide ? 'w-6 bg-white shadow-md' : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                    title={`View watch ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. Customer Trust Policies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
          {policies.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div 
                key={idx} 
                className="flex flex-col sm:flex-row items-start space-y-2 sm:space-y-0 sm:space-x-4 bg-luxury-cream-50 p-3.5 sm:p-6 rounded-2xl border border-luxury-cream-200 shadow-2xs text-left"
              >
                <div className="text-luxury-gold-500 shrink-0">
                  <Icon size={20} strokeWidth={1.5} className="sm:w-6 sm:h-6" />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-luxury-charcoal-900">
                    {p.title}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-luxury-charcoal-500 font-medium leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Categories Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
            Featured Collections
          </h2>
          <p className="text-xs text-luxury-charcoal-500 max-w-md mx-auto leading-relaxed">
            Explore curated series crafted for specific lifestyles and styling expressions.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.id}
              onClick={() => navigate(`/shop?category=${cat.name}`)}
              className="group relative h-52 sm:h-72 lg:h-96 overflow-hidden rounded-2xl shadow-2xs hover:shadow-md border border-luxury-cream-300 cursor-pointer"
            >
              {/* Overlay shading */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:from-black/90"></div>
              
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 z-20 text-left space-y-0.5 sm:space-y-1">
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-luxury-gold-300 font-bold">
                  Collection
                </span>
                <h3 className="text-sm sm:text-xl font-serif text-white font-semibold tracking-wide truncate">
                  {cat.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Featured Watch Items Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
            Timeless Bestsellers
          </h2>
          <p className="text-xs text-luxury-charcoal-500 max-w-md mx-auto leading-relaxed">
            Our most requested and highly rated mechanical pieces.
          </p>
        </div>

        {/* Dynamic Database Watch Check (Golden Rule) */}
        {featuredProducts.length === 0 ? (
          <EmptyState 
            title="No Featured Timepieces"
            message="We are currently curating new additions to our collection. Check back soon."
            actionLabel="View All Watches"
            onActionClick={() => navigate('/shop')}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8">
            {featuredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="group bg-white rounded-2xl border border-luxury-cream-300 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col text-left cursor-pointer"
              >
                {/* Watch Photo Display */}
                <div className="relative h-44 sm:h-72 bg-luxury-cream-200 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.discountPrice && (
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-luxury-charcoal-900 text-luxury-gold-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded shadow">
                      Special Offer
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 sm:p-5 flex-grow flex flex-col justify-between space-y-2 sm:space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-luxury-gold-600">
                      {product.brand}
                    </span>
                    <h3 className="font-serif text-base font-semibold text-luxury-charcoal-900 group-hover:text-luxury-gold-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline space-x-2 pt-2 border-t border-luxury-cream-200">
                    {product.discountPrice ? (
                      <>
                        <span className="font-mono font-bold text-base text-luxury-charcoal-900">
                          ₹{product.discountPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-luxury-charcoal-300 font-mono line-through">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono font-bold text-base text-luxury-charcoal-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-6">
          <Link to="/shop">
            <Button variant="outline" size="md">
              View Complete Catalog
            </Button>
          </Link>
        </div>
      </section>

      {/* 5. The Wristora Client Privileges & Guarantees */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-luxury-gold-600">
            The Wristora Advantage
          </span>
          <h2 className="text-2xl md:text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
            Acquisition Privileges &amp; Guarantees
          </h2>
          <p className="text-xs text-luxury-charcoal-500 max-w-md mx-auto leading-relaxed">
            Every acquisition through Wristora is backed by real-world guarantees of authenticity, security, and lifelong collector support.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
          {collectorGuarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="bg-luxury-cream-50 p-6 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="w-11 h-11 rounded-xl bg-luxury-gold-500/10 border border-luxury-gold-500/30 flex items-center justify-center text-luxury-gold-600">
                  <Icon size={22} />
                </div>
                <h3 className="font-serif text-base font-bold text-luxury-charcoal-900">
                  {item.title}
                </h3>
                <p className="text-xs text-luxury-charcoal-500 font-sans leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-center">
          <Link 
            to="/warranty" 
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-bold text-luxury-gold-600 hover:text-luxury-gold-700 transition-colors"
          >
            <span>Read Our Complete Horological Assurance &amp; Warranty Protocol</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* 6. Live Connoisseur Voices & Provenance Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-10">
        <div className="text-center space-y-2 px-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-luxury-gold-600">
            Collector Provenance
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
            Voices of the Connoisseur Circle
          </h2>
          <p className="text-xs text-luxury-charcoal-500 max-w-md mx-auto leading-relaxed">
            Acquisitions verified and delivered to distinguished collectors across the globe.
          </p>
        </div>

        {/* Desktop Grid: 3 columns with clean pagination */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {visibleReviews.map((review, idx) => (
            <ReviewCard 
              key={review.id || idx} 
              review={review} 
              onWatchClick={(id) => navigate(`/product/${id}`)} 
            />
          ))}
        </div>

        {/* Mobile Horizontal Snap Carousel: touch-friendly, cards peek into view */}
        <div className="md:hidden">
          <div 
            ref={mobileCarouselRef}
            onScroll={handleMobileScroll}
            className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 no-scrollbar -mx-4 px-4 text-left"
          >
            {displayedReviews.map((review, idx) => (
              <div 
                key={review.id || idx} 
                className="shrink-0 w-[84vw] max-w-[325px] snap-center flex flex-col"
              >
                <ReviewCard 
                  review={review} 
                  isMobile={true} 
                  onWatchClick={(id) => navigate(`/product/${id}`)} 
                />
              </div>
            ))}
          </div>

          {/* Mobile Carousel Indicators & Next/Prev Controls */}
          {displayedReviews.length > 1 && (
            <div className="flex items-center justify-between pt-3 px-1">
              <div className="flex items-center gap-1.5">
                {displayedReviews.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => scrollToMobileReview(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeMobileReview === idx ? 'w-5 bg-luxury-gold-600' : 'w-1.5 bg-luxury-cream-300'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollToMobileReview(Math.max(0, activeMobileReview - 1))}
                  disabled={activeMobileReview === 0}
                  className="w-8 h-8 rounded-full border border-luxury-cream-300 bg-white flex items-center justify-center text-luxury-charcoal-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs active:scale-95 transition-all cursor-pointer"
                  title="Previous review"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToMobileReview(Math.min(displayedReviews.length - 1, activeMobileReview + 1))}
                  disabled={activeMobileReview >= displayedReviews.length - 1}
                  className="w-8 h-8 rounded-full border border-luxury-cream-300 bg-white flex items-center justify-center text-luxury-charcoal-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs active:scale-95 transition-all cursor-pointer"
                  title="Next review"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Pagination navigation controls if more than 3 reviews */}
        {displayedReviews.length > 3 && (
          <div className="hidden md:flex items-center justify-center space-x-3 pt-2">
            <button 
              type="button"
              onClick={() => setReviewIndex(prev => Math.max(0, prev - 1))}
              disabled={reviewIndex === 0}
              className="p-2 rounded-full border border-luxury-cream-300 bg-white text-luxury-charcoal-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-luxury-cream-100 transition-colors shadow-2xs cursor-pointer"
              title="Previous reviews"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-mono text-luxury-charcoal-500">
              {reviewIndex + 1}–{Math.min(reviewIndex + 3, displayedReviews.length)} of {displayedReviews.length}
            </span>
            <button 
              type="button"
              onClick={() => setReviewIndex(prev => Math.min(displayedReviews.length - 3, prev + 1))}
              disabled={reviewIndex >= displayedReviews.length - 3}
              className="p-2 rounded-full border border-luxury-cream-300 bg-white text-luxury-charcoal-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-luxury-cream-100 transition-colors shadow-2xs cursor-pointer"
              title="Next reviews"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <Link 
            to="/shop" 
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest font-bold text-luxury-gold-600 hover:text-luxury-gold-700 transition-colors"
          >
            <span>Explore All Certified Timepieces</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}

export default Home;
