import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Key, MapPin, ClipboardList, Heart, LogOut, ShieldCheck, CheckCircle2, AlertCircle, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { getUserWallet, creditUserWallet } from '../../firebase/dbService';

/**
 * Profile Page Component
 * 
 * Provides account profile updates, password modification panels,
 * Wristora Atelier Vault Wallet Passbook, and settings with live AuthContext bindings.
 */
function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, isAdmin, logoutUser, updateUserProfile, updateUserPassword } = useAuth();
  const adminUrl = import.meta.env.VITE_ADMIN_URL || `${window.location.protocol}//${window.location.hostname}:5174/admin`;

  // Check URL query parameters for active tab e.g. /profile?tab=wallet
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'profile';

  // Active navigation tab state
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  // Wallet State
  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [depositAmountInput, setDepositAmountInput] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Sync with AuthContext user data & fetch wallet details
  useEffect(() => {
    if (queryParams.get('tab')) {
      setActiveTab(queryParams.get('tab'));
    }
  }, [location.search]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchWalletDetails = async () => {
      const w = await getUserWallet(currentUser.uid, currentUser.email);
      setWalletData(w);
    };
    fetchWalletDetails();
  }, [currentUser, activeTab]);

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateJoined: 'Curator Member'
  });

  // Password data forms state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Sync with AuthContext user data
  useEffect(() => {
    if (currentUser || userProfile) {
      setProfileData({
        fullName: userProfile?.fullName || currentUser?.displayName || 'Watch Collector',
        email: currentUser?.email || 'collector@wristora.com',
        phone: userProfile?.phone || '+91 98765 43210',
        dateJoined: userProfile?.createdAt ? 'Verified Member' : 'Active Curator'
      });
    }
  }, [currentUser, userProfile]);

  // Input change handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => {
      const updated = { ...prev, [name]: value };
      // Real-time password match clearance
      if (name === 'confirmPassword' || name === 'newPassword') {
        if (updated.newPassword && updated.confirmPassword) {
          if (updated.newPassword === updated.confirmPassword) {
            setFormErrors(errs => ({ ...errs, confirmPassword: '' }));
          }
        }
      }
      return updated;
    });
    // Clear specific field error as user types
    if (formErrors[name]) {
      setFormErrors(errs => ({ ...errs, [name]: '' }));
    }
  };

  // Submission Handlers
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setFeedbackMessage({ type: '', text: '' });

    if (!profileData.fullName.trim()) {
      setFormErrors({ fullName: 'Full legal name cannot be empty' });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updateUserProfile({
        fullName: profileData.fullName.trim(),
        phone: profileData.phone.trim()
      });
      if (res?.success) {
        setFeedbackMessage({ type: 'success', text: 'Vault profile updated & saved to database successfully.' });
        setFormErrors({});
      } else {
        setFeedbackMessage({ type: 'error', text: res?.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setFeedbackMessage({ type: '', text: '' });
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);
      if (res?.success) {
        setFeedbackMessage({ 
          type: 'success', 
          text: 'Password updated successfully! Please use your new password for all future sign-ins.' 
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setFormErrors({});
      } else {
        if (res?.field === 'currentPassword') {
          setFormErrors(errs => ({ ...errs, currentPassword: res.error }));
        } else if (res?.field === 'newPassword') {
          setFormErrors(errs => ({ ...errs, newPassword: res.error }));
        }
        setFeedbackMessage({ type: 'error', text: res?.error || 'Failed to update password.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const amount = Number(depositAmountInput);
    if (!amount || amount <= 0) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid deposit amount.' });
      return;
    }

    setIsDepositing(true);
    try {
      const res = await creditUserWallet(
        currentUser?.uid,
        currentUser?.email,
        amount,
        'Direct Wallet Deposit'
      );
      setWalletData({
        balance: res.balance,
        transactions: [res.transaction, ...walletData.transactions]
      });
      setDepositAmountInput('');
      setFeedbackMessage({
        type: 'success',
        text: `₹${amount.toLocaleString('en-IN')} added to your Wristora Vault Wallet successfully!`
      });
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Failed to deposit funds.' });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const displayName = profileData.fullName || 'Collector';
  const displayInitial = displayName.charAt(0).toUpperCase();

  const sidebarLinks = [
    { id: 'profile', name: 'Profile Information', icon: User },
    { id: 'wallet', name: 'Atelier Vault Wallet', icon: Wallet },
    { id: 'security', name: 'Security Settings', icon: Key }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left space-y-8 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-luxury-cream-300 pb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-luxury-charcoal-900 font-bold tracking-wide">
            My Collector Vault
          </h1>
          <p className="text-xs text-luxury-charcoal-500 font-sans mt-1">
            Manage your personal details, shipping profiles, and account security.
          </p>
        </div>

        {isAdmin && (
          <a
            href={adminUrl}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-luxury-gold-100 border border-luxury-gold-300 text-luxury-gold-900 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 hover:bg-luxury-gold-200 transition-colors cursor-pointer"
          >
            <ShieldCheck size={14} className="text-luxury-gold-700" />
            <span>Store Admin Panel</span>
          </a>
        )}
      </div>

      {/* Main Layout: Navigation Sidebar + Form Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* Profile Fixed Sidebar */}
        <aside className="space-y-4 md:sticky md:top-24 md:self-start">
          
          {/* Quick Profile Summary Card */}
          <div className="bg-luxury-cream-50 p-6 rounded-2xl border border-luxury-cream-300 shadow-sm text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-luxury-charcoal-900 border-2 border-luxury-gold-400 flex items-center justify-center mx-auto text-xl font-serif font-bold text-luxury-gold-300 shadow-xs">
              {displayInitial}
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-luxury-charcoal-900">{profileData.fullName}</h3>
              <p className="text-[11px] text-luxury-charcoal-500 font-sans truncate">{profileData.email}</p>
            </div>
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider bg-luxury-cream-200 text-luxury-charcoal-700 px-3 py-1 rounded-full border border-luxury-cream-300">
              {isAdmin ? '👑 Store Administrator' : '💎 Verified Collector'}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="bg-luxury-cream-50 rounded-2xl border border-luxury-cream-300 shadow-sm overflow-hidden p-2 space-y-1">
            {sidebarLinks.map(link => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setFormErrors({});
                    setFeedbackMessage({ type: '', text: '' });
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-luxury-charcoal-900 text-white font-bold shadow-xs' 
                      : 'hover:bg-luxury-cream-200 text-luxury-charcoal-600 hover:text-luxury-charcoal-900'
                  }`}
                >
                  <Icon size={15} />
                  <span>{link.name}</span>
                </button>
              );
            })}

            {/* Sign Out Button in Sidebar */}
            <div className="pt-2 border-t border-luxury-cream-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-left text-xs uppercase tracking-wider font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

        </aside>

        {/* Form area */}
        <div className="md:col-span-3 bg-luxury-cream-50 p-6 md:p-8 rounded-2xl border border-luxury-cream-300 shadow-sm space-y-6">
          
          {/* Feedback Alert Box */}
          {feedbackMessage.text && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 ${
              feedbackMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedbackMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            
            /* Profile Info Form */
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <h3 className="text-sm font-serif font-bold uppercase tracking-widest text-luxury-charcoal-900 pb-3 border-b border-luxury-cream-300">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Legal Name"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  error={formErrors.fullName}
                  placeholder="Enter full name"
                />
                <Input
                  label="Contact Phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Email Address"
                  name="email"
                  type="email"
                  disabled
                  value={profileData.email}
                  className="opacity-75 bg-luxury-cream-100 cursor-not-allowed"
                  title="Email cannot be modified directly"
                />
                <Input
                  label="Membership Tier"
                  name="dateJoined"
                  disabled
                  value={profileData.dateJoined}
                  className="opacity-75 bg-luxury-cream-100 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" isLoading={isUpdating}>
                  Save Profile Changes
                </Button>
              </div>
            </form>

          ) : activeTab === 'wallet' ? (

            /* Wristora Atelier Vault Wallet & Passbook */
            <div className="space-y-6">
              <div className="pb-3 border-b border-luxury-cream-300 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-sm font-serif font-bold uppercase tracking-widest text-luxury-charcoal-900 flex items-center gap-2">
                    <Wallet size={16} className="text-luxury-gold-600" />
                    Wristora Atelier Vault Wallet
                  </h3>
                  <p className="text-[11px] text-luxury-charcoal-500 mt-0.5">
                    Live store credit balance applied instantly for 1-click acquisitions or order refunds.
                  </p>
                </div>
              </div>

              {/* Balance Summary Header Card */}
              <div className="bg-white p-6 rounded-2xl text-luxury-charcoal-900 shadow-md border-2 border-luxury-charcoal-900 relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-luxury-gold-700 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-luxury-gold-600 animate-pulse" /> Live Available Balance
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-mono font-extrabold text-black mt-1 tracking-tight">
                      ₹{walletData.balance.toLocaleString('en-IN')}
                    </h2>
                  </div>
                </div>

                <div className="pt-3 border-t border-luxury-cream-300 flex items-center justify-between text-xs text-luxury-charcoal-600">
                  <span>Owner: <strong className="text-black font-serif">{profileData.fullName}</strong></span>
                  <span>Currency: <strong className="text-black font-mono">INR (₹)</strong></span>
                </div>
              </div>

              {/* Passbook Transaction Ledger */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-luxury-charcoal-800 flex items-center gap-1.5">
                    <Clock size={14} className="text-luxury-gold-600" /> Transaction History & Passbook
                  </h4>
                  <span className="text-[10px] font-mono text-luxury-charcoal-500 font-bold">
                    {(walletData?.transactions || []).length} Total Logs
                  </span>
                </div>

                {(walletData?.transactions || []).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-luxury-cream-300/80 p-6 space-y-2">
                    <Wallet size={32} className="mx-auto text-luxury-cream-400" />
                    <p className="text-xs font-bold text-luxury-charcoal-700">No Wallet Activity Yet</p>
                    <p className="text-[11px] text-luxury-charcoal-400 max-w-sm mx-auto">
                      When you cancel an order or deposit funds, your credit entries and purchase debits will be listed here.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-luxury-cream-300 overflow-hidden shadow-2xs">
                    <div className="divide-y divide-luxury-cream-200">
                      {(walletData?.transactions || []).map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-luxury-cream-50 transition-colors">
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              tx.type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {tx.type === 'CREDIT' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-luxury-charcoal-900 truncate">
                                {tx.description || (tx.type === 'CREDIT' ? 'Credit Deposit' : 'Purchase Payment')}
                              </p>
                              <div className="flex items-center space-x-2 text-[10px] text-luxury-charcoal-400 font-mono mt-0.5">
                                <span>{tx.date || 'Recent'}</span>
                                {tx.orderId && (
                                  <span className="bg-luxury-cream-200 text-luxury-charcoal-700 px-1.5 py-0.5 rounded font-bold">
                                    #{tx.orderId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-mono font-extrabold text-sm ${
                              tx.type === 'CREDIT' ? 'text-emerald-700' : 'text-luxury-charcoal-900'
                            }`}>
                              {tx.type === 'CREDIT' ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
                            </span>
                            <span className={`block text-[9px] uppercase font-bold tracking-wider ${
                              tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-luxury-gold-600'
                            }`}>
                              {tx.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          ) : (

            /* Security password Form */
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <h3 className="text-sm font-serif font-bold uppercase tracking-widest text-luxury-charcoal-900 pb-3 border-b border-luxury-cream-300">
                Update Security Credentials
              </h3>

              <Input
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                error={formErrors.currentPassword}
                placeholder="••••••••••••"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Security Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={formErrors.newPassword}
                  placeholder="••••••••••••"
                />
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={formErrors.confirmPassword}
                  placeholder="••••••••••••"
                />
              </div>

              {/* Real-time Match Indicator */}
              {passwordData.newPassword && passwordData.confirmPassword && (
                <div className="text-xs font-sans flex items-center gap-1.5 -mt-2">
                  {passwordData.newPassword === passwordData.confirmPassword ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-emerald-600" /> Passwords match
                    </span>
                  ) : (
                    <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 font-semibold inline-flex items-center gap-1">
                      <AlertCircle size={13} className="text-red-500" /> Passwords do not match
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" variant="primary" size="md" isLoading={isUpdating}>
                  Update Password
                </Button>
              </div>
            </form>

          )}

        </div>

      </div>

    </div>
  );
}

export default Profile;
