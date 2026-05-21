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
  updateMatch as updateMatchLocal,
} from "@/lib/storage";
import {
  getMatchesForSeller as getFirebaseMatchesForSeller,
  getMissionById as getFirebaseMission,
  updateMatch as updateMatchFirebase,
} from "@/lib/db";
import type { UserProfile, Match, Mission } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { IoArrowBack, IoCheckmark, IoClose, IoChatbubble, IoTime } from "react-icons/io5";

interface RequestWithMission extends Match {
  mission?: Mission;
}

export default function RequestsPage() {
  const router = useRouter();
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<RequestWithMission[]>([]);
  const [mounted, setMounted] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const loadData = async () => {
      const isConfigured = isFirebaseConfigured();
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

      let matches: Match[];
      if (isConfigured) {
        matches = await getFirebaseMatchesForSeller(currentUser.id);
      } else {
        matches = getMatchesForSeller(currentUser.id);
      }

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

      requestsWithMissions.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (b.status === "pending" && a.status !== "pending") return 1;
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setRequests(requestsWithMissions);
    };

    loadData();
  }, [mounted, loading, authUser, router]);

  const handleAccept = async (matchId: string) => {
    setUpdatingId(matchId);
    const isConfigured = isFirebaseConfigured();
    if (isConfigured) {
      await updateMatchFirebase(matchId, { status: "connected" });
    } else {
      updateMatchLocal(matchId, { status: "connected" });
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === matchId ? { ...r, status: "connected" } : r)),
    );
    setUpdatingId(null);
  };

  const handleDecline = async (matchId: string) => {
    setUpdatingId(matchId);
    const isConfigured = isFirebaseConfigured();
    if (isConfigured) {
      await updateMatchFirebase(matchId, { status: "declined" });
    } else {
      updateMatchLocal(matchId, { status: "declined" });
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === matchId ? { ...r, status: "declined" } : r)),
    );
    setUpdatingId(null);
  };

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const others = requests.filter((r) => r.status !== "pending");

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-[#EF7C29]/10 text-[#EF7C29]";
      case "connected":
        return "bg-green-100 text-green-700";
      case "declined":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Buyer Requests</h1>
              <p className="text-blue-200 text-sm">
                {pending.length} pending · {requests.length} total
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-4 space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <IoChatbubble className="w-7 h-7 text-[#1152A2]/40" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">No requests yet</p>
            <p className="text-sm text-gray-400">
              Buyers will find you through AI matching
            </p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pending ({pending.length})
                </p>
                <div className="space-y-3">
                  {pending.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      isUpdating={updatingId === req.id}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      getStatusStyle={getStatusStyle}
                    />
                  ))}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-4">
                  Past Requests ({others.length})
                </p>
                <div className="space-y-3">
                  {others.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      isUpdating={updatingId === req.id}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      getStatusStyle={getStatusStyle}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav role="seller" />
    </div>
  );
}

function RequestCard({
  request,
  isUpdating,
  onAccept,
  onDecline,
  getStatusStyle,
}: {
  request: RequestWithMission;
  isUpdating: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  getStatusStyle: (status: string) => string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-bold text-sm text-gray-900 truncate">
            {request.mission?.product || "Buyer Request"}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {[request.mission?.category, request.mission?.location]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize shrink-0 ${getStatusStyle(request.status)}`}
        >
          {request.status}
        </span>
      </div>

      {request.mission?.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
          {request.mission.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
        {request.mission?.quantity && (
          <span className="text-gray-500">
            Qty:{" "}
            <strong className="text-gray-900">{request.mission.quantity}</strong>
          </span>
        )}
        {request.mission?.budgetMin && request.mission?.budgetMax && (
          <span className="text-gray-500">
            Budget:{" "}
            <strong className="text-gray-900">
              {parseInt(request.mission.budgetMin).toLocaleString()}–
              {parseInt(request.mission.budgetMax).toLocaleString()} RWF
            </strong>
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        {request.mission?.urgency && (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize ${
              request.mission.urgency === "urgent"
                ? "bg-red-50 text-red-600"
                : request.mission.urgency === "normal"
                  ? "bg-blue-50 text-[#1152A2]"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {request.mission.urgency}
          </span>
        )}
        {request.createdAt && (
          <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
            <IoTime className="w-3 h-3" />
            {new Date(request.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {request.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => onDecline(request.id)}
            disabled={isUpdating}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <IoClose className="w-4 h-4" />
                Decline
              </>
            )}
          </button>
          <button
            onClick={() => onAccept(request.id)}
            disabled={isUpdating}
            className="flex-1 py-2.5 rounded-xl bg-[#1152A2] text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-[#0d3d7a] disabled:opacity-50 transition-colors"
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <IoCheckmark className="w-4 h-4" />
                Accept
              </>
            )}
          </button>
        </div>
      )}

      {request.status === "connected" && (
        <Link
          href={`/chat/${request.missionId}?seller=${request.sellerId}`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#EF7C29] text-white text-sm font-semibold hover:bg-[#d96a1f] transition-colors"
        >
          <IoChatbubble className="w-4 h-4" />
          Open Chat
        </Link>
      )}
    </div>
  );
}
