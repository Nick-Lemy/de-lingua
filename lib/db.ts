"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type {
  UserProfile,
  Mission,
  Match,
  Seller,
  ChatMessage,
  FeedPost,
  FeedReply,
} from "./types";

// Collection names
const COLLECTIONS = {
  USERS: "users",
  MISSIONS: "missions",
  MATCHES: "matches",
  SELLERS: "sellers",
  CHATS: "chats",
  FEED_POSTS: "feedPosts",
  FEED_REPLIES: "feedReplies",
};

// ==================== USER OPERATIONS ====================

export async function createOrUpdateUser(user: UserProfile): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const userRef = doc(db, COLLECTIONS.USERS, user.id);
  await setDoc(userRef, user, { merge: true });
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !db) return null;

  const userRef = doc(db, COLLECTIONS.USERS, id);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
}

export async function updateUser(
  id: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const userRef = doc(db, COLLECTIONS.USERS, id);
  await updateDoc(userRef, updates);
}

// ==================== MISSION OPERATIONS ====================

export async function createMission(mission: Mission): Promise<string> {
  if (!isFirebaseConfigured() || !db) return mission.id;

  const missionRef = doc(db, COLLECTIONS.MISSIONS, mission.id);
  await setDoc(missionRef, mission);
  return mission.id;
}

export async function getMissionById(id: string): Promise<Mission | null> {
  if (!isFirebaseConfigured() || !db) return null;

  const missionRef = doc(db, COLLECTIONS.MISSIONS, id);
  const missionSnap = await getDoc(missionRef);

  if (missionSnap.exists()) {
    return missionSnap.data() as Mission;
  }
  return null;
}

export async function getMissionsByBuyer(buyerId: string): Promise<Mission[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const missionsRef = collection(db, COLLECTIONS.MISSIONS);
  const q = query(
    missionsRef,
    where("buyerId", "==", buyerId),
    orderBy("createdAt", "desc"),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Mission);
}

export async function updateMission(
  id: string,
  updates: Partial<Mission>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const missionRef = doc(db, COLLECTIONS.MISSIONS, id);
  await updateDoc(missionRef, updates);
}

export async function deleteMission(id: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const missionRef = doc(db, COLLECTIONS.MISSIONS, id);
  await deleteDoc(missionRef);
}

// ==================== MATCH OPERATIONS ====================

export async function createMatch(match: Match): Promise<string> {
  if (!isFirebaseConfigured() || !db) return match.id;

  const matchRef = doc(db, COLLECTIONS.MATCHES, match.id);
  await setDoc(matchRef, match);
  return match.id;
}

export async function getMatchesByMission(missionId: string): Promise<Match[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const matchesRef = collection(db, COLLECTIONS.MATCHES);
  const q = query(matchesRef, where("missionId", "==", missionId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Match);
}

export async function getAllMatchesForBuyer(buyerId: string): Promise<Match[]> {
  if (!isFirebaseConfigured() || !db) return [];

  // First get all missions for the buyer
  const missions = await getMissionsByBuyer(buyerId);
  const missionIds = missions.map((m) => m.id);

  if (missionIds.length === 0) return [];

  // Get matches for those missions
  const matchesRef = collection(db, COLLECTIONS.MATCHES);
  const allMatches: Match[] = [];

  // Firestore 'in' query supports max 10 items, so we batch
  for (let i = 0; i < missionIds.length; i += 10) {
    const batch = missionIds.slice(i, i + 10);
    const q = query(matchesRef, where("missionId", "in", batch));
    const querySnapshot = await getDocs(q);
    allMatches.push(...querySnapshot.docs.map((doc) => doc.data() as Match));
  }

  return allMatches;
}

export async function updateMatch(
  id: string,
  updates: Partial<Match>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const matchRef = doc(db, COLLECTIONS.MATCHES, id);
  await updateDoc(matchRef, updates);
}

// ==================== SELLER OPERATIONS ====================

export async function createSeller(seller: Seller): Promise<string> {
  if (!isFirebaseConfigured() || !db) return seller.id;

  const sellerRef = doc(db, COLLECTIONS.SELLERS, seller.id);
  await setDoc(sellerRef, seller);
  return seller.id;
}

export async function getSellerById(id: string): Promise<Seller | null> {
  if (!isFirebaseConfigured() || !db) return null;

  const sellerRef = doc(db, COLLECTIONS.SELLERS, id);
  const sellerSnap = await getDoc(sellerRef);

  if (sellerSnap.exists()) {
    return sellerSnap.data() as Seller;
  }
  return null;
}

export async function getAllSellers(): Promise<Seller[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const sellersRef = collection(db, COLLECTIONS.SELLERS);
  const querySnapshot = await getDocs(sellersRef);

  return querySnapshot.docs.map((doc) => doc.data() as Seller);
}

export async function getSellersByCategory(
  category: string,
): Promise<Seller[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const sellersRef = collection(db, COLLECTIONS.SELLERS);
  const q = query(sellersRef, where("category", "==", category));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Seller);
}

