"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getMatches,
  getMissionById,
  getSellerById,
} from "@/lib/storage";
import { getAllMatchesForBuyer, getMissionsByBuyer } from "@/lib/db";
import type { UserProfile, Match } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";

export default function MatchesPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    const loadData = async () => {
      const isConfigured = isFirebaseConfigured();

      if (isConfigured) {
        if (!authUser) {
          router.push("/onboarding");
          return;
        }
        setUser(authUser);

        const allMatches = await getAllMatchesForBuyer(authUser.id);
        setMatches(allMatches.sort((a, b) => b.matchScore - a.matchScore));
      } else {
        const profile = getUserProfile();
        if (!profile) {
          router.push("/onboarding");
          return;
        }
        setUser(profile);

        const allMatches = getMatches().filter((match) => {
          const mission = getMissionById(match.missionId);
          return mission && mission.buyerId === profile.id;
        });
        setMatches(allMatches.sort((a, b) => b.matchScore - a.matchScore));
      }
    };

    loadData();
  }, [mounted, authLoading, authUser, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getBudgetFitColor = (fit: string) => {
    switch (fit) {
      case "good":
        return "text-[#1152A2]";
      case "moderate":
        return "text-[#EF7C29]";
      case "high":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-6 lg:px-8 pt-14 pb-8">
        <div className="max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">All Matches</h1>
            <p className="text-slate-300 text-sm">
              {matches.length} potential suppliers
            </p>
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="px-6 lg:px-8 max-w-4xl mx-auto mt-6">
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6M17 11h6" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2 text-black">
              No matches yet
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Create a mission to find suppliers
            </p>
            <Link
              href="/missions/create"
              className="inline-block px-6 py-3 bg-[#EF7C29] text-white rounded-2xl font-semibold hover:bg-[#d96a1f]"
            >
              Create Mission
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const mission = getMissionById(match.missionId);
              const seller = getSellerById(match.sellerId);
              if (!mission || !seller) return null;

              return (
                <Link
                  key={match.id}
                  href={`/sellers/${match.sellerId}?mission=${match.missionId}`}
                  className="block bg-white border border-gray-200 rounded-2xl p-5"
                >
                  {/* Match Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#1152A2] text-white flex items-center justify-center text-xl font-bold">
                        {match.sellerAvatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-black">
                          {match.sellerName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {seller.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#1152A2]">
                        {match.matchScore}%
                      </div>
                      <p className="text-xs text-gray-600">Match</p>
                    </div>
                  </div>

                  {/* Mission Context */}
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-gray-600 mb-1">For mission</p>
                    <p className="font-medium text-sm text-black">
                      {mission.product}
                    </p>
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                      <p className="text-xs text-slate-600 mb-1 font-medium">
                        Distance
                      </p>
                      <p className="font-semibold text-sm text-slate-800">
                        {match.distance}
                      </p>
                    </div>
                    <div className="bg-[#1152A2]/10 border border-[#1152A2]/20 rounded-xl p-2">
                      <p className="text-xs text-[#1152A2] mb-1 font-medium">
                        Budget
                      </p>
                      <p
                        className={`font-semibold text-sm capitalize ${getBudgetFitColor(match.budgetFit)}`}
                      >
                        {match.budgetFit}
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                      <p className="text-xs text-slate-600 mb-1 font-medium">
                        Stock
                      </p>
                      <p className="font-semibold text-sm capitalize text-slate-800">
                        {match.stockStatus.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
