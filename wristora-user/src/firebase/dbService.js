import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { mockProducts, mockCategories, mockOrders, mockBrands } from '../utils/mockData';
import { formatDate, getCurrentDateDDMMYYYY } from '../utils/dateFormatter';

/**
 * Wristora Cloud Database & Local Fallback Service
 * 
 * Centralized CRUD abstraction for Firestore with seamless local persistence fallback.
 * Automatically switches between live cloud Firestore and reactive local storage
 * if Firebase keys are unconfigured.
 */

// Local Storage Storage Keys
const LOCAL_PRODUCTS_KEY = 'wristora_db_products';
const LOCAL_CATEGORIES_KEY = 'wristora_db_categories';
const LOCAL_BRANDS_KEY = 'wristora_db_brands';
const LOCAL_ORDERS_KEY = 'wristora_db_orders';
const LOCAL_REVIEWS_KEY = 'wristora_db_reviews';
const LOCAL_USERS_KEY = 'wristora_db_users';
const LOCAL_USERS_OVERRIDES_KEY = 'wristora_db_user_overrides';
const LOCAL_SETTINGS_KEY = 'wristora_db_settings';

// Helper: Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return db && apiKey && apiKey !== 'YOUR_FIREBASE_API_KEY' && apiKey.length > 10;
};

// Seed Local Storage if empty
const initializeLocalStorage = () => {
  if (!localStorage.getItem(LOCAL_PRODUCTS_KEY)) {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(mockProducts));
  }
  if (!localStorage.getItem(LOCAL_CATEGORIES_KEY)) {
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(mockCategories));
  }
  if (!localStorage.getItem(LOCAL_BRANDS_KEY)) {
    localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(mockBrands));
  }
  if (!localStorage.getItem(LOCAL_ORDERS_KEY)) {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(mockOrders));
  }
  if (!localStorage.getItem(LOCAL_REVIEWS_KEY)) {
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify([
      {
        id: 'REV-501',
        watchId: 'prod-1',
        watchName: 'Rolex Datejust 41',
        watchBrand: 'Rolex',
        watchImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400',
        customerName: 'Julian Vance',
        customerEmail: 'collector@wristora.com',
        rating: 5,
        title: 'Timeless masterpiece with unmatched dial brilliance',
        comment: 'Exceptional balance and craftsmanship. The fluted bezel catches light effortlessly, and the delivery arrived in a pristine presentation box.',
        date: '29/08/2026',
        status: 'Published',
        verifiedPurchase: true
      },
      {
        id: 'REV-502',
        watchId: 'prod-2',
        watchName: 'Omega Speedmaster Professional',
        watchBrand: 'Omega',
        watchImage: 'https://images.unsplash.com/photo-1547996160-71dfabb1a79f?auto=format&fit=crop&q=80&w=400',
        customerName: 'Aarav Singhania',
        customerEmail: 'aarav.singhania@heritage.in',
        rating: 5,
        title: 'The ultimate space heritage chronograph',
        comment: 'Winding the Calibre 3861 manual movement every morning is pure meditation. Perfect 42mm wrist presence.',
        date: '31/08/2026',
        status: 'Published',
        verifiedPurchase: true
      }
    ]));
  }
};

// Auto-run local storage initialization
initializeLocalStorage();

/* ==========================================================================
   1. PRODUCTS CRUD OPERATIONS
   ========================================================================== */

/**
 * Fetch all products
 */
export const getProducts = async () => {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('Firestore getProducts error, using local fallback:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  const products = local ? JSON.parse(local) : [...mockProducts];

  // Ensure default mock products (e.g. i-Watch, Patek Philippe) are merged if missing from existing cache
  const existingIds = new Set(products.map(p => p.id));
  let modified = false;
  for (const mp of mockProducts) {
    if (!existingIds.has(mp.id)) {
      products.push(mp);
      modified = true;
    }
  }
  if (modified) {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  }
  return products;
};

/**
 * Fetch a single product by ID
 */
export const getProductById = async (id) => {
  if (isFirebaseConfigured()) {
    try {
      const docRef = doc(db, 'products', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
    } catch (err) {
      console.warn('Firestore getProductById error, using local fallback:', err);
    }
  }

  const products = await getProducts();
  return products.find(p => p.id === id) || null;
};

/**
 * Add a new product
 */
export const addProduct = async (productData) => {
  const newId = `prod-${Date.now()}`;
  const completeProduct = {
    id: newId,
    ...productData,
    rating: productData.rating || 5.0,
    numReviews: productData.numReviews || 0,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'products', newId), completeProduct);
      return completeProduct;
    } catch (err) {
      console.warn('Firestore addProduct error, using local fallback:', err);
    }
  }

  const products = await getProducts();
  const updated = [completeProduct, ...products];
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
  return completeProduct;
};

