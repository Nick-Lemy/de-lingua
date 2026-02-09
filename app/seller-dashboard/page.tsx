"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getSellerById,
  getMatchesForSeller,
  getMissionById,
  createSellerFromUser,
} from "@/lib/storage";
import {
  getSellerById as getFirebaseSeller,
  getMatchesForSeller as getFirebaseMatchesForSeller,
  getMissionById as getFirebaseMission,
} from "@/lib/db";
import type { UserProfile, Seller, Match, Mission } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import {
  IoNotifications,
  IoStorefront,
  IoTrendingUp,
  IoCheckmarkCircle,
  IoChatbubbles,
  IoTime,
  IoAdd,
  IoListOutline,
} from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";

interface RequestWithMission extends Match {
  mission?: Mission;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [requests, setRequests] = useState<RequestWithMission[]>([]);
  const [mounted, setMounted] = useState(false);

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

      // Load seller profile
      let sellerData: Seller | null = null;
      if (isConfigured) {
        sellerData = await getFirebaseSeller(currentUser.id);
      } else {
        sellerData = getSellerById(currentUser.id);
      }

      // If no seller profile exists, create one
      if (!sellerData) {
        sellerData = createSellerFromUser(currentUser);
      }

      setSeller(sellerData);

      // Load incoming requests
      let matches: Match[] = [];
      if (isConfigured) {
        matches = await getFirebaseMatchesForSeller(currentUser.id);
      } else {
        matches = getMatchesForSeller(currentUser.id);
      }

      // Load mission details for pending requests
      const pendingMatches = matches.filter((m) => m.status === "pending");
      const requestsWithMissions: RequestWithMission[] = await Promise.all(
        pendingMatches.slice(0, 3).map(async (match) => {
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
  }, [mounted, loading, authUser, router]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = requests.length;
  const productCount = seller?.inventory?.length || 0;

  const stats = [
    {
      icon: IoChatbubbles,
      label: "Pending Requests",
      value: pendingCount,
      color: "bg-slate-600",
      textColor: "text-slate-600",
    },
    {
      icon: IoStorefront,
      label: "Products Listed",
      value: productCount,
      color: "bg-emerald-600",
      textColor: "text-emerald-600",
    },
    {
      icon: IoCheckmarkCircle,
      label: "Completed Deals",
      value: 0,
      color: "bg-emerald-600",
      textColor: "text-emerald-600",
    },
    {
      icon: IoTrendingUp,
      label: "This Month",
      value: "0 RWF",
      color: "bg-slate-800",
      textColor: "text-slate-800",
    },
  ];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "normal":
        return "bg-slate-50 text-slate-600 border-slate-200";
      case "flexible":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-5 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-300 text-xs font-medium mb-1">
                Welcome back
              </p>
              <h1 className="text-xl font-bold">{user.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center relative">
                <IoNotifications className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <Link
                href="/account"
                className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-lg font-bold"
              >
                {user.avatar}
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            {stats.slice(0, 2).map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}
                  >
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-slate-300 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 max-w-lg mx-auto mt-6 space-y-6">
        {/* More Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.slice(2).map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className={`text-xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">New Match Requests</h2>
            <Link
              href="/requests"
              className="text-sm text-slate-600 font-medium"
            >
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
                <IoListOutline className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pending requests yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Buyers will find you through our AI matching
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        {request.mission?.product || "Buyer Request"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {request.mission?.description?.slice(0, 50) ||
                          request.mission?.quantity ||
                          "Product inquiry"}
                        ...
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${getUrgencyColor(request.mission?.urgency || "normal")}`}
                    >
                      {request.mission?.urgency || "normal"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {request.mission?.budgetMin && request.mission?.budgetMax
                        ? `${parseInt(request.mission.budgetMin).toLocaleString()} - ${parseInt(request.mission.budgetMax).toLocaleString()} RWF`
                        : "Budget TBD"}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <IoTime className="w-3 h-3" />
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/inventory"
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <IoAdd className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Add Product</p>
                <p className="text-xs text-gray-500">Update inventory</p>
              </div>
            </Link>
            <Link
              href="/requests"
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <IoChatbubbles className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">
                  View Requests
                </p>
                <p className="text-xs text-gray-500">Buyer inquiries</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <BottomNav role="seller" />
    </div>
  );
}
