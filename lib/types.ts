// Shared types for DeLingua

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller";
  avatar: string;
  createdAt?: string;
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
}

export interface InventoryItem {
  id: string;
  name: string;
  price: string;
  stock: number;
  moq: string;
  leadTime: string;
}

export interface ChatMessage {
  id: string;
  missionId: string;
  sellerId: string;
  buyerId: string;
  sender: "buyer" | "seller";
  text: string;
  time: string;
}
