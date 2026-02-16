// LocalStorage utilities for data persistence
// Re-export types for backwards compatibility
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
} from "./types";

// Storage keys
const KEYS = {
  USER_PROFILE: "delingua_user_profile",
  MISSIONS: "delingua_missions",
  SELLERS: "delingua_sellers",
  MATCHES: "delingua_matches",
  CHATS: "delingua_chats",
  FEED_POSTS: "delingua_feed_posts",
  FEED_REPLIES: "delingua_feed_replies",
};

// User Profile
export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function getUserProfile(): UserProfile | null {
  const data = localStorage.getItem(KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

export function clearUserProfile(): void {
  localStorage.removeItem(KEYS.USER_PROFILE);
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
  localStorage.setItem(KEYS.MISSIONS, JSON.stringify(missions));
}

export function getMissions(): Mission[] {
  const data = localStorage.getItem(KEYS.MISSIONS);
  return data ? JSON.parse(data) : [];
}

export function getMissionById(id: string): Mission | null {
  const missions = getMissions();
  return missions.find((m) => m.id === id) || null;
}

export function deleteMission(id: string): void {
  const missions = getMissions().filter((m) => m.id !== id);
  localStorage.setItem(KEYS.MISSIONS, JSON.stringify(missions));
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
  localStorage.setItem(KEYS.SELLERS, JSON.stringify(sellers));
}

export function getSellers(): Seller[] {
  const data = localStorage.getItem(KEYS.SELLERS);
  return data ? JSON.parse(data) : [];
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
  localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
}

export function getMatches(): Match[] {
  const data = localStorage.getItem(KEYS.MATCHES);
  return data ? JSON.parse(data) : [];
}

export function getMatchesByMission(missionId: string): Match[] {
  return getMatches().filter((m) => m.missionId === missionId);
}

// Get matches for a seller (incoming buyer requests)
export function getMatchesForSeller(sellerId: string): Match[] {
  return getMatches().filter((m) => m.sellerId === sellerId);
}

// Update a match
export function updateMatch(id: string, updates: Partial<Match>): void {
  const matches = getMatches();
  const index = matches.findIndex((m) => m.id === id);
  if (index >= 0) {
    matches[index] = { ...matches[index], ...updates };
    localStorage.setItem(KEYS.MATCHES, JSON.stringify(matches));
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
  // Use store name as the seller's display name (falls back to user name)
  const displayName = user.businessProfile?.storeName || user.name;
  const seller: Seller = {
    id: user.id,
    name: displayName,
    avatar: displayName.charAt(0).toUpperCase(),
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
  };
  saveSeller(seller);
  return seller;
}

// Chat Messages
export function saveChatMessage(message: ChatMessage): void {
  const chats = getChatMessages();
  chats.push(message);
  localStorage.setItem(KEYS.CHATS, JSON.stringify(chats));
}

export function getChatMessages(): ChatMessage[] {
  const data = localStorage.getItem(KEYS.CHATS);
  return data ? JSON.parse(data) : [];
}

export function getChatByMissionAndSeller(
  missionId: string,
  sellerId: string,
): ChatMessage[] {
  return getChatMessages().filter(
    (m) => m.missionId === missionId && m.sellerId === sellerId,
  );
}

// Get all chats for a buyer
export function getChatsForBuyer(buyerId: string): ChatMessage[] {
  return getChatMessages().filter((m) => m.buyerId === buyerId);
}

// Get all chats for a seller
export function getChatsForSeller(sellerId: string): ChatMessage[] {
  return getChatMessages().filter((m) => m.sellerId === sellerId);
}

// Initialize dummy data (no longer seeds fake sellers - sellers come from real signups)
export function initializeDummyData(): void {
  // No longer pre-seeding sellers - they are created when users sign up as sellers
}

// Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== FEED POSTS ====================

export function saveFeedPost(post: FeedPost): void {
  const posts = getFeedPosts();
  const index = posts.findIndex((p) => p.id === post.id);
  if (index >= 0) {
    posts[index] = post;
  } else {
    posts.unshift(post); // Add to beginning
  }
  localStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(posts));
}

export function getFeedPosts(): FeedPost[] {
  const data = localStorage.getItem(KEYS.FEED_POSTS);
  return data ? JSON.parse(data) : [];
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
    localStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(posts));
  }
}

export function deleteFeedPost(id: string): void {
  const posts = getFeedPosts().filter((p) => p.id !== id);
  localStorage.setItem(KEYS.FEED_POSTS, JSON.stringify(posts));
  // Also delete associated replies
  const replies = getFeedReplies().filter((r) => r.postId !== id);
  localStorage.setItem(KEYS.FEED_REPLIES, JSON.stringify(replies));
}

// ==================== FEED REPLIES ====================

export function saveFeedReply(reply: FeedReply): void {
  const replies = getFeedReplies();
  replies.push(reply);
  localStorage.setItem(KEYS.FEED_REPLIES, JSON.stringify(replies));
  // Increment reply count on post
  const post = getFeedPostById(reply.postId);
  if (post) {
    updateFeedPost(reply.postId, { repliesCount: post.repliesCount + 1 });
  }
}

export function getFeedReplies(): FeedReply[] {
  const data = localStorage.getItem(KEYS.FEED_REPLIES);
  return data ? JSON.parse(data) : [];
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