/**
 * Update an existing product
 */
export const updateProduct = async (id, updateData) => {
  if (isFirebaseConfigured()) {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, updateData);
      return { id, ...updateData };
    } catch (err) {
      console.warn('Firestore updateProduct error, using local fallback:', err);
    }
  }

  const products = await getProducts();
  const updated = products.map(p => p.id === id ? { ...p, ...updateData } : p);
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
  return updated.find(p => p.id === id);
};

/**
 * Delete a product
 */
export const deleteProduct = async (id) => {
  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'products', id));
      return true;
    } catch (err) {
      console.warn('Firestore deleteProduct error, using local fallback:', err);
    }
  }

  const products = await getProducts();
  const updated = products.filter(p => p.id !== id);
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(updated));
  return true;
};

/* ==========================================================================
   2. CATEGORIES CRUD OPERATIONS
   ========================================================================== */

/**
 * Fetch all categories
 */
export const getCategories = async () => {
  if (isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('Firestore getCategories error, using local fallback:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_CATEGORIES_KEY);
  return local ? JSON.parse(local) : mockCategories;
};

/**
 * Add a new category
 */
export const addCategory = async (categoryData) => {
  const newId = `cat-${Date.now()}`;
  const completeCategory = { id: newId, ...categoryData };

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'categories', newId), completeCategory);
      return completeCategory;
    } catch (err) {
      console.warn('Firestore addCategory error, using local fallback:', err);
    }
  }

  const categories = await getCategories();
  const updated = [...categories, completeCategory];
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updated));
  return completeCategory;
};

/**
 * Delete a category
 */
export const deleteCategory = async (id) => {
  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'categories', id));
      return true;
    } catch (err) {
      console.warn('Firestore deleteCategory error, using local fallback:', err);
    }
  }

  const categories = await getCategories();
  const updated = categories.filter(c => c.id !== id);
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updated));
  return true;
};

/**
 * Update an existing category
 */
export const updateCategory = async (id, categoryData) => {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'categories', id), categoryData);
    } catch (err) {
      console.warn('Firestore updateCategory error, using local fallback:', err);
    }
  }

  const categories = await getCategories();
  const updated = categories.map(c => c.id === id ? { ...c, ...categoryData } : c);
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updated));
  return updated.find(c => c.id === id);
};

/* ==========================================================================
   2.5 BRANDS CRUD OPERATIONS
   ========================================================================== */

/**
 * Fetch all watchmaker brands
 */
export const getBrands = async () => {
  if (isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, 'brands'));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (err) {
      console.warn('Firestore getBrands error, using local fallback:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_BRANDS_KEY);
  const brands = local ? JSON.parse(local) : [...mockBrands];

  // Ensure default mock brands (e.g. i-Watch, Patek Philippe) are merged if missing from existing cache
  const existingNames = new Set(brands.map(b => (b.name || '').toLowerCase().trim()));
  let modified = false;
  for (const mb of mockBrands) {
    if (!existingNames.has(mb.name.toLowerCase().trim())) {
      brands.push(mb);
      modified = true;
    }
  }
  if (modified) {
    localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(brands));
  }
  return brands;
};

/**
 * Add a new brand to database
 */
export const addBrand = async (brandData) => {
  const newId = brandData.id || `brand-${Date.now()}`;
  const completeBrand = { id: newId, ...brandData };

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'brands', newId), completeBrand);
      return completeBrand;
    } catch (err) {
      console.warn('Firestore addBrand error, using local fallback:', err);
    }
  }

  const brands = await getBrands();
  const exists = brands.some(b => b.name.toLowerCase() === completeBrand.name.toLowerCase());
  let updated;
  if (exists) {
    updated = brands.map(b => b.name.toLowerCase() === completeBrand.name.toLowerCase() ? { ...b, ...completeBrand } : b);
  } else {
    updated = [...brands, completeBrand];
  }
  localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(updated));
  return completeBrand;
};

/**
 * Delete a brand from database
 */
export const deleteBrand = async (brandIdOrName) => {
  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'brands', brandIdOrName));
    } catch (err) {
      console.warn('Firestore deleteBrand error, using local fallback:', err);
    }
  }

  const brands = await getBrands();
  const updated = brands.filter(b => b.id !== brandIdOrName && b.name.toLowerCase() !== String(brandIdOrName).toLowerCase());
  localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(updated));
  return true;
};

/* ==========================================================================
   3. ORDERS CRUD OPERATIONS
   ========================================================================== */

