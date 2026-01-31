// LocalStorage utilities for data persistence

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "buyer" | "seller";
  avatar: string;
  preferences?: {
    categories: string[];
    budgetBehavior: string;
    locationRadius: string;
    values: string[];
  };
  businessProfile?: {
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
  urgency: string;
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
  budgetFit: string;
  stockStatus: string;
  whyMatch: string[];
  status: "pending" | "connected" | "declined";
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
  sender: "buyer" | "seller";
  text: string;
  time: string;
}

// Storage keys
const KEYS = {
  USER_PROFILE: "delingua_user_profile",
  MISSIONS: "delingua_missions",
  SELLERS: "delingua_sellers",
  MATCHES: "delingua_matches",
  CHATS: "delingua_chats",
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

// Initialize dummy data
export function initializeDummyData(): void {
  // Only initialize if no data exists
  if (getSellers().length === 0) {
    const dummySellers: Seller[] = [
      {
        id: "seller_1",
        name: "TechPro Supplies",
        avatar: "T",
        category: "Electronics",
        rating: 4.8,
        reviews: 234,
        verified: true,
        location: "Berlin, Germany",
        serviceRange: "EU Wide",
        minOrder: "€500",
        responseTime: "< 2 hours",
        description:
          "Leading supplier of professional electronics and office equipment. We specialize in bulk orders for businesses and offer competitive pricing with certified quality.",
        certifications: ["ISO 9001", "CE Certified", "RoHS"],
        inventory: [
          {
            id: "inv_1",
            name: '27" LED Monitor',
            price: "245",
            stock: 450,
            moq: "10 units",
            leadTime: "3-5 days",
          },
          {
            id: "inv_2",
            name: "Wireless Keyboard & Mouse",
            price: "45",
            stock: 890,
            moq: "20 units",
            leadTime: "2-3 days",
          },
        ],
      },
      {
        id: "seller_2",
        name: "Office Direct",
        avatar: "O",
        category: "Office Supplies",
        rating: 4.6,
        reviews: 189,
        verified: true,
        location: "Munich, Germany",
        serviceRange: "Nationwide",
        minOrder: "€200",
        responseTime: "< 4 hours",
        description:
          "Your trusted partner for office supplies. From paper to furniture, we deliver quality products at competitive prices.",
        certifications: ["ISO 14001"],
        inventory: [
          {
            id: "inv_3",
            name: "Office Chair Premium",
            price: "189",
            stock: 120,
            moq: "5 units",
            leadTime: "1 week",
          },
        ],
      },
      {
        id: "seller_3",
        name: "GreenPack Co",
        avatar: "G",
        category: "Packaging",
        rating: 4.9,
        reviews: 312,
        verified: true,
        location: "Hamburg, Germany",
        serviceRange: "EU Wide",
        minOrder: "€1000",
        responseTime: "< 3 hours",
        description:
          "Eco-friendly packaging solutions for modern businesses. Sustainable, certified, and competitively priced.",
        certifications: ["FSC", "EU Ecolabel", "Cradle to Cradle"],
        inventory: [
          {
            id: "inv_4",
            name: "Recycled Cardboard Boxes",
            price: "0.45",
            stock: 50000,
            moq: "500 units",
            leadTime: "5-7 days",
          },
        ],
      },
    ];

    dummySellers.forEach(saveSeller);
  }
}

// Generate unique ID
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
