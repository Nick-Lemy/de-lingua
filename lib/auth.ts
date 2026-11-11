"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  updateProfile,
  deleteUser as firebaseDeleteUser,
} from "firebase/auth";

function initialFor(name: string | null | undefined): string {
  return (name?.trim()?.charAt(0) || "U").toUpperCase();
}
import { auth, isFirebaseConfigured } from "./firebase";
import {
  createOrUpdateUser,
  getUserById,
  getSellerById,
  createSellerFromUser,
  deleteUserAccount,
} from "./db";
import { deleteUserAccountLocal } from "./storage";
import type { UserProfile, Seller, SubscriptionTier } from "./types";

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: "buyer" | "seller",
  preferences?: UserProfile["preferences"],
  businessProfile?: UserProfile["businessProfile"],
  subscriptionTier?: SubscriptionTier,
): Promise<UserProfile> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase is not configured");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const user = userCredential.user;

  await updateProfile(user, { displayName: name });

  try {
    await sendEmailVerification(user);
  } catch (err) {
    console.error("sendEmailVerification failed", err);
  }

  const userProfile: UserProfile = {
    id: user.uid,
    name,
    email,
    role,
    avatar: initialFor(name),
    createdAt: new Date().toISOString(),
    ...(subscriptionTier && { subscriptionTier }),
    ...(preferences && { preferences }),
    ...(businessProfile && { businessProfile }),
  };

  await createOrUpdateUser(userProfile);

  if (role === "seller") {
    const displayName = businessProfile?.storeName?.trim() || name;
    const sellerData: Omit<Seller, "id"> = {
      name: displayName,
      avatar: initialFor(displayName),
      category: businessProfile?.category || "General",
      rating: 5.0,
      reviews: 0,
      verified: false,
      location: businessProfile?.location || "Rwanda",
      serviceRange: businessProfile?.serviceRange || "Nationwide",
      minOrder: businessProfile?.minOrderQty || "1 unit",
      responseTime: "< 24 hours",
      description: `${displayName} is a supplier offering ${businessProfile?.products?.join(", ") || "products"} in Rwanda.`,
      certifications: [],
      inventory: [],
    };
    await createSellerFromUser(user.uid, sellerData);
  }

  return userProfile;
}

// Sign in with email and password
export async function signIn(
  email: string,
  password: string,
): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase is not configured");
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password,
  );
  const fbUser = userCredential.user;
  let userProfile = await getUserById(fbUser.uid);
  const sellerDoc = await getSellerById(fbUser.uid);

  if (!userProfile) {
    const isSeller = !!sellerDoc;
    userProfile = {
      id: fbUser.uid,
      name: sellerDoc?.name || fbUser.displayName || email.split("@")[0],
      email: fbUser.email || email,
      role: isSeller ? "seller" : "buyer",
      avatar: initialFor(sellerDoc?.name || fbUser.displayName || email),
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
    // Auto-heal: If seller document exists, ensure role is seller
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

  return userProfile;
}

// Sign in with Google
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase is not configured");
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user already exists
  let userProfile = await getUserById(user.uid);
  const sellerDoc = await getSellerById(user.uid);

  if (!userProfile) {
    const isSeller = !!sellerDoc;
    userProfile = {
      id: user.uid,
      name: sellerDoc?.name || user.displayName || "User",
      email: user.email || "",
      role: isSeller ? "seller" : "buyer",
      avatar: initialFor(sellerDoc?.name || user.displayName),
      createdAt: new Date().toISOString(),
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

  return userProfile;
}

// Delete user account
export async function deleteAccount(userId: string): Promise<void> {
  if (isFirebaseConfigured()) {
    await deleteUserAccount(userId);
    if (auth && auth.currentUser && auth.currentUser.uid === userId) {
      try {
        await firebaseDeleteUser(auth.currentUser);
      } catch (err) {
        console.warn("Firebase Auth deleteUser failed, signing out:", err);
        await firebaseSignOut(auth);
      }
    }
  } else {
    deleteUserAccountLocal(userId);
  }
}

// Sign out
export async function signOut(): Promise<void> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase is not configured");
  }

  await firebaseSignOut(auth);
}

// Get current user
export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured() || !auth) {
    return null;
  }
  return auth.currentUser;
}

// Send password reset email
export async function forgotPassword(email: string): Promise<void> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error("Firebase is not configured");
  }
  await sendPasswordResetEmail(auth, email);
}

// Subscribe to auth state changes
export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  if (!isFirebaseConfigured() || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}
