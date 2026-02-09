"use server";

import type { Mission, Seller, Match } from "./types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
): Promise<MatchResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not set, falling back to basic matching");
    return fallbackMatching(mission, sellers);
  }

  const prompt = buildMatchingPrompt(mission, sellers);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return fallbackMatching(mission, sellers);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return fallbackMatching(mission, sellers);
    }

    // Parse the JSON response from Gemini
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return fallbackMatching(mission, sellers);
    }

    const matches: MatchResult[] = JSON.parse(jsonMatch[0]);
    return matches.filter((m) => sellers.some((s) => s.id === m.sellerId));
  } catch (error) {
    console.error("AI matching error:", error);
    return fallbackMatching(mission, sellers);
  }
}

function buildMatchingPrompt(mission: Mission, sellers: Seller[]): string {
  const sellersInfo = sellers.map((s) => ({
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
  }));

  return `You are a B2B supplier matching expert for the Rwandan market. Analyze the buyer's mission and available sellers to find the best matches.

BUYER MISSION:
- Product needed: ${mission.product}
- Category: ${mission.category}
- Quantity: ${mission.quantity}
- Budget range: ${mission.budgetMin} - ${mission.budgetMax} RWF
- Urgency: ${mission.urgency}
- Preferred location: ${mission.location} (Rwanda)
- Description: ${mission.description || "N/A"}

AVAILABLE SELLERS:
${JSON.stringify(sellersInfo, null, 2)}

INSTRUCTIONS:
1. Match sellers based on: category relevance, product availability, price fit, location proximity within Rwanda, and reliability (rating)
2. Calculate a matchScore (0-100) based on how well each seller fits the buyer's needs
3. Determine budgetFit: "good" if within budget, "moderate" if slightly above, "high" if significantly above
4. Determine stockStatus based on their inventory and the buyer's quantity needs
5. Only include sellers with matchScore >= 60
6. Prioritize local Rwandan suppliers and those who can deliver to the buyer's location

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

function fallbackMatching(mission: Mission, sellers: Seller[]): MatchResult[] {
  const budgetMin = parseInt(mission.budgetMin) || 0;
  const budgetMax = parseInt(mission.budgetMax) || 0;
  const budgetMid = (budgetMin + budgetMax) / 2;

  return sellers
    .filter((seller) => {
      const categoryMatch =
        seller.category
          .toLowerCase()
          .includes(mission.category.toLowerCase()) ||
        mission.category.toLowerCase().includes(seller.category.toLowerCase());
      return categoryMatch;
    })
    .map((seller) => {
      // Calculate a more meaningful score
      let score = 70;

      // Category match bonus
      if (seller.category.toLowerCase() === mission.category.toLowerCase()) {
        score += 10;
      }

      // Rating bonus
      score += Math.floor(seller.rating * 2);

      // Price fit calculation
      const avgPrice =
        seller.inventory.length > 0
          ? seller.inventory.reduce((sum, i) => sum + Number(i.price), 0) /
            seller.inventory.length
          : budgetMid;

      const priceDiff = Math.abs(budgetMid - avgPrice) / budgetMid;
      let budgetFit: "good" | "moderate" | "high" = "good";
      if (priceDiff < 0.2) {
        score += 10;
        budgetFit = "good";
      } else if (priceDiff < 0.5) {
        score += 5;
        budgetFit = "moderate";
      } else {
        budgetFit = "high";
      }

      // Stock status based on inventory
      const totalStock = seller.inventory.reduce((sum, i) => sum + i.stock, 0);
      const stockStatus: "in-stock" | "low-stock" | "on-request" =
        totalStock > 10
          ? "in-stock"
          : totalStock > 0
            ? "low-stock"
            : "on-request";

      return {
        sellerId: seller.id,
        matchScore: Math.min(score, 99),
        budgetFit,
        stockStatus,
        reasoning: `Matches ${mission.category} category with ${seller.rating} rating`,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

export async function createMatchesFromAI(
  mission: Mission,
  sellers: Seller[],
  generateId: () => string,
): Promise<Match[]> {
  const aiResults = await generateMatchesWithAI(mission, sellers);

  return aiResults.map((result) => {
    const seller = sellers.find((s) => s.id === result.sellerId)!;
    const distance = calculateDistance(mission.location, seller.location);

    return {
      id: generateId(),
      missionId: mission.id,
      sellerId: seller.id,
      sellerName: seller.name,
      sellerAvatar: seller.avatar,
      matchScore: result.matchScore,
      distance: `${distance}km`,
      budgetFit: result.budgetFit,
      stockStatus: result.stockStatus,
      whyMatch: [result.reasoning],
      status: "pending" as const,
    };
  });
}

function calculateDistance(
  buyerLocation: string,
  sellerLocation: string,
): number {
  // Simple distance estimation based on location strings
  // In production, you'd use a geocoding API
  const sameCity =
    buyerLocation
      .toLowerCase()
      .includes(sellerLocation.split(",")[0].toLowerCase()) ||
    sellerLocation
      .toLowerCase()
      .includes(buyerLocation.split(",")[0].toLowerCase());

  if (sameCity) {
    return Math.floor(Math.random() * 30) + 5;
  }

  // Same country check (Germany example)
  if (
    buyerLocation.toLowerCase().includes("germany") &&
    sellerLocation.toLowerCase().includes("germany")
  ) {
    return Math.floor(Math.random() * 400) + 50;
  }

  return Math.floor(Math.random() * 800) + 200;
}
