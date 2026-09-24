import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Crown, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  MoreVertical, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  SlidersHorizontal,
  Lock,
  Eye,
  Wallet
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Loader from '../../components/common/Loader';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { getAllUsers, updateUserRole, updateUserStatus, getUserWallet } from '../../firebase/dbService';
import { formatDate } from '../../utils/dateFormatter';

/**
 * AdminUsers Component
 * 
 * Collector & Staff Directory connected to live Cloud Database & Orders Stream:
 * - Real-time customer search & role filter (Admin, VIP Collector, Member).
 * - Dynamic lifetime orders and spending breakdown computed from live orders.
 * - Role permission switcher and account status management (Active / Suspended).
 * - Collector inspection drawer modal.
 */
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Fetch live collectors & user accounts with real-time Firestore sync
  useEffect(() => {
    let isMounted = true;
    let unsubscribeSnapshot = null;

    const fetchCollectors = async () => {
      try {
        const data = await getAllUsers();
        if (isMounted) {
          setUsers(data || []);
        }
      } catch (err) {
        console.error('Error fetching collectors:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchCollectors();

    // Subscribe to live Firestore user document changes so status updates reflect dynamically
    try {
      unsubscribeSnapshot = onSnapshot(collection(db, 'users'), (snap) => {
        if (!isMounted) return;
        const firestoreStatuses = {};
        const firestoreRoles = {};
        snap.docs.forEach(docSnap => {
          const dt = docSnap.data();
          if (dt.status) {
            firestoreStatuses[docSnap.id] = dt.status;
            if (dt.uid) firestoreStatuses[dt.uid] = dt.status;
            if (dt.email) firestoreStatuses[dt.email.toLowerCase()] = dt.status;
          }
          if (dt.role || dt.displayRole) {
            const r = dt.displayRole || (dt.role === 'admin' ? 'Admin' : (dt.role === 'VIP Collector' ? 'VIP Collector' : 'Member'));
            firestoreRoles[docSnap.id] = r;
            if (dt.uid) firestoreRoles[dt.uid] = r;
            if (dt.email) firestoreRoles[dt.email.toLowerCase()] = r;
          }
        });

        setUsers(prev => {
          if (!prev || prev.length === 0) return prev;
          let changed = false;
          const updated = prev.map(u => {
            const newStatus = firestoreStatuses[u.id] || (u.uid ? firestoreStatuses[u.uid] : null) || (u.email ? firestoreStatuses[u.email.toLowerCase()] : null);
            const newRole = firestoreRoles[u.id] || (u.uid ? firestoreRoles[u.uid] : null) || (u.email ? firestoreRoles[u.email.toLowerCase()] : null);
            
            if ((newStatus && newStatus !== u.status) || (newRole && newRole !== u.role)) {
              changed = true;
              return {
                ...u,
                ...(newStatus ? { status: newStatus } : {}),
                ...(newRole ? { role: newRole } : {})
              };
            }
            return u;
          });
          return changed ? updated : prev;
        });
      }, (err) => {
        console.warn('Firestore live collectors listener error:', err);
      });
    } catch (e) {
      console.warn('Live collectors listener setup error:', e);
    }

    return () => {
      isMounted = false;
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // Summary Metrics
  const totalUsers = users.length;
  const vipUsers = users.filter(u => u.role === 'VIP Collector').length;
  const adminUsers = users.filter(u => u.role === 'Admin').length;
  const totalVolume = users.reduce((sum, u) => sum + (Number(u.totalSpend) || 0), 0);

  // Filtered Users
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.phone?.toLowerCase().includes(term) ||
      user.id?.toLowerCase().includes(term);

    const matchesRole = roleFilter === 'All' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, role: newRole }));
    }
    await updateUserRole(targetUser || userId, newRole);
    setToastMessage(`Updated role for ${targetUser?.name || targetUser?.email || userId} to ${newRole}.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Handle Status Toggle (Synchronously computed and persisted)
  const handleToggleStatus = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const currentStatus = targetUser.status || 'active';
    const updatedStatus = currentStatus === 'active' ? 'suspended' : 'active';

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: updatedStatus } : u));
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, status: updatedStatus }));
    }

    try {
      await updateUserStatus(targetUser, updatedStatus);
      setToastMessage(`Account for ${targetUser.name || targetUser.email || userId} changed to ${updatedStatus.toUpperCase()}.`);
    } catch (err) {
      console.error('Error toggling account status:', err);
      // Revert state on error
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: currentStatus } : u));
      setToastMessage('Failed to update account status. Please check your connection.');
    }
    setTimeout(() => setToastMessage(''), 4000);
  };

  if (isLoading) {
    return (
      <div className="py-32 flex justify-center items-center">
        <Loader size="lg" text="Syncing Collector Accounts & Acquisition Stats..." />
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
              Collector Accounts & Directory
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-luxury-charcoal-900 text-luxury-gold-300">
              {totalUsers} Members
            </span>
          </div>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
            Manage collector privilege tiers, access permissions, lifetime acquisition histories, and account security.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-5 rounded-2xl bg-luxury-cream-50 border border-luxury-cream-300 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center text-luxury-charcoal-500">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Accounts</span>
            <User size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900">{totalUsers}</p>
          <span className="text-[9px] sm:text-[10px] text-luxury-charcoal-400">Registered collectors</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-luxury-cream-50 border border-luxury-cream-300 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center text-purple-700">
            <span className="text-[10px] font-bold uppercase tracking-widest">VIP Collectors</span>
            <Crown size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900">{vipUsers}</p>
          <span className="text-[9px] sm:text-[10px] text-purple-700 font-semibold">Priority access</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-luxury-cream-50 border border-luxury-cream-300 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center text-luxury-gold-600">
            <span className="text-[10px] font-bold uppercase tracking-widest">Store Admins</span>
            <ShieldCheck size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900">{adminUsers}</p>
          <span className="text-[9px] sm:text-[10px] text-luxury-charcoal-400">Catalog authority</span>
        </div>

        <div className="p-3.5 sm:p-5 rounded-2xl bg-luxury-cream-50 border border-luxury-cream-300 space-y-1 shadow-2xs">
          <div className="flex justify-between items-center text-green-700">
            <span className="text-[10px] font-bold uppercase tracking-widest">Cumulative Spend</span>
            <ShoppingBag size={16} />
          </div>
          <p className="text-xl sm:text-2xl font-mono font-bold text-luxury-charcoal-900">₹{(totalVolume / 100000).toFixed(1)}L</p>
          <span className="text-[9px] sm:text-[10px] text-green-700 font-semibold">Settled volume</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-luxury-cream-50 p-4 rounded-2xl border border-luxury-cream-300 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-luxury-cream-300 rounded-xl text-xs text-luxury-charcoal-900 placeholder:text-luxury-charcoal-400 focus:outline-none focus:border-luxury-gold-500"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-luxury-charcoal-400" />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['All', 'Admin', 'VIP Collector', 'Member'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                roleFilter === role
                  ? 'bg-luxury-charcoal-900 text-white shadow-2xs'
                  : 'bg-white text-luxury-charcoal-600 hover:bg-luxury-cream-200 border border-luxury-cream-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Directory */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-4">
          
          {/* Mobile Touch Cards View (md:hidden) */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map((user) => (
              <div 
                key={user.id}
                className="bg-luxury-cream-50 rounded-2xl border border-luxury-cream-300 p-4 shadow-2xs space-y-3 text-left"
              >
                {/* Top: Avatar, Name & Privilege Role Dropdown */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-luxury-charcoal-900 text-luxury-gold-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                      {(user.name || 'Collector').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h4 className="font-bold text-luxury-charcoal-900 text-xs truncate">{user.name || 'Collector'}</h4>
                        {user.verified && <CheckCircle2 size={12} className="text-green-600 shrink-0" title="Verified Account" />}
                      </div>
                      <p className="text-[10px] text-luxury-charcoal-500 truncate">{user.email || 'collector@wristora.com'}</p>
                    </div>
                  </div>

                  <select
                    value={user.role || 'Member'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none transition-colors shrink-0 ${
                      user.role === 'Admin'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : user.role === 'VIP Collector'
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : 'bg-white text-luxury-charcoal-800 border-luxury-cream-300'
                    }`}
                  >
                    <option value="Admin">Admin</option>
                    <option value="VIP Collector">VIP</option>
                    <option value="Member">Member</option>
                  </select>
                </div>

                {/* Lifetime Acquisition Record */}
                <div className="pt-2 border-t border-luxury-cream-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-luxury-charcoal-400 block">Total Spend</span>
                    <span className="font-mono font-bold text-sm text-luxury-charcoal-900">
                      ₹{(Number(user.totalSpend) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-luxury-charcoal-400 block">Orders</span>
                    <span className="font-bold text-xs text-luxury-charcoal-800">
                      {user.ordersCount || 0} Acquired
                    </span>
                  </div>
                </div>

                {/* Footer: Joined Date, Status & Dossier Button */}
                <div className="pt-2 border-t border-luxury-cream-200 flex items-center justify-between">
                  <span className="text-[10px] text-luxury-charcoal-400">
                    Joined: {formatDate(user.joinedDate || '01/08/2026')}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        user.status === 'active'
                          ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                          : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                      }`}
                    >
                      {user.status === 'active' ? 'Active' : 'Suspended'}
                    </button>
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-luxury-charcoal-900 text-luxury-gold-300 hover:bg-luxury-charcoal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="View User Dossier"
                    >
                      <Eye size={12} />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Desktop Users Directory Table (hidden md:block) */}
          <div className="hidden md:block bg-luxury-cream-50 rounded-2xl border border-luxury-cream-300 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-luxury-cream-300 bg-luxury-cream-100 text-luxury-charcoal-600 uppercase tracking-widest text-[10px] font-bold">
                    <th className="py-4 px-6">Collector Profile</th>
                    <th className="py-4 px-4">Privilege Tier</th>
                    <th className="py-4 px-4">Acquisition Record</th>
                    <th className="py-4 px-4">Joined Date</th>
                    <th className="py-4 px-4">Account Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-cream-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-luxury-cream-100/80 transition-colors group">
                      
                      {/* Profile & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-luxury-charcoal-900 text-luxury-gold-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {(user.name || 'Collector').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h4 className="font-bold text-luxury-charcoal-900 text-xs">{user.name || 'Collector'}</h4>
                              {user.verified && <CheckCircle2 size={12} className="text-green-600" title="Verified Account" />}
                            </div>
                            <p className="text-[10px] text-luxury-charcoal-500">{user.email || 'collector@wristora.com'}</p>
                            <p className="text-[9px] text-luxury-charcoal-400 font-mono">ID: {user.displayId || (user.id?.length > 10 ? `USR-${user.id.slice(0, 5).toUpperCase()}` : user.id)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Privilege Role */}
                      <td className="py-4 px-4">
                        <select
                          value={user.role || 'Member'}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border cursor-pointer focus:outline-none transition-colors ${
                            user.role === 'Admin'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : user.role === 'VIP Collector'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : 'bg-white text-luxury-charcoal-800 border-luxury-cream-300'
                          }`}
                        >
                          <option value="Admin">Admin</option>
                          <option value="VIP Collector">VIP Collector</option>
                          <option value="Member">Member</option>
                        </select>
                      </td>

                      {/* Acquisition Record */}
                      <td className="py-4 px-4">
                        <p className="font-mono font-bold text-sm text-luxury-charcoal-900">
                          ₹{(Number(user.totalSpend) || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-luxury-charcoal-400">
                          {user.ordersCount || 0} {(user.ordersCount === 1) ? 'Order' : 'Orders'} Completed
                        </p>
                      </td>

                      {/* Joined Date */}
                      <td className="py-4 px-4 text-luxury-charcoal-600">
                        {formatDate(user.joinedDate || '01/08/2026')}
                      </td>

                      {/* Account Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            user.status === 'active'
                              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {user.status === 'active' ? 'Active' : 'Suspended'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 hover:bg-luxury-cream-200 text-luxury-charcoal-600 hover:text-luxury-charcoal-900 rounded-lg transition-colors cursor-pointer"
                          title="View User Dossier"
                        >
                          <Eye size={15} />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-luxury-cream-50 p-12 rounded-2xl border border-luxury-cream-300 text-center">
          <EmptyState
            title="No Collectors Matched"
            message="No user accounts match your search query or role filter."
            actionLabel="Reset Filters"
            onActionClick={() => { setSearchTerm(''); setRoleFilter('All'); }}
          />
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          size="lg"
          title={`Collector Dossier: ${selectedUser.name}`}
        >
          <div className="space-y-6 text-left text-xs font-sans">
            
            {/* Header Avatar & Tier */}
            <div className="flex items-center space-x-4 p-4 bg-luxury-cream-100 rounded-xl border border-luxury-cream-300">
              <div className="w-14 h-14 rounded-full bg-luxury-charcoal-900 text-luxury-gold-300 flex items-center justify-center font-bold text-lg shadow-sm">
                {(selectedUser.name || 'Collector').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-serif font-bold text-luxury-charcoal-900">{selectedUser.name}</h3>
                  <span className="px-2 py-0.5 bg-luxury-gold-100 text-luxury-gold-800 text-[10px] font-bold rounded-full">
                    {selectedUser.role}
                  </span>
                </div>
                <p className="text-luxury-charcoal-500 text-xs">{selectedUser.email}</p>
                <p className="text-[10px] text-luxury-charcoal-400">Phone: {selectedUser.phone || '+91 98201 44552'} • Member since {formatDate(selectedUser.joinedDate || '01/08/2026')}</p>
              </div>
            </div>

            {/* Financial History Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-white rounded-xl border border-luxury-cream-300 space-y-1">
                <span className="text-[9.5px] uppercase tracking-widest font-bold text-luxury-charcoal-400">Lifetime Vault Spend</span>
                <p className="text-lg font-mono font-bold text-luxury-charcoal-900">₹{(Number(selectedUser.totalSpend) || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3.5 bg-luxury-gold-50/60 rounded-xl border border-luxury-gold-300 space-y-1">
                <span className="text-[9.5px] uppercase tracking-widest font-bold text-luxury-gold-800 flex items-center gap-1">
                  <Wallet size={12} className="text-luxury-gold-600" /> Vault Wallet Credit
                </span>
                <p className="text-lg font-mono font-extrabold text-luxury-gold-900">
                  ₹{Number(selectedUser.walletBalance || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-luxury-cream-300 space-y-1">   
                <span className="text-[9.5px] uppercase tracking-widest font-bold text-luxury-charcoal-400">Acquisitions</span>
                <p className="text-lg font-serif font-bold text-luxury-charcoal-900">{selectedUser.ordersCount || 0} Orders</p>
              </div>
            </div>

            {/* Account Controls */}
            <div className="space-y-2 pt-2 border-t border-luxury-cream-300">
              <Button
                variant="primary"
                onClick={() => setSelectedUser(null)}
                className="w-full justify-center text-xs uppercase font-bold"
              >
                Close Dossier
              </Button>
            </div>

          </div>
        </Modal>
      )}

    </div>
  );
}

export default AdminUsers;