/**
 * Helper to compute numerical timestamp for order date sorting (newest first)
 */
export const getOrderTimestamp = (order) => {
  if (!order) return 0;
  if (order.createdAt) {
    if (typeof order.createdAt.toDate === 'function') {
      return order.createdAt.toDate().getTime();
    }
    if (typeof order.createdAt.seconds === 'number') {
      return order.createdAt.seconds * 1000;
    }
    const t = new Date(order.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  const rawDate = order.date;
  if (rawDate) {
    if (typeof rawDate === 'string') {
      const match = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const hours = match[4] ? parseInt(match[4], 10) : 0;
        const minutes = match[5] ? parseInt(match[5], 10) : 0;
        const seconds = match[6] ? parseInt(match[6], 10) : 0;
        return new Date(year, month, day, hours, minutes, seconds).getTime();
      }
    }
    const t = new Date(rawDate).getTime();
    if (!isNaN(t)) return t;
  }
  if (order.id) {
    const digits = String(order.id).replace(/\D/g, '');
    if (digits) return parseInt(digits, 10);
  }
  return 0;
};

/**
 * Fetch all orders (Admin / Sync view) sorted newest-first
 */
export const getAllOrders = async () => {
  let ordersList = [];
  if (isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      if (!snapshot.empty) {
        ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: formatDate(data.date || data.createdAt)
          };
        });
      }
    } catch (err) {
      console.warn('Firestore getAllOrders error, using local fallback:', err);
    }
  }

  if (ordersList.length === 0) {
    const local = localStorage.getItem(LOCAL_ORDERS_KEY);
    const orders = local ? JSON.parse(local) : mockOrders;
    ordersList = orders.map(o => ({
      ...o,
      date: formatDate(o.date || o.createdAt)
    }));
  }

  return ordersList.sort((a, b) => {
    const timeA = getOrderTimestamp(a);
    const timeB = getOrderTimestamp(b);
    if (timeA !== timeB) return timeB - timeA;
    const numA = String(a.id || '').replace(/\D/g, '');
    const numB = String(b.id || '').replace(/\D/g, '');
    if (numA && numB) return parseInt(numB, 10) - parseInt(numA, 10);
    return 0;
  });
};

/**
 * Fetch orders for a specific user
 */
export const getOrdersByUserId = async (userId, userEmail) => {
  const allOrders = await getAllOrders();
  return allOrders.filter(o => 
    (userId && o.userId === userId) || 
    (userEmail && o.customer?.email?.toLowerCase() === userEmail.toLowerCase())
  );
};

/**
 * Create a new order (Checkout / Direct Buy)
 * Automatically decrements inventory stock for all purchased watches!
 */
export const createOrder = async (orderData) => {
  const newId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date();
  const etaDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // Default 10 days delivery window

  const completeOrder = {
    id: newId,
    date: getCurrentDateDDMMYYYY(),
    status: 'Processing',
    trackingNumber: 'Awaiting Dispatch',
    estimatedDeliveryDays: 10,
    estimatedDeliveryDate: etaDate.toISOString(),
    deliveryNoticeStatus: 'ON_TIME',
    deliveryNoticeMessage: 'Transit normal — On schedule for delivery',
    ...orderData,
    createdAt: now.toISOString()
  };

  // 1. Save order to Firestore if configured
  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'orders', newId), completeOrder);
    } catch (err) {
      console.warn('Firestore createOrder error, using local fallback:', err);
    }
  }

  // 2. Persist order in local storage fallback
  const orders = await getAllOrders();
  const updated = [completeOrder, ...orders.filter(o => o.id !== newId)];
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));

  // 3. AUTOMATIC STOCK DEDUCTION: Subtract purchased quantity from product stock
  if (completeOrder.items && Array.isArray(completeOrder.items)) {
    for (const item of completeOrder.items) {
      const productId = item.id || item.productId;
      const quantityPurchased = Number(item.quantity) || 1;
      if (productId) {
        try {
          const product = await getProductById(productId);
          if (product) {
            const currentStock = Number(product.stock) || 0;
            const newStock = Math.max(0, currentStock - quantityPurchased);
            await updateProduct(productId, { stock: newStock });
          }
        } catch (stockErr) {
          console.warn(`Error deducting stock for product ${productId}:`, stockErr);
        }
      }
    }
  }

  return completeOrder;
};

/**
 * Update order status
 * If status changes to 'Cancelled', automatically restores the watch stock!
 */
