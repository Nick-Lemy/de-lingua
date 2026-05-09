"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  updateProfile,
} from "firebase/auth";

function initialFor(name: string | null | undefined): string {
  return (name?.trim()?.charAt(0) || "U").toUpperCase();
}
import { auth, isFirebaseConfigured } from "./firebase";
import { createOrUpdateUser, getUserById, createSellerFromUser } from "./db";
import type { UserProfile, Seller } from "./types";

// Sign up with email and password
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: "buyer" | "seller",
  preferences?: UserProfile["preferences"],
  businessProfile?: UserProfile["businessProfile"],
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
  const userProfile = await getUserById(userCredential.user.uid);

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

  if (!userProfile) {
    // Create new user profile from Google data
    userProfile = {
      id: user.uid,
      name: user.displayName || "User",
      email: user.email || "",
      role: "buyer", // Default role, user can change later
      avatar: initialFor(user.displayName),
      createdAt: new Date().toISOString(),
    };

    await createOrUpdateUser(userProfile);
  }

  return userProfile;
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
