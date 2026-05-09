// LocalStorage utilities for data persistence
export type {
  UserProfile,
  Mission,
  Match,
  Seller,
  InventoryItem,
  ChatMessage,
  FeedPost,
  FeedReply,
  FeedAISuggestion,
} from "./types";

import type {
  UserProfile,
  Mission,
  Match,
  Seller,
  ChatMessage,
  FeedPost,
  FeedReply,
  Review,
  WishlistItem,
  WishlistAlert,
  SellerAnalytics,
  SellerBadge,
  PaymentRequest,
  PaymentStatus,
} from "./types";
import { safeGet, safeSet, safeRemove } from "./utils";

export { generateId } from "./utils";

const KEYS = {
  USER_PROFILE: "delingua_user_profile",
  MISSIONS: "delingua_missions",
  SELLERS: "delingua_sellers",
  MATCHES: "delingua_matches",
  CHATS: "delingua_chats",
  FEED_POSTS: "delingua_feed_posts",
  FEED_REPLIES: "delingua_feed_replies",
  REVIEWS: "delingua_reviews",
  WISHLIST: "delingua_wishlist",
  WISHLIST_ALERTS: "delingua_wishlist_alerts",
  ANALYTICS: "delingua_seller_analytics",
  PAYMENTS: "delingua_payments",
};

// User Profile
export function saveUserProfile(profile: UserProfile): void {
  safeSet(KEYS.USER_PROFILE, profile);
}

export function getUserProfile(): UserProfile | null {
  return safeGet<UserProfile | null>(KEYS.USER_PROFILE, null);
}

export function clearUserProfile(): void {
  safeRemove(KEYS.USER_PROFILE);
}

// Missions
export function saveMission(mission: Mission): void {
  const missions = getMissions();
  const index = missions.findIndex((m) => m.id === mission.id);
  if (index >= 0) {
    missions[index] = mission;
  } else {
    missions.push(mission);
  }
  safeSet(KEYS.MISSIONS, missions);
}

export function getMissions(): Mission[] {
  return safeGet<Mission[]>(KEYS.MISSIONS, []);
}

export function getMissionById(id: string): Mission | null {
  const missions = getMissions();
  return missions.find((m) => m.id === id) || null;
}

export function deleteMission(id: string): void {
  const missions = getMissions().filter((m) => m.id !== id);
  safeSet(KEYS.MISSIONS, missions);
}

// Sellers
export function saveSeller(seller: Seller): void {
  const sellers = getSellers();
  const index = sellers.findIndex((s) => s.id === seller.id);
  if (index >= 0) {
    sellers[index] = seller;
  } else {
    sellers.push(seller);
  }
  safeSet(KEYS.SELLERS, sellers);
}

export function getSellers(): Seller[] {
  return safeGet<Seller[]>(KEYS.SELLERS, []);
}

export function getSellerById(id: string): Seller | null {
  const sellers = getSellers();
  return sellers.find((s) => s.id === id) || null;
}

// Matches
export function saveMatch(match: Match): void {
  const matches = getMatches();
  const index = matches.findIndex((m) => m.id === match.id);
  if (index >= 0) {
    matches[index] = match;
  } else {
    matches.push(match);
  }
  safeSet(KEYS.MATCHES, matches);
}

export function getMatches(): Match[] {
  return safeGet<Match[]>(KEYS.MATCHES, []);
}

export function getMatchesByMission(missionId: string): Match[] {
  return getMatches().filter((m) => m.missionId === missionId);
}

export function getMatchesForSeller(sellerId: string): Match[] {
  return getMatches().filter((m) => m.sellerId === sellerId);
}

export function updateMatch(id: string, updates: Partial<Match>): void {
  const matches = getMatches();
  const index = matches.findIndex((m) => m.id === id);
  if (index >= 0) {
    matches[index] = { ...matches[index], ...updates };
    safeSet(KEYS.MATCHES, matches);
  }
}

// Update seller inventory
export function updateSellerInventory(
  sellerId: string,
  inventory: Seller["inventory"],
): void {
  const seller = getSellerById(sellerId);
  if (seller) {
    seller.inventory = inventory;
    saveSeller(seller);
  }
}

// Create a Seller from UserProfile during signup
export function createSellerFromUser(user: UserProfile): Seller {
  const displayName = user.businessProfile?.storeName?.trim() || user.name;
  const initial = (displayName?.trim()?.charAt(0) || "U").toUpperCase();
  const seller: Seller = {
    id: user.id,
    name: displayName,
    avatar: initial,
    category: user.businessProfile?.category || "General",
    rating: 5.0,
    reviews: 0,
    verified: false,
    location: user.businessProfile?.location || "Rwanda",
    serviceRange: user.businessProfile?.serviceRange || "Nationwide",
    minOrder: user.businessProfile?.minOrderQty || "1 unit",
    responseTime: "< 24 hours",
    description: `${displayName} is a supplier offering ${user.businessProfile?.products?.join(", ") || "products"} in Rwanda.`,
    certifications: [],
    inventory: [],
    badges: [],
  };
  saveSeller(seller);
  return seller;
}

