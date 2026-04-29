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
  getChatsForSeller,
  getReviewsBySeller,
  getSellerAnalytics,
} from "@/lib/storage";
import {
  getSellerById as getFirebaseSeller,
  getMatchesForSeller as getFirebaseMatchesForSeller,
  getMissionById as getFirebaseMission,
  getChatsForSeller as getFirebaseChats,
  getReviewsBySeller as getFirebaseReviews,
  getSellerAnalytics as getFirebaseAnalytics,
} from "@/lib/db";
import type {
  UserProfile,
  Seller,
  Match,
  Mission,
  Review,
  SellerAnalytics,
} from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { StarRating } from "@/components/StarRating";
import {
  IoNotifications,
  IoStorefront,
  IoCheckmarkCircle,
  IoChatbubbles,
  IoTime,
  IoAdd,
  IoListOutline,
  IoEye,
  IoTrendingUp,
} from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";

interface RequestWithMission extends Match {
  mission?: Mission;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [requests, setRequests] = useState<RequestWithMission[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
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

      if (!sellerData) {
        sellerData = createSellerFromUser(currentUser);
      }

      setSeller(sellerData);

      // Load all data in parallel
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const [matches, chats, reviewsData, analyticsData] = await Promise.all([
        isConfigured
          ? getFirebaseMatchesForSeller(currentUser.id)
          : Promise.resolve(getMatchesForSeller(currentUser.id)),
        isConfigured
          ? getFirebaseChats(currentUser.id)
          : Promise.resolve(getChatsForSeller(currentUser.id)),
        isConfigured
          ? getFirebaseReviews(currentUser.id)
          : Promise.resolve(getReviewsBySeller(currentUser.id)),
        isConfigured
          ? getFirebaseAnalytics(currentUser.id)
          : Promise.resolve(getSellerAnalytics(currentUser.id)),
      ]);

      setReviews(reviewsData);
      setAnalytics(analyticsData);

      // Count new messages in last 7 days from buyers
      const recent = chats.filter(
        (m) => m.sender === "buyer" && new Date(m.time).getTime() > weekAgo,
      );
      setNewMessageCount(recent.length);

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
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : seller?.rating || 0;

  // Sort inventory by view count
  const popularItems = seller?.inventory
    ? [...seller.inventory].sort(
        (a, b) =>
          (analytics?.itemViews?.[b.id] || 0) - (analytics?.itemViews?.[a.id] || 0),
      )
    : [];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-50 text-red-700 border-red-200";
      case "normal":
        return "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-300 text-xs font-medium mb-1">
                {t("sellerDashboard.welcomeBack")}
              </p>
              <h1 className="text-xl font-bold">{user.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center relative">
                <IoNotifications className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF7C29] rounded-full text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              <Link
                href="/account"
                className="w-10 h-10 rounded-md bg-[#EF7C29] flex items-center justify-center text-lg font-bold"
              >
                {user.avatar}
              </Link>
            </div>
          </div>

          {/* Stats grid (2x2) in header */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#EF7C29] flex items-center justify-center">
                  <IoEye className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{analytics?.profileViews ?? 0}</p>
              <p className="text-slate-300 text-xs">{t("sellerDashboard.profileViews")}</p>
            </div>
            <div className="bg-white/10 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#1152A2] flex items-center justify-center">
                  <IoChatbubbles className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{newMessageCount}</p>
              <p className="text-slate-300 text-xs">{t("sellerDashboard.newMessages")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 max-w-lg mx-auto mt-6 space-y-6">
        {/* More Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-md p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#EF7C29] flex items-center justify-center">
                <IoChatbubbles className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-[#EF7C29]">{pendingCount}</p>
            <p className="text-gray-500 text-xs">{t("sellerDashboard.pendingRequests")}</p>
          </div>
          <div className="bg-white rounded-md p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#1152A2] flex items-center justify-center">
                <IoStorefront className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-[#1152A2]">{productCount}</p>
            <p className="text-gray-500 text-xs">{t("sellerDashboard.productsListed")}</p>
          </div>
        </div>

        {/* Performance */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-md p-4 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <IoTrendingUp className="w-4 h-4 text-[#1152A2]" />
              {t("sellerDashboard.performance")}
            </h2>
            <div className="flex items-center gap-4">
              <div>
                <StarRating value={avgRating} readonly size="sm" />
                <p className="text-xs text-gray-500 mt-0.5">
                  {avgRating} · {reviews.length} reviews
                </p>
              </div>
              {seller?.responseTime && (
                <div className="border-l border-gray-200 pl-4">
                  <p className="text-xs font-medium text-gray-700">Response Time</p>
                  <p className="text-xs text-gray-500">{seller.responseTime}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Popular Items */}
        {popularItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">{t("sellerDashboard.popularItems")}</h2>
              <Link href="/inventory" className="text-sm text-[#1152A2] font-medium">
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {popularItems.slice(0, 4).map((item) => {
                const views = analytics?.itemViews?.[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-md p-3 border border-gray-100 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-md object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                          <IoStorefront className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-[#EF7C29] font-bold">{item.price} RWF</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          item.stock === 0
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {item.stock === 0 ? "Out" : "In Stock"}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <IoEye className="w-3 h-3" />
                        {views}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">{t("sellerDashboard.newMatchRequests")}</h2>
            <Link href="/requests" className="text-sm text-slate-600 font-medium">
              {t("sellerDashboard.viewAll")}
            </Link>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-white rounded-md p-6 border border-gray-100 shadow-sm text-center">
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
                  className="bg-white rounded-md p-4 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        {request.mission?.product || t("sellerDashboard.buyerRequest")}
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
                        : t("sellerDashboard.budgetTbd")}
                    </span>
                    <span className="text-gray-400 flex items-center gap-1">
                      <IoTime className="w-3 h-3" />
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleDateString()
                        : t("sellerDashboard.recently")}
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
              className="bg-white rounded-md p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-md bg-[#EF7C29]/10 flex items-center justify-center">
                <IoAdd className="w-5 h-5 text-[#EF7C29]" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{t("sellerDashboard.addProduct")}</p>
                <p className="text-xs text-gray-500">{t("sellerDashboard.updateInventory")}</p>
              </div>
            </Link>
            <Link
              href="/messages"
              className="bg-white rounded-md p-4 border border-gray-100 shadow-sm flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-md bg-[#1152A2]/10 flex items-center justify-center">
                <IoChatbubbles className="w-5 h-5 text-[#1152A2]" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Messages</p>
                <p className="text-xs text-gray-500">Chat with buyers</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <BottomNav role="seller" />
    </div>
  );
}
