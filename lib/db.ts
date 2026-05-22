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
  runTransaction,
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

export { generateId } from "./utils";

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

async function safeCall<T>(
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[db.${label}]`, err);
    return fallback;
  }
}

// ==================== USER OPERATIONS ====================

export async function createOrUpdateUser(user: UserProfile): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "createOrUpdateUser",
    async () => {
      const userRef = doc(db!, COLLECTIONS.USERS, user.id);
      await setDoc(userRef, user, { merge: true });
    },
    undefined,
  );
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured() || !db) return null;
  return safeCall(
    "getUserById",
    async () => {
      const userRef = doc(db!, COLLECTIONS.USERS, id);
      const userSnap = await getDoc(userRef);
      return userSnap.exists() ? (userSnap.data() as UserProfile) : null;
    },
    null,
  );
}

export async function updateUser(
  id: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updateUser",
    async () => {
      const userRef = doc(db!, COLLECTIONS.USERS, id);
      await updateDoc(userRef, updates);
    },
    undefined,
  );
}

// ==================== MISSION OPERATIONS ====================

export async function createMission(mission: Mission): Promise<string> {
  if (!isFirebaseConfigured() || !db) return mission.id;
  return safeCall(
    "createMission",
    async () => {
      const missionRef = doc(db!, COLLECTIONS.MISSIONS, mission.id);
      await setDoc(missionRef, mission);
      return mission.id;
    },
    mission.id,
  );
}

export async function getMissionById(id: string): Promise<Mission | null> {
  if (!isFirebaseConfigured() || !db) return null;
  return safeCall(
    "getMissionById",
    async () => {
      const missionRef = doc(db!, COLLECTIONS.MISSIONS, id);
      const missionSnap = await getDoc(missionRef);
      return missionSnap.exists() ? (missionSnap.data() as Mission) : null;
    },
    null,
  );
}

export async function getMissionsByBuyer(buyerId: string): Promise<Mission[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getMissionsByBuyer",
    async () => {
      const missionsRef = collection(db!, COLLECTIONS.MISSIONS);
      const q = query(missionsRef, where("buyerId", "==", buyerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as Mission)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [],
  );
}

export async function updateMission(
  id: string,
  updates: Partial<Mission>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updateMission",
    async () => {
      const missionRef = doc(db!, COLLECTIONS.MISSIONS, id);
      await updateDoc(missionRef, updates);
    },
    undefined,
  );
}

export async function deleteMission(id: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "deleteMission",
    async () => {
      const missionRef = doc(db!, COLLECTIONS.MISSIONS, id);
      await deleteDoc(missionRef);
    },
    undefined,
  );
}

// ==================== MATCH OPERATIONS ====================

export async function createMatch(match: Match): Promise<string> {
  if (!isFirebaseConfigured() || !db) return match.id;
  return safeCall(
    "createMatch",
    async () => {
      const matchRef = doc(db!, COLLECTIONS.MATCHES, match.id);
      await setDoc(matchRef, match);
      return match.id;
    },
    match.id,
  );
}

export async function getMatchesByMission(missionId: string): Promise<Match[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getMatchesByMission",
    async () => {
      const matchesRef = collection(db!, COLLECTIONS.MATCHES);
      const q = query(matchesRef, where("missionId", "==", missionId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Match);
    },
    [],
  );
}

export async function getAllMatchesForBuyer(buyerId: string): Promise<Match[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getAllMatchesForBuyer",
    async () => {
      const missions = await getMissionsByBuyer(buyerId);
      const missionIds = missions.map((m) => m.id);
      if (missionIds.length === 0) return [];

      const matchesRef = collection(db!, COLLECTIONS.MATCHES);
      const allMatches: Match[] = [];
      for (let i = 0; i < missionIds.length; i += 10) {
        const batch = missionIds.slice(i, i + 10);
        const q = query(matchesRef, where("missionId", "in", batch));
        const querySnapshot = await getDocs(q);
        allMatches.push(...querySnapshot.docs.map((doc) => doc.data() as Match));
      }
      return allMatches;
    },
    [],
  );
}

export async function updateMatch(
  id: string,
  updates: Partial<Match>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updateMatch",
    async () => {
      const matchRef = doc(db!, COLLECTIONS.MATCHES, id);
      await updateDoc(matchRef, updates);
    },
    undefined,
  );
}

// ==================== SELLER OPERATIONS ====================

export async function createSeller(seller: Seller): Promise<string> {
  if (!isFirebaseConfigured() || !db) return seller.id;
  return safeCall(
    "createSeller",
    async () => {
      const sellerRef = doc(db!, COLLECTIONS.SELLERS, seller.id);
      await setDoc(sellerRef, seller);
      return seller.id;
    },
    seller.id,
  );
}

export async function getSellerById(id: string): Promise<Seller | null> {
  if (!isFirebaseConfigured() || !db) return null;
  return safeCall(
    "getSellerById",
    async () => {
      const sellerRef = doc(db!, COLLECTIONS.SELLERS, id);
      const sellerSnap = await getDoc(sellerRef);
      return sellerSnap.exists() ? (sellerSnap.data() as Seller) : null;
    },
    null,
  );
}

export async function getAllSellers(): Promise<Seller[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getAllSellers",
    async () => {
      const sellersRef = collection(db!, COLLECTIONS.SELLERS);
      const querySnapshot = await getDocs(sellersRef);
      return querySnapshot.docs.map((doc) => doc.data() as Seller);
    },
    [],
  );
}

export async function getSellersByCategory(
  category: string,
): Promise<Seller[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getSellersByCategory",
    async () => {
      const sellersRef = collection(db!, COLLECTIONS.SELLERS);
      const q = query(sellersRef, where("category", "==", category));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Seller);
    },
    [],
  );
}

export async function updateSeller(
  id: string,
  updates: Partial<Seller>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updateSeller",
    async () => {
      const sellerRef = doc(db!, COLLECTIONS.SELLERS, id);
      await updateDoc(sellerRef, updates);
    },
    undefined,
  );
}

export async function getMatchesForSeller(sellerId: string): Promise<Match[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getMatchesForSeller",
    async () => {
      const matchesRef = collection(db!, COLLECTIONS.MATCHES);
      const q = query(matchesRef, where("sellerId", "==", sellerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Match);
    },
    [],
  );
}

export async function getAllMissions(): Promise<Mission[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getAllMissions",
    async () => {
      const missionsRef = collection(db!, COLLECTIONS.MISSIONS);
      const q = query(missionsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Mission);
    },
    [],
  );
}

export async function updateSellerInventory(
  sellerId: string,
  inventory: Seller["inventory"],
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updateSellerInventory",
    async () => {
      const sellerRef = doc(db!, COLLECTIONS.SELLERS, sellerId);
      await setDoc(sellerRef, { inventory }, { merge: true });
    },
    undefined,
  );
}

export async function createSellerFromUser(
  userId: string,
  sellerData: Omit<Seller, "id">,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "createSellerFromUser",
    async () => {
      const seller: Seller = { id: userId, ...sellerData };
      const sellerRef = doc(db!, COLLECTIONS.SELLERS, userId);
      await setDoc(sellerRef, seller);
    },
    undefined,
  );
}

// ==================== CHAT OPERATIONS ====================

export async function sendChatMessage(message: ChatMessage): Promise<string> {
  if (!isFirebaseConfigured() || !db) return message.id;
  return safeCall(
    "sendChatMessage",
    async () => {
      const chatRef = doc(db!, COLLECTIONS.CHATS, message.id);
      await setDoc(chatRef, message);
      return message.id;
    },
    message.id,
  );
}

export async function getChatMessages(
  missionId: string,
  sellerId: string,
): Promise<ChatMessage[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getChatMessages",
    async () => {
      const chatsRef = collection(db!, COLLECTIONS.CHATS);
      const q = query(
        chatsRef,
        where("missionId", "==", missionId),
        where("sellerId", "==", sellerId),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as ChatMessage)
        .sort((a, b) => a.time.localeCompare(b.time));
    },
    [],
  );
}

export async function getChatsForBuyer(
  buyerId: string,
): Promise<ChatMessage[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getChatsForBuyer",
    async () => {
      const chatsRef = collection(db!, COLLECTIONS.CHATS);
      const q = query(chatsRef, where("buyerId", "==", buyerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as ChatMessage)
        .sort((a, b) => b.time.localeCompare(a.time));
    },
    [],
  );
}

export async function getChatsForSeller(
  sellerId: string,
): Promise<ChatMessage[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getChatsForSeller",
    async () => {
      const chatsRef = collection(db!, COLLECTIONS.CHATS);
      const q = query(chatsRef, where("sellerId", "==", sellerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as ChatMessage)
        .sort((a, b) => b.time.localeCompare(a.time));
    },
    [],
  );
}

// ==================== FEED POST OPERATIONS ====================

export async function createFeedPost(post: FeedPost): Promise<string> {
  if (!isFirebaseConfigured() || !db) return post.id;
  const postRef = doc(db!, COLLECTIONS.FEED_POSTS, post.id);
  const clean = Object.fromEntries(
    Object.entries(post).filter(([, v]) => v !== undefined),
  );
  await setDoc(postRef, clean);
  return post.id;
}

export async function getFeedPostById(id: string): Promise<FeedPost | null> {
  if (!isFirebaseConfigured() || !db) return null;
  return safeCall(
    "getFeedPostById",
    async () => {
      const postRef = doc(db!, COLLECTIONS.FEED_POSTS, id);
      const postSnap = await getDoc(postRef);
      return postSnap.exists() ? (postSnap.data() as FeedPost) : null;
    },
    null,
  );
}

export async function getAllFeedPosts(): Promise<FeedPost[]> {
  if (!isFirebaseConfigured() || !db) return [];
  const postsRef = collection(db!, COLLECTIONS.FEED_POSTS);
  const querySnapshot = await getDocs(postsRef);
  return querySnapshot.docs
    .map((doc) => doc.data() as FeedPost)
    .filter((p) => p.status === "active")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFeedPostsByUser(userId: string): Promise<FeedPost[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getFeedPostsByUser",
    async () => {
      const postsRef = collection(db!, COLLECTIONS.FEED_POSTS);
      const q = query(postsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as FeedPost)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [],
  );
}

export async function updateFeedPost(
  id: string,
  updates: Partial<FeedPost>,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updateFeedPost",
    async () => {
      const postRef = doc(db!, COLLECTIONS.FEED_POSTS, id);
      await updateDoc(postRef, updates);
    },
    undefined,
  );
}

export async function deleteFeedPost(id: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "deleteFeedPost",
    async () => {
      const postRef = doc(db!, COLLECTIONS.FEED_POSTS, id);
      await deleteDoc(postRef);
    },
    undefined,
  );
}

// ==================== FEED REPLY OPERATIONS ====================

export async function createFeedReply(reply: FeedReply): Promise<string> {
  if (!isFirebaseConfigured() || !db) return reply.id;
  return safeCall(
    "createFeedReply",
    async () => {
      const replyRef = doc(db!, COLLECTIONS.FEED_REPLIES, reply.id);
      await setDoc(replyRef, reply);

      const postRef = doc(db!, COLLECTIONS.FEED_POSTS, reply.postId);
      await updateDoc(postRef, { repliesCount: increment(1) });

      return reply.id;
    },
    reply.id,
  );
}

export async function getRepliesByPost(postId: string): Promise<FeedReply[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getRepliesByPost",
    async () => {
      const repliesRef = collection(db!, COLLECTIONS.FEED_REPLIES);
      const q = query(repliesRef, where("postId", "==", postId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as FeedReply)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    [],
  );
}

export async function getRepliesByUser(userId: string): Promise<FeedReply[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getRepliesByUser",
    async () => {
      const repliesRef = collection(db!, COLLECTIONS.FEED_REPLIES);
      const q = query(repliesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as FeedReply)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [],
  );
}

// ==================== REVIEWS ====================

export async function createReview(review: Review): Promise<string> {
  if (!isFirebaseConfigured() || !db) return review.id;
  return safeCall(
    "createReview",
    async () => {
      const reviewRef = doc(db!, COLLECTIONS.REVIEWS, review.id);
      await setDoc(reviewRef, review);
      return review.id;
    },
    review.id,
  );
}

export async function getReviewsBySeller(sellerId: string): Promise<Review[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getReviewsBySeller",
    async () => {
      const reviewsRef = collection(db!, COLLECTIONS.REVIEWS);
      const q = query(reviewsRef, where("sellerId", "==", sellerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((doc) => doc.data() as Review)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [],
  );
}

export async function getReviewsByBuyer(buyerId: string): Promise<Review[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getReviewsByBuyer",
    async () => {
      const reviewsRef = collection(db!, COLLECTIONS.REVIEWS);
      const q = query(reviewsRef, where("buyerId", "==", buyerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => doc.data() as Review);
    },
    [],
  );
}

export async function hasReviewedSeller(
  buyerId: string,
  sellerId: string,
  missionId: string,
): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;
  return safeCall(
    "hasReviewedSeller",
    async () => {
      const reviewsRef = collection(db!, COLLECTIONS.REVIEWS);
      const q = query(
        reviewsRef,
        where("buyerId", "==", buyerId),
        where("sellerId", "==", sellerId),
        where("missionId", "==", missionId),
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    },
    false,
  );
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
  await safeCall(
    "updateSellerRatingAndBadges",
    async () => {
      const sellerRef = doc(db!, COLLECTIONS.SELLERS, sellerId);
      await runTransaction(db!, async (tx) => {
        const sellerSnap = await tx.get(sellerRef);
        if (!sellerSnap.exists()) return;
        const seller = sellerSnap.data() as Seller;

        const count = reviews.length;
        const avg =
          count > 0
            ? Math.round(
                (reviews.reduce((s, r) => s + r.rating, 0) / count) * 10,
              ) / 10
            : seller.rating;

        tx.update(sellerRef, {
          rating: avg,
          reviews: count,
          badges: computeBadges(seller, reviews),
        });
      });
    },
    undefined,
  );
}

// ==================== WISHLIST ====================

export async function addToWishlist(item: WishlistItem): Promise<string> {
  if (!isFirebaseConfigured() || !db) return item.id;
  return safeCall(
    "addToWishlist",
    async () => {
      const wishlistRef = collection(db!, COLLECTIONS.WISHLIST);
      const existing = await getDocs(
        query(
          wishlistRef,
          where("buyerId", "==", item.buyerId),
          where("sellerId", "==", item.sellerId),
        ),
      );
      if (!existing.empty) {
        return existing.docs[0].id;
      }
      const ref = doc(db!, COLLECTIONS.WISHLIST, item.id);
      await setDoc(ref, item);
      return item.id;
    },
    item.id,
  );
}

export async function removeFromWishlist(buyerId: string, sellerId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "removeFromWishlist",
    async () => {
      const wishlistRef = collection(db!, COLLECTIONS.WISHLIST);
      const q = query(
        wishlistRef,
        where("buyerId", "==", buyerId),
        where("sellerId", "==", sellerId),
      );
      const querySnapshot = await getDocs(q);
      await Promise.all(querySnapshot.docs.map((d) => deleteDoc(d.ref)));
    },
    undefined,
  );
}

export async function getWishlistByBuyer(buyerId: string): Promise<WishlistItem[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getWishlistByBuyer",
    async () => {
      const wishlistRef = collection(db!, COLLECTIONS.WISHLIST);
      const q = query(wishlistRef, where("buyerId", "==", buyerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => d.data() as WishlistItem);
    },
    [],
  );
}

export async function isInWishlist(buyerId: string, sellerId: string): Promise<boolean> {
  if (!isFirebaseConfigured() || !db) return false;
  return safeCall(
    "isInWishlist",
    async () => {
      const wishlistRef = collection(db!, COLLECTIONS.WISHLIST);
      const q = query(
        wishlistRef,
        where("buyerId", "==", buyerId),
        where("sellerId", "==", sellerId),
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    },
    false,
  );
}

export async function updateWishlistAlert(
  buyerId: string,
  sellerId: string,
  alertKeyword: string,
  alertEnabled: boolean,
): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updateWishlistAlert",
    async () => {
      const wishlistRef = collection(db!, COLLECTIONS.WISHLIST);
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
    },
    undefined,
  );
}

export async function getWishlistItemsForSeller(sellerId: string): Promise<WishlistItem[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getWishlistItemsForSeller",
    async () => {
      const wishlistRef = collection(db!, COLLECTIONS.WISHLIST);
      const q = query(wishlistRef, where("sellerId", "==", sellerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => d.data() as WishlistItem);
    },
    [],
  );
}

export async function createWishlistAlert(alert: WishlistAlert): Promise<string> {
  if (!isFirebaseConfigured() || !db) return alert.id;
  return safeCall(
    "createWishlistAlert",
    async () => {
      const alertRef = doc(db!, COLLECTIONS.WISHLIST_ALERTS, alert.id);
      await setDoc(alertRef, alert);
      return alert.id;
    },
    alert.id,
  );
}

export async function getWishlistAlertsByBuyer(buyerId: string): Promise<WishlistAlert[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getWishlistAlertsByBuyer",
    async () => {
      const alertsRef = collection(db!, COLLECTIONS.WISHLIST_ALERTS);
      const q = query(alertsRef, where("buyerId", "==", buyerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((d) => d.data() as WishlistAlert)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    [],
  );
}

export async function markAlertSeen(alertId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "markAlertSeen",
    async () => {
      const alertRef = doc(db!, COLLECTIONS.WISHLIST_ALERTS, alertId);
      await updateDoc(alertRef, { seen: true });
    },
    undefined,
  );
}

// ==================== ANALYTICS ====================

export async function getSellerAnalytics(sellerId: string): Promise<SellerAnalytics | null> {
  if (!isFirebaseConfigured() || !db) return null;
  return safeCall(
    "getSellerAnalytics",
    async () => {
      const ref = doc(db!, COLLECTIONS.ANALYTICS, sellerId);
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as SellerAnalytics) : null;
    },
    null,
  );
}

export async function incrementProfileView(sellerId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "incrementProfileView",
    async () => {
      const ref = doc(db!, COLLECTIONS.ANALYTICS, sellerId);
      await setDoc(
        ref,
        {
          sellerId,
          profileViews: increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    },
    undefined,
  );
}

export async function incrementItemView(sellerId: string, itemId: string): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "incrementItemView",
    async () => {
      const ref = doc(db!, COLLECTIONS.ANALYTICS, sellerId);
      await setDoc(
        ref,
        {
          sellerId,
          itemViews: { [itemId]: increment(1) },
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    },
    undefined,
  );
}

// ==================== PAYMENTS ====================

export async function createPaymentRequest(payment: PaymentRequest): Promise<string> {
  if (!isFirebaseConfigured() || !db) return payment.id;
  return safeCall(
    "createPaymentRequest",
    async () => {
      const ref = doc(db!, COLLECTIONS.PAYMENTS, payment.id);
      await setDoc(ref, payment);
      return payment.id;
    },
    payment.id,
  );
}

export async function getPaymentsByChat(missionId: string, sellerId: string): Promise<PaymentRequest[]> {
  if (!isFirebaseConfigured() || !db) return [];
  return safeCall(
    "getPaymentsByChat",
    async () => {
      const ref = collection(db!, COLLECTIONS.PAYMENTS);
      const q = query(
        ref,
        where("missionId", "==", missionId),
        where("sellerId", "==", sellerId),
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => d.data() as PaymentRequest);
    },
    [],
  );
}

export async function updatePaymentStatus(id: string, status: PaymentStatus): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  await safeCall(
    "updatePaymentStatus",
    async () => {
      const ref = doc(db!, COLLECTIONS.PAYMENTS, id);
      await updateDoc(ref, { status, updatedAt: new Date().toISOString() });
    },
    undefined,
  );
}
