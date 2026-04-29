"use client";

import type { SellerBadge } from "@/lib/types";

const BADGE_CONFIG: Record<SellerBadge, { label: string; color: string }> = {
  "top-seller": { label: "Top Seller", color: "bg-amber-100 text-amber-800 border-amber-200" },
  "good-seller": { label: "Good Seller", color: "bg-green-100 text-green-800 border-green-200" },
  "fast-reply": { label: "Fast Reply", color: "bg-blue-100 text-blue-800 border-blue-200" },
  "verified-supplier": { label: "Verified Supplier", color: "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20" },
  "trusted-partner": { label: "Trusted Partner", color: "bg-purple-100 text-purple-800 border-purple-200" },
};

interface SellerBadgesProps {
  badges: SellerBadge[];
}

export function SellerBadges({ badges }: SellerBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const config = BADGE_CONFIG[badge];
        if (!config) return null;
        return (
          <span
            key={badge}
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.color}`}
          >
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
