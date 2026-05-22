"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getUserProfile, saveUserProfile } from "@/lib/storage";
import { createOrUpdateUser } from "@/lib/db";
import type { UserProfile, SubscriptionTier } from "@/lib/types";
import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICE } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { IoArrowBack, IoCheckmark } from "react-icons/io5";

const TIERS: {
  id: SubscriptionTier;
  label: string;
  badge?: string;
  features: string[];
}[] = [
  {
    id: "lite",
    label: "DeLingua Lite",
    features: [
      `Up to ${SUBSCRIPTION_LIMITS.lite} active product listings`,
      "Standard search visibility",
      "Basic seller profile",
    ],
  },
  {
    id: "plus",
    label: "DeLingua Plus",
    badge: "Popular",
    features: [
      `Up to ${SUBSCRIPTION_LIMITS.plus} active product listings`,
      "Eligible for Fast Reply badge",
      "Monthly customer view insights",
    ],
  },
  {
    id: "pro",
    label: "DeLingua Pro",
    badge: "Premium",
    features: [
      "Unlimited product listings",
      "Always pinned at top of searches",
      "Verified Stock premium badge",
      "Single-tap WhatsApp connection",
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const { user: authUser, isConfigured, loading, refreshUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("lite");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;
    let currentUser: UserProfile | null = null;
    if (isConfigured) {
      if (!authUser) { router.push("/onboarding"); return; }
      currentUser = authUser;
    } else {
      currentUser = getUserProfile();
      if (!currentUser) { router.push("/onboarding"); return; }
    }
    if (currentUser.role !== "seller") { router.push("/"); return; }
    setUser(currentUser);
    setSelectedTier(currentUser.subscriptionTier || "lite");
  }, [mounted, loading, authUser, isConfigured, router]);

  const handleSave = async () => {
    if (!user || selectedTier === (user.subscriptionTier || "lite")) {
      router.back();
      return;
    }
    setSaving(true);
    const updated: UserProfile = { ...user, subscriptionTier: selectedTier };
    try {
      if (isConfigured) {
        await createOrUpdateUser(updated);
        await refreshUser();
      } else {
        saveUserProfile(updated);
        setUser(updated);
      }
      setSaved(true);
      setTimeout(() => router.push("/seller-dashboard"), 1200);
    } catch (err) {
      console.error("Failed to update subscription:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentTier = user.subscriptionTier || "lite";

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Subscription Plan</h1>
              <p className="text-blue-200 text-sm">
                Current plan:{" "}
                <span className="font-semibold text-white capitalize">
                  {currentTier}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-6 space-y-4">
        {TIERS.map((tier) => {
          const price = SUBSCRIPTION_PRICE[tier.id];
          const isCurrent = tier.id === currentTier;
          const isSelected = tier.id === selectedTier;

          return (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                isSelected
                  ? "border-[#EF7C29] bg-orange-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-[#EF7C29]/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "border-[#EF7C29] bg-[#EF7C29]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="font-bold text-gray-900">{tier.label}</span>
                  {tier.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tier.id === "pro"
                          ? "bg-[#EF7C29] text-white"
                          : "bg-[#1152A2]/10 text-[#1152A2]"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                      Current
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm font-bold ${
                    tier.id === "lite" ? "text-green-600" : "text-[#EF7C29]"
                  }`}
                >
                  {price === 0 ? "FREE" : `${price.toLocaleString()} RWF/mo`}
                </span>
              </div>

              <ul className="space-y-1.5 pl-7">
                {tier.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-start gap-1.5">
                    <IoCheckmark className="w-4 h-4 text-[#EF7C29] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}

        <p className="text-xs text-gray-400 text-center px-4">
          Paid plans are billed monthly via MTN MoMo or Airtel Money. You can downgrade at any time.
        </p>
      </div>

      {/* Save button */}
      <div className="fixed bottom-20 left-0 right-0 px-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
              saved
                ? "bg-green-500"
                : saving
                  ? "bg-[#EF7C29]/60"
                  : selectedTier === currentTier
                    ? "bg-gray-300 text-gray-600"
                    : "bg-[#EF7C29] hover:bg-[#d96a1f] shadow-orange-200/60"
            }`}
          >
            {saved
              ? "✓ Plan updated!"
              : saving
                ? "Saving..."
                : selectedTier === currentTier
                  ? "No changes"
                  : selectedTier === "lite"
                    ? "Downgrade to Lite"
                    : `Upgrade to ${TIERS.find((t) => t.id === selectedTier)?.label}`}
          </button>
        </div>
      </div>

      <BottomNav role="seller" />
    </div>
  );
}
