"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import { onAuthChange, signOut as authSignOut } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

// For local storage fallback
import {
  getUserProfile as getLocalUserProfile,
  clearUserProfile as clearLocalUserProfile,
} from "@/lib/storage";

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: User | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  isConfigured: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      // Use Firebase auth
      const unsubscribe = onAuthChange(async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          const userProfile = await getUserById(fbUser.uid);
          setUser(userProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Fallback to localStorage
      const localUser = getLocalUserProfile();
      setUser(localUser);
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    if (isConfigured) {
      await authSignOut();
    } else {
      clearLocalUserProfile();
    }
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshUser = async () => {
    if (isConfigured && firebaseUser) {
      const userProfile = await getUserById(firebaseUser.uid);
      setUser(userProfile);
    } else if (!isConfigured) {
      const localUser = getLocalUserProfile();
      setUser(localUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isConfigured,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
