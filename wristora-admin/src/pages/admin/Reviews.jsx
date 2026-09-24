import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Eye, 
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { getAllReviews, updateReviewStatus, deleteReview, getProducts } from '../../firebase/dbService';
import { formatDate } from '../../utils/dateFormatter';

const DEFAULT_REVIEW_WATCH_IMAGE = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400';

/**
 * AdminReviews Component
 * 
 * Collector Review Moderation Hub:
 * - Review verification and approval queue connected to live Database.
 * - Star rating breakdown and sentiment analytics.
 * - Quick approve, flag, or delete actions with feedback notifications.
 */
function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Fetch reviews on mount with automatic watch image resolution
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [data, products] = await Promise.all([
          getAllReviews(),
          getProducts().catch(() => [])
        ]);

        // Map products by ID and lowercase name for instant lookup
        const productMap = {};
        (products || []).forEach(p => {
          if (p.id) productMap[p.id] = p;
          if (p.name) productMap[p.name.toLowerCase().trim()] = p;
        });

        // Enrich any reviews that might be missing a valid watchImage
        const enriched = (data || []).map(r => {
          const matched = productMap[r.watchId] || productMap[r.watchName?.toLowerCase()?.trim()];
          const resolvedImg = r.watchImage || matched?.image || (matched?.images && matched.images[0]) || DEFAULT_REVIEW_WATCH_IMAGE;
          return {
            ...r,
            watchImage: resolvedImg
          };
        });

        setReviews(enriched);
      } catch (err) {
        console.error('Error fetching admin reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Moderation Handlers
  const handleApprove = async (reviewId) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'Published' } : r));
    await updateReviewStatus(reviewId, 'Published');
    setToastMessage(`Review #${reviewId} approved and published to storefront.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleFlag = async (reviewId) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'Flagged' } : r));
    await updateReviewStatus(reviewId, 'Flagged');
    setToastMessage(`Review #${reviewId} moved to flagged queue.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleDelete = async (reviewId) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    await deleteReview(reviewId);
    setToastMessage(`Review #${reviewId} permanently deleted.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter Logic
  const filteredReviews = reviews.filter((review) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      (review.watchName || '').toLowerCase().includes(term) ||
      (review.customerName || '').toLowerCase().includes(term) ||
      (review.comment || '').toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || review.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : '5.0';
  const pendingCount = reviews.filter(r => r.status === 'Pending').length;

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Loading Collector Reviews & Moderation Log..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto text-left font-sans">
      
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
              Collector Reviews Moderation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-luxury-charcoal-900 text-luxury-gold-300">
              {reviews.length} Reviews
            </span>
          </div>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
            Moderate timepiece testimonials, verify authenticity badges, and maintain store credibility.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-luxury-cream-100 px-4 py-2 rounded-xl border border-luxury-cream-300 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center space-x-1.5">
            <Star size={16} className="text-luxury-gold-500 fill-luxury-gold-500" />
            <span className="font-mono font-bold text-sm text-luxury-charcoal-900">{averageRating} / 5.0</span>
          </div>
          <span className="text-[10px] text-luxury-charcoal-500 uppercase tracking-wider font-bold">Store Average</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-luxury-cream-50 p-4 rounded-2xl border border-luxury-cream-300 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search by watch, collector name, or text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['All', 'Published', 'Pending', 'Flagged'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-luxury-charcoal-900 text-white shadow-2xs'
                  : 'bg-white text-luxury-charcoal-600 hover:bg-luxury-cream-200 border border-luxury-cream-300'
              }`}
            >
              {status}
              {status === 'Pending' && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Cards Feed */}
      {filteredReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div 
              key={review.id}
              className="bg-luxury-cream-50 p-4 sm:p-6 rounded-2xl border border-luxury-cream-300 shadow-2xs space-y-4 hover:border-luxury-charcoal-300 transition-colors"
            >
              {/* Card Top: Watch info + Status Badge */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-luxury-cream-200">
                <div className="flex items-center space-x-3 min-w-0">
                  <img 
                    src={review.watchImage || DEFAULT_REVIEW_WATCH_IMAGE} 
                    alt={review.watchName || 'Watch'} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_REVIEW_WATCH_IMAGE;
                    }}
                    className="w-12 h-12 rounded-xl object-cover border border-luxury-cream-300 shadow-2xs shrink-0" 
                  />

                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-luxury-gold-600 block">
                      {review.watchBrand}
                    </span>
                    <h3 className="text-xs font-bold text-luxury-charcoal-900 truncate">
                      {review.watchName}
                    </h3>
                    <p className="text-[10px] text-luxury-charcoal-400">Review Ref: #{review.id} • {formatDate(review.date)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    review.status === 'Published'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : review.status === 'Pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {review.status}
                  </span>
                </div>
              </div>

              {/* Rating & Testimonial Content */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="flex text-luxury-gold-500 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        className={i < review.rating ? 'fill-luxury-gold-500' : 'text-luxury-cream-300'} 
                      />
                    ))}
                  </div>
                  <span className="font-bold text-luxury-charcoal-900 text-xs truncate">{review.title}</span>
                </div>

                <p className="text-xs text-luxury-charcoal-600 leading-relaxed font-sans">
                  "{review.comment}"
                </p>
              </div>

              {/* Card Footer: Collector attribution & Actions */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-3 border-t border-luxury-cream-200">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-luxury-charcoal-500">
                  <span className="font-bold text-luxury-charcoal-800">{review.customerName}</span>
                  <span className="text-luxury-charcoal-400">({review.customerEmail})</span>
                  {review.verifiedPurchase && (
                    <span className="inline-flex items-center text-green-700 text-[10px] font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <ShieldCheck size={11} className="mr-1" />
                      Verified
                    </span>
                  )}
                  <span>•</span>
                  <span className="flex items-center text-luxury-charcoal-400">
                    <ThumbsUp size={11} className="mr-1" />
                    {review.helpfulVotes} helpful
                  </span>
                </div>

                {/* Moderation Action Buttons */}
                <div className="flex items-center space-x-2 justify-end">
                  {review.status !== 'Published' && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  )}

                  {review.status !== 'Flagged' && (
                    <button
                      onClick={() => handleFlag(review.id)}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Flag
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-1.5 text-luxury-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-luxury-cream-50 p-12 rounded-2xl border border-luxury-cream-300 text-center">
          <EmptyState
            title="No Reviews Found"
            message="No collector reviews match your selected filter criteria."
            actionLabel="Reset Status Filters"
            onActionClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
          />
        </div>
      )}

    </div>
  );
}

export default AdminReviews;
