import type { Mission, Seller, Match, FeedPost } from "./types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface MatchResult {
  sellerId: string;
  matchScore: number;
  budgetFit: "good" | "moderate" | "high";
  stockStatus: "in-stock" | "low-stock" | "on-request";
  reasoning: string;
}

// ==================== BILINGUAL RWANDAN COMMODITY SYNONYMS ====================
// Maps English, French, and Kinyarwanda trade commodities so queries across languages match seamlessly
export const COMMODITY_SYNONYMS: string[][] = [
  // Produce & Fruits
  ["tree tomato", "tree tomatoes", "ibinyomoro", "ikinyomoro", "tamarillo", "tamarillos"],
  ["tomato", "tomatoes", "inyanya", "urunyanya", "tomate", "tomates"],
  ["potato", "potatoes", "irish potato", "irish potatoes", "ibirayi", "ikirayi", "pomme de terre"],
  ["sweet potato", "sweet potatoes", "ibijumba", "ikijumba", "patate douce"],
  ["bean", "beans", "ibishyimbo", "igishyimbo", "haricot", "haricots"],
  ["rice", "umuceri", "umucheri", "riz"],
  ["maize flour", "corn flour", "kawunga", "ufu", "ifu y'ibigori", "farine de maïs"],
  ["maize", "corn", "ibigori", "ikigori", "maïs"],
  ["avocado", "avocados", "avoka", "avocat", "avocats"],
  ["pineapple", "pineapples", "inanasi", "ananas"],
  ["banana", "bananas", "igitoki", "ibitoki", "imizuzu", "imineke", "banane", "bananes", "matoke"],
  ["mango", "mangoes", "imyembe", "umwembe", "mangue", "mangues"],
  ["orange", "oranges", "amacunga", "icunga", "orange", "agrumes"],
  ["passion fruit", "maracuja", "marakuja", "itunda", "amatunda"],
  ["watermelon", "pastèque", "ibivoka", "pasteque"],
  ["cabbage", "cabbages", "amashu", "ishu", "chou", "choux"],
  ["carrot", "carrots", "karoti", "carotte", "carottes"],
  ["onion", "onions", "ibitunguru", "igitunguru", "oignon", "oignons"],
  ["garlic", "tungurusumu", "ail"],
  ["ginger", "tangawizi", "gingembre"],
  ["eggplant", "intoryi", "aubergine"],
  ["chili", "pepper", "urusenda", "pili pili", "pilipili", "poivre", "poivron"],
  ["spinach", "amaranth", "dodo", "inyabutongo", "imbwija", "épinards", "epinards"],
  ["mushroom", "mushrooms", "ibihumyo", "champignon", "champignons"],
  ["cassava", "imyumbati", "manioc"],
  ["cassava flour", "ubugari", "ifu y'imyumbati"],
  ["cooking oil", "vegetable oil", "oil", "amavuta yo guteka", "amavuta", "huile"],
  ["sugar", "isukari", "sucre"],
  ["salt", "umunyu", "sel"],
  ["milk", "amata", "inshushyu", "ikivuguto", "lait"],
  ["egg", "eggs", "amagi", "igi", "oeuf", "oeufs"],
  ["meat", "beef", "inyama", "viande", "boeuf"],
  ["chicken", "inkoko", "poulet"],
  ["fish", "amafi", "ifi", "isambaza", "sambaza", "tilapia", "poisson"],
  ["coffee", "ikawa", "café", "cafe"],
  ["tea", "icyayi", "thé", "the"],

  // Construction & Hardware
  ["cement", "sima", "ciment"],
  ["sand", "umusenyi", "sable"],
  ["gravel", "stone", "stones", "amabuye", "ibuye", "pierre", "pierres", "gravier"],
  ["iron sheets", "roofing sheets", "amabati", "ibati", "iriba", "tôle", "tôles", "tole"],
  ["rebar", "steel bars", "iron bars", "fer à béton", "ibyuma", "imikwege", "fer"],
  ["brick", "bricks", "amatafari", "itafari", "brique", "briques"],
  ["timber", "wood", "planks", "imbaho", "urubaho", "ibiti", "bois", "planches"],
  ["paint", "amabara", "rangi", "irangi", "peinture"],
  ["pipes", "plumbing", "imiyoboro", "tuyau", "tuyaux"],
  ["tiles", "amategura", "itegura", "carreaux", "carrelage"],

  // Textiles & Fashion
  ["clothes", "clothing", "imyenda", "umwenda", "vêtements", "vetements", "habits"],
  ["kitenge", "african print", "fabric", "igitenge", "ibitenge", "tissu"],
  ["shoes", "footwear", "inkweto", "urukweto", "chaussures", "souliers"],
  ["shirts", "amashati", "ishati", "chemises", "chemise"],
  ["pants", "trousers", "amapantalo", "ipantalo", "pantalons"],

  // Electronics & Solar
  ["phone", "phones", "smartphone", "telefoni", "terefoni", "téléphone", "telephone"],
  ["laptop", "computer", "mudasobwa", "ordinateur"],
  ["tv", "television", "televiziyo", "écran", "ecran"],
  ["solar", "solar panel", "solar panels", "imirasire", "amabati y'imirasire", "panneau solaire"],
  ["battery", "batteries", "batiri", "batterie"],
];

