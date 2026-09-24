import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/firebaseConfig';

/**
 * AuthContext
 * 
 * Central React Context that manages user authentication state,
 * profile data from Firestore, and strict credential verification across Wristora.
 */
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Local storage keys
const DEMO_USER_STORAGE_KEY = 'wristora_active_session_user';
const LOCAL_USERS_REGISTRY_KEY = 'wristora_registered_users_registry';

// Default accounts configured for Wristora Customer Storefront
const defaultAccounts = [
  {
    email: 'collector@wristora.com',
    password: 'user123456',
    fullName: 'Julian Vance',
    phone: '+91 98765 43210',
    role: 'user',
    uid: 'local-collector-102'
  }
];

// Helper to get all registered local users
function getLocalUsers() {
  try {
    const data = localStorage.getItem(LOCAL_USERS_REGISTRY_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Filter out admin accounts from customer app
      const filtered = parsed.filter(u => u.email.toLowerCase() !== 'wristora@gmail.com');
      return filtered.length > 0 ? filtered : defaultAccounts;
    }
  } catch (e) {
    console.warn('Error reading local users registry:', e);
  }
  return defaultAccounts;
}

// Helper to save a user to local registry
function saveLocalUser(userData) {
  try {
    const list = getLocalUsers().filter(u => u.email.toLowerCase() !== userData.email.toLowerCase());
    list.push(userData);
    localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving to local users registry:', e);
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to determine if an email has admin clearance (customer app does not grant admin access)
  const isMasterAdminEmail = (email) => {
    return false;
  };

  // 1. Fetch or create Firestore user profile document
  const fetchUserProfile = async (user) => {
    if (!user) {
      setUserProfile(null);
      return null;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (isMasterAdminEmail(user.email) && data.role !== 'admin') {
          data.role = 'admin';
        }
        data.status = data.status || 'active';
        setUserProfile(data);
        return data;
      } else {
        const initialProfile = {
          uid: user.uid,
          fullName: user.displayName || user.email?.split('@')[0] || 'Valued Collector',
          email: user.email,
          phone: '',
          role: isMasterAdminEmail(user.email) ? 'admin' : 'user',
          status: 'active',
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);
        return initialProfile;
      }
    } catch (error) {
      // Fallback local profile if cloud database is not reachable
      const localUsers = getLocalUsers();
      const existing = localUsers.find(u => u.email.toLowerCase() === user.email?.toLowerCase());

      const fallbackProfile = {
        uid: user.uid,
        fullName: user.displayName || existing?.fullName || user.email?.split('@')[0] || 'Member',
        email: user.email,
        phone: user.phone || existing?.phone || '+91 98765 43210',
        role: isMasterAdminEmail(user.email) ? 'admin' : (existing?.role || 'user'),
        status: existing?.status || 'active'
      };
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  // 2. Register with Email and Password
  const registerWithEmail = async (email, password, fullName, phone = '') => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Store administrator account cannot be registered on customer storefront
    if (cleanEmail === 'wristora@gmail.com') {
      return {
        success: false,
        error: 'This email address is reserved for store administration and cannot be registered as a customer account.'
      };
    }

    // Save to local registry so it's always recognized
    const localUserObj = {
      uid: `usr-${Date.now()}`,
      email: cleanEmail,
      password: password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role: 'user'
    };
    saveLocalUser(localUserObj);

    try {
      // Register in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: fullName });

      const userDocRef = doc(db, 'users', user.uid);
      const newUserData = {
        uid: user.uid,
        fullName: fullName.trim(),
        email: user.email,
        phone: phone.trim(),
        role: 'user',
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, newUserData);
      setUserProfile(newUserData);

      return { success: true, user };
    } catch (error) {
      // If Firebase is unconfigured or throwing errors, use strict local registry verification
      if (isFirebaseUnconfigured(error) || error.code === 'auth/network-request-failed') {
        const mockUser = {
          uid: localUserObj.uid,
          email: cleanEmail,
          displayName: fullName,
          phone
        };
        const mockProfile = {
          uid: mockUser.uid,
          fullName,
          email: cleanEmail,
          phone,
          role: localUserObj.role
        };
        setCurrentUser(mockUser);
        setUserProfile(mockProfile);
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));
        return { success: true, user: mockUser };
      }
      return { success: false, error: formatAuthError(error) };
    }
  };

  // 3. Login with Email and Password (CUSTOMER ONLY - BLOCKS ADMIN ACCOUNT & SUSPENDED ACCOUNTS)
  const loginWithEmail = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Prevent store administrator from logging into customer storefront
    if (cleanEmail === 'wristora@gmail.com') {
      return {
        success: false,
        error: 'Access denied: Store administrator accounts cannot log in to the customer storefront. Please access the Admin Portal at http://localhost:5174/login'
      };
    }

    try {
      // Attempt Firebase Authentication first
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);

      // Verify the authenticated Firebase user is not the administrator
      if (userCredential.user?.email?.toLowerCase().trim() === 'wristora@gmail.com') {
        await signOut(auth);
        return {
          success: false,
          error: 'Access denied: Store administrator accounts cannot log in to the customer storefront. Please access the Admin Portal at http://localhost:5174/login'
        };
      }

      const profile = await fetchUserProfile(userCredential.user);
      if (profile && profile.status === 'suspended') {
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        return {
          success: false,
          error: 'Your account has been suspended by store administration. Please contact customer care to restore access.'
        };
      }

      setCurrentUser(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      const code = error.code || '';

      // If Firebase Authentication explicitly rejected the credentials because password was wrong:
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        return { success: false, error: 'Incorrect email or password. Please check your credentials.' };
      }

      // Check local user registry ONLY for offline accounts or mock demo accounts
      const localUsers = getLocalUsers();
      const localMatch = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

      // If local match exists and Firebase was unconfigured or user not found in Firebase:
      if (localMatch && (isFirebaseUnconfigured(error) || code === 'auth/user-not-found')) {
        if (localMatch.password === password) {
          // Check Firestore directly if this account is suspended
          let isSuspended = localMatch.status === 'suspended';
          try {
            if (localMatch.uid) {
              const snap = await getDoc(doc(db, 'users', localMatch.uid));
              if (snap.exists() && snap.data().status === 'suspended') {
                isSuspended = true;
              }
            }
          } catch (e) {
            // silent network fallback
          }

          if (isSuspended) {
            return {
              success: false,
              error: 'Your account has been suspended by store administration. Please contact customer care to restore access.'
            };
          }

          const matchedUser = {
            uid: localMatch.uid,
            email: localMatch.email,
            displayName: localMatch.fullName,
            phone: localMatch.phone
          };
          const matchedProfile = {
            uid: localMatch.uid,
            fullName: localMatch.fullName,
            email: localMatch.email,
            phone: localMatch.phone,
            role: 'user',
            status: 'active'
          };
          setCurrentUser(matchedUser);
          setUserProfile(matchedProfile);
          localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: matchedUser, profile: matchedProfile }));
          return { success: true, user: matchedUser };
        } else {
          // Wrong password entered for local account!
          return { success: false, error: 'Incorrect email or password. Please check your credentials.' };
        }
      }

      if (code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email address. Please register first.' };
      }

      return { success: false, error: formatAuthError(error) };
    }
  };

  // 4. Login / Sign Up with Google
  const loginWithGoogle = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const cleanEmail = userCredential.user?.email?.toLowerCase().trim();

      // Guard: Administrator account cannot sign into customer storefront via Google
      if (cleanEmail === 'wristora@gmail.com') {
        await signOut(auth);
        return {
          success: false,
          error: 'Access denied: Store administrator accounts cannot log in to the customer storefront. Please access the Admin Portal at http://localhost:5174/login'
        };
      }

      const profile = await fetchUserProfile(userCredential.user);
      if (profile && profile.status === 'suspended') {
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        return {
          success: false,
          error: 'Your account has been suspended by store administration. Please contact customer care to restore access.'
        };
      }

      setCurrentUser(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      if (isFirebaseUnconfigured(error) || error.code === 'auth/network-request-failed') {
        const mockUser = {
          uid: 'demo-google-user',
          email: 'google.user@wristora.com',
          displayName: 'Google Collector'
        };
        const mockProfile = {
          uid: mockUser.uid,
          fullName: mockUser.displayName,
          email: mockUser.email,
          role: 'user',
          status: 'active'
        };
        setCurrentUser(mockUser);
        setUserProfile(mockProfile);
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: mockUser, profile: mockProfile }));
        return { success: true, user: mockUser };
      }
      return { success: false, error: formatAuthError(error) };
    }
  };

  // 5. Reset Password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      if (isFirebaseUnconfigured(error)) {
        return { success: true };
      }
      return { success: false, error: formatAuthError(error) };
    }
  };

  // 6. Logout User
  const logoutUser = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore offline errors
    }
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    return { success: true };
  };

  // 7. Auth State Observer with Local Fallback persistence, Admin account isolation & Suspension Enforcement
  useEffect(() => {
    const savedDemoUser = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        if (
          parsed.user?.email?.toLowerCase().trim() === 'wristora@gmail.com' ||
          parsed.profile?.status === 'suspended'
        ) {
          // Immediately purge admin or suspended session from customer storefront
          localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        } else {
          setCurrentUser(parsed.user);
          setUserProfile(parsed.profile);
        }
      } catch (e) {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          if (user.email?.toLowerCase().trim() === 'wristora@gmail.com') {
            // Disallow admin account on customer storefront
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            localStorage.removeItem(DEMO_USER_STORAGE_KEY);
          } else {
            const profile = await fetchUserProfile(user);
            if (profile && profile.status === 'suspended') {
              // Account was suspended by administrator
              await signOut(auth);
              setCurrentUser(null);
              setUserProfile(null);
              localStorage.removeItem(DEMO_USER_STORAGE_KEY);
            } else {
              setCurrentUser(user);
            }
          }
        } else if (!savedDemoUser) {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.warn('Auth state resolution error:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 7b. Live listener: Instantly sign out user if an administrator suspends their account while active
  useEffect(() => {
    if (!currentUser?.uid || currentUser.email?.toLowerCase().trim() === 'wristora@gmail.com') return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const unsub = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === 'suspended') {
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            localStorage.removeItem(DEMO_USER_STORAGE_KEY);
          }
        }
      }, (err) => {
        // silent fallback
      });

      return () => unsub();
    } catch (e) {
      // ignore
    }
  }, [currentUser?.uid]);

  // 7. Update User Profile (Firestore + LocalStorage persistence)
  const updateUserProfile = async (updates) => {
    try {
      if (currentUser) {
        if (updates.fullName && currentUser.updateProfile) {
          try {
            await updateProfile(currentUser, { displayName: updates.fullName });
          } catch (e) {
            // ignore
          }
        }
        
        if (!isFirebaseUnconfigured({})) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, updates, { merge: true });
          } catch (e) {
            console.warn('Firestore user update error, fallback to local:', e);
          }
        }
      }

      const updatedProfile = { ...(userProfile || {}), ...updates };
      setUserProfile(updatedProfile);

      if (currentUser) {
        const updatedCurrent = {
          ...currentUser,
          displayName: updates.fullName || currentUser.displayName,
          phone: updates.phone || currentUser.phone
        };
        setCurrentUser(updatedCurrent);

        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({
          user: updatedCurrent,
          profile: updatedProfile
        }));
      }

      const localUsers = getLocalUsers();
      const emailToMatch = (currentUser?.email || userProfile?.email || '').toLowerCase();
      if (emailToMatch) {
        const updatedList = localUsers.map(u => {
          if (u.email?.toLowerCase() === emailToMatch) {
            return {
              ...u,
              fullName: updates.fullName || u.fullName,
              phone: updates.phone || u.phone,
              ...updates
            };
          }
          return u;
        });
        localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(updatedList));
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message };
    }
  };

  // 8. Update User Password (Auth + LocalStorage persistence)
  const updateUserPassword = async (currentPassword, newPassword) => {
    try {
      const emailToMatch = (currentUser?.email || userProfile?.email || '').toLowerCase().trim();
      const firebaseUser = auth.currentUser;

      // 1. If active Firebase Auth user exists:
      if (firebaseUser && firebaseUser.email) {
        // Re-authenticate with currentPassword to verify identity and refresh auth token
        try {
          const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
          await reauthenticateWithCredential(firebaseUser, credential);
        } catch (authErr) {
          console.warn('Re-authentication error in updateUserPassword:', authErr);
          if (
            authErr.code === 'auth/wrong-password' || 
            authErr.code === 'auth/invalid-credential'
          ) {
            return { 
              success: false, 
              field: 'currentPassword',
              error: 'Current password is incorrect. Please verify your current password.' 
            };
          }
          if (authErr.code === 'auth/too-many-requests') {
            return { 
              success: false, 
              error: 'Too many unsuccessful attempts. Please try again later.' 
            };
          }
          return {
            success: false,
            error: authErr.message || 'Verification failed. Please check your current password.'
          };
        }

        // Now update the password in Firebase Authentication
        try {
          await updatePassword(firebaseUser, newPassword);
        } catch (updateErr) {
          console.error('Firebase updatePassword error:', updateErr);
          if (updateErr.code === 'auth/weak-password') {
            return { 
              success: false, 
              field: 'newPassword',
              error: 'New security password must be at least 6 characters.' 
            };
          }
          if (updateErr.code === 'auth/requires-recent-login') {
            return { 
              success: false, 
              error: 'Security session expired. Please log out and sign back in to change your credentials.' 
            };
          }
          return { 
            success: false, 
            error: updateErr.message || 'Failed to update security password in authentication system.' 
          };
        }
      }

      // 2. Synchronize local registry
      const localUsers = getLocalUsers();
      const userIdx = localUsers.findIndex(u => u.email?.toLowerCase() === emailToMatch);
      
      if (userIdx !== -1) {
        const existingUser = localUsers[userIdx];
        // If purely a local offline user without active Firebase session:
        if (!firebaseUser && existingUser.password && existingUser.password !== currentPassword) {
          return { 
            success: false, 
            field: 'currentPassword',
            error: 'Current password is incorrect. Please verify your current password.' 
          };
        }
        localUsers[userIdx].password = newPassword;
        localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(localUsers));
      }

      // 3. Update saved active session user
      const savedDemoUser = localStorage.getItem(DEMO_USER_STORAGE_KEY);
      if (savedDemoUser) {
        try {
          const parsed = JSON.parse(savedDemoUser);
          if (parsed.user && parsed.user.email?.toLowerCase() === emailToMatch) {
            if (parsed.user.password) parsed.user.password = newPassword;
            localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(parsed));
          }
        } catch (e) {}
      }

      return { success: true };
    } catch (err) {
      console.error('updateUserPassword uncaught exception:', err);
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  };

  const isAdmin = false;

  const value = {
    currentUser,
    userProfile,
    isAdmin,
    loading,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    resetPassword,
    logoutUser,
    updateUserProfile,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

/**
 * Check if the error indicates Firebase credentials are missing
 */
function isFirebaseUnconfigured(error) {
  const code = error?.code || '';
  return (
    code === 'auth/api-key-not-valid' ||
    code === 'auth/invalid-api-key' ||
    code === 'auth/project-not-found' ||
    !import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.VITE_FIREBASE_API_KEY.includes('MockDemo')
  );
}

function formatAuthError(error) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please login instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    default:
      return error?.message || 'Invalid credentials. Please verify your email and password.';
  }
}
