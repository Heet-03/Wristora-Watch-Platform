import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Eye, 
  Printer, 
  ShieldCheck, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Package, 
  ExternalLink, 
  ChevronDown, 
  XCircle, 
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Hash,
  Copy,
  Check
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { getAllOrders, updateOrderStatus, updateOrderTracking, updateOrderLogistics, getOrderTimestamp, creditUserWallet } from '../../firebase/dbService';
import { formatDate } from '../../utils/dateFormatter';

/**
 * AdminOrders Component (Mockup 17)
 * 
 * Central Order Fulfillment & Logistics Hub connected to Firestore:
 * - Real-time order pipeline management (Processing -> Shipped -> Delivered -> Cancelled).
 * - Customer shipping address and contact inspection.
 * - Carrier tracking number assignment.
 * - Official printable luxury Tax Invoice generation.
 */
function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live orders from Firestore
  useEffect(() => {
    const fetchStoreOrders = async () => {
      try {
        const data = await getAllOrders();
        setOrders(data || []);
      } catch (err) {
        console.error('Error fetching admin orders from Firestore:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStoreOrders();
  }, []);
  // Filters & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState(''); // '' (placeholder) | 'none' | 'orderNumber' | 'date'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' (small to big) | 'desc' (big to small)

  // Toggle Sorting Handler
  const handleToggleSort = (field) => {
    if (sortBy === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortBy('none');
        setSortDirection('asc');
      }
    } else {
      setSortBy(field);
      setSortDirection(field === 'orderNumber' ? 'asc' : 'desc');
    }
  };

  // Helper to extract numerical order number for ascending/descending sorting (small to big)
  const getOrderNumber = (id) => {
    if (!id) return 0;
    const digits = String(id).replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [dispatchTrackingNumber, setDispatchTrackingNumber] = useState('');
  const [cancelOrderTarget, setCancelOrderTarget] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
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

  // Status Counts
  const processingCount = orders.filter(o => o.status === 'Processing').length;
  const shippedCount = orders.filter(o => o.status === 'Shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'Cancelled').length;

  // Filtered & Sorted Orders Logic (Defaults to date newest-first in sink with user app)
  const baseFiltered = orders.filter((order) => {
    const rawSearch = searchTerm.trim().toLowerCase();
    const cleanSearch = rawSearch.replace(/^#/, '');

    const orderIdLower = (order.id || '').toLowerCase();
    const fullHashId = `#${orderIdLower}`;
    const trackingLower = (order.trackingNumber || '').toLowerCase();
    const customerName = (order.customer?.name || '').toLowerCase();
    const customerEmail = (order.customer?.email || '').toLowerCase();

    const matchesSearch = !rawSearch ||
      orderIdLower.includes(cleanSearch) ||
      fullHashId.includes(rawSearch) ||
      trackingLower.includes(cleanSearch) ||
      customerName.includes(rawSearch) ||
      customerEmail.includes(rawSearch) ||
      order.items?.some(i => (i.name || '').toLowerCase().includes(rawSearch));

    const matchesStatus = statusFilter === 'All' || 
      order.status === statusFilter || 
      (statusFilter === 'Ordered' && (order.status === 'Processing' || order.status === 'Ordered'));

    return matchesSearch && matchesStatus;
  });

  const filteredOrders = [...baseFiltered].sort((a, b) => {
    if (sortBy === 'orderNumber') {
      const numA = getOrderNumber(a.id);
      const numB = getOrderNumber(b.id);
      if (numA !== numB) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      return sortDirection === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    }
    if (sortBy === 'date') {
      const timeA = getOrderTimestamp(a);
      const timeB = getOrderTimestamp(b);
      if (timeA !== timeB) {
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }
      const numA = getOrderNumber(a.id);
      const numB = getOrderNumber(b.id);
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    }
    // Default: Sort by date timestamp newest-first
    const timeA = getOrderTimestamp(a);
    const timeB = getOrderTimestamp(b);
    if (timeA !== timeB) return timeB - timeA;
    const numA = getOrderNumber(a.id);
    const numB = getOrderNumber(b.id);
    return numB - numA;
  });

  // 10 Rows Per Page Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortDirection]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Update Status Handler in Firestore
  const handleUpdateStatus = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    }));
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }

    try {
      await updateOrderStatus(orderId, newStatus);

      // Trigger 100% wallet refund to customer if admin cancels order
      if (newStatus === 'Cancelled' && targetOrder && targetOrder.status !== 'Cancelled') {
        const refundAmount = Number(targetOrder.finalPayable ?? targetOrder.amount) || 0;
        const targetUserId = targetOrder.userId || targetOrder.customer?.id || targetOrder.customer?.email;
        const targetEmail = targetOrder.customer?.email || targetOrder.email;
        if (refundAmount > 0) {
          await creditUserWallet(
            targetUserId,
            targetEmail,
            refundAmount,
            `100% Refund for Order #${orderId} Cancelled by Store Admin`,
            orderId
          );
        }
      }

      setToastMessage(`Order #${orderId} marked as ${newStatus} in Firestore.`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Error updating order status in Firestore:', err);
    }
  };

  // Open Dispatch Modal
  const handleInitiateShip = (order) => {
    setDispatchModalOrder(order);
    setDispatchTrackingNumber(
      order.trackingNumber && !order.trackingNumber.startsWith('Awaiting')
        ? order.trackingNumber
        : `BLUEDART-EXP-${order.id}`
    );
  };

  // Confirm Dispatch & Ship
  const handleConfirmShip = async () => {
    if (!dispatchModalOrder) return;
    const orderId = dispatchModalOrder.id;
    const tracking = dispatchTrackingNumber.trim() || `BLUEDART-EXP-${orderId}`;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Shipped', trackingNumber: tracking } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: 'Shipped', trackingNumber: tracking }));
    }

    try {
      await updateOrderTracking(orderId, tracking);
      await updateOrderStatus(orderId, 'Shipped');
      setToastMessage(`Order #${orderId} marked as Shipped with tracking ${tracking}.`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Error shipping order:', err);
    } finally {
      setDispatchModalOrder(null);
    }
  };

  // Confirm Cancellation (returns stock to vault automatically via updateOrderStatus)
  const handleConfirmCancelOrder = async () => {
    if (!cancelOrderTarget) return;
    const orderId = cancelOrderTarget.id;
    await handleUpdateStatus(orderId, 'Cancelled');
    setCancelOrderTarget(null);
  };

  // Update Tracking Number in Firestore
  const handleSaveTracking = async (orderId) => {
    if (!trackingInput.trim()) return;
    const newTracking = trackingInput.trim();

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, trackingNumber: newTracking, status: o.status === 'Processing' ? 'Shipped' : o.status };
      }
      return o;
    }));

    try {
      await updateOrderTracking(orderId, newTracking);
      setToastMessage(`Tracking ID saved for Order #${orderId} in Firestore.`);
      setTrackingInput('');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Error updating tracking ID in Firestore:', err);
    }
  };

  // Logistics ETA & Notice Editing State
  const [logisticsEtaDate, setLogisticsEtaDate] = useState('');
  const [logisticsStatusNotice, setLogisticsStatusNotice] = useState('ON_TIME');
  const [logisticsMessageNotice, setLogisticsMessageNotice] = useState('');

  // Open Dossier Modal & Initialize Logistics Inputs
  const handleOpenDossier = (order) => {
    setSelectedOrder(order);
    setTrackingInput(order.trackingNumber?.startsWith('Awaiting') ? '' : (order.trackingNumber || ''));
    
    let etaFormatted = '';
    if (order.estimatedDeliveryDate) {
      etaFormatted = new Date(order.estimatedDeliveryDate).toISOString().slice(0, 10);
    } else {
      const now = new Date();
      etaFormatted = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }
    setLogisticsEtaDate(etaFormatted);
    setLogisticsStatusNotice(order.deliveryNoticeStatus || 'ON_TIME');
    setLogisticsMessageNotice(order.deliveryNoticeMessage || '');
  };

  // Save Logistics Handler
  const handleSaveLogistics = async (orderId) => {
    const updatePayload = {
      estimatedDeliveryDate: logisticsEtaDate ? new Date(logisticsEtaDate).toISOString() : new Date().toISOString(),
      deliveryNoticeStatus: logisticsStatusNotice,
      deliveryNoticeMessage: logisticsMessageNotice.trim()
    };

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatePayload } : o));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, ...updatePayload }));
    }

    try {
      await updateOrderLogistics(orderId, updatePayload);
      setToastMessage(`Logistics ETA & Alert Notice updated for Order #${orderId}`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      console.error('Error updating order logistics:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Retrieving Vault Orders & Logistics Stream..." />
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
              Collector Acquisitions & Orders
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-luxury-charcoal-900 text-luxury-gold-300">
              {orders.length} Dispatches
            </span>
          </div>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
            Verify payment settlements, attach courier security tracking, and generate collector invoices.
          </p>
        </div>
      </div>

      {/* Metric Pipeline Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Ordered */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'Ordered' ? 'All' : 'Ordered')}
          className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Ordered' 
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300' 
              : 'bg-luxury-cream-50 border-luxury-cream-300 hover:border-luxury-charcoal-400'
          }`}
        >
          <div className="flex justify-between items-center text-amber-700">
            <span className="text-[10px] font-bold uppercase tracking-widest">Ordered</span>
            <Clock size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900 mt-2">{processingCount}</p>
          <span className="text-[9px] sm:text-[10px] text-luxury-charcoal-500">Awaiting Dispatch</span>
        </button>

        {/* Shipped */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'Shipped' ? 'All' : 'Shipped')}
          className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Shipped' 
              ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-300' 
              : 'bg-luxury-cream-50 border-luxury-cream-300 hover:border-luxury-charcoal-400'
          }`}
        >
          <div className="flex justify-between items-center text-blue-700">
            <span className="text-[10px] font-bold uppercase tracking-widest">In Transit</span>
            <Truck size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900 mt-2">{shippedCount}</p>
          <span className="text-[9px] sm:text-[10px] text-luxury-charcoal-500">Active Transit</span>
        </button>

        {/* Delivered */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'Delivered' ? 'All' : 'Delivered')}
          className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Delivered' 
              ? 'bg-green-50 border-green-300 ring-2 ring-green-300' 
              : 'bg-luxury-cream-50 border-luxury-cream-300 hover:border-luxury-charcoal-400'
          }`}
        >
          <div className="flex justify-between items-center text-green-700">
            <span className="text-[10px] font-bold uppercase tracking-widest">Delivered</span>
            <CheckCircle2 size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900 mt-2">{deliveredCount}</p>
          <span className="text-[9px] sm:text-[10px] text-luxury-charcoal-500">Confirmed</span>
        </button>

        {/* Cancelled */}
        <button 
          onClick={() => setStatusFilter(statusFilter === 'Cancelled' ? 'All' : 'Cancelled')}
          className={`p-3.5 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Cancelled' 
              ? 'bg-red-50 border-red-300 ring-2 ring-red-300' 
              : 'bg-luxury-cream-50 border-luxury-cream-300 hover:border-luxury-charcoal-400'
          }`}
        >
          <div className="flex justify-between items-center text-red-700">
            <span className="text-[10px] font-bold uppercase tracking-widest">Cancelled</span>
            <XCircle size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900 mt-2">{cancelledCount}</p>
          <span className="text-[9px] sm:text-[10px] text-luxury-charcoal-500">Refunded</span>
        </button>

      </div>

      {/* Search, Filter & Simple Sort Bar */}
      <div className="bg-luxury-cream-50 p-4 rounded-2xl border border-luxury-cream-300 shadow-2xs flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full xl:w-80">
          <input
            type="text"
            placeholder="Search by Order ID, Collector name, or watch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
        </div>

        {/* Status Filter Tab Pills */}
        <div className="flex flex-wrap gap-1.5">
          {['All', 'Ordered', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
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
            </button>
          ))}
        </div>

        {/* Simple Sort Dropdown with Placeholder & None */}
        <div className="flex items-center space-x-2">
          <label className="text-[11px] font-bold text-luxury-charcoal-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <ArrowUpDown size={13} /> Sort:
          </label>
          <select
            value={sortBy === 'none' ? 'none' : (sortBy ? `${sortBy}-${sortDirection}` : '')}
            onChange={(e) => {
              const val = e.target.value;
              if (!val || val === 'none') {
                setSortBy('none');
              } else {
                const [field, dir] = val.split('-');
                setSortBy(field);
                setSortDirection(dir);
              }
            }}
            className={`w-full xl:w-auto px-3 py-1.5 bg-white border border-luxury-cream-300 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none focus:border-luxury-gold-500 shadow-2xs ${
              !sortBy ? 'text-luxury-charcoal-400' : 'text-luxury-charcoal-800'
            }`}
          >
            <option value="" disabled>Select Sort Option...</option>
            <option value="none">None</option>
            <option value="orderNumber-asc">Order Number: Small to Big ↑</option>
            <option value="orderNumber-desc">Order Number: Big to Small ↓</option>
            <option value="date-desc">Due Date: Newest First ↓</option>
            <option value="date-asc">Due Date: Oldest First ↑</option>
          </select>
        </div>

      </div>

      {/* Orders Catalog */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          
          {/* Mobile Touch Cards View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {paginatedOrders.map((order) => (
              <div 
                key={order.id}
                className="bg-luxury-cream-50 rounded-2xl border border-luxury-cream-300 p-4 shadow-2xs space-y-3 text-left"
              >
                {/* Top Row: Order ID, Date & Status Dropdown */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1 font-mono font-bold text-xs text-luxury-charcoal-900">
                      <span>#{order.id}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyOrderId(order.id, e)}
                        className="p-1 text-luxury-charcoal-400 hover:text-luxury-gold-600 hover:bg-luxury-cream-200 rounded-md transition-colors cursor-pointer"
                        title="Copy Order ID to clipboard"
                      >
                        {copiedOrderId === order.id ? (
                          <Check size={11} className="text-emerald-600 stroke-[2.5]" />
                        ) : (
                          <Copy size={11} className="opacity-70 hover:opacity-100" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-luxury-charcoal-400 mt-0.5">
                      {formatDate(order.date)}
                    </p>
                  </div>
                  {/* Status Pill Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1 ${
                    order.status === 'Delivered'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : order.status === 'Shipped'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : order.status === 'Processing'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {order.status === 'Delivered' && <CheckCircle2 size={11} className="text-green-700" />}
                    {order.status === 'Shipped' && <Truck size={11} className="text-blue-700" />}
                    {order.status === 'Processing' && <Clock size={11} className="text-amber-700" />}
                    {order.status === 'Cancelled' && <XCircle size={11} className="text-red-700" />}
                    {order.status || 'Processing'}
                  </span>
                </div>

                {/* Collector Info */}
                <div className="pt-2 border-t border-luxury-cream-200 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-luxury-charcoal-900 text-xs block">
                        {order.customer?.name || 'Valued Collector'}
                      </span>
                      <span className="text-[10px] text-luxury-charcoal-500 block truncate max-w-[200px]">
                        {order.customer?.email || 'collector@wristora.com'}
                      </span>
                    </div>
                    <span className="text-[10px] text-luxury-charcoal-400 text-right shrink-0">
                      {order.customer?.city || 'Mumbai'}, {order.customer?.state || 'MH'}
                    </span>
                  </div>
                </div>

                {/* Acquired Watches Row */}
                <div className="pt-2 border-t border-luxury-cream-200 space-y-1.5">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400'} 
                        alt={item.name || 'Watch'} 
                        className="w-8 h-8 rounded-lg object-cover border border-luxury-cream-300 shrink-0" 
                      />
                      <span className="font-semibold text-luxury-charcoal-800 text-[11px] truncate flex-1">
                        {item.quantity || 1}x {item.name || 'Timepiece'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progressive Pipeline Action Buttons (Contextual) */}
                {order.status === 'Processing' && (
                  <div className="pt-2.5 border-t border-luxury-cream-200 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-luxury-charcoal-400">
                      Pipeline Action
                    </span>
                    <div className="inline-flex items-center p-1 bg-white border border-luxury-cream-300 rounded-xl shadow-2xs gap-1.5">
                      <button
                        onClick={() => handleInitiateShip(order)}
                        className="group inline-flex items-center gap-1 px-3 py-1 bg-luxury-charcoal-900 hover:bg-black text-luxury-gold-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95 border border-luxury-charcoal-800 hover:border-luxury-gold-500/40"
                        title="Dispatch Order via Armored Courier"
                      >
                        <Truck size={11} className="text-luxury-gold-400 group-hover:scale-110 transition-transform" />
                        <span>Ship</span>
                      </button>
                      <div className="w-px h-4 bg-luxury-cream-300" />
                      <button
                        onClick={() => setCancelOrderTarget(order)}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 text-luxury-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title="Cancel Order"
                      >
                        <XCircle size={11} className="group-hover:text-rose-600 transition-colors" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}

                {order.status === 'Shipped' && (
                  <div className="pt-2.5 border-t border-luxury-cream-200 flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-luxury-charcoal-400">
                      Pipeline Action
                    </span>
                    <div className="inline-flex items-center p-1 bg-white border border-luxury-cream-300 rounded-xl shadow-2xs gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                        className="group inline-flex items-center gap-1 px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95 border border-emerald-700 hover:border-emerald-600"
                        title="Confirm Delivery"
                      >
                        <CheckCircle2 size={11} className="text-emerald-300 group-hover:scale-110 transition-transform" />
                        <span>Delivered</span>
                      </button>
                      <div className="w-px h-4 bg-luxury-cream-300" />
                      <button
                        onClick={() => setCancelOrderTarget(order)}
                        className="group inline-flex items-center gap-1 px-2.5 py-1 text-luxury-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title="Cancel / Return Order"
                      >
                        <XCircle size={11} className="group-hover:text-rose-600 transition-colors" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Row: Price, Payment & Action Buttons */}
                <div className="pt-2 border-t border-luxury-cream-200 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-sm text-luxury-charcoal-900 block">
                      ₹{(Number(order.amount) || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-luxury-charcoal-400 uppercase tracking-wider block">
                      {order.paymentMethod || 'Prepaid Card'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setInvoiceOrder(order)}
                      className="p-1.5 bg-white hover:bg-luxury-cream-200 text-luxury-charcoal-600 border border-luxury-cream-300 rounded-lg transition-colors cursor-pointer"
                      title="Generate Tax Invoice"
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenDossier(order)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 bg-luxury-charcoal-900 text-luxury-gold-300 hover:bg-luxury-charcoal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Inspect Order Dossier"
                    >
                      <Eye size={13} />
                      <span>Dossier</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Desktop Orders Table (hidden md:block) */}
          <div className="hidden md:block bg-luxury-cream-50 rounded-2xl border border-luxury-cream-300 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-luxury-cream-300 bg-luxury-cream-100 text-luxury-charcoal-600 uppercase tracking-widest text-[10px] font-bold">
                    <th className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleToggleSort('orderNumber')}
                          className={`flex items-center space-x-1 hover:text-luxury-charcoal-900 transition-colors cursor-pointer ${
                            sortBy === 'orderNumber' ? 'text-luxury-charcoal-900 font-extrabold' : ''
                          }`}
                          title="Sort by Order # (Small to Big ↕ Big to Small)"
                        >
                          <span>Order #</span>
                          {sortBy === 'orderNumber' ? (
                            sortDirection === 'asc' ? <ArrowUp size={12} strokeWidth={2.5} className="text-luxury-gold-600" /> : <ArrowDown size={12} strokeWidth={2.5} className="text-luxury-gold-600" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30" />
                          )}
                        </button>
                        <span className="text-luxury-charcoal-300 font-normal">|</span>
                        <button 
                          onClick={() => handleToggleSort('date')}
                          className={`flex items-center space-x-1 hover:text-luxury-charcoal-900 transition-colors cursor-pointer ${
                            sortBy === 'date' ? 'text-luxury-charcoal-900 font-extrabold' : ''
                          }`}
                          title="Sort by Due Date / Order Date"
                        >
                          <span>Due Date</span>
                          {sortBy === 'date' ? (
                            sortDirection === 'desc' ? <ArrowDown size={12} strokeWidth={2.5} className="text-luxury-gold-600" /> : <ArrowUp size={12} strokeWidth={2.5} className="text-luxury-gold-600" />
                          ) : (
                            <ArrowUpDown size={11} className="opacity-30" />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="py-4 px-4">Collector Profile</th>
                    <th className="py-4 px-4">Acquired Timepieces</th>
                    <th className="py-4 px-4">Total Settlement</th>
                    <th className="py-4 px-4">Pipeline Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-cream-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-luxury-cream-100/80 transition-colors group">
                      
                      {/* Order ID & Date */}
                      <td className="py-4 px-6 whitespace-nowrap min-w-[130px]">
                        <div className="flex items-center space-x-1.5 font-mono font-bold text-luxury-charcoal-900 text-xs whitespace-nowrap">
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
                              <Copy size={12} className="opacity-70 hover:opacity-100" />
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-luxury-charcoal-400 mt-0.5 whitespace-nowrap">
                          {formatDate(order.date)}
                        </p>
                      </td>

                      {/* Collector Details */}
                      <td className="py-4 px-4">
                        <div>
                          <h4 className="font-bold text-luxury-charcoal-900 text-xs">
                            {order.customer?.name || 'Valued Collector'}
                          </h4>
                          <p className="text-[10px] text-luxury-charcoal-500 truncate max-w-[180px]">
                            {order.customer?.email || 'collector@wristora.com'}
                          </p>
                          <p className="text-[10px] text-luxury-charcoal-400">
                            {order.customer?.city || 'Mumbai'}, {order.customer?.state || 'Maharashtra'}
                          </p>
                        </div>
                      </td>

                      {/* Acquired Watches */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <img src={item.image || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400'} alt={item.name || 'Watch'} className="w-8 h-8 rounded-lg object-cover border border-luxury-cream-300 shrink-0" />
                              <span className="font-semibold text-luxury-charcoal-800 text-[11px] truncate max-w-[180px]">
                                {item.quantity || 1}x {item.name || 'Timepiece'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Settlement */}
                      <td className="py-4 px-4">
                        <p className="font-mono font-bold text-sm text-luxury-charcoal-900">
                          ₹{(Number(order.amount) || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-luxury-charcoal-400">
                          {order.paymentMethod || 'Prepaid Card'}
                        </p>
                      </td>

                      {/* Pipeline Status & Progressive Contextual Actions */}
                      <td className="py-4 px-4">
                        {order.status === 'Processing' && (
                          <div className="inline-flex items-center p-1 bg-white/95 border border-luxury-cream-300 rounded-xl shadow-2xs gap-1.5 hover:border-luxury-gold-400/40 transition-colors">
                            {/* Status indicator */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-900 border border-amber-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                              ORDERED
                            </span>

                            <div className="w-px h-4 bg-luxury-cream-300" />

                            {/* Primary Action: Ship Order */}
                            <button
                              onClick={() => handleInitiateShip(order)}
                              className="group inline-flex items-center gap-1 px-2.5 py-1 bg-luxury-charcoal-900 hover:bg-black text-luxury-gold-300 hover:text-luxury-gold-200 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 border border-luxury-charcoal-800 hover:border-luxury-gold-500/40"
                              title="Dispatch and Mark as Shipped"
                            >
                              <Truck size={11} className="text-luxury-gold-400 group-hover:scale-110 transition-transform" />
                              <span>Ship</span>
                            </button>

                            {/* Secondary Action: Cancel Order */}
                            <button
                              onClick={() => setCancelOrderTarget(order)}
                              className="group inline-flex items-center gap-1 px-2 py-1 text-luxury-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Cancel Order & Restock Vault"
                            >
                              <XCircle size={11} className="group-hover:text-rose-600 transition-colors" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}

                        {order.status === 'Shipped' && (
                          <div className="inline-flex items-center p-1 bg-white/95 border border-luxury-cream-300 rounded-xl shadow-2xs gap-1.5 hover:border-luxury-gold-400/40 transition-colors">
                            {/* Status indicator */}
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 text-sky-900 border border-sky-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shrink-0" />
                              Shipped
                            </span>

                            <div className="w-px h-4 bg-luxury-cream-300" />

                            {/* Primary Action: Mark Delivered */}
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                              className="group inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-2xs active:scale-95 border border-emerald-700 hover:border-emerald-600"
                              title="Confirm Delivery to Collector"
                            >
                              <CheckCircle2 size={11} className="text-emerald-300 group-hover:scale-110 transition-transform" />
                              <span>Delivered</span>
                            </button>

                            {/* Secondary Action: Cancel Order */}
                            <button
                              onClick={() => setCancelOrderTarget(order)}
                              className="group inline-flex items-center gap-1 px-2 py-1 text-luxury-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              title="Cancel / Return Order & Restock Vault"
                            >
                              <XCircle size={11} className="group-hover:text-rose-600 transition-colors" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}

                        {order.status === 'Delivered' && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-900 border border-emerald-500/30 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                            <span>Delivered</span>
                          </div>
                        )}

                        {order.status === 'Cancelled' && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-800 border border-rose-500/20">
                            <XCircle size={12} className="text-rose-500 shrink-0" />
                            <span>Cancelled</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* View Order Dossier */}
                          <button
                            onClick={() => handleOpenDossier(order)}
                            className="p-2 hover:bg-luxury-cream-200 text-luxury-charcoal-600 hover:text-luxury-charcoal-900 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Order Dossier"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Print Invoice */}
                          <button
                            onClick={() => setInvoiceOrder(order)}
                            className="p-2 hover:bg-luxury-cream-200 text-luxury-charcoal-600 hover:text-luxury-charcoal-900 rounded-lg transition-colors cursor-pointer"
                            title="Generate Tax Invoice"
                          >
                            <Printer size={15} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls Bar (10 Rows Per Page) */}
          {totalPages > 1 && (
            <div className="bg-luxury-cream-50 px-6 py-4 rounded-2xl border border-luxury-cream-300 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-xs text-luxury-charcoal-600 font-sans">
                Showing <strong className="text-luxury-charcoal-900 font-mono">{startIndex + 1}</strong> to{' '}
                <strong className="text-luxury-charcoal-900 font-mono">
                  {Math.min(startIndex + itemsPerPage, filteredOrders.length)}
                </strong>{' '}
                of <strong className="text-luxury-charcoal-900 font-mono">{filteredOrders.length}</strong> orders
              </div>

              <div className="flex items-center space-x-1.5 font-mono text-xs">
                {/* Prev Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-luxury-cream-300 bg-white hover:bg-luxury-cream-200 text-luxury-charcoal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                >
                  ‹ Prev
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-luxury-charcoal-900 text-luxury-gold-300 shadow-2xs'
                        : 'bg-white text-luxury-charcoal-700 hover:bg-luxury-cream-200 border border-luxury-cream-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-luxury-cream-300 bg-white hover:bg-luxury-cream-200 text-luxury-charcoal-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold cursor-pointer"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-luxury-cream-50 p-12 rounded-2xl border border-luxury-cream-300 text-center">
          <EmptyState
            title="No Orders Matched"
            message="No orders match your search keyword or selected status filter."
            actionLabel="Reset Status Filters"
            onActionClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
          />
        </div>
      )}

      {/* Order Dossier Inspection Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          size="2xl"
          title={`Order Dossier #${selectedOrder.id}`}
        >
          <div className="space-y-6 text-left text-xs font-sans">
            
            {/* Status & Date Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-luxury-cream-100 rounded-xl border border-luxury-cream-300">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-luxury-charcoal-400 font-bold">Fulfillment Status</p>
                <div className="mt-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1 ${
                    selectedOrder.status === 'Delivered'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : selectedOrder.status === 'Shipped'
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : selectedOrder.status === 'Processing'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {selectedOrder.status === 'Delivered' && <CheckCircle2 size={11} className="text-green-700" />}
                    {selectedOrder.status === 'Shipped' && <Truck size={11} className="text-blue-700" />}
                    {selectedOrder.status === 'Processing' && <Clock size={11} className="text-amber-700" />}
                    {selectedOrder.status === 'Cancelled' && <XCircle size={11} className="text-red-700" />}
                    {selectedOrder.status || 'Processing'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-luxury-charcoal-400 font-bold">Transaction Date</p>
                <p className="text-xs font-bold text-luxury-charcoal-900 mt-0.5">{formatDate(selectedOrder.date)}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-[10px] uppercase tracking-wider text-luxury-charcoal-400 font-bold">Payment Channel</p>
                <p className="text-xs font-bold text-luxury-charcoal-900 mt-0.5 truncate">{selectedOrder.paymentMethod || 'Prepaid Card'}</p>
              </div>
            </div>

            {/* 2-Column Split: Details & Purchased Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: Shipping Address & Carrier Tracking */}
              <div className="space-y-4">
                
                {/* Customer Shipping Address */}
                <div className="bg-white p-4 rounded-xl border border-luxury-cream-300 space-y-2 shadow-2xs">
                  <div className="flex items-center space-x-2 text-luxury-charcoal-900 pb-2 border-b border-luxury-cream-200">
                    <MapPin size={15} className="text-luxury-gold-600" />
                    <h4 className="text-xs font-serif font-bold uppercase tracking-wider">
                      Collector Shipping Address
                    </h4>
                  </div>
                  <div className="text-xs text-luxury-charcoal-700 space-y-1 pt-1">
                    <p className="font-bold text-luxury-charcoal-900 text-sm">{selectedOrder.customer?.name || 'Valued Collector'}</p>
                    <p>{selectedOrder.customer?.address || 'Villa 14, Palm Avenue, Juhu'}</p>
                    <p>{selectedOrder.customer?.city || 'Mumbai'}, {selectedOrder.customer?.state || 'Maharashtra'} - {selectedOrder.customer?.pincode || '400049'}</p>
                    <p className="text-luxury-charcoal-500 text-[11px] pt-1">
                      📞 {selectedOrder.customer?.phone || '+91 98201 44552'}
                    </p>
                    <p className="text-luxury-charcoal-500 text-[11px] truncate">
                      ✉️ {selectedOrder.customer?.email || 'collector@wristora.com'}
                    </p>
                  </div>
                </div>

                {/* Carrier Logistics Tracking ID */}
                <div className="bg-white p-4 rounded-xl border border-luxury-cream-300 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 text-luxury-charcoal-900">
                    <Truck size={15} className="text-luxury-gold-600" />
                    <h4 className="text-xs font-serif font-bold uppercase tracking-wider">
                      Carrier Tracking ID
                    </h4>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. BLUEDART-EXP-889021"
                      value={trackingInput || (selectedOrder.trackingNumber || '')}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      className="flex-grow px-3 py-2 text-xs border border-luxury-cream-300 rounded-lg focus:outline-none focus:border-luxury-gold-500 font-mono"
                    />
                    <Button
                      onClick={() => handleSaveTracking(selectedOrder.id)}
                      variant="primary"
                      size="sm"
                      className="text-xs uppercase tracking-wider font-bold shrink-0"
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {/* Fulfillment ETA & Logistics Alert Control Box */}
                <div className="bg-white p-4 rounded-xl border border-luxury-cream-300 space-y-3 shadow-2xs">
                  <div className="flex items-center space-x-2 text-luxury-charcoal-900 pb-2 border-b border-luxury-cream-200">
                    <Clock size={15} className="text-luxury-gold-600" />
                    <h4 className="text-xs font-serif font-bold uppercase tracking-wider">
                      Fulfillment ETA & Logistics Alert
                    </h4>
                  </div>

                  {/* ETA Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-luxury-charcoal-500 block">
                      Estimated Delivery Date (ETA):
                    </label>
                    <input
                      type="date"
                      value={logisticsEtaDate}
                      onChange={(e) => setLogisticsEtaDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-luxury-cream-300 rounded-lg focus:outline-none focus:border-luxury-gold-500 font-mono"
                    />
                  </div>

                  {/* Delivery Status Alert Notice */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-luxury-charcoal-500 block">
                      Delivery Alert Status:
                    </label>
                    <select
                      value={logisticsStatusNotice}
                      onChange={(e) => setLogisticsStatusNotice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-luxury-cream-300 rounded-lg focus:outline-none focus:border-luxury-gold-500 font-semibold"
                    >
                      <option value="ON_TIME">🚚 On Schedule — Transit Normal</option>
                      <option value="EARLY">⚡ Arriving Ahead of Schedule</option>
                      <option value="DELAYED">⚠️ Logistics / Customs Inspection Delay</option>
                    </select>
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-luxury-charcoal-500 block">
                      Custom Customer Notice Message:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Arriving 2 days ahead of schedule!"
                      value={logisticsMessageNotice}
                      onChange={(e) => setLogisticsMessageNotice(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-luxury-cream-300 rounded-lg focus:outline-none focus:border-luxury-gold-500"
                    />
                  </div>

                  <Button
                    onClick={() => handleSaveLogistics(selectedOrder.id)}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center text-xs uppercase tracking-wider font-bold mt-2"
                  >
                    Save Logistics & ETA Updates
                  </Button>
                </div>

              </div>

              {/* Right Column: Acquired Watches & Total Settlement */}
              <div className="space-y-4">
                
                <div className="bg-white p-4 rounded-xl border border-luxury-cream-300 space-y-3 shadow-2xs">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-luxury-charcoal-700 pb-2 border-b border-luxury-cream-200">
                    Acquired Timepieces
                  </p>
                  
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-luxury-cream-50/70 rounded-lg border border-luxury-cream-200">
                        <div className="flex items-center space-x-3">
                          <img src={item.image || 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400'} alt={item.name || 'Watch'} className="w-10 h-10 rounded-lg object-cover border border-luxury-cream-200 shrink-0" />
                          <div>
                            <h5 className="font-bold text-luxury-charcoal-900 text-xs">{item.name || 'Timepiece'}</h5>
                            <p className="text-[10px] text-luxury-charcoal-500">Qty: {item.quantity || 1} • Official Presentation Box</p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-luxury-charcoal-900 text-xs shrink-0">
                          ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total Settlement */}
                  <div className="border-t border-luxury-cream-300 pt-3 flex justify-between items-center text-sm">
                    <span className="font-bold uppercase tracking-wider text-luxury-charcoal-700">Total Settlement</span>
                    <span className="font-mono font-bold text-base text-luxury-charcoal-900">
                      ₹{(Number(selectedOrder.amount) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Contextual Action Bar in Dossier */}
            {selectedOrder.status === 'Processing' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-800 text-xs">
                  <Clock size={15} className="shrink-0 text-amber-600" />
                  <span>Order is in preparation. Advance to dispatch or cancel:</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleInitiateShip(selectedOrder)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-luxury-charcoal-900 hover:bg-black text-luxury-gold-300 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs border border-luxury-charcoal-800 hover:border-luxury-gold-500/40 flex-1 sm:flex-initial"
                  >
                    <Truck size={13} className="text-luxury-gold-400" />
                    <span>Ship Order</span>
                  </button>
                  <button
                    onClick={() => setCancelOrderTarget(selectedOrder)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-luxury-charcoal-500 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-luxury-cream-300 hover:border-rose-200 flex-1 sm:flex-initial"
                  >
                    <XCircle size={13} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}

            {selectedOrder.status === 'Shipped' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-blue-800 text-xs">
                  <Truck size={15} className="shrink-0 text-blue-600" />
                  <span>Order is in transit with courier. Confirm delivery upon arrival:</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs border border-emerald-700 hover:border-emerald-600 flex-1 sm:flex-initial"
                  >
                    <CheckCircle2 size={13} className="text-emerald-300" />
                    <span>Mark Delivered</span>
                  </button>
                  <button
                    onClick={() => setCancelOrderTarget(selectedOrder)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-luxury-charcoal-500 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-luxury-cream-300 hover:border-rose-200 flex-1 sm:flex-initial"
                  >
                    <XCircle size={13} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}

            {selectedOrder.status === 'Delivered' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-800 text-xs font-semibold">
                <CheckCircle2 size={15} className="text-green-600 shrink-0" />
                <span>Order successfully delivered & verified. Transaction is permanently completed.</span>
              </div>
            )}

            {selectedOrder.status === 'Cancelled' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-semibold">
                <XCircle size={15} className="text-red-600 shrink-0" />
                <span>Order cancelled. All allocated timepieces have been returned to vault stock.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2 border-t border-luxury-cream-300">
              <Button
                variant="outline"
                onClick={() => setInvoiceOrder(selectedOrder)}
                className="flex-1 justify-center text-xs uppercase"
              >
                <Printer size={14} className="mr-1.5" />
                View Official Invoice
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 justify-center text-xs uppercase font-bold"
              >
                Close Dossier
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Official Tax Invoice Printable Preview Modal */}
      {invoiceOrder && (
        <Modal
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          size="2xl"
          title={`Official Tax Invoice #${invoiceOrder.id}`}
        >
          <div className="p-6 sm:p-8 bg-white border border-luxury-cream-300 rounded-2xl space-y-6 text-left text-xs font-sans text-luxury-charcoal-900 shadow-xs">
            
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-luxury-cream-300 pb-5">
              <div>
                <h2 className="text-2xl font-serif font-bold tracking-widest uppercase text-luxury-charcoal-900">
                  WRISTORA
                </h2>
                <p className="text-[10px] text-luxury-charcoal-500 uppercase tracking-wider mt-0.5">
                  Haute Horlogerie Boutiques Private Limited
                </p>
                <p className="text-[10px] text-luxury-charcoal-400 mt-1">
                  GSTIN: 27AABCT8891P1ZV • CIN: U74999MH2026PTC392019
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-widest font-bold bg-luxury-cream-200 text-luxury-charcoal-800 px-3 py-1 rounded-full border border-luxury-cream-300">
                  ORIGINAL FOR RECIPIENT
                </span>
                <p className="font-mono font-bold text-sm text-luxury-charcoal-900 mt-2.5">
                  #{invoiceOrder.id}
                </p>
                <p className="text-[10px] text-luxury-charcoal-400">Date: {formatDate(invoiceOrder.date)}</p>
              </div>
            </div>

            {/* Billed To / Shipped To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-luxury-cream-50/50 p-4 rounded-xl border border-luxury-cream-200">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-bold text-luxury-charcoal-400 block">
                  Billed & Shipped To:
                </span>
                <p className="font-bold text-luxury-charcoal-900 text-sm">{invoiceOrder.customer?.name || 'Valued Collector'}</p>
                <p className="text-luxury-charcoal-600">{invoiceOrder.customer?.address || 'Villa 14, Palm Avenue, Juhu'}</p>
                <p className="text-luxury-charcoal-600">{invoiceOrder.customer?.city || 'Mumbai'}, {invoiceOrder.customer?.state || 'Maharashtra'} - {invoiceOrder.customer?.pincode || '400049'}</p>
                <p className="text-luxury-charcoal-500 text-[10px] pt-1">Phone: {invoiceOrder.customer?.phone || '+91 98201 44552'}</p>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] uppercase tracking-widest font-bold text-luxury-charcoal-400 block">
                  Logistics & Payment:
                </span>
                <p className="font-semibold text-luxury-charcoal-800">Carrier: BlueDart Armored Express</p>
                <p className="text-luxury-charcoal-500 font-mono text-[10px]">AWB: {invoiceOrder.trackingNumber || 'BLUEDART-SEC-8821903'}</p>
                <p className="text-luxury-charcoal-600">Payment: {invoiceOrder.paymentMethod || 'Prepaid Card'}</p>
                <p className="text-green-700 font-bold text-[10px]">Status: Payment Settled</p>
              </div>
            </div>

            {/* Invoice Line Items (Wide & Scrollable) */}
            <div className="border border-luxury-cream-300 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[480px]">
                  <thead>
                    <tr className="bg-luxury-cream-100 border-b border-luxury-cream-300 text-luxury-charcoal-600 text-[10px] uppercase tracking-wider font-bold">
                      <th className="py-3 px-4 text-left">Item Description</th>
                      <th className="py-3 px-3 text-center">HSN Code</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Rate (₹)</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxury-cream-200">
                    {(invoiceOrder.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-luxury-cream-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-luxury-charcoal-900">{item.name || 'Timepiece'}</td>
                        <td className="py-3 px-3 text-center text-luxury-charcoal-400 font-mono text-[10px]">9102</td>
                        <td className="py-3 px-3 text-center">{item.quantity || 1}</td>
                        <td className="py-3 px-4 text-right font-mono">₹{(item.price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Calculations */}
            <div className="flex justify-end pt-2">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-luxury-charcoal-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">₹{Math.round(invoiceOrder.amount * 0.82).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-luxury-charcoal-600">
                  <span>Integrated GST (18%):</span>
                  <span className="font-mono font-bold">₹{Math.round(invoiceOrder.amount * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-luxury-charcoal-600">
                  <span>Vault Armored Shipping:</span>
                  <span className="text-green-700 font-bold">FREE (Complimentary)</span>
                </div>
                <div className="border-t border-luxury-cream-300 pt-2 flex justify-between font-bold text-sm text-luxury-charcoal-900">
                  <span>Total Amount:</span>
                  <span className="font-mono font-bold text-base">₹{invoiceOrder.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex space-x-3 pt-4 border-t border-luxury-cream-300">
              <Button
                variant="outline"
                onClick={() => setInvoiceOrder(null)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="flex-1 justify-center text-xs uppercase font-bold"
              >
                <Printer size={14} className="mr-1.5" />
                Print / Save PDF
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* Dispatch & Ship Modal */}
      {dispatchModalOrder && (
        <Modal
          isOpen={!!dispatchModalOrder}
          onClose={() => setDispatchModalOrder(null)}
          size="md"
          title={`Dispatch Order #${dispatchModalOrder.id}`}
        >
          <div className="space-y-4 text-left text-xs font-sans">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Truck size={14} className="text-blue-600" /> Ready to dispatch timepieces
              </p>
              <p className="text-[11px] text-blue-700">
                Collector: <span className="font-semibold">{dispatchModalOrder.customer?.name || 'Valued Collector'}</span> ({dispatchModalOrder.customer?.city || 'Mumbai'})
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-luxury-charcoal-600 mb-1.5">
                Carrier Logistics Tracking ID (BlueDart)
              </label>
              <input
                type="text"
                value={dispatchTrackingNumber}
                onChange={(e) => setDispatchTrackingNumber(e.target.value)}
                placeholder="e.g. BLUEDART-EXP-889021"
                className="w-full px-3 py-2 text-xs font-mono border border-luxury-cream-300 rounded-xl focus:outline-none focus:border-luxury-gold-500 bg-white"
              />
              <p className="text-[10px] text-luxury-charcoal-400 mt-1">
                The collector will receive this tracking code to trace their armored dispatch in real-time.
              </p>
            </div>

            <div className="flex space-x-3 pt-3 border-t border-luxury-cream-200">
              <Button
                variant="outline"
                onClick={() => setDispatchModalOrder(null)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmShip}
                className="flex-1 justify-center text-xs uppercase font-bold bg-blue-600 hover:bg-blue-700"
              >
                <Truck size={13} className="mr-1.5" /> Confirm Dispatch
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelOrderTarget && (
        <Modal
          isOpen={!!cancelOrderTarget}
          onClose={() => setCancelOrderTarget(null)}
          size="md"
          title={`Cancel Order #${cancelOrderTarget.id}`}
        >
          <div className="space-y-4 text-left text-xs font-sans">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle size={15} className="text-red-600" /> Cancel Order Authorization
              </p>
              <p className="text-[11px] text-red-700 leading-relaxed">
                Are you sure you want to cancel this order?
              </p>
              <div className="bg-white/80 p-2.5 rounded-lg border border-red-200 text-[10px] text-red-800 space-y-1">
                <span className="font-bold block uppercase tracking-wider text-red-900">📦 Automatic Inventory Restock:</span>
                <span>
                  All allocated units ({(cancelOrderTarget.items || []).map(i => `${i.quantity || 1}x ${i.name || 'Timepiece'}`).join(', ')}) will be returned to vault inventory immediately.
                </span>
              </div>
            </div>

            <div className="flex space-x-3 pt-3 border-t border-luxury-cream-200">
              <Button
                variant="outline"
                onClick={() => setCancelOrderTarget(null)}
                className="flex-1 justify-center text-xs uppercase"
              >
                Keep Order Active
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmCancelOrder}
                className="flex-1 justify-center text-xs uppercase font-bold bg-red-600 hover:bg-red-700"
              >
                <XCircle size={13} className="mr-1.5" /> Yes, Cancel & Restock
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

export default AdminOrders;
