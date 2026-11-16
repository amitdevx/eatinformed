
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase";

// Define the shape of your user profile data stored in Firestore
interface UserProfile extends DocumentData {
  uid: string;
  email: string;
  name: string;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // ponytail: subscribe once on mount; never re-bind listener on user change
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setUser(null);
      setUserProfile(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUserProfile(null);
        setUser(firebaseUser);
        try {
          const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${await firebaseUser.getIdToken()}` } });
          const result = await response.json();
          if (response.ok && auth?.currentUser?.uid === firebaseUser.uid) setUserProfile({ ...result.profile, uid: firebaseUser.uid, email: firebaseUser.email || '', name: result.profile?.name || firebaseUser.displayName || 'Member' });
        } catch { /* Account remains authenticated when profile storage is unavailable. */ }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
