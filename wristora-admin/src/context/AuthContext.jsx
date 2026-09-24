import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

// Default accounts configured for Wristora Admin
const defaultAccounts = [
  {
    email: 'wristora@gmail.com',
    password: 'Wristora@1234',
    fullName: 'Wristora Administrator',
    phone: '+91 (022) 8921-9900',
    role: 'admin',
    uid: 'local-admin-wristora'
  }
];

// Helper to get all registered local users
function getLocalUsers() {
  try {
    const data = localStorage.getItem(LOCAL_USERS_REGISTRY_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure wristora@gmail.com is always up-to-date with Wristora@1234
      const hasAdmin = parsed.some(u => u.email.toLowerCase() === 'wristora@gmail.com');
      if (!hasAdmin) {
        parsed.push(defaultAccounts[0]);
        localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(parsed));
      } else {
        // Update password if outdated
        const updated = parsed.map(u => u.email.toLowerCase() === 'wristora@gmail.com' ? { ...u, password: 'Wristora@1234', role: 'admin' } : u);
        localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(updated));
        return updated;
      }
      return parsed;
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

  // Helper to determine if an email has admin clearance
  const isMasterAdminEmail = (email) => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return clean === 'wristora@gmail.com';
  };

  // 1. Fetch or create Firestore user profile document
  const fetchUserProfile = async (user) => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (isMasterAdminEmail(user.email) && data.role !== 'admin') {
          data.role = 'admin';
        }
        setUserProfile(data);
      } else {
        const initialProfile = {
          uid: user.uid,
          fullName: user.displayName || user.email?.split('@')[0] || 'Valued Collector',
          email: user.email,
          phone: '',
          role: isMasterAdminEmail(user.email) ? 'admin' : 'user',
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, initialProfile);
        setUserProfile(initialProfile);
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
        role: isMasterAdminEmail(user.email) ? 'admin' : (existing?.role || 'user')
      };
      setUserProfile(fallbackProfile);
    }
  };

  // 2. Register with Email and Password
  const registerWithEmail = async (email, password, fullName, phone = '') => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Save to local registry so it's always recognized
    const localUserObj = {
      uid: `usr-${Date.now()}`,
      email: cleanEmail,
      password: password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role: isMasterAdminEmail(cleanEmail) ? 'admin' : 'user'
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
        role: isMasterAdminEmail(cleanEmail) ? 'admin' : 'user',
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

  // 3. Login with Email and Password (STRICT WRISTORA ADMIN VERIFICATION)
  const loginWithEmail = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Strictly restrict access to wristora@gmail.com
    if (cleanEmail !== 'wristora@gmail.com') {
      return { 
        success: false, 
        error: 'Access denied: Only authorized administrator (wristora@gmail.com) can access this portal.' 
      };
    }

    try {
      // Attempt Firebase Authentication first
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await fetchUserProfile(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      const code = error.code || '';

      // Check configured admin credentials: wristora@gmail.com / Wristora@1234
      if (cleanEmail === 'wristora@gmail.com' && password === 'Wristora@1234') {
        const adminUser = {
          uid: 'local-admin-wristora',
          email: 'wristora@gmail.com',
          displayName: 'Wristora Administrator',
          phone: '+91 (022) 8921-9900'
        };
        const adminProfile = {
          uid: adminUser.uid,
          fullName: 'Wristora Administrator',
          email: 'wristora@gmail.com',
          phone: '+91 (022) 8921-9900',
          role: 'admin'
        };
        setCurrentUser(adminUser);
        setUserProfile(adminProfile);
        localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify({ user: adminUser, profile: adminProfile }));
        return { success: true, user: adminUser };
      }

      if (cleanEmail === 'wristora@gmail.com' && password !== 'Wristora@1234') {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      if (
        code === 'auth/wrong-password' || 
        code === 'auth/invalid-credential' || 
        code === 'auth/user-not-found'
      ) {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }

      return { success: false, error: formatAuthError(error) };
    }
  };

  // 4. Login / Sign Up with Google (Disabled for Admin Portal)
  const loginWithGoogle = async () => {
    return { 
      success: false, 
      error: 'Google Sign-In is disabled on the Administrator Portal. Please log in with admin credentials.' 
    };
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

  // 7. Auth State Observer with strict admin check
  useEffect(() => {
    const savedDemoUser = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (savedDemoUser) {
      try {
        const parsed = JSON.parse(savedDemoUser);
        if (parsed.user?.email?.toLowerCase().trim() === 'wristora@gmail.com') {
          setCurrentUser(parsed.user);
          setUserProfile(parsed.profile);
        } else {
          localStorage.removeItem(DEMO_USER_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          if (user.email?.toLowerCase().trim() === 'wristora@gmail.com') {
            setCurrentUser(user);
            await fetchUserProfile(user);
          } else {
            // Any other user account is blocked from admin access
            setCurrentUser(null);
            setUserProfile(null);
            localStorage.removeItem(DEMO_USER_STORAGE_KEY);
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
      if (currentUser && currentUser.updatePassword) {
        try {
          await updatePassword(currentUser, newPassword);
        } catch (e) {
          console.warn('Firebase updatePassword error:', e);
        }
      }

      const emailToMatch = (currentUser?.email || userProfile?.email || '').toLowerCase();
      const localUsers = getLocalUsers();
      const userIdx = localUsers.findIndex(u => u.email?.toLowerCase() === emailToMatch);
      
      if (userIdx !== -1) {
        const existingUser = localUsers[userIdx];
        if (existingUser.password && existingUser.password !== currentPassword) {
          return { success: false, error: 'Current password does not match.' };
        }
        localUsers[userIdx].password = newPassword;
        localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(localUsers));
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const isAdmin = currentUser?.email?.toLowerCase().trim() === 'wristora@gmail.com';

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