// Calculate Levenshtein string similarity (0.0 to 1.0)
export function stringSimilarity(s1: string, s2: string): number {
  const str1 = (s1 || "").toLowerCase().trim();
  const str2 = (s2 || "").toLowerCase().trim();
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  if (str1.includes(str2) || str2.includes(str1)) {
    return Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
  }

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[] = Array(len1 + 1).fill(0);
  for (let i = 0; i <= len1; i++) matrix[i] = i;

  for (let j = 1; j <= len2; j++) {
    let prev = matrix[0];
    matrix[0] = j;
    for (let i = 1; i <= len1; i++) {
      const temp = matrix[i];
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i] = prev;
      } else {
        matrix[i] = Math.min(prev + 1, matrix[i] + 1, matrix[i - 1] + 1);
      }
      prev = temp;
    }
  }

  const distance = matrix[len1];
  const maxLen = Math.max(len1, len2);
  return 1.0 - distance / maxLen;
}

// Expands a query product name with its multilingual synonyms
export function expandProductKeywords(query: string): string[] {
  const clean = (query || "").toLowerCase().trim();
  const tokens = clean
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const synonyms = new Set<string>([clean, ...tokens]);

  for (const synset of COMMODITY_SYNONYMS) {
    const matchesSynset = synset.some((term) => {
      const t = term.toLowerCase();
      if (clean === t || clean.includes(t) || t.includes(clean)) return true;
      return tokens.some((tok) => tok === t || stringSimilarity(tok, t) >= 0.85);
    });

    if (matchesSynset) {
      synset.forEach((term) => synonyms.add(term.toLowerCase()));
    }
  }

  return Array.from(synonyms);
}

// Check if any target text fuzzy-matches the search keywords with typo tolerance
export function fuzzyMatchKeywords(
  targetText: string,
  searchTerms: string[],
): { matched: boolean; similarity: number; matchedTerm?: string } {
  const targetClean = (targetText || "").toLowerCase().trim();
  if (!targetClean) return { matched: false, similarity: 0 };

  const targetTokens = targetClean
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let bestScore = 0;
  let bestTerm: string | undefined;

  for (const term of searchTerms) {
    const t = term.toLowerCase().trim();
    if (t.length <= 2) continue;

    // Direct substring match
    if (targetClean.includes(t)) {
      return { matched: true, similarity: 1.0, matchedTerm: term };
    }

    // Check each target token for typos
    for (const token of targetTokens) {
      const sim = stringSimilarity(token, t);
      if (sim > bestScore) {
        bestScore = sim;
        bestTerm = term;
      }
      if (bestScore >= 0.82) {
        return { matched: true, similarity: bestScore, matchedTerm: bestTerm };
      }
    }
  }

  return { matched: bestScore >= 0.80, similarity: bestScore, matchedTerm: bestTerm };
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
              "You are a supplier matching expert for the Rwandan market. Analyze the buyer's mission and available sellers (including catalog inventory, active community feed offers, and Kinyarwanda/English commodity synonyms) to find the best matches. Return ONLY a JSON array as described in the instructions.",
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
  const expandedSynonyms = expandProductKeywords(mission.product);

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
- Multilingual trade synonyms (EN / FR / RW): [${expandedSynonyms.slice(0, 10).join(", ")}]
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
3. Consider Kinyarwanda, English, and French synonyms (e.g. "ibinyomoro" = "tree tomatoes", "sima" = "cement", "inyanya" = "tomatoes").
4. Be typo-tolerant (e.g. "tomatos" matches "tomatoes").
5. Match sellers based on: product availability (in inventory or feed offers), price fit, location proximity within Rwanda, reliability (rating), and details in the buyer's description.
6. Calculate a matchScore (0-100) based on how well each seller fits the buyer's needs.
7. Determine budgetFit: "good" if within budget, "moderate" if slightly above, "high" if significantly above.
8. Determine stockStatus based on their inventory or feed offer ("in-stock" if offered or in inventory, "low-stock", or "on-request").
9. Only include sellers with matchScore >= 60.
10. Prioritize local Rwandan suppliers and those who can deliver to the buyer's location.

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

  // Expand mission product with synonyms across EN, FR, and Kinyarwanda
  const expandedSearchTerms = expandProductKeywords(mission.product);

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
    let postMatchTerm: string | undefined;

    for (const post of sellerPosts) {
      const postText = `${post.title} ${post.description} ${post.category}`.toLowerCase();
      const match = fuzzyMatchKeywords(postText, expandedSearchTerms);
      if (match.matched) {
        matchingPost = post;
        postMatchTerm = match.matchedTerm;
        break;
      }
    }

    if (matchingPost) {
      score += 65;
      stockStatus = "in-stock";
      const termNote = postMatchTerm && postMatchTerm !== mission.product.toLowerCase()
        ? ` (matches ${postMatchTerm})`
        : "";
      matchedReason = `${seller.name} is offering "${matchingPost.title}" on the Community Feed${termNote}`;
    }

    // 2. Check seller catalog inventory
    let matchingItem: (typeof seller.inventory)[0] | null = null;
    let itemMatchTerm: string | undefined;

    for (const item of seller.inventory) {
      const match = fuzzyMatchKeywords(item.name, expandedSearchTerms);
      if (match.matched) {
        matchingItem = item;
        itemMatchTerm = match.matchedTerm;
        break;
      }
    }

    if (matchingItem) {
      score += 60;
      if (!matchedReason) {
        const termNote = itemMatchTerm && itemMatchTerm !== mission.product.toLowerCase()
          ? ` (matches ${itemMatchTerm})`
          : "";
        matchedReason = `${seller.name} carries "${matchingItem.name}" in their product catalog${termNote}`;
      }
      if (matchingItem.stock > 0) {
        stockStatus = "in-stock";
      } else {
        stockStatus = "low-stock";
      }
    }

    // 3. Check seller store name and description
    const storeText = `${seller.name} ${seller.description}`.toLowerCase();
    const storeMatch = fuzzyMatchKeywords(storeText, expandedSearchTerms);
    if (storeMatch.matched) {
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


