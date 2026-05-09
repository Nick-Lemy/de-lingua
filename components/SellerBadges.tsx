"use client";

import type { SellerBadge } from "@/lib/types";

const BADGE_CONFIG: Record<SellerBadge, { label: string; color: string; icon: string }> = {
  "top-seller": { label: "Top Seller", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "🏆" },
  "good-seller": { label: "Good Seller", color: "bg-green-50 text-green-700 border-green-200", icon: "✓" },
  "fast-reply": { label: "Fast Reply", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "⚡" },
  "verified-supplier": { label: "Verified", color: "bg-[#1152A2]/8 text-[#1152A2] border-[#1152A2]/20", icon: "✓" },
  "trusted-partner": { label: "Trusted Partner", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "🤝" },
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
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.color}`}
          >
            <span className="text-[10px]">{config.icon}</span>
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