export const updateOrderStatus = async (orderId, status) => {
  const orders = await getAllOrders();
  const existingOrder = orders.find(o => o.id === orderId);

  // If cancelling an active order, return the stock to the catalog
  if (status === 'Cancelled' && existingOrder && existingOrder.status !== 'Cancelled') {
    if (existingOrder.items && Array.isArray(existingOrder.items)) {
      for (const item of existingOrder.items) {
        const productId = item.id || item.productId;
        const qtyToRestore = Number(item.quantity) || 1;
        if (productId) {
          try {
            const product = await getProductById(productId);
            if (product) {
              const currentStock = Number(product.stock) || 0;
              await updateProduct(productId, { stock: currentStock + qtyToRestore });
            }
          } catch (e) {
            console.warn(`Error restoring stock for cancelled order ${orderId}:`, e);
          }
        }
      }
    }
  }

  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      return true;
    } catch (err) {
      console.warn('Firestore updateOrderStatus error, using local fallback:', err);
    }
  }

  const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  return true;
};

/**
 * Update order tracking number
 */
export const updateOrderTracking = async (orderId, trackingNumber) => {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'orders', orderId), { trackingNumber });
      return true;
    } catch (err) {
      console.warn('Firestore updateOrderTracking error, using local fallback:', err);
    }
  }

  const orders = await getAllOrders();
  const updated = orders.map(o => o.id === orderId ? { ...o, trackingNumber } : o);
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  return true;
};

/**
 * Update order logistics (ETA date, alert status, alert custom message)
 */
export const updateOrderLogistics = async (orderId, logisticsData) => {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'orders', orderId), logisticsData);
      return true;
    } catch (err) {
      console.warn('Firestore updateOrderLogistics error, using local fallback:', err);
    }
  }

  const orders = await getAllOrders();
  const updated = orders.map(o => o.id === orderId ? { ...o, ...logisticsData } : o);
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  return true;
};

/**
 * Public Order Tracking Lookup by Order ID or Tracking Number
 */
export const trackOrderById = async (orderId) => {
  if (!orderId) return null;
  const raw = orderId.trim();
  const cleanId = raw.toUpperCase().replace(/^#/, '');
  const allOrders = await getAllOrders();
  return allOrders.find(o => {
    if (!o.id) return false;
    const oIdUpper = o.id.toUpperCase();
    const hashIdUpper = `#${oIdUpper}`;
    const trackingUpper = (o.trackingNumber || '').toUpperCase();

    return (
      oIdUpper === cleanId ||
      oIdUpper === `ORD-${cleanId}` ||
      hashIdUpper === raw.toUpperCase() ||
      oIdUpper.includes(cleanId) ||
      (trackingUpper && trackingUpper === cleanId) ||
      (trackingUpper && trackingUpper.includes(cleanId))
    );
  }) || null;
};

/* ==========================================================================
   4. REVIEWS CRUD OPERATIONS
   ========================================================================== */

/**
 * Fetch all reviews
 */
export const getAllReviews = async () => {
  if (isFirebaseConfigured()) {
    try {
      const snapshot = await getDocs(collection(db, 'reviews'));
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: formatDate(data.date)
          };
        });
      }
    } catch (err) {
      console.warn('Firestore getAllReviews error, using local fallback:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_REVIEWS_KEY);
  const reviews = local ? JSON.parse(local) : [];
  return reviews.map(r => ({
    ...r,
    date: formatDate(r.date)
  }));
};

/**
 * Real-time listener for reviews (subscribes to Firestore updates or local fallback)
 */
export const subscribeToReviews = (callback) => {
  if (isFirebaseConfigured()) {
    try {
      const q = query(collection(db, 'reviews'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: formatDate(data.date)
          };
        });
        callback(list);
      }, (err) => {
        console.warn('Firestore reviews subscription error:', err);
      });
      return unsubscribe;
    } catch (err) {
      console.warn('Error setting up reviews listener:', err);
    }
  }

  // Local fallback if Firebase not configured
  getAllReviews().then(callback);
  return () => {};
};

/**
 * Add a review
 */
export const addReview = async (reviewData) => {
  const newId = `REV-${Math.floor(100 + Math.random() * 900)}`;
  const defaultWatchImage = 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400';
  const completeReview = {
    id: newId,
    date: getCurrentDateDDMMYYYY(),
    status: 'Pending',
    watchImage: reviewData.watchImage || defaultWatchImage,
    ...reviewData
  };
  if (!completeReview.watchImage) {
    completeReview.watchImage = defaultWatchImage;
  }

  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'reviews', newId), completeReview);
      return completeReview;
    } catch (err) {
      console.warn('Firestore addReview error, using local fallback:', err);
    }
  }

  const reviews = await getAllReviews();
  const updated = [completeReview, ...reviews];
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
  return completeReview;
};

