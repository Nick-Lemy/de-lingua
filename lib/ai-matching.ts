"use server";

import type { Mission, Seller, Match, FeedPost } from "./types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface MatchResult {
  sellerId: string;
  matchScore: number;
  budgetFit: "good" | "moderate" | "high";
  stockStatus: "in-stock" | "low-stock" | "on-request";
  reasoning: string;
}

export async function generateMatchesWithAI(
  mission: Mission,
  sellers: Seller[],
  feedPosts: FeedPost[] = [],
): Promise<MatchResult[]> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return fallbackMatching(mission, sellers, feedPosts);
  }

  const prompt = buildMatchingPrompt(mission, sellers, feedPosts);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a supplier matching expert for the Rwandan market. Analyze the buyer's mission and available sellers (including their catalog inventory and active community feed offers) to find the best matches. Return ONLY a JSON array as described in the instructions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      console.error("Groq API error:", await response.text());
      return fallbackMatching(mission, sellers, feedPosts);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) {
      return fallbackMatching(mission, sellers, feedPosts);
    }

    // Parse the JSON response from Groq
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return fallbackMatching(mission, sellers, feedPosts);
    }

    const matches: MatchResult[] = JSON.parse(jsonMatch[0]);
    return matches.filter((m) => sellers.some((s) => s.id === m.sellerId));
  } catch (error) {
    console.error("AI matching error:", error);
    return fallbackMatching(mission, sellers, feedPosts);
  }
}

function buildMatchingPrompt(
  mission: Mission,
  sellers: Seller[],
  feedPosts: FeedPost[] = [],
): string {
  const sellersInfo = sellers.map((s) => {
    const sellerFeedPosts = feedPosts.filter(
      (p) =>
        p.type === "offering" &&
        p.status === "active" &&
        (p.userId === s.id || p.userName.toLowerCase() === s.name.toLowerCase()),
    );
    return {
      id: s.id,
      name: s.name,
      category: s.category,
      location: s.location,
      rating: s.rating,
      minOrder: s.minOrder,
      responseTime: s.responseTime,
      inventory: s.inventory.map((i) => ({
        name: i.name,
        price: i.price,
        stock: i.stock,
      })),
      recentFeedOffers: sellerFeedPosts.map((p) => ({
        title: p.title,
        description: p.description,
        category: p.category,
        price: p.budget,
      })),
    };
  });

  return `You are a supplier matching expert for the Rwandan market. Analyze the buyer's mission and available sellers to find the best matches.

BUYER MISSION:
- Product needed: ${mission.product}
- Category: ${mission.category}
- Quantity: ${mission.quantity}
- Budget range: ${mission.budgetMin} - ${mission.budgetMax} RWF
- Urgency: ${mission.urgency}
- Preferred location: ${mission.location} (Rwanda)
- Description: ${mission.description || "N/A"}

AVAILABLE SELLERS (with inventory and active community feed offers):
${JSON.stringify(sellersInfo, null, 2)}

INSTRUCTIONS:
1. Focus on matching sellers to the buyer's actual product needs, description, and requirements. Consider category only as a hint, not a hard barrier.
2. CRITICAL: Check both the seller's catalog inventory AND their recentFeedOffers (e.g. if a seller posted on the community feed offering "tree tomatoes", match them!).
3. Match sellers based on: product availability (in inventory or feed offers), price fit, location proximity within Rwanda, reliability (rating), and details in the buyer's description.
4. Calculate a matchScore (0-100) based on how well each seller fits the buyer's needs.
5. Determine budgetFit: "good" if within budget, "moderate" if slightly above, "high" if significantly above.
6. Determine stockStatus based on their inventory or feed offer ("in-stock" if offered or in inventory, "low-stock", or "on-request").
7. Only include sellers with matchScore >= 60.
8. Prioritize local Rwandan suppliers and those who can deliver to the buyer's location.

Return ONLY a JSON array with this exact format, no extra text:
[
  {
    "sellerId": "seller_id_here",
    "matchScore": 87,
    "budgetFit": "good",
    "stockStatus": "in-stock",
    "reasoning": "Brief explanation of why this is a good match"
  }
]

Sort by matchScore descending. Maximum 5 matches.`;
}

