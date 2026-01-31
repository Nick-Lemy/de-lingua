"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getMissionById, getMatchesByMission } from "@/lib/storage";
import type { Mission, Match } from "@/lib/storage";

export default function MissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [mission, setMission] = useState<Mission | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = params?.id as string;
    if (!id) return;

    const foundMission = getMissionById(id);
    if (!foundMission) {
      router.push("/missions");
      return;
    }
    setMission(foundMission);

    const foundMatches = getMatchesByMission(id);
    setMatches(foundMatches.sort((a, b) => b.matchScore - a.matchScore));
  }, [params, router]);

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
        return "bg-yellow-100 text-yellow-800";
      case "matched":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBudgetFitColor = (fit: string) => {
    switch (fit) {
      case "good":
        return "text-green-600";
      case "moderate":
        return "text-yellow-600";
      case "high":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-black text-white px-6 lg:px-8 pt-14 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
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
                <span className="text-gray-400 text-sm">
                  • {mission.category}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Details */}
      <div className="px-6 lg:px-8 max-w-4xl mx-auto mt-6">
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
          <h3 className="font-semibold mb-4 text-black">Mission Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Quantity</p>
              <p className="font-semibold text-black">
                {mission.quantity} units
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Budget</p>
              <p className="font-semibold text-black">
                €{mission.budgetMin} - €{mission.budgetMax}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Urgency</p>
              <p className="font-semibold capitalize text-black">
                {mission.urgency}
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Location</p>
              <p className="font-semibold text-black">{mission.location}</p>
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
            {matches.length} {matches.length === 1 ? "Match" : "Matches"} Found
          </h3>
        </div>

        {matches.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-gray-600">Looking for suppliers...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/sellers/${match.sellerId}?mission=${mission.id}`}
                className="block bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-black transition-colors"
              >
                {/* Match Score Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center text-xl font-bold">
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
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-600 mb-1">Budget Fit</p>
                    <p
                      className={`font-semibold text-sm capitalize ${getBudgetFitColor(match.budgetFit)}`}
                    >
                      {match.budgetFit}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-600 mb-1">Availability</p>
                    <p className="font-semibold text-sm capitalize">
                      {match.stockStatus.replace("-", " ")}
                    </p>
                  </div>
                </div>

                {/* Why This Match */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-600 mb-1">Why this match?</p>
                  <p className="text-sm text-black">{match.whyMatch}</p>
                </div>

                {/* View Profile CTA */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    View Full Profile
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
    </div>
  );
}