/**
 * Update review status (Approved / Flagged)
 */
export const updateReviewStatus = async (reviewId, status) => {
  if (isFirebaseConfigured()) {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), { status });
      return true;
    } catch (err) {
      console.warn('Firestore updateReviewStatus error, using local fallback:', err);
    }
  }

  const reviews = await getAllReviews();
  const updated = reviews.map(r => r.id === reviewId ? { ...r, status } : r);
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
  return true;
};

/**
 * Delete a review permanently from Firestore and local storage
 */
export const deleteReview = async (reviewId) => {
  if (isFirebaseConfigured()) {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
    } catch (err) {
      console.warn('Firestore deleteReview error, using local fallback:', err);
    }
  }

  const reviews = await getAllReviews();
  const updated = reviews.filter(r => r.id !== reviewId);
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(updated));
  return true;
};

/* ==========================================================================
   6. USERS & COLLECTORS DIRECTORY
   ========================================================================== */

/**
 * Fetch all registered users & collectors consolidated with live orders metadata
 */
export const getAllUsers = async () => {
  const usersMap = new Map();

  // 1. Fetch from Firestore users collection if configured
  if (isFirebaseConfigured()) {
    try {
      const userSnapshot = await getDocs(collection(db, 'users'));
      userSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const id = docSnap.id;
        const email = (data.email || '').toLowerCase().trim();
        if (email) {
          let role = 'Member';
          if (data.role === 'admin' || data.role === 'Admin') {
            role = 'Admin';
          } else if (data.role === 'VIP Collector' || data.role === 'vip') {
            role = 'VIP Collector';
          }

          usersMap.set(email, {
            id: id,
            uid: id,
            displayId: `USR-${id.slice(0, 5).toUpperCase()}`,
            name: data.fullName || data.name || email.split('@')[0],
            email: data.email,
            phone: data.phone || '+91 98201 44552',
            role: role,
            status: data.status || 'active',
            joinedDate: formatDate(data.createdAt || '15/01/2026'),
            ordersCount: 0,
            totalSpend: 0,
            verified: true
          });
        }
      });
    } catch (err) {
      console.warn('Error fetching Firestore users:', err);
    }
  }

  // 2. Fetch all orders and index/aggregate customer records
  const orders = await getAllOrders();
  orders.forEach(order => {
    const customer = order.customer || {};
    const email = (customer.email || order.email || `collector-${order.id}@wristora.com`).toLowerCase().trim();
    const name = customer.name || order.customerName || 'Valued Collector';
    const amount = Number(order.amount) || 0;
    const date = formatDate(order.date || order.createdAt || '01/08/2026');

    const isCancelled = order.status === 'Cancelled';

    if (usersMap.has(email)) {
      const existing = usersMap.get(email);
      if (!isCancelled) {
        existing.ordersCount += 1;
        existing.totalSpend += amount;
      }
      if (customer.phone && (!existing.phone || existing.phone === '+91 98201 44552')) {
        existing.phone = customer.phone;
      }
      if (existing.totalSpend >= 2000000 && existing.role !== 'Admin') {
        existing.role = 'VIP Collector';
      }
    } else {
      const pseudoId = `USR-${Math.abs(email.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString().slice(0, 5)}`;
      usersMap.set(email, {
        id: pseudoId,
        uid: pseudoId,
        displayId: pseudoId,
        name,
        email,
        phone: customer.phone || '+91 98201 44552',
        role: (amount >= 2000000 && !isCancelled) ? 'VIP Collector' : 'Member',
        status: 'active',
        joinedDate: date,
        ordersCount: isCancelled ? 0 : 1,
        totalSpend: isCancelled ? 0 : amount,
        verified: true,
        address: customer.address || 'Private Collection Vault',
        city: customer.city || 'Mumbai',
        state: customer.state || 'Maharashtra',
        pincode: customer.pincode || '400001'
      });
    }
  });

  // 3. Fallback mock users if totally empty
  if (usersMap.size === 0) {
    const fallbackUsers = [
      {
        id: 'local-collector-102',
        uid: 'local-collector-102',
        displayId: 'USR-101',
        name: 'Julian Vance',
        email: 'collector@wristora.com',
        phone: '+91 98201 44552',
        role: 'VIP Collector',
        status: 'active',
        joinedDate: '15/01/2026',
        ordersCount: 4,
        totalSpend: 2810000,
        verified: true
      },
      {
        id: 'local-admin-wristora',
        uid: 'local-admin-wristora',
        displayId: 'USR-ADMIN',
        name: 'Alexander Sterling',
        email: 'wristora@gmail.com',
        phone: '+91 98111 00992',
        role: 'Admin',
        status: 'active',
        joinedDate: '01/11/2025',
        ordersCount: 1,
        totalSpend: 745000,
        verified: true
      }
    ];
    const overrides = JSON.parse(localStorage.getItem(LOCAL_USERS_OVERRIDES_KEY) || '{}');
    return fallbackUsers.map(u => {
      const override = overrides[u.id] || overrides[u.email];
      return override ? { ...u, ...(override.role ? { role: override.role } : {}), ...(override.status ? { status: override.status } : {}) } : u;
    });
  }

  const overrides = JSON.parse(localStorage.getItem(LOCAL_USERS_OVERRIDES_KEY) || '{}');
  const userList = Array.from(usersMap.values()).map(user => {
    const override = overrides[user.id] || (user.uid ? overrides[user.uid] : null) || (user.email ? overrides[user.email.toLowerCase()] : null);
    if (override) {
      return {
        ...user,
        ...(override.role ? { role: override.role } : {}),
        ...(override.status ? { status: override.status } : {})
      };
    }
    return user;
  });

  return userList;
};

