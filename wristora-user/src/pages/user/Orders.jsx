import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Star, 
  ExternalLink, 
  Calendar, 
  CheckCircle, 
  PackageCheck, 
  Eye, 
  Truck, 
  Clock, 
  Copy, 
  Check, 
  XCircle, 
  AlertTriangle,
  Sparkles,
  Search,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { getAllOrders, updateOrderStatus, trackOrderById, getOrderTimestamp, creditUserWallet } from '../../firebase/dbService';
import { formatDate } from '../../utils/dateFormatter';

/**
 * Orders Page Component
 * 
 * Lists customer order receipts from Firestore database in a clean table.
 * Integrates interactive modal viewports for viewing itemized invoice logs.
 */
function Orders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Handle Copying Order ID to clipboard with visual feedback
  const handleCopyOrderId = (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    const textToCopy = id.startsWith('#') ? id : `#${id}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedOrderId(id);
    setToastMessage(`Copied Order ID ${textToCopy} to clipboard!`);
    setTimeout(() => setCopiedOrderId(null), 2000);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Track by Order ID Concierge Search State
  const [trackerQuery, setTrackerQuery] = useState('');
  const [isSearchingTracker, setIsSearchingTracker] = useState(false);
  const [trackerError, setTrackerError] = useState('');

  // Calculate dynamic delivery ETA and progress bar metrics
  const calculateDeliveryMetrics = (order) => {
    if (!order) return { daysRemaining: 0, progressPct: 0, stage: 1, label: 'Ordered' };

    const status = (order.status || 'Processing').toLowerCase();
    
    if (status === 'cancelled') {
      return { daysRemaining: 0, progressPct: 0, stage: 0, label: 'Order Cancelled', isCancelled: true };
    }
    
    if (status === 'delivered') {
      return { daysRemaining: 0, progressPct: 100, stage: 3, label: 'Delivered', isDelivered: true };
    }

    const now = new Date();
    let targetEta;
    
    if (order.estimatedDeliveryDate) {
      targetEta = new Date(order.estimatedDeliveryDate);
    } else {
      const createdTime = order.createdAt ? new Date(order.createdAt).getTime() : now.getTime();
      targetEta = new Date(createdTime + 10 * 24 * 60 * 60 * 1000);
    }

    const diffMs = targetEta.getTime() - now.getTime();
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (status === 'shipped') {
      const shippedDays = Math.min(diffDays, 6);
      return { daysRemaining: shippedDays, progressPct: 50, stage: 2, label: `${shippedDays} Days Left (In Transit)` };
    }

    const procDays = Math.min(diffDays, 10);
    return { daysRemaining: procDays, progressPct: 0, stage: 1, label: `${procDays} Days to Delivery` };
  };

  // Arrival Alert Banner Helper
  const renderArrivalAlertBanner = (order) => {
    if (!order || order.status === 'Cancelled' || order.status === 'Delivered') return null;

    const alertStatus = order.deliveryNoticeStatus || 'ON_TIME';
    const customMsg = order.deliveryNoticeMessage;

    if (alertStatus === 'EARLY') {
      return (
        <div className="px-3 py-2 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-emerald-500/30 rounded-xl text-emerald-900 text-[10.5px] font-bold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles size={14} className="text-amber-500 shrink-0 animate-pulse" />
            <span className="truncate">{customMsg || '⚡ Arriving 2 Days Ahead of Schedule! Fast-tracked by Atelier.'}</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-700 text-white rounded-md font-mono text-[9px] uppercase tracking-wider shrink-0">
            Expedited
          </span>
        </div>
      );
    }

    if (alertStatus === 'DELAYED') {
      return (
        <div className="px-3 py-2 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-[10.5px] font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <span className="truncate">{customMsg || '⚠️ Armored Customs Clearance Inspection (+2 Days Added)'}</span>
          </div>
          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md font-mono text-[9px] uppercase tracking-wider shrink-0 font-bold">
            Logistics Note
          </span>
        </div>
      );
    }

    return (
      <div className="px-3 py-1.5 bg-luxury-cream-100/90 border border-luxury-cream-300 rounded-xl text-luxury-charcoal-700 text-[10px] font-medium flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Truck size={13} className="text-luxury-charcoal-500 shrink-0" />
          <span className="truncate">{customMsg || '🚚 Transit normal — On schedule for delivery'}</span>
        </div>
        <span className="text-[9px] font-bold text-luxury-gold-600 uppercase tracking-widest shrink-0">
          On Schedule
        </span>
      </div>
    );
  };

  // 3-Stage Stepper Component (Ordered -> Shipped -> Delivered)
  const OrderTimelineStepper = ({ order, compact = false }) => {
    const metrics = calculateDeliveryMetrics(order);
    const stages = [
      { label: 'Ordered', sub: 'Confirmed' },
      { label: 'Shipped', sub: 'Armored Courier' },
      { label: 'Delivered', sub: 'Collector Vault' }
    ];

    if (metrics.isCancelled) {
      return (
        <div className={`py-1 px-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[10.5px] font-medium flex items-center gap-1.5 ${compact ? '' : 'my-1'}`}>
          <XCircle size={13} className="text-red-600 shrink-0" />
          <span>Cancelled & Refunded</span>
        </div>
      );
    }

    if (compact) {
      return (
        <div className="space-y-1.5 py-0.5 min-w-[200px]">
          <div className="flex items-center justify-between text-[11px] gap-2">
            <span className="font-bold text-luxury-charcoal-900 flex items-center gap-1 truncate">
              <Clock size={12} className="text-luxury-gold-600 shrink-0" />
              {metrics.label}
            </span>
          </div>
          
          {/* Sleek 3px Progress Line */}
          <div className="w-full bg-luxury-cream-200 h-1.5 rounded-full overflow-hidden border border-luxury-cream-300/60">
            <div 
              className="bg-gradient-to-r from-luxury-gold-400 via-luxury-gold-500 to-luxury-charcoal-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.progressPct}%` }}
            />
          </div>

          {/* Minimal 3-Stage Step Labels */}
          <div className="flex justify-between text-[8.5px] text-luxury-charcoal-400 font-medium">
            <span className={metrics.stage >= 1 ? 'text-luxury-charcoal-900 font-bold' : ''}>Ordered</span>
            <span className={metrics.stage >= 2 ? 'text-luxury-charcoal-900 font-bold' : ''}>Shipped</span>
            <span className={metrics.stage >= 3 ? 'text-luxury-charcoal-900 font-bold' : ''}>Delivered</span>
          </div>
        </div>
      );
    }

    return (
      <div className="py-3 px-4 bg-luxury-cream-100/60 border border-luxury-cream-300/80 rounded-xl space-y-3">
        {/* Progress Bar Header */}
        <div className="flex justify-between items-center text-[10.5px]">
          <span className="font-bold text-luxury-charcoal-700 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={13} className="text-luxury-gold-600" /> Fulfillment Timeline
          </span>
          <span className="font-mono font-bold text-luxury-charcoal-900 bg-white border border-luxury-cream-300 px-2.5 py-0.5 rounded-md shadow-2xs">
            {metrics.label}
          </span>
        </div>

        {/* Stepper with connecting line */}
        <div className="relative pt-1 pb-1">
          {/* Connecting Line behind circles */}
          <div className="absolute top-3.5 left-[16%] right-[16%] h-0.5 bg-luxury-cream-300 z-0">
            <div 
              className="h-full bg-gradient-to-r from-luxury-gold-400 to-luxury-charcoal-900 transition-all duration-500" 
              style={{ width: `${Math.max(0, (metrics.stage - 1) / 2 * 100)}%` }}
            />
          </div>

          {/* 3 Stage Nodes */}
          <div className="grid grid-cols-3 gap-1 relative z-10 text-center">
            {stages.map((st, idx) => {
              const isDone = metrics.stage > idx + 1 || metrics.isDelivered;
              const isCurrent = metrics.stage === idx + 1 && !metrics.isDelivered;
              
              return (
                <div key={idx} className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                    isDone 
                      ? 'bg-luxury-charcoal-900 text-luxury-gold-300 shadow-2xs ring-2 ring-luxury-cream-300' 
                      : isCurrent 
                      ? 'bg-luxury-gold-500 text-white ring-4 ring-luxury-gold-200/80 shadow-2xs' 
                      : 'bg-white text-luxury-charcoal-400 border border-luxury-cream-300'
                  }`}>
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 leading-tight ${isCurrent ? 'text-luxury-charcoal-900' : isDone ? 'text-luxury-charcoal-800' : 'text-luxury-charcoal-400'}`}>
                    {st.label}
                  </span>
                  <span className="text-[8px] text-luxury-charcoal-400 hidden sm:block mt-0.5">
                    {st.sub}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleCopyTracking = (trackingNum, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trackingNum);
    setCopiedTrackingId(trackingNum);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  const handleConfirmCancelUserOrder = async () => {
    if (!cancelTargetOrder) return;
    const orderId = cancelTargetOrder.id;
    const refundAmount = Number(cancelTargetOrder.amount) || 0;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled' } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: 'Cancelled' }));
    }

    try {
      await updateOrderStatus(orderId, 'Cancelled');
      if (refundAmount > 0) {
        await creditUserWallet(
          currentUser?.uid,
          currentUser?.email,
          refundAmount,
          `Instant Refund for Cancelled Order #${orderId}`,
          orderId
        );
      }
      setToastMessage(`Order #${orderId} cancelled! ₹${refundAmount.toLocaleString('en-IN')} deposited to your Wristora Vault Wallet.`);
      setTimeout(() => setToastMessage(''), 5500);
    } catch (err) {
      console.error('Failed cancelling order:', err);
    } finally {
      setCancelTargetOrder(null);
    }
  };

  // Concierge Order Lookup Handler
  const handleConciergeLookup = async (e) => {
    e.preventDefault();
    if (!trackerQuery.trim()) return;
    setIsSearchingTracker(true);
    setTrackerError('');

    try {
      if (filteredOrders.length > 0) {
        setSelectedOrder(filteredOrders[0]);
        setIsModalOpen(true);
      } else {
        const match = await trackOrderById(trackerQuery.trim());
        if (match) {
          setSelectedOrder(match);
          setIsModalOpen(true);
        } else {
          setTrackerError(`No active order found matching "${trackerQuery}". Please check your Order ID.`);
        }
      }
    } catch (err) {
      console.error('Error looking up order:', err);
      setTrackerError('Failed to lookup order. Please try again.');
    } finally {
      setIsSearchingTracker(false);
    }
  };

  // Load orders from Firestore database sorted date/time newest-first
  useEffect(() => {
    const fetchUserOrders = async () => {
      try {
        const all = await getAllOrders();
        const userOrders = all.filter(o => 
          !currentUser || 
          o.userId === currentUser.uid || 
          o.customer?.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
          currentUser.email === 'collector@wristora.com' ||
          currentUser.email === 'wristora@gmail.com' ||
          currentUser.email === 'admin@wristora.com'
        );
        const listToUse = userOrders.length > 0 ? userOrders : all;
        const sortedList = [...listToUse].sort((a, b) => {
          const timeA = getOrderTimestamp(a);
          const timeB = getOrderTimestamp(b);
          if (timeA !== timeB) return timeB - timeA;
          const numA = String(a.id || '').replace(/\D/g, '');
          const numB = String(b.id || '').replace(/\D/g, '');
          if (numA && numB) return parseInt(numB, 10) - parseInt(numA, 10);
          return 0;
        });
        setOrders(sortedList);
      } catch (err) {
        console.error('Failed fetching user orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserOrders();
  }, [currentUser]);

  // Real-Time Filtered Orders Logic (handles copy-pasted & typed search queries)
  const filteredOrders = orders.filter((order) => {
    const rawSearch = trackerQuery.trim().toLowerCase();
    if (!rawSearch) return true;

    const cleanSearch = rawSearch.replace(/^#/, '');
    const orderIdLower = (order.id || '').toLowerCase();
    const fullHashId = `#${orderIdLower}`;
    const trackingLower = (order.trackingNumber || '').toLowerCase();
    const customerName = (order.customer?.name || '').toLowerCase();
    const customerEmail = (order.customer?.email || '').toLowerCase();

    return (
      orderIdLower.includes(cleanSearch) ||
      fullHashId.includes(rawSearch) ||
      trackingLower.includes(cleanSearch) ||
      customerName.includes(rawSearch) ||
      customerEmail.includes(rawSearch) ||
      order.items?.some(i => (i.name || '').toLowerCase().includes(rawSearch))
    );
  });

  // Status Badge styling helper
  const getStatusStyle = (status) => {
    const statuses = {
      delivered: 'bg-green-100 text-green-700 border-green-200',
      shipped: 'bg-blue-100 text-blue-700 border-blue-200',
      processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    return statuses[status.toLowerCase()] || 'bg-luxury-cream-200 text-luxury-charcoal-500';
  };

  // Open Details Handler
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Close Handler
  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Retrieving Collector Purchase History..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-24 sm:pb-12 text-left space-y-6 sm:space-y-8 font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-luxury-charcoal-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-luxury-gold-500/40 text-xs flex items-center space-x-2">
          <CheckCircle size={15} className="text-luxury-gold-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Concierge Tracker Search Widget */}
      <div className="border-b border-luxury-cream-300 pb-4 sm:pb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif text-luxury-charcoal-900 font-semibold tracking-wide">
              My Orders & Acquisitions
            </h2>
            <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
              Review live dispatch manifests, tracking dossiers, and estimated delivery dates.
            </p>
          </div>

          {/* Concierge Track Order Search Box */}
          <form onSubmit={handleConciergeLookup} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="#ORD-XXXX"
                value={trackerQuery}
                onChange={(e) => {
                  setTrackerQuery(e.target.value);
                  if (trackerError) setTrackerError('');
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500 shadow-2xs font-mono"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
            </div>
            <button
              type="submit"
              disabled={isSearchingTracker || !trackerQuery.trim()}
              className="px-4 py-2 bg-luxury-charcoal-900 hover:bg-black text-luxury-gold-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-2xs disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              {isSearchingTracker ? (
                <span className="animate-spin text-xs">⌛</span>
              ) : (
                <>
                  <Truck size={13} />
                  <span>Track</span>
                </>
              )}
            </button>
          </form>
        </div>

        {trackerError && (
          <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
            {trackerError}
          </p>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-12">
          <EmptyState
            title={orders.length === 0 ? "No orders found" : "No matching orders found"}
            message={orders.length === 0 ? "You have not acquired any luxury timepieces yet." : `No active orders match "${trackerQuery}".`}
            actionLabel={orders.length === 0 ? "Discover Collection" : "Clear Search"}
            onActionClick={() => {
              if (orders.length === 0) window.location.href = '/shop';
              else setTrackerQuery('');
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Ticket View (< md) */}
          <div className="md:hidden space-y-2.5">
            {filteredOrders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-xl border border-luxury-cream-300 shadow-2xs overflow-hidden text-left"
              >
                {/* Top Ticket Header */}
                <div className="px-3 py-2 bg-luxury-cream-50/80 border-b border-luxury-cream-200 flex justify-between items-center">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-luxury-charcoal-900 text-luxury-gold-300 flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                      #
                    </div>
                    <div className="min-w-0 flex items-center space-x-1">
                      <span className="font-mono font-bold text-[11px] text-luxury-charcoal-900 block leading-tight truncate">
                        #{order.id}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyOrderId(order.id, e)}
                        className="p-1 text-luxury-charcoal-400 hover:text-luxury-gold-600 hover:bg-luxury-cream-200 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Copy Order ID to clipboard"
                      >
                        {copiedOrderId === order.id ? (
                          <Check size={11} className="text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <Copy size={11} className="opacity-70" />
                        )}
                      </button>
                    </div>
                    <span className="text-[9.5px] text-luxury-charcoal-500 font-medium block">
                      {formatDate(order.date)}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider border shrink-0 ${getStatusStyle(order.status || 'Processing')}`}>
                    {order.status || 'Processing'}
                  </span>
                </div>

                {/* Arrival Notice & Live Stepper */}
                <div className="p-3 pb-1 space-y-2">
                  {renderArrivalAlertBanner(order)}
                  <OrderTimelineStepper order={order} />
                </div>

                {/* Allocated Items List */}
                <div className="px-3 py-2 space-y-2">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-11 h-11 rounded-lg object-cover border border-luxury-cream-200 shrink-0 bg-luxury-cream-100" 
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        {item.brand && (
                          <span className="text-[7.5px] uppercase tracking-widest text-luxury-gold-600 font-bold block leading-tight">
                            {item.brand}
                          </span>
                        )}
                        <p className="font-bold text-[11.5px] text-luxury-charcoal-900 truncate leading-snug">
                          {item.name || 'Timepiece'}
                        </p>
                        <div className="flex items-center justify-between text-[9.5px] text-luxury-charcoal-500 mt-0.5">
                          <span>Qty: {item.quantity || 1}</span>
                          <span className="font-mono font-bold text-[11px] text-luxury-charcoal-900">
                            ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Armored Courier & Tracking Box */}
                {order.trackingNumber && (
                  <div className="mx-3 mb-2 px-2.5 py-1.5 bg-luxury-cream-100/70 rounded-lg border border-luxury-cream-200 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <Truck size={12} className="text-luxury-charcoal-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[7.5px] uppercase font-bold tracking-wider text-luxury-charcoal-500 block leading-tight">BlueDart Armored</span>
                        <span className="font-mono font-bold text-[10px] text-luxury-charcoal-900 truncate block">{order.trackingNumber}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleCopyTracking(order.trackingNumber, e)}
                      className="px-2 py-0.5 bg-white border border-luxury-cream-300 rounded-md text-[9px] font-bold text-luxury-charcoal-800 hover:bg-luxury-cream-200 transition-colors cursor-pointer flex items-center space-x-1 shrink-0 ml-2"
                      title="Copy tracking code"
                    >
                      {copiedTrackingId === order.trackingNumber ? (
                        <>
                          <Check size={10} className="text-green-600" />
                          <span className="text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Card Footer: Amount & Action */}
                <div className="px-3 py-2 bg-luxury-cream-50/50 border-t border-luxury-cream-200 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[7.5px] uppercase font-bold tracking-wider text-luxury-charcoal-400 block leading-tight">Settled Total</span>
                    <span className="font-mono font-bold text-xs text-luxury-charcoal-900">
                      ₹{(Number(order.amount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {order.status === 'Processing' && (
                      <button
                        onClick={() => setCancelTargetOrder(order)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1"
                        title="Cancel Order"
                      >
                        <XCircle size={11} />
                        <span>Cancel</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenDetails(order)}
                      className="px-3 py-1 bg-luxury-charcoal-900 hover:bg-black text-luxury-gold-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-1 shadow-2xs"
                    >
                      <Eye size={11} />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-luxury-cream-50 rounded-xl border border-luxury-cream-300 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-luxury-cream-100 text-luxury-charcoal-600 border-b border-luxury-cream-300 uppercase tracking-widest text-[9.5px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Allocated Items</th>
                    <th className="py-3 px-4">Order-Track</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Fulfillment Status</th>
                    <th className="py-3 px-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-cream-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-luxury-cream-100/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-luxury-charcoal-900 text-xs whitespace-nowrap min-w-[130px]">
                        <div className="flex items-center space-x-1.5 whitespace-nowrap">
                          <span className="whitespace-nowrap">#{order.id}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyOrderId(order.id, e)}
                            className="p-1 text-luxury-charcoal-400 hover:text-luxury-gold-600 hover:bg-luxury-cream-200 rounded-md transition-colors cursor-pointer shrink-0"
                            title="Copy Order ID to clipboard"
                          >
                            {copiedOrderId === order.id ? (
                              <Check size={12} className="text-emerald-600 stroke-[2.5]" />
                            ) : (
                              <Copy size={12} className="opacity-60 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-luxury-charcoal-600 text-[11.5px]">
                        {formatDate(order.date)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-luxury-charcoal-800 text-[11.5px]">
                        {(order.items || []).map((i) => `${i.quantity || 1}x ${i.name || 'Timepiece'}`).join(', ')}
                      </td>
                      <td className="py-3 px-4">
                        <OrderTimelineStepper order={order} compact={true} />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-luxury-charcoal-900 text-xs">
                        ₹{(Number(order.amount) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusStyle(order.status || 'Processing')}`}>
                          {order.status || 'Processing'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === 'Processing' && (
                            <button
                              onClick={() => setCancelTargetOrder(order)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Cancel Order"
                            >
                              <XCircle size={11} />
                              <span>Cancel</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetails(order)}
                            className="px-2.5 py-1 bg-white hover:bg-luxury-cream-200 border border-luxury-cream-300 text-luxury-charcoal-800 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Eye size={11} />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Item Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseDetails}
          size="lg"
          title={`Live Tracking Dossier #${selectedOrder.id}`}
        >
          <div className="space-y-5 text-left text-xs font-sans">
            
            {/* Header info */}
            <div className="flex flex-wrap justify-between items-center bg-luxury-cream-100 p-4 rounded-xl border border-luxury-cream-300 gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-luxury-charcoal-400 font-bold">Order Reference</p>
                <div className="flex items-center space-x-1 font-mono font-bold text-luxury-charcoal-900 text-xs mt-0.5">
                  <span>#{selectedOrder.id}</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyOrderId(selectedOrder.id, e)}
                    className="p-1 text-luxury-charcoal-400 hover:text-luxury-gold-600 hover:bg-luxury-cream-200 rounded-md transition-colors cursor-pointer"
                    title="Copy Order ID to clipboard"
                  >
                    {copiedOrderId === selectedOrder.id ? (
                      <Check size={12} className="text-emerald-600 stroke-[2.5]" />
                    ) : (
                      <Copy size={12} className="opacity-70 hover:opacity-100" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-luxury-charcoal-400 font-bold">Transaction Date</p>
                <p className="font-bold text-luxury-charcoal-900 mt-0.5">{formatDate(selectedOrder.date)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-luxury-charcoal-400 font-bold">Status</p>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block mt-0.5 ${getStatusStyle(selectedOrder.status || 'Processing')}`}>
                  {selectedOrder.status || 'Processing'}
                </span>
              </div>
            </div>

            {/* Arrival Notice Banner */}
            {renderArrivalAlertBanner(selectedOrder)}

            {/* Live 4-Stage Stepper */}
            <OrderTimelineStepper order={selectedOrder} />

            {/* Carrier Tracking ID */}
            {selectedOrder.trackingNumber && (
              <div className="p-3 bg-white border border-luxury-cream-300 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-luxury-charcoal-400 font-bold block">
                    BlueDart Tracking Number
                  </span>
                  <span className="font-mono font-bold text-xs text-luxury-charcoal-900">
                    {selectedOrder.trackingNumber}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  Armored Dispatch
                </span>
              </div>
            )}

            {/* Purchased Items List */}
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest font-bold text-luxury-charcoal-900 pb-2 border-b border-luxury-cream-200">
                Delivered Watch Units
              </p>
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-luxury-cream-200">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-lg object-cover border border-luxury-cream-200"
                    />
                    <div>
                      <h4 className="font-bold text-luxury-charcoal-900 text-xs">{item.name}</h4>
                      <p className="text-[10px] text-luxury-charcoal-400">Qty: {item.quantity || 1} • Standard Luxury Packing</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-luxury-charcoal-900">
                    ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Breakdown */}
            <div className="border-t border-luxury-cream-300 pt-3 space-y-1.5 text-xs text-luxury-charcoal-600">
              <div className="flex justify-between items-center">
                <span>Armored Vault Transition:</span>
                <span className="text-green-700 font-bold uppercase text-[10px] tracking-wider">Free (Complimentary)</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-luxury-charcoal-900 pt-1 border-t border-luxury-cream-200">
                <span>Grand Total Settled:</span>
                <span className="font-mono font-bold text-base">₹{(Number(selectedOrder.amount) || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Status Context Banner */}
            {selectedOrder.status === 'Processing' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-amber-900">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-amber-600 shrink-0" />
                  <span className="text-[11px]">Preparation underway. You may cancel before armored dispatch.</span>
                </div>
                <button
                  onClick={() => {
                    const ord = selectedOrder;
                    handleCloseDetails();
                    setCancelTargetOrder(ord);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer shrink-0 inline-flex items-center gap-1 transition-colors"
                >
                  <XCircle size={12} /> Cancel Order
                </button>
              </div>
            )}

            {selectedOrder.status === 'Shipped' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-900 text-[11px]">
                <Truck size={15} className="text-blue-600 shrink-0" />
                <span>Dispatched via BlueDart Armored Courier. On its way to your destination.</span>
              </div>
            )}

            {selectedOrder.status === 'Delivered' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-900 text-[11px] font-semibold">
                <CheckCircle size={15} className="text-green-600 shrink-0" />
                <span>Timepiece delivered and verified into your permanent collection.</span>
              </div>
            )}

            {selectedOrder.status === 'Cancelled' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-900 text-[11px] font-semibold">
                <XCircle size={15} className="text-red-600 shrink-0" />
                <span>This acquisition was cancelled and fully refunded to your payment method.</span>
              </div>
            )}

            <Button onClick={handleCloseDetails} variant="primary" size="md" className="w-full justify-center">
              Close Order Detail
            </Button>

          </div>
        </Modal>
      )}

      {/* Customer Order Cancellation Modal */}
      {cancelTargetOrder && (
        <Modal
          isOpen={!!cancelTargetOrder}
          onClose={() => setCancelTargetOrder(null)}
          size="md"
          title={`Cancel Order #${cancelTargetOrder.id}`}
        >
          <div className="space-y-4 text-left text-xs font-sans">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle size={16} className="text-red-600" /> Confirm Order Cancellation
              </p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Are you sure you want to cancel your acquisition of{' '}
                <span className="font-bold">
                  {(cancelTargetOrder.items || []).map(i => `${i.quantity || 1}x ${i.name || 'Timepiece'}`).join(', ')}
                </span>?
              </p>
              <p className="text-[10px] text-red-600">
                Your settlement of <span className="font-mono font-bold">₹{(Number(cancelTargetOrder.amount) || 0).toLocaleString('en-IN')}</span> will be refunded immediately.
              </p>
            </div>

            <div className="flex space-x-3 pt-3 border-t border-luxury-cream-200">
              <Button
                variant="outline"
                onClick={() => setCancelTargetOrder(null)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Keep Order
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmCancelUserOrder}
                className="flex-1 justify-center text-xs uppercase font-bold bg-red-600 hover:bg-red-700"
              >
                <XCircle size={13} className="mr-1.5" /> Yes, Cancel Acquisition
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default Orders;
