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
  increment,
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
  Review,
  SellerBadge,
  WishlistItem,
  WishlistAlert,
  SellerAnalytics,
  PaymentRequest,
  PaymentStatus,
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
  REVIEWS: "reviews",
  WISHLIST: "wishlist",
  WISHLIST_ALERTS: "wishlistAlerts",
  ANALYTICS: "sellerAnalytics",
  PAYMENTS: "paymentRequests",
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

  const missions = await getMissionsByBuyer(buyerId);
  const missionIds = missions.map((m) => m.id);

  if (missionIds.length === 0) return [];

  const matchesRef = collection(db, COLLECTIONS.MATCHES);
  const allMatches: Match[] = [];

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

export async function getMatchesForSeller(sellerId: string): Promise<Match[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const matchesRef = collection(db, COLLECTIONS.MATCHES);
  const q = query(matchesRef, where("sellerId", "==", sellerId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Match);
}

export async function getAllMissions(): Promise<Mission[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const missionsRef = collection(db, COLLECTIONS.MISSIONS);
  const q = query(missionsRef, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => doc.data() as Mission);
}

export async function updateSellerInventory(
  sellerId: string,
  inventory: Seller["inventory"],
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const sellerRef = doc(db, COLLECTIONS.SELLERS, sellerId);
  await setDoc(sellerRef, { inventory }, { merge: true });
}

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

  return querySnapshot.docs.map((doc) => doc.data() as ChatMessage);
}

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

// ==================== REVIEWS ====================

export async function createReview(review: Review): Promise<string> {
  if (!isFirebaseConfigured() || !db) return review.id;

  const reviewRef = doc(db, COLLECTIONS.REVIEWS, review.id);
  await setDoc(reviewRef, review);
  return review.id;
}

