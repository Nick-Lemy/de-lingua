"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getMatchesForSeller,
  getMissionById,
  updateMatch as updateLocalMatch,
} from "@/lib/storage";
import {
  getMatchesForSeller as getFirebaseMatchesForSeller,
  getMissionById as getFirebaseMission,
  updateMatch,
} from "@/lib/db";
import type { UserProfile, Match, Mission } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import {
  IoArrowBack,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoChatbubbles,
} from "react-icons/io5";

interface RequestWithMission extends Match {
  mission?: Mission;
}

export default function RequestsPage() {
  const router = useRouter();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<RequestWithMission[]>([]);
  const [activeTab, setActiveTab] = useState<
    "pending" | "connected" | "declined"
  >("pending");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const loadData = async () => {
      let currentUser: UserProfile | null = null;

      if (isConfigured) {
        if (!authUser) {
          router.push("/onboarding");
          return;
        }
        currentUser = authUser;
      } else {
        currentUser = getUserProfile();
        if (!currentUser) {
          router.push("/onboarding");
          return;
        }
      }

      if (currentUser.role !== "seller") {
        router.push("/");
        return;
      }

      setUser(currentUser);

      // Load matches for this seller
      let matches: Match[] = [];
      if (isConfigured) {
        matches = await getFirebaseMatchesForSeller(currentUser.id);
      } else {
        matches = getMatchesForSeller(currentUser.id);
      }

      // Load mission details for each match
      const requestsWithMissions: RequestWithMission[] = await Promise.all(
        matches.map(async (match) => {
          let mission: Mission | null = null;
          if (isConfigured) {
            mission = await getFirebaseMission(match.missionId);
          } else {
            mission = getMissionById(match.missionId);
          }
          return { ...match, mission: mission || undefined };
        }),
      );

      setRequests(requestsWithMissions);
    };

    loadData();
  }, [mounted, loading, authUser, isConfigured, router]);

  const handleAccept = async (matchId: string) => {
    if (isConfigured) {
      await updateMatch(matchId, { status: "connected" });
    } else {
      updateLocalMatch(matchId, { status: "connected" });
    }
    setRequests(
      requests.map((r) =>
        r.id === matchId ? { ...r, status: "connected" } : r,
      ),
    );
  };

  const handleDecline = async (matchId: string) => {
    if (isConfigured) {
      await updateMatch(matchId, { status: "declined" });
    } else {
      updateLocalMatch(matchId, { status: "declined" });
    }
    setRequests(
      requests.map((r) =>
        r.id === matchId ? { ...r, status: "declined" } : r,
      ),
    );
  };

  const filteredRequests = requests.filter((r) => r.status === activeTab);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "normal":
        return "bg-[#1152A2]/10 text-[#1152A2]";
      case "flexible":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Buyer Requests</h1>
              <p className="text-slate-300 text-sm">
                {requests.filter((r) => r.status === "pending").length} pending
                requests
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-4">
        {/* Tabs */}
        <div className="flex bg-gray-200 rounded-xl p-1 mb-5">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === "pending"
                ? "bg-white text-[#1152A2] shadow-sm"
                : "text-gray-600"
            }`}
          >
            Pending ({requests.filter((r) => r.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveTab("connected")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === "connected"
                ? "bg-white text-[#1152A2] shadow-sm"
                : "text-gray-600"
            }`}
          >
            Connected ({requests.filter((r) => r.status === "connected").length}
            )
          </button>
          <button
            onClick={() => setActiveTab("declined")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              activeTab === "declined"
                ? "bg-white text-[#1152A2] shadow-sm"
                : "text-gray-600"
            }`}
          >
            Declined
          </button>
        </div>

        {/* Requests List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">No {activeTab} requests</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === "pending"
                  ? "New buyer requests will appear here"
                  : `Your ${activeTab} requests will appear here`}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-xl p-4 border border-gray-200"
              >
                {/* Match Score */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#1152A2] bg-[#1152A2]/10 px-2 py-1 rounded-full">
                    {request.matchScore}% match
                  </span>
                  {request.mission?.urgency && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${getUrgencyBadge(
                        request.mission.urgency,
                      )}`}
                    >
                      {request.mission.urgency}
                    </span>
                  )}
                </div>

                {/* Request Details */}
                {request.mission && (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {request.mission.product}
                    </h4>
                    <div className="text-sm text-gray-500 space-y-1 mb-3">
                      <p>Qty: {request.mission.quantity}</p>
                      <p>
                        Budget: {request.mission.budgetMin} -{" "}
                        {request.mission.budgetMax} RWF
                      </p>
                      <p>Location: {request.mission.location}</p>
                    </div>
                    {request.mission.description && (
                      <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                        {request.mission.description}
                      </p>
                    )}
                  </>
                )}

                {/* Why Match */}
                {request.whyMatch && request.whyMatch.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {request.whyMatch.slice(0, 3).map((reason, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {activeTab === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleDecline(request.id)}
                      className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 font-medium flex items-center justify-center gap-2"
                    >
                      <IoCloseCircle className="w-4 h-4" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="flex-1 py-2 bg-[#EF7C29] text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#d96a1f]"
                    >
                      <IoCheckmarkCircle className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                )}

                {activeTab === "connected" && (
                  <Link
                    href={`/chat/${request.missionId}?seller=${request.sellerId}`}
                    className="w-full py-2 bg-[#1152A2] text-white rounded-xl font-medium flex items-center justify-center gap-2 mt-4 hover:bg-[#0d3f7a]"
                  >
                    <IoChatbubbles className="w-4 h-4" />
                    Open Chat
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav role="seller" />
    </div>
  );
}