// Chat Messages
export function saveChatMessage(message: ChatMessage): void {
  const chats = getChatMessages();
  chats.push(message);
  safeSet(KEYS.CHATS, chats);
}

export function getChatMessages(): ChatMessage[] {
  return safeGet<ChatMessage[]>(KEYS.CHATS, []);
}

export function getChatByMissionAndSeller(
  missionId: string,
  sellerId: string,
): ChatMessage[] {
  return getChatMessages().filter(
    (m) => m.missionId === missionId && m.sellerId === sellerId,
  );
}

export function getChatsForBuyer(buyerId: string): ChatMessage[] {
  return getChatMessages().filter((m) => m.buyerId === buyerId);
}

export function getChatsForSeller(sellerId: string): ChatMessage[] {
  return getChatMessages().filter((m) => m.sellerId === sellerId);
}

// ==================== FEED POSTS ====================

export function saveFeedPost(post: FeedPost): void {
  const posts = getFeedPosts();
  const index = posts.findIndex((p) => p.id === post.id);
  if (index >= 0) {
    posts[index] = post;
  } else {
    posts.unshift(post);
  }
  safeSet(KEYS.FEED_POSTS, posts);
}

export function getFeedPosts(): FeedPost[] {
  return safeGet<FeedPost[]>(KEYS.FEED_POSTS, []);
}

export function getFeedPostById(id: string): FeedPost | null {
  const posts = getFeedPosts();
  return posts.find((p) => p.id === id) || null;
}

export function getFeedPostsByUser(userId: string): FeedPost[] {
  return getFeedPosts().filter((p) => p.userId === userId);
}

export function updateFeedPost(id: string, updates: Partial<FeedPost>): void {
  const posts = getFeedPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index >= 0) {
    posts[index] = { ...posts[index], ...updates };
    safeSet(KEYS.FEED_POSTS, posts);
  }
}

export function deleteFeedPost(id: string): void {
  const posts = getFeedPosts().filter((p) => p.id !== id);
  safeSet(KEYS.FEED_POSTS, posts);
  const replies = getFeedReplies().filter((r) => r.postId !== id);
  safeSet(KEYS.FEED_REPLIES, replies);
}

// ==================== FEED REPLIES ====================

export function saveFeedReply(reply: FeedReply): void {
  const replies = getFeedReplies();
  replies.push(reply);
  safeSet(KEYS.FEED_REPLIES, replies);
  const post = getFeedPostById(reply.postId);
  if (post) {
    updateFeedPost(reply.postId, { repliesCount: post.repliesCount + 1 });
  }
}

export function getFeedReplies(): FeedReply[] {
  return safeGet<FeedReply[]>(KEYS.FEED_REPLIES, []);
}

