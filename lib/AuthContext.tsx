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
import { getUserById, getSellerById, createOrUpdateUser } from "@/lib/db";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { UserProfile, Seller } from "@/lib/types";

// For local storage fallback
import {
  getUserProfile as getLocalUserProfile,
  clearUserProfile as clearLocalUserProfile,
  getSellerById as getLocalSeller,
  saveUserProfile as saveLocalUserProfile,
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
    let mounted = true;
    const configured = isFirebaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      const unsubscribe = onAuthChange(async (fbUser) => {
        if (!mounted) return;
        setFirebaseUser(fbUser);
        if (fbUser) {
          let userProfile = await getUserById(fbUser.uid);

          // If null, wait briefly and retry once in case signUp is still writing
          if (!userProfile) {
            await new Promise((res) => setTimeout(res, 500));
            if (!mounted) return;
            userProfile = await getUserById(fbUser.uid);
          }

          // Check if a seller document exists for this user in Firestore
          let sellerDoc: Seller | null = null;
          try {
            sellerDoc = await getSellerById(fbUser.uid);
          } catch {
            // ignore
          }

          if (!userProfile) {
            // Firestore document missing — construct from Auth & Seller data
            const isSeller = !!sellerDoc;
            userProfile = {
              id: fbUser.uid,
              name: sellerDoc?.name || fbUser.displayName || fbUser.email?.split("@")[0] || "User",
              email: fbUser.email || "",
              role: isSeller ? "seller" : "buyer",
              avatar: (
                sellerDoc?.name?.charAt(0) ||
                fbUser.displayName?.charAt(0) ||
                fbUser.email?.charAt(0) ||
                "U"
              ).toUpperCase(),
              createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
              ...(sellerDoc && {
                businessProfile: {
                  storeName: sellerDoc.name,
                  category: sellerDoc.category,
                  products: [sellerDoc.category],
                  minOrderQty: sellerDoc.minOrder,
                  location: sellerDoc.location,
                  serviceRange: sellerDoc.serviceRange,
                  capacity: "",
                },
              }),
            };
            await createOrUpdateUser(userProfile);
          } else if (sellerDoc && userProfile.role !== "seller") {
            // Auto-heal: If seller document exists, ensure user role is seller
            userProfile = {
              ...userProfile,
              role: "seller",
              businessProfile: userProfile.businessProfile || {
                storeName: sellerDoc.name,
                category: sellerDoc.category,
                products: [sellerDoc.category],
                minOrderQty: sellerDoc.minOrder,
                location: sellerDoc.location,
                serviceRange: sellerDoc.serviceRange,
                capacity: "",
              },
            };
            await createOrUpdateUser(userProfile);
          }

          if (!mounted) return;
          setUser(userProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    } else {
      let localUser = getLocalUserProfile();
      if (localUser) {
        const localSeller = getLocalSeller(localUser.id);
        if (localSeller && localUser.role !== "seller") {
          localUser = { ...localUser, role: "seller" };
          saveLocalUserProfile(localUser);
        }
      }
      setUser(localUser);
      setLoading(false);
      return () => {
        mounted = false;
      };
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
      let userProfile = await getUserById(firebaseUser.uid);
      const sellerDoc = await getSellerById(firebaseUser.uid);

      if (!userProfile) {
        const isSeller = !!sellerDoc;
        userProfile = {
          id: firebaseUser.uid,
          name: sellerDoc?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          email: firebaseUser.email || "",
          role: isSeller ? "seller" : "buyer",
          avatar: (
            sellerDoc?.name?.charAt(0) ||
            firebaseUser.displayName?.charAt(0) ||
            firebaseUser.email?.charAt(0) ||
            "U"
          ).toUpperCase(),
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          ...(sellerDoc && {
            businessProfile: {
              storeName: sellerDoc.name,
              category: sellerDoc.category,
              products: [sellerDoc.category],
              minOrderQty: sellerDoc.minOrder,
              location: sellerDoc.location,
              serviceRange: sellerDoc.serviceRange,
              capacity: "",
            },
          }),
        };
        await createOrUpdateUser(userProfile);
      } else if (sellerDoc && userProfile.role !== "seller") {
        userProfile = {
          ...userProfile,
          role: "seller",
          businessProfile: userProfile.businessProfile || {
            storeName: sellerDoc.name,
            category: sellerDoc.category,
            products: [sellerDoc.category],
            minOrderQty: sellerDoc.minOrder,
            location: sellerDoc.location,
            serviceRange: sellerDoc.serviceRange,
            capacity: "",
          },
        };
        await createOrUpdateUser(userProfile);
      }
      setUser(userProfile);
    } else if (!isConfigured) {
      let localUser = getLocalUserProfile();
      if (localUser) {
        const localSeller = getLocalSeller(localUser.id);
        if (localSeller && localUser.role !== "seller") {
          localUser = { ...localUser, role: "seller" };
          saveLocalUserProfile(localUser);
        }
      }
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
