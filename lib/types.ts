// Shared types for DeLingua

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller";
  avatar: string;
  createdAt?: string;
  phoneNumber?: string;
  preferences?: {
    categories: string[];
    budgetBehavior: string;
    locationRadius: string;
    values: string[];
  };
  businessProfile?: {
    storeName: string;
    category: string;
    products: string[];
    minOrderQty: string;
    location: string;
    serviceRange: string;
    capacity: string;
  };
}

export interface Mission {
  id: string;
  buyerId: string;
  product: string;
  category: string;
  quantity: string;
  budgetMin: string;
  budgetMax: string;
  urgency: "urgent" | "normal" | "flexible";
  location: string;
  description?: string;
  status: "finding" | "matched" | "completed" | "cancelled";
  createdAt: string;
  matches?: Match[];
}

export interface Match {
  id: string;
  missionId: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  matchScore: number;
  distance: string;
  budgetFit: "good" | "moderate" | "high";
  stockStatus: "in-stock" | "on-request" | "low-stock";
  whyMatch: string[];
  status: "pending" | "connected" | "declined";
  createdAt?: string;
}

export type SellerBadge =
  | "top-seller"
  | "good-seller"
  | "fast-reply"
  | "verified-supplier"
  | "trusted-partner";

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  category: string;
  rating: number;
  reviews: number;
  verified: boolean;
  location: string;
  serviceRange: string;
  minOrder: string;
  responseTime: string;
  description: string;
  certifications: string[];
  inventory: InventoryItem[];
  badges?: SellerBadge[];
}

export interface InventoryItem {
  id: string;
  name: string;
  price: string;
  stock: number;
  moq: string;
  leadTime: string;
  image?: string;
}

export interface ChatMessage {
  id: string;
  missionId: string;
  sellerId: string;
  buyerId: string;
  sender: "buyer" | "seller";
  text: string;
  time: string;
  type?: "text" | "payment-request" | "payment-confirmed";
  paymentRequestId?: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: "buyer" | "seller";
  type: "looking-for" | "offering";
  title: string;
  description: string;
  category: string;
  budget?: string;
  location: string;
  urgency?: "urgent" | "normal" | "flexible";
  images?: string[];
  status: "active" | "fulfilled" | "closed";
  createdAt: string;
  repliesCount: number;
  aiSuggestions?: FeedAISuggestion[];
}

export interface FeedReply {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: "buyer" | "seller";
  type: "have-it" | "interested" | "pass" | "comment";
  message: string;
  price?: string;
  availability?: string;
  createdAt: string;
}

export interface FeedAISuggestion {
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  matchScore: number;
  reason: string;
}

export interface Review {
  id: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  rating: number;
  comment: string;
  missionId: string;
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerCategory: string;
  savedAt: string;
  alertKeyword?: string;
  alertEnabled: boolean;
}

export interface WishlistAlert {
  id: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  keyword: string;
  matchedItem: string;
  seen: boolean;
  createdAt: string;
}

export interface SellerAnalytics {
  sellerId: string;
  profileViews: number;
  itemViews: Record<string, number>;
  updatedAt: string;
}

export type PaymentProvider = "mtn-momo" | "airtel-money";
export type PaymentStatus = "pending" | "initiated" | "confirmed" | "failed" | "cancelled";

export interface PaymentRequest {
  id: string;
  missionId: string;
  sellerId: string;
  buyerId: string;
  amount: number;
  currency: "RWF";
  provider: PaymentProvider;
  phoneNumber: string;
  description: string;
  status: PaymentStatus;
  requestedBy: "buyer" | "seller";
  createdAt: string;
  updatedAt: string;
}