/**
 * Update user role (persisted to Firestore and local storage)
 */
/**
 * Update user role (persisted to Firestore and local storage)
 */
export const updateUserRole = async (userOrId, role) => {
  let userId = typeof userOrId === 'string' ? userOrId : (userOrId?.id || userOrId?.uid);
  let userEmail = typeof userOrId === 'object' ? (userOrId?.email || '').toLowerCase().trim() : '';
  let userName = typeof userOrId === 'object' ? (userOrId?.name || userOrId?.fullName || '') : '';
  let matchedDocId = userId;
  const mappedRole = role === 'Admin' ? 'admin' : (role === 'VIP Collector' ? 'VIP Collector' : 'user');

  if (isFirebaseConfigured()) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, { role: mappedRole, displayRole: role, updatedAt: serverTimestamp() });
      } else {
        const usersCol = collection(db, 'users');
        let foundDoc = null;
        const qUid = query(usersCol, where('uid', '==', userId));
        const snapUid = await getDocs(qUid);
        if (!snapUid.empty) {
          foundDoc = snapUid.docs[0];
        } else if (userEmail) {
          const qEmail = query(usersCol, where('email', '==', userEmail));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            foundDoc = snapEmail.docs[0];
          }
        }

        if (foundDoc) {
          matchedDocId = foundDoc.id;
          await updateDoc(doc(db, 'users', matchedDocId), { role: mappedRole, displayRole: role, updatedAt: serverTimestamp() });
        } else {
          await setDoc(userRef, {
            uid: userId,
            id: userId,
            email: userEmail || `${userId.toLowerCase()}@wristora.com`,
            fullName: userName || 'Valued Collector',
            role: mappedRole,
            displayRole: role,
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Firestore updateUserRole error, using local fallback:', err);
    }
  }

  const overrides = JSON.parse(localStorage.getItem(LOCAL_USERS_OVERRIDES_KEY) || '{}');
  overrides[userId] = { ...(overrides[userId] || {}), role };
  if (matchedDocId && matchedDocId !== userId) {
    overrides[matchedDocId] = { ...(overrides[matchedDocId] || {}), role };
  }
  if (userEmail) {
    overrides[userEmail] = { ...(overrides[userEmail] || {}), role };
  }
  localStorage.setItem(LOCAL_USERS_OVERRIDES_KEY, JSON.stringify(overrides));
  return true;
};

/**
 * Update user status (active / suspended) (persisted to Firestore and local storage)
 */
