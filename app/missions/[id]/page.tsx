"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getMissionById,
  getMatchesByMission,
  getSellers,
  getFeedPosts,
  saveMatch as saveLocalMatch,
  saveMission as saveLocalMission,
  deleteMatchesByMission as deleteMatchesByMissionLocal,
  generateId as generateLocalId,
} from "@/lib/storage";
import {
  getMissionById as getFirebaseMission,
  getMatchesByMission as getFirebaseMatches,
  getAllSellers,
  getAllFeedPosts,
  createMatch as createFirebaseMatch,
  updateMission as updateFirebaseMission,
  deleteMatchesByMission,
  generateId as generateFirebaseId,
} from "@/lib/db";
import { generateAIMatches } from "@/app/actions/matching";
import type { Mission, Match } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { IoRefresh, IoStorefront, IoSparkles } from "react-icons/io5";

export default function MissionDetailPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useParams();
  const [mission, setMission] = useState<Mission | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadData = async () => {
      const id = params?.id as string;
      if (!id) return;

      const isConfigured = isFirebaseConfigured();
      let foundMission: Mission | null = null;
      let foundMatches: Match[] = [];

      if (isConfigured) {
        const [m, matches] = await Promise.all([
          getFirebaseMission(id),
          getFirebaseMatches(id),
        ]);
        foundMission = m;
        foundMatches = matches;
      } else {
        foundMission = getMissionById(id);
        if (foundMission) {
          foundMatches = getMatchesByMission(id);
        }
      }

      if (!foundMission) {
        router.push("/missions");
        return;
      }

      // Auto-scan once on load if there are currently 0 matches
      if (foundMatches.length === 0) {
        try {
          const [sellers, feedPosts] = isConfigured
            ? await Promise.all([getAllSellers(), getAllFeedPosts()])
            : [getSellers(), getFeedPosts()];
          const newMatches = await generateAIMatches(
            foundMission,
            sellers,
            "match",
            feedPosts,
          );
          if (newMatches.length > 0) {
            if (isConfigured) {
              for (const m of newMatches) {
                await createFirebaseMatch({
                  ...m,
                  id: generateFirebaseId("match"),
                });
              }
              await updateFirebaseMission(foundMission.id, {
                status: "matched",
              });
            } else {
              for (const m of newMatches) {
                saveLocalMatch({ ...m, id: generateLocalId("match") });
              }
              saveLocalMission({ ...foundMission, status: "matched" });
            }
            foundMatches = newMatches;
            foundMission = { ...foundMission, status: "matched" };
          }
        } catch (e) {
          console.error("Auto match scan error:", e);
        }
      }

      setMission(foundMission);
      setMatches(foundMatches.sort((a, b) => b.matchScore - a.matchScore));
    };

    loadData();
  }, [params, router]);

  const handleRefreshMatches = async () => {
    if (!mission || refreshing) return;
    setRefreshing(true);

    try {
      const isConfigured = isFirebaseConfigured();
      const [sellers, feedPosts] = isConfigured
        ? await Promise.all([getAllSellers(), getAllFeedPosts()])
        : [getSellers(), getFeedPosts()];

      const idPrefix = isConfigured ? "match" : "match";
      const newMatches = await generateAIMatches(
        mission,
        sellers,
        idPrefix,
        feedPosts,
      );

      if (isConfigured) {
        await deleteMatchesByMission(mission.id);
        for (const m of newMatches) {
          const matchWithId = {
            ...m,
            id: generateFirebaseId("match"),
          };
          await createFirebaseMatch(matchWithId);
        }
        if (newMatches.length > 0) {
          await updateFirebaseMission(mission.id, { status: "matched" });
        }
      } else {
        deleteMatchesByMissionLocal(mission.id);
        for (const m of newMatches) {
          const matchWithId = {
            ...m,
            id: generateLocalId("match"),
          };
          saveLocalMatch(matchWithId);
        }
        if (newMatches.length > 0) {
          saveLocalMission({ ...mission, status: "matched" });
        }
      }

      setMatches(newMatches.sort((a, b) => b.matchScore - a.matchScore));
      if (newMatches.length > 0) {
        setMission((prev) => (prev ? { ...prev, status: "matched" } : null));
      }
    } catch (err) {
      console.error("Manual refresh matches failed:", err);
    } finally {
      setRefreshing(false);
    }
  };

  if (!mounted || !mission) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finding":
        return "bg-[#EF7C29]/10 text-[#EF7C29]";
      case "matched":
        return "bg-[#1152A2]/10 text-[#1152A2]";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{mission.product}</h1>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}
                >
                  {mission.status}
                </span>
                <span className="text-slate-300 text-sm">
                  • {mission.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Details */}
      <div className="px-6 lg:px-8 max-w-4xl mx-auto mt-6">
        <div className="bg-gray-50 rounded-md p-5 border border-gray-200">
          <h3 className="font-semibold mb-4 text-black">{t("missionDetails.title")}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-slate-600 text-xs mb-1 font-medium">
                {t("missionDetails.quantity")}
              </p>
              <p className="font-semibold text-slate-800">
                {mission.quantity} units
              </p>
            </div>
            <div className="bg-[#EF7C29]/10 border border-[#EF7C29]/20 rounded-md p-3">
              <p className="text-[#EF7C29] text-xs mb-1 font-medium">{t("missionDetails.budget")}</p>
              <p className="font-semibold text-[#EF7C29]">
                {mission.budgetMin} RWF - {mission.budgetMax} RWF
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-slate-600 text-xs mb-1 font-medium">{t("missionDetails.urgency")}</p>
              <p className="font-semibold capitalize text-slate-800">
                {mission.urgency}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
              <p className="text-slate-600 text-xs mb-1 font-medium">
                {t("missionDetails.location")}
              </p>
              <p className="font-semibold text-slate-800">{mission.location}</p>
            </div>
          </div>
          {mission.description && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600 text-sm mb-1">Additional Details</p>
              <p className="text-sm text-black">{mission.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Matches */}
      <div className="px-6 lg:px-8 max-w-4xl mx-auto mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {t("missionDetails.matchesFound", { count: matches.length })}
          </h3>
          <button
            onClick={handleRefreshMatches}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1152A2]/10 hover:bg-[#1152A2]/20 text-[#1152A2] rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
          >
            <IoRefresh
              className={`w-4 h-4 ${refreshing ? "animate-spin text-[#1152A2]" : ""}`}
            />
            <span>{refreshing ? "Scanning..." : "Re-scan Suppliers"}</span>
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <IoStorefront className="w-7 h-7 text-[#1152A2]" />
            </div>
            <h4 className="font-bold text-gray-800 text-sm mb-1">
              No matches found yet
            </h4>
            <p className="text-gray-500 text-xs mb-4 max-w-sm mx-auto">
              We checked suppliers and community feed posts. When suppliers update stock or post offers, re-scan to get matches!
            </p>
            <button
              onClick={handleRefreshMatches}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1152A2] hover:bg-[#0d3d7a] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <IoRefresh
                className={`w-4 h-4 ${refreshing ? "animate-spin text-white" : ""}`}
              />
              <span>
                {refreshing
                  ? "Scanning suppliers & feed..."
                  : "Scan for Matches Now"}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/sellers/${match.sellerId}?mission=${mission.id}`}
                className="block bg-white border border-gray-200 rounded-md p-5"
              >
                {/* Match Score Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-[#1152A2] text-white flex items-center justify-center text-xl font-bold">
                      {match.sellerAvatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-black">
                        {match.sellerName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {match.distance} away
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {match.matchScore}%
                    </div>
                    <p className="text-xs text-gray-600">Match</p>
                  </div>
                </div>

                {/* Match Attributes */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs text-gray-600 mb-1">{t("missionDetails.budgetFit")}</p>
                    <p
                      className={`font-semibold text-sm capitalize ${getBudgetFitColor(match.budgetFit)}`}
                    >
                      {match.budgetFit}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs text-gray-600 mb-1">{t("missionDetails.availability")}</p>
                    <p className="font-semibold text-sm capitalize">
                      {match.stockStatus.replace("-", " ")}
                    </p>
                  </div>
                </div>

                {/* Why This Match */}
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs text-gray-600 mb-1">{t("missionDetails.why")}</p>
                  <p className="text-sm text-black">
                    {Array.isArray(match.whyMatch) ? match.whyMatch.join(", ") : match.whyMatch}
                  </p>
                </div>

                {/* View Profile CTA */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {t("missionDetails.viewProfile")}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