export function getRepliesByPost(postId: string): FeedReply[] {
  return getFeedReplies()
    .filter((r) => r.postId === postId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
}

export function getRepliesByUser(userId: string): FeedReply[] {
  return getFeedReplies().filter((r) => r.userId === userId);
}

// ==================== REVIEWS ====================

function getReviewsAll(): Review[] {
  return safeGet<Review[]>(KEYS.REVIEWS, []);
}

export function saveReview(review: Review): void {
  const reviews = getReviewsAll();
  reviews.push(review);
  safeSet(KEYS.REVIEWS, reviews);
}

export function getReviewsBySeller(sellerId: string): Review[] {
  return getReviewsAll()
    .filter((r) => r.sellerId === sellerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getReviewsByBuyer(buyerId: string): Review[] {
  return getReviewsAll().filter((r) => r.buyerId === buyerId);
}

export function hasReviewedSeller(
  buyerId: string,
  sellerId: string,
  missionId: string,
): boolean {
  return getReviewsAll().some(
    (r) => r.buyerId === buyerId && r.sellerId === sellerId && r.missionId === missionId,
  );
}

function computeBadges(seller: Seller, reviews: Review[]): SellerBadge[] {
  const badges: SellerBadge[] = [];
  const count = reviews.length;
  const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;

  if (avg >= 4.5 && count >= 5) badges.push("top-seller");
  if (avg >= 4.0 && !badges.includes("top-seller")) badges.push("good-seller");
  if (count >= 10) badges.push("trusted-partner");
  if (seller.responseTime && seller.responseTime.toLowerCase().includes("min")) badges.push("fast-reply");
  if (seller.verified) badges.push("verified-supplier");

  return badges;
}

export function updateSellerRatingAndBadges(sellerId: string, reviews: Review[]): void {
  const seller = getSellerById(sellerId);
  if (!seller) return;

  const count = reviews.length;
  const avg = count > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : seller.rating;

  const updated: Seller = {
    ...seller,
    rating: avg,
    reviews: count,
    badges: computeBadges(seller, reviews),
  };
  saveSeller(updated);
}

// ==================== WISHLIST ====================

function getWishlistAll(): WishlistItem[] {
  return safeGet<WishlistItem[]>(KEYS.WISHLIST, []);
}

export function addToWishlist(item: WishlistItem): void {
  const wishlist = getWishlistAll();
  const exists = wishlist.findIndex((w) => w.buyerId === item.buyerId && w.sellerId === item.sellerId);
  if (exists < 0) {
    wishlist.push(item);
    safeSet(KEYS.WISHLIST, wishlist);
  }
}

export function removeFromWishlist(buyerId: string, sellerId: string): void {
  const wishlist = getWishlistAll().filter(
    (w) => !(w.buyerId === buyerId && w.sellerId === sellerId),
  );
  safeSet(KEYS.WISHLIST, wishlist);
}

export function getWishlistByBuyer(buyerId: string): WishlistItem[] {
  return getWishlistAll().filter((w) => w.buyerId === buyerId);
}

export function isInWishlist(buyerId: string, sellerId: string): boolean {
  return getWishlistAll().some((w) => w.buyerId === buyerId && w.sellerId === sellerId);
}

export function updateWishlistAlert(
  buyerId: string,
  sellerId: string,
  alertKeyword: string,
  alertEnabled: boolean,
): void {
  const wishlist = getWishlistAll();
  const index = wishlist.findIndex((w) => w.buyerId === buyerId && w.sellerId === sellerId);
  if (index >= 0) {
    wishlist[index] = { ...wishlist[index], alertKeyword, alertEnabled };
    safeSet(KEYS.WISHLIST, wishlist);
  }
}

function getWishlistAlertsAll(): WishlistAlert[] {
  return safeGet<WishlistAlert[]>(KEYS.WISHLIST_ALERTS, []);
}

export function saveWishlistAlert(alert: WishlistAlert): void {
  const alerts = getWishlistAlertsAll();
  alerts.unshift(alert);
  safeSet(KEYS.WISHLIST_ALERTS, alerts);
}

export function getWishlistAlertsByBuyer(buyerId: string): WishlistAlert[] {
  return getWishlistAlertsAll()
    .filter((a) => a.buyerId === buyerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function markAlertSeen(alertId: string): void {
  const alerts = getWishlistAlertsAll();
  const index = alerts.findIndex((a) => a.id === alertId);
  if (index >= 0) {
    alerts[index] = { ...alerts[index], seen: true };
    safeSet(KEYS.WISHLIST_ALERTS, alerts);
  }
}

export function getWishlistItemsForSeller(sellerId: string): WishlistItem[] {
  return getWishlistAll().filter((w) => w.sellerId === sellerId);
}

// ==================== ANALYTICS ====================

function getAllAnalytics(): Record<string, SellerAnalytics> {
  return safeGet<Record<string, SellerAnalytics>>(KEYS.ANALYTICS, {});
}

function saveAllAnalytics(all: Record<string, SellerAnalytics>): void {
  safeSet(KEYS.ANALYTICS, all);
}

export function getSellerAnalytics(sellerId: string): SellerAnalytics | null {
  const all = getAllAnalytics();
  return all[sellerId] || null;
}

export function incrementProfileView(sellerId: string): void {
  const all = getAllAnalytics();
  const existing = all[sellerId] || { sellerId, profileViews: 0, itemViews: {}, updatedAt: "" };
  all[sellerId] = {
    ...existing,
    profileViews: (existing.profileViews || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  saveAllAnalytics(all);
}

export function incrementItemView(sellerId: string, itemId: string): void {
  const all = getAllAnalytics();
  const existing = all[sellerId] || { sellerId, profileViews: 0, itemViews: {}, updatedAt: "" };
  const itemViews = { ...existing.itemViews };
  itemViews[itemId] = (itemViews[itemId] || 0) + 1;
  all[sellerId] = { ...existing, itemViews, updatedAt: new Date().toISOString() };
  saveAllAnalytics(all);
}

// ==================== PAYMENTS ====================

function getPaymentsAll(): PaymentRequest[] {
  return safeGet<PaymentRequest[]>(KEYS.PAYMENTS, []);
}

export function savePaymentRequest(payment: PaymentRequest): void {
  const payments = getPaymentsAll();
  payments.push(payment);
  safeSet(KEYS.PAYMENTS, payments);
}

export function getPaymentsByChat(missionId: string, sellerId: string): PaymentRequest[] {
  return getPaymentsAll().filter(
    (p) => p.missionId === missionId && p.sellerId === sellerId,
  );
}

export function updatePaymentStatus(id: string, status: PaymentStatus): void {
  const payments = getPaymentsAll();
  const index = payments.findIndex((p) => p.id === id);
  if (index >= 0) {
    payments[index] = { ...payments[index], status, updatedAt: new Date().toISOString() };
    safeSet(KEYS.PAYMENTS, payments);
  }
}