export const updateUserStatus = async (userOrId, status) => {
  let userId = typeof userOrId === 'string' ? userOrId : (userOrId?.id || userOrId?.uid);
  let userEmail = typeof userOrId === 'object' ? (userOrId?.email || '').toLowerCase().trim() : '';
  let userName = typeof userOrId === 'object' ? (userOrId?.name || userOrId?.fullName || '') : '';
  let matchedDocId = userId;

  if (isFirebaseConfigured()) {
    try {
      // 1. Try direct doc ID
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        await updateDoc(userRef, { status, updatedAt: serverTimestamp() });
      } else {
        // 2. Query by uid or email
        const usersCol = collection(db, 'users');
        let foundDoc = null;

        const qUid = query(usersCol, where('uid', '==', userId));
        const snapUid = await getDocs(qUid);
        if (!snapUid.empty) {
          foundDoc = snapUid.docs[0];
        } else if (userEmail) {
          const qEmail = query(usersCol, where('email', '==', userEmail));
          const snapEmail = await getDocs(qEmail);
          if (!snapEmail.empty) {
            foundDoc = snapEmail.docs[0];
          }
        }

        if (foundDoc) {
          matchedDocId = foundDoc.id;
          await updateDoc(doc(db, 'users', matchedDocId), { status, updatedAt: serverTimestamp() });
        } else {
          // Find by matching start of ID or displayId
          const allUsersSnap = await getDocs(usersCol);
          const cleanTarget = userId.replace(/^USR-/i, '').toLowerCase();
          const matched = allUsersSnap.docs.find(d => {
            const dId = d.id.toLowerCase();
            const dData = d.data();
            return dId.startsWith(cleanTarget) ||
                   (userEmail && dData.email && dData.email.toLowerCase() === userEmail) ||
                   (dData.email && dData.email.toLowerCase() === userId.toLowerCase());
          });

          if (matched) {
            matchedDocId = matched.id;
            await updateDoc(doc(db, 'users', matchedDocId), { status, updatedAt: serverTimestamp() });
          } else {
            // Create or merge document with email and name so it persists on reload!
            await setDoc(userRef, {
              uid: userId,
              id: userId,
              email: userEmail || `${userId.toLowerCase()}@wristora.com`,
              fullName: userName || 'Valued Collector',
              status,
              role: 'user',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }
      }
    } catch (err) {
      console.warn('Firestore updateUserStatus error, using local fallback:', err);
    }
  }

  const overrides = JSON.parse(localStorage.getItem(LOCAL_USERS_OVERRIDES_KEY) || '{}');
  overrides[userId] = { ...(overrides[userId] || {}), status };
  if (matchedDocId && matchedDocId !== userId) {
    overrides[matchedDocId] = { ...(overrides[matchedDocId] || {}), status };
  }
  if (userEmail) {
    overrides[userEmail] = { ...(overrides[userEmail] || {}), status };
  }
  localStorage.setItem(LOCAL_USERS_OVERRIDES_KEY, JSON.stringify(overrides));
  return true;
};

/* ==========================================================================
   6.5 STORE CONFIGURATIONS & SETTINGS
   ========================================================================== */

export const defaultHeroImages = [
  'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=1000',
  'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=1000'
];

export const defaultStoreSettings = {
  storeName: 'Wristora Haute Horlogerie',
  supportEmail: 'concierge@wristora.com',
  supportPhone: '+91 (022) 8921-9900',
  address: '402 Luxury Avenue, Marine Drive, Mumbai 400020',
  currency: 'INR (₹)',
  razorpayEnabled: true,
  stripeEnabled: false,
  twoFactorRequired: true,
  codLimit: '100000',
  freeShippingThreshold: '50000',
  shippingPartner: 'BlueDart Armored Express',
  vaultInsuranceIncluded: true,
  emailAlerts: true,
  smsTracking: true,
  heroImages: defaultHeroImages
};

/**
 * Fetch store configurations
 */
export const getStoreSettings = async () => {
  if (isFirebaseConfigured()) {
    try {
      const docRef = doc(db, 'settings', 'store');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { ...defaultStoreSettings, ...snapshot.data() };
      }
    } catch (err) {
      console.warn('Firestore getStoreSettings error, using local fallback:', err);
    }
  }

  const local = localStorage.getItem(LOCAL_SETTINGS_KEY);
  return local ? { ...defaultStoreSettings, ...JSON.parse(local) } : defaultStoreSettings;
};

/**
 * Update store configurations
 */
export const updateStoreSettings = async (settingsData) => {
  if (isFirebaseConfigured()) {
    try {
      await setDoc(doc(db, 'settings', 'store'), settingsData, { merge: true });
    } catch (err) {
      console.warn('Firestore updateStoreSettings error, using local fallback:', err);
    }
  }

  const current = await getStoreSettings();
  const updated = { ...current, ...settingsData };
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

/* ==========================================================================
   7. SEED DATABASE UTILITY (1-Click Sample Injector)
   ========================================================================== */

/**
 * Seeds the active database (Firestore or LocalStorage) with catalog sample watches
 */
export const seedDatabase = async () => {
  if (isFirebaseConfigured()) {
    try {
      // Seed products
      for (const p of mockProducts) {
        await setDoc(doc(db, 'products', p.id), p);
      }
      // Seed categories
      for (const c of mockCategories) {
        await setDoc(doc(db, 'categories', c.id), c);
      }
      // Seed brands
      for (const b of mockBrands) {
        await setDoc(doc(db, 'brands', b.id), b);
      }
      // Seed orders
      for (const o of mockOrders) {
        await setDoc(doc(db, 'orders', o.id), o);
      }
      return { success: true, target: 'Firestore Cloud' };
    } catch (err) {
      console.error('Failed seeding cloud database:', err);
      throw err;
    }
  } else {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(mockProducts));
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(mockCategories));
    localStorage.setItem(LOCAL_BRANDS_KEY, JSON.stringify(mockBrands));
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(mockOrders));
    return { success: true, target: 'Local Persistence (Demo Mode)' };
  }
};

