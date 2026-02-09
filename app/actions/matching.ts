"use server";

import { createMatchesFromAI } from "@/lib/ai-matching";
import type { Mission, Match, Seller } from "@/lib/types";

export async function generateAIMatches(
  mission: Mission,
  sellers: Seller[],
  idPrefix: string,
): Promise<Match[]> {
  let counter = 0;
  const generateId = () => `${idPrefix}_${Date.now()}_${counter++}`;

  const matches = await createMatchesFromAI(mission, sellers, generateId);
  return matches;
}