export async function updateSeller(
  id: string,
  updates: Partial<Seller>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const sellerRef = doc(db, COLLECTIONS.SELLERS, id);
  await updateDoc(sellerRef, updates);
}

// Get all matches where this seller is matched (incoming buyer requests)
export async function getMatchesForSeller(sellerId: string): Promise<Match[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const matchesRef = collection(db, COLLECTIONS.MATCHES);
  const q = query(matchesRef, where("sellerId", "==", sellerId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Match);
}

// Get all missions (for sellers to see incoming requests)
export async function getAllMissions(): Promise<Mission[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const missionsRef = collection(db, COLLECTIONS.MISSIONS);
  const q = query(missionsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Mission);
}

// Update seller inventory
export async function updateSellerInventory(
  sellerId: string,
  inventory: Seller["inventory"],
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const sellerRef = doc(db, COLLECTIONS.SELLERS, sellerId);
  await setDoc(sellerRef, { inventory }, { merge: true });
}

// Create seller profile from user
export async function createSellerFromUser(
  userId: string,
  sellerData: Omit<Seller, "id">,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const seller: Seller = {
    id: userId,
    ...sellerData,
  };

  const sellerRef = doc(db, COLLECTIONS.SELLERS, userId);
  await setDoc(sellerRef, seller);
}

// ==================== CHAT OPERATIONS ====================

export async function sendChatMessage(message: ChatMessage): Promise<string> {
  if (!isFirebaseConfigured() || !db) return message.id;

  const chatRef = doc(db, COLLECTIONS.CHATS, message.id);
  await setDoc(chatRef, message);
  return message.id;
}

export async function getChatMessages(
  missionId: string,
  sellerId: string,
): Promise<ChatMessage[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const chatsRef = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsRef,
    where("missionId", "==", missionId),
    where("sellerId", "==", sellerId),
    orderBy("time", "asc"),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as ChatMessage);
}

// Get all chats for a buyer (grouped by seller)
export async function getChatsForBuyer(
  buyerId: string,
): Promise<ChatMessage[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const chatsRef = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsRef,
    where("buyerId", "==", buyerId),
    orderBy("time", "desc"),
  );
  const querySnapshot = await getDocs(q);
  console.log(querySnapshot);

  return querySnapshot.docs.map((doc) => doc.data() as ChatMessage);
}

// Get all chats for a seller
export async function getChatsForSeller(
  sellerId: string,
): Promise<ChatMessage[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const chatsRef = collection(db, COLLECTIONS.CHATS);
  const q = query(
    chatsRef,
    where("sellerId", "==", sellerId),
    orderBy("time", "desc"),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as ChatMessage);
}

// ==================== FEED POST OPERATIONS ====================

export async function createFeedPost(post: FeedPost): Promise<string> {
  if (!isFirebaseConfigured() || !db) return post.id;

  const postRef = doc(db, COLLECTIONS.FEED_POSTS, post.id);
  await setDoc(postRef, post);
  return post.id;
}

export async function getFeedPostById(id: string): Promise<FeedPost | null> {
  if (!isFirebaseConfigured() || !db) return null;

  const postRef = doc(db, COLLECTIONS.FEED_POSTS, id);
  const postSnap = await getDoc(postRef);

  if (postSnap.exists()) {
    return postSnap.data() as FeedPost;
  }
  return null;
}

export async function getAllFeedPosts(): Promise<FeedPost[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const postsRef = collection(db, COLLECTIONS.FEED_POSTS);
  const q = query(
    postsRef,
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as FeedPost);
}

export async function getFeedPostsByUser(userId: string): Promise<FeedPost[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const postsRef = collection(db, COLLECTIONS.FEED_POSTS);
  const q = query(
    postsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as FeedPost);
}

export async function updateFeedPost(
  id: string,
  updates: Partial<FeedPost>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const postRef = doc(db, COLLECTIONS.FEED_POSTS, id);
  await updateDoc(postRef, updates);
}

export async function deleteFeedPost(id: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const postRef = doc(db, COLLECTIONS.FEED_POSTS, id);
  await deleteDoc(postRef);
}

// ==================== FEED REPLY OPERATIONS ====================

export async function createFeedReply(reply: FeedReply): Promise<string> {
  if (!isFirebaseConfigured() || !db) return reply.id;

  const replyRef = doc(db, COLLECTIONS.FEED_REPLIES, reply.id);
  await setDoc(replyRef, reply);

  // Increment reply count on post
  const post = await getFeedPostById(reply.postId);
  if (post) {
    await updateFeedPost(reply.postId, { repliesCount: post.repliesCount + 1 });
  }

  return reply.id;
}

export async function getRepliesByPost(postId: string): Promise<FeedReply[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const repliesRef = collection(db, COLLECTIONS.FEED_REPLIES);
  const q = query(
    repliesRef,
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as FeedReply);
}

export async function getRepliesByUser(userId: string): Promise<FeedReply[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const repliesRef = collection(db, COLLECTIONS.FEED_REPLIES);
  const q = query(
    repliesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as FeedReply);
}

// ==================== UTILITY ====================

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