/* ==========================================================================
   8. WRISTORA ATELIER VAULT WALLET OPERATIONS
   ========================================================================== */

const LOCAL_WALLETS_KEY = 'wristora_user_wallets_registry';

/**
 * Fetch wallet balance and transaction logs for a customer
 */
export const getUserWallet = async (userId, userEmail) => {
  const key = (userId || userEmail || 'guest').toLowerCase();
  if (isFirebaseConfigured() && userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return {
          balance: Number(data.walletBalance) || 0,
          transactions: Array.isArray(data.walletTransactions) ? data.walletTransactions : []
        };
      }
    } catch (err) {
      console.warn('Firestore getUserWallet error, falling back to local storage:', err);
    }
  }

  try {
    const localData = localStorage.getItem(LOCAL_WALLETS_KEY);
    const wallets = localData ? JSON.parse(localData) : {};
    const uWallet = wallets[key] || {};
    return {
      balance: Number(uWallet.balance) || 0,
      transactions: Array.isArray(uWallet.transactions) ? uWallet.transactions : []
    };
  } catch (err) {
    return { balance: 0, transactions: [] };
  }
};

/**
 * Credit funds to customer wallet (e.g. order refund / deposit)
 */
export const creditUserWallet = async (userId, userEmail, amount, description = 'Credit Refund Deposit', orderId = null) => {
  const numAmount = Number(amount) || 0;
  if (numAmount <= 0) return null;

  const currentWallet = await getUserWallet(userId, userEmail);
  const newBalance = currentWallet.balance + numAmount;
  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'CREDIT',
    amount: numAmount,
    description,
    orderId,
    date: getCurrentDateDDMMYYYY(),
    timestamp: new Date().toISOString()
  };

  const updatedTransactions = [newTx, ...currentWallet.transactions];
  const key = (userId || userEmail || 'guest').toLowerCase();

  try {
    const localData = localStorage.getItem(LOCAL_WALLETS_KEY);
    const wallets = localData ? JSON.parse(localData) : {};
    wallets[key] = { balance: newBalance, transactions: updatedTransactions };
    localStorage.setItem(LOCAL_WALLETS_KEY, JSON.stringify(wallets));
  } catch (e) {
    console.warn('Error persisting local wallet credit:', e);
  }

  if (isFirebaseConfigured() && userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        walletBalance: newBalance,
        walletTransactions: updatedTransactions
      });
    } catch (err) {
      console.warn('Firestore creditUserWallet error:', err);
    }
  }

  return { balance: newBalance, transaction: newTx };
};

/**
 * Debit funds from customer wallet (e.g. checkout payment deduction)
 */
export const debitUserWallet = async (userId, userEmail, amount, description = 'Checkout Purchase Payment', orderId = null) => {
  const numAmount = Number(amount) || 0;
  if (numAmount <= 0) return null;

  const currentWallet = await getUserWallet(userId, userEmail);
  if (currentWallet.balance < numAmount) {
    throw new Error(`Insufficient wallet balance. Available: ₹${currentWallet.balance.toLocaleString('en-IN')}`);
  }

  const newBalance = currentWallet.balance - numAmount;
  const newTx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'DEBIT',
    amount: numAmount,
    description,
    orderId,
    date: getCurrentDateDDMMYYYY(),
    timestamp: new Date().toISOString()
  };

  const updatedTransactions = [newTx, ...currentWallet.transactions];
  const key = (userId || userEmail || 'guest').toLowerCase();

  try {
    const localData = localStorage.getItem(LOCAL_WALLETS_KEY);
    const wallets = localData ? JSON.parse(localData) : {};
    wallets[key] = { balance: newBalance, transactions: updatedTransactions };
    localStorage.setItem(LOCAL_WALLETS_KEY, JSON.stringify(wallets));
  } catch (e) {
    console.warn('Error persisting local wallet debit:', e);
  }

  if (isFirebaseConfigured() && userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        walletBalance: newBalance,
        walletTransactions: updatedTransactions
      });
    } catch (err) {
      console.warn('Firestore debitUserWallet error:', err);
    }
  }

  return { balance: newBalance, transaction: newTx };
};
