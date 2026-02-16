"use server";

import type { Seller, FeedAISuggestion } from "@/lib/types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface FeedPostRequest {
  title: string;
  description: string;
  category: string;
  budget?: string;
  location: string;
}

export async function generateFeedAISuggestions(
  post: FeedPostRequest,
  sellers: Seller[],
): Promise<FeedAISuggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || sellers.length === 0) {
    console.warn(
      "GEMINI_API_KEY not set or no sellers available, falling back to basic matching",
    );
    return fallbackMatching(post, sellers);
  }

  const prompt = buildMatchingPrompt(post, sellers);

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
      return fallbackMatching(post, sellers);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return fallbackMatching(post, sellers);
    }

    // Parse the JSON response from Gemini
    const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return fallbackMatching(post, sellers);
    }

    const suggestions: FeedAISuggestion[] = JSON.parse(jsonMatch[0]);
    return suggestions.filter((s) =>
      sellers.some((sel) => sel.id === s.sellerId),
    );
  } catch (error) {
    console.error("AI matching error:", error);
    return fallbackMatching(post, sellers);
  }
}

function buildMatchingPrompt(post: FeedPostRequest, sellers: Seller[]): string {
  const sellersInfo = sellers.map((s) => ({
    id: s.id,
    name: s.name,
    avatar: s.avatar,
    category: s.category,
    location: s.location,
    rating: s.rating,
    description: s.description,
    inventory: s.inventory.map((i) => ({
      name: i.name,
      price: i.price,
      stock: i.stock,
    })),
  }));

  return `You are a supplier matching expert for the Rwandan marketplace DeLingua. Analyze the user's feed post and find the best matching suppliers.

FEED POST:
- Title: ${post.title}
- Description: ${post.description}
- Category: ${post.category}
- Budget: ${post.budget || "Not specified"}
- Location: ${post.location}

AVAILABLE SELLERS:
${JSON.stringify(sellersInfo, null, 2)}

INSTRUCTIONS:
1. Match sellers based on: category relevance, product availability, location proximity within Rwanda, and reliability (rating)
2. Calculate a matchScore (0-100) based on how well each seller can fulfill the request
3. Provide a brief, friendly reason explaining why each seller is a good match
4. Only include sellers with matchScore >= 60
5. Prioritize local Rwandan suppliers

Return ONLY a JSON array with this exact format, no extra text:
[
  {
    "sellerId": "seller_id_here",
    "sellerName": "Seller Name",
    "sellerAvatar": "S",
    "matchScore": 87,
    "reason": "Brief explanation of why this is a good match"
  }
]

Sort by matchScore descending. Maximum 5 suggestions.`;
}

function fallbackMatching(
  post: FeedPostRequest,
  sellers: Seller[],
): FeedAISuggestion[] {
  return sellers
    .filter((seller) => {
      // Basic category matching
      const categoryMatch =
        seller.category.toLowerCase().includes(post.category.toLowerCase()) ||
        post.category.toLowerCase().includes(seller.category.toLowerCase());
      return categoryMatch;
    })
    .map((seller) => {
      let score = 70;

      // Category match bonus
      if (seller.category.toLowerCase() === post.category.toLowerCase()) {
        score += 10;
      }

      // Rating bonus
      score += Math.floor(seller.rating * 2);

      // Location proximity (simple check)
      if (
        seller.location.toLowerCase().includes(post.location.toLowerCase()) ||
        post.location.toLowerCase().includes(seller.location.toLowerCase())
      ) {
        score += 5;
      }

      return {
        sellerId: seller.id,
        sellerName: seller.name,
        sellerAvatar: seller.avatar,
        matchScore: Math.min(score, 99),
        reason: `Offers ${seller.category} products with ${seller.rating} rating`,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}