export async function getReviewsBySeller(sellerId: string): Promise<Review[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const q = query(
    reviewsRef,
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc"),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Review);
}

export async function getReviewsByBuyer(buyerId: string): Promise<Review[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const q = query(reviewsRef, where("buyerId", "==", buyerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Review);
}

export async function hasReviewedSeller(
  buyerId: string,
  sellerId: string,
  missionId: string,
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
  const q = query(
    reviewsRef,
    where("buyerId", "==", buyerId),
    where("sellerId", "==", sellerId),
    where("missionId", "==", missionId),
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

function computeBadges(seller: Seller, reviews: Review[]): SellerBadge[] {
  const badges: SellerBadge[] = [];
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  if (avg >= 4.5 && count >= 5) badges.push("top-seller");
  if (avg >= 4.0 && !badges.includes("top-seller")) badges.push("good-seller");
  if (count >= 10) badges.push("trusted-partner");
  if (seller.responseTime?.toLowerCase().includes("min")) badges.push("fast-reply");
  if (seller.verified) badges.push("verified-supplier");

  return badges;
}

export async function updateSellerRatingAndBadges(
  sellerId: string,
  reviews: Review[],
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const seller = await getSellerById(sellerId);
  if (!seller) return;

  const count = reviews.length;
  const avg =
    count > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : seller.rating;

  const sellerRef = doc(db, COLLECTIONS.SELLERS, sellerId);
  await updateDoc(sellerRef, {
    rating: avg,
    reviews: count,
    badges: computeBadges(seller, reviews),
  });
}

// ==================== WISHLIST ====================

export async function addToWishlist(item: WishlistItem): Promise<string> {
  if (!isFirebaseConfigured() || !db) return item.id;

  const wishlistRef = doc(db, COLLECTIONS.WISHLIST, item.id);
  await setDoc(wishlistRef, item);
  return item.id;
}

export async function removeFromWishlist(buyerId: string, sellerId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const wishlistRef = collection(db, COLLECTIONS.WISHLIST);
  const q = query(
    wishlistRef,
    where("buyerId", "==", buyerId),
    where("sellerId", "==", sellerId),
  );
  const querySnapshot = await getDocs(q);
  await Promise.all(querySnapshot.docs.map((d) => deleteDoc(d.ref)));
}

export async function getWishlistByBuyer(buyerId: string): Promise<WishlistItem[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const wishlistRef = collection(db, COLLECTIONS.WISHLIST);
  const q = query(wishlistRef, where("buyerId", "==", buyerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => d.data() as WishlistItem);
}

export async function isInWishlist(buyerId: string, sellerId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;

  const wishlistRef = collection(db, COLLECTIONS.WISHLIST);
  const q = query(
    wishlistRef,
    where("buyerId", "==", buyerId),
    where("sellerId", "==", sellerId),
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

export async function updateWishlistAlert(
  buyerId: string,
  sellerId: string,
  alertKeyword: string,
  alertEnabled: boolean,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const wishlistRef = collection(db, COLLECTIONS.WISHLIST);
  const q = query(
    wishlistRef,
    where("buyerId", "==", buyerId),
    where("sellerId", "==", sellerId),
  );
  const querySnapshot = await getDocs(q);
  await Promise.all(
    querySnapshot.docs.map((d) =>
      updateDoc(d.ref, { alertKeyword, alertEnabled }),
    ),
  );
}

export async function getWishlistItemsForSeller(sellerId: string): Promise<WishlistItem[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const wishlistRef = collection(db, COLLECTIONS.WISHLIST);
  const q = query(wishlistRef, where("sellerId", "==", sellerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => d.data() as WishlistItem);
}

export async function createWishlistAlert(alert: WishlistAlert): Promise<string> {
  if (!isFirebaseConfigured() || !db) return alert.id;

  const alertRef = doc(db, COLLECTIONS.WISHLIST_ALERTS, alert.id);
  await setDoc(alertRef, alert);
  return alert.id;
}

export async function getWishlistAlertsByBuyer(buyerId: string): Promise<WishlistAlert[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const alertsRef = collection(db, COLLECTIONS.WISHLIST_ALERTS);
  const q = query(
    alertsRef,
    where("buyerId", "==", buyerId),
    orderBy("createdAt", "desc"),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => d.data() as WishlistAlert);
}

export async function markAlertSeen(alertId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const alertRef = doc(db, COLLECTIONS.WISHLIST_ALERTS, alertId);
  await updateDoc(alertRef, { seen: true });
}

// ==================== ANALYTICS ====================

export async function getSellerAnalytics(sellerId: string): Promise<SellerAnalytics | null> {
  if (!isFirebaseConfigured() || !db) return null;

  const ref = doc(db, COLLECTIONS.ANALYTICS, sellerId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as SellerAnalytics) : null;
}

export async function incrementProfileView(sellerId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const ref = doc(db, COLLECTIONS.ANALYTICS, sellerId);
  await setDoc(
    ref,
    {
      sellerId,
      profileViews: increment(1),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function incrementItemView(sellerId: string, itemId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const ref = doc(db, COLLECTIONS.ANALYTICS, sellerId);
  await setDoc(
    ref,
    {
      sellerId,
      itemViews: { [itemId]: increment(1) },
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

// ==================== PAYMENTS ====================

export async function createPaymentRequest(payment: PaymentRequest): Promise<string> {
  if (!isFirebaseConfigured() || !db) return payment.id;

  const ref = doc(db, COLLECTIONS.PAYMENTS, payment.id);
  await setDoc(ref, payment);
  return payment.id;
}

export async function getPaymentsByChat(missionId: string, sellerId: string): Promise<PaymentRequest[]> {
  if (!isFirebaseConfigured() || !db) return [];

  const ref = collection(db, COLLECTIONS.PAYMENTS);
  const q = query(
    ref,
    where("missionId", "==", missionId),
    where("sellerId", "==", sellerId),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => d.data() as PaymentRequest);
}

export async function updatePaymentStatus(id: string, status: PaymentStatus): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;

  const ref = doc(db, COLLECTIONS.PAYMENTS, id);
  await updateDoc(ref, { status, updatedAt: new Date().toISOString() });
}

// ==================== UTILITY ====================

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