function fallbackMatching(
  mission: Mission,
  sellers: Seller[],
  feedPosts: FeedPost[] = [],
): MatchResult[] {
  const budgetMin = parseInt(mission.budgetMin, 10) || 0;
  const budgetMax = parseInt(mission.budgetMax, 10) || 0;
  const budgetMid = (budgetMin + budgetMax) / 2;

  const productTokens = mission.product
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const categoryClusters: Record<string, string[]> = {
    agriculture: [
      "agriculture",
      "food",
      "fruits",
      "vegetables",
      "farming",
      "produce",
      "crops",
      "general",
    ],
    food: [
      "food",
      "agriculture",
      "fruits",
      "vegetables",
      "beverages",
      "produce",
      "groceries",
      "general",
    ],
    construction: [
      "construction",
      "hardware",
      "building",
      "cement",
      "tools",
      "materials",
      "general",
    ],
    textiles: [
      "textiles",
      "clothing",
      "fabric",
      "fashion",
      "apparel",
      "wear",
      "general",
    ],
    electronics: [
      "electronics",
      "phones",
      "appliances",
      "computers",
      "tech",
      "gadgets",
      "general",
    ],
    machinery: [
      "machinery",
      "equipment",
      "industrial",
      "tools",
      "hardware",
      "general",
    ],
  };

  const isCategoryRelated = (catA: string, catB: string): boolean => {
    const a = (catA || "").toLowerCase().trim();
    const b = (catB || "").toLowerCase().trim();
    if (!a || !b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    for (const cluster of Object.values(categoryClusters)) {
      if (
        cluster.some((c) => a.includes(c)) &&
        cluster.some((c) => b.includes(c))
      ) {
        return true;
      }
    }
    return false;
  };

  const results: MatchResult[] = [];

  for (const seller of sellers) {
    let score = 0;
    let matchedReason = "";
    let stockStatus: "in-stock" | "low-stock" | "on-request" = "on-request";

    // 1. Check active offering feed posts by this seller
    const sellerPosts = feedPosts.filter(
      (p) =>
        p.type === "offering" &&
        p.status === "active" &&
        (p.userId === seller.id ||
          p.userName.toLowerCase() === seller.name.toLowerCase()),
    );

    let matchingPost: FeedPost | null = null;
    for (const post of sellerPosts) {
      const postText = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      if (
        postText.includes(mission.product.toLowerCase()) ||
        mission.product.toLowerCase().includes(post.title.toLowerCase())
      ) {
        matchingPost = post;
        break;
      }
      const matchingTokens = productTokens.filter((token) =>
        postText.includes(token),
      );
      if (matchingTokens.length > 0) {
        matchingPost = post;
        break;
      }
    }

    if (matchingPost) {
      score += 65;
      stockStatus = "in-stock";
      matchedReason = `${seller.name} is actively offering "${matchingPost.title}" on the Community Feed`;
    }

    // 2. Check seller catalog inventory
    let matchingItem: (typeof seller.inventory)[0] | null = null;
    for (const item of seller.inventory) {
      const itemText = item.name.toLowerCase();
      if (
        itemText.includes(mission.product.toLowerCase()) ||
        mission.product.toLowerCase().includes(itemText)
      ) {
        matchingItem = item;
        break;
      }
      const matchingTokens = productTokens.filter((t) => itemText.includes(t));
      if (matchingTokens.length > 0) {
        matchingItem = item;
        break;
      }
    }

    if (matchingItem) {
      score += 60;
      if (!matchedReason) {
        matchedReason = `${seller.name} carries "${matchingItem.name}" in their product catalog`;
      }
      if (matchingItem.stock > 0) {
        stockStatus = "in-stock";
      } else {
        stockStatus = "low-stock";
      }
    }

    // 3. Check seller store name and description
    const storeText = `${seller.name} ${seller.description}`.toLowerCase();
    const storeTokensMatch = productTokens.filter((t) => storeText.includes(t));
    if (storeTokensMatch.length > 0) {
      score += 25;
      if (!matchedReason) {
        matchedReason = `${seller.name} specializes in ${seller.category} and related supplies`;
      }
    }

    // 4. Check category fit
    const catMatch = isCategoryRelated(seller.category, mission.category);
    if (catMatch) {
      score += 20;
      if (!matchedReason) {
        matchedReason = `Matches ${mission.category} supplier in ${seller.location}`;
      }
    }

    // If there is zero match across feed, inventory, store name, and category, skip this seller
    if (score < 40) continue;

    // Additional bonuses
    score += Math.floor(Math.min(seller.rating, 5) * 2);

    if (seller.subscriptionTier === "pro") score += 5;
    else if (seller.subscriptionTier === "plus") score += 2;

    // Location proximity bonus
    if (
      mission.location &&
      seller.location &&
      mission.location.toLowerCase().split(",")[0] ===
        seller.location.toLowerCase().split(",")[0]
    ) {
      score += 4;
    }

    // Budget evaluation
    let budgetFit: "good" | "moderate" | "high" = "good";
    const avgPrice =
      seller.inventory.length > 0
        ? seller.inventory.reduce((sum, i) => sum + Number(i.price || 0), 0) /
          seller.inventory.length
        : budgetMid;

    if (budgetMid > 0 && avgPrice > 0) {
      const priceDiff = Math.abs(budgetMid - avgPrice) / budgetMid;
      if (priceDiff < 0.25) {
        budgetFit = "good";
        score += 5;
      } else if (priceDiff < 0.6) {
        budgetFit = "moderate";
      } else {
        budgetFit = "high";
      }
    }

    const finalScore = Math.min(Math.max(score, 60), 99);

    results.push({
      sellerId: seller.id,
      matchScore: finalScore,
      budgetFit,
      stockStatus,
      reasoning: matchedReason || `Matches your request for ${mission.product}`,
    });
  }

  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

export async function createMatchesFromAI(
  mission: Mission,
  sellers: Seller[],
  generateId: () => string,
  feedPosts: FeedPost[] = [],
): Promise<Match[]> {
  const allSellers = [...sellers];

  // Auto-synthesize seller from offering feed posts if any seller was not in `sellers` list
  for (const post of feedPosts) {
    if (
      post.type === "offering" &&
      post.status === "active" &&
      post.userRole === "seller"
    ) {
      const exists = allSellers.some(
        (s) =>
          s.id === post.userId ||
          s.name.toLowerCase() === post.userName.toLowerCase(),
      );
      if (!exists) {
        allSellers.push({
          id: post.userId,
          name: post.userName,
          avatar: post.userAvatar || post.userName.charAt(0).toUpperCase(),
          category: post.category || "General",
          rating: 5.0,
          reviews: 0,
          verified: false,
          location: post.location || "Kigali, Rwanda",
          serviceRange: "Nationwide",
          minOrder: "1 unit",
          responseTime: "< 24 hours",
          description:
            post.description || `${post.userName} offers ${post.title}`,
          certifications: [],
          inventory: [],
        });
      }
    }
  }

  const aiResults = await generateMatchesWithAI(mission, allSellers, feedPosts);

  const matches: Match[] = [];
  for (const result of aiResults) {
    const seller = allSellers.find((s) => s.id === result.sellerId);
    if (!seller) continue;
    matches.push({
      id: generateId(),
      missionId: mission.id,
      sellerId: seller.id,
      sellerName: seller.name,
      sellerAvatar: seller.avatar,
      matchScore: result.matchScore,
      distance: estimateDistance(mission.location, seller.location),
      budgetFit: result.budgetFit,
      stockStatus: result.stockStatus,
      whyMatch: [result.reasoning],
      status: "pending",
    });
  }
  return matches;
}

function estimateDistance(
  buyerLocation: string,
  sellerLocation: string,
): string {
  if (!buyerLocation || !sellerLocation) return "N/A";

  const buyerCity = buyerLocation.split(",")[0]?.trim().toLowerCase() ?? "";
  const sellerCity = sellerLocation.split(",")[0]?.trim().toLowerCase() ?? "";

  if (buyerCity && sellerCity && buyerCity === sellerCity) {
    return "same city";
  }
  return "N/A";
}


