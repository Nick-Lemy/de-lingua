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
  IoChatbubbles,
  IoTime,
  IoAdd,
  IoListOutline,
  IoEye,
  IoTrendingUp,
  IoChevronForward,
  IoFlash,
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

      const recent = chats.filter(
        (m) => m.sender === "buyer" && new Date(m.time).getTime() > weekAgo,
      );
      setNewMessageCount(recent.length);

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
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount = requests.length;
  const productCount = seller?.inventory?.length || 0;
  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : seller?.rating || 0;

  const popularItems = seller?.inventory
    ? [...seller.inventory].sort(
        (a, b) =>
          (analytics?.itemViews?.[b.id] || 0) - (analytics?.itemViews?.[a.id] || 0),
      )
    : [];

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-50 text-red-600 border-red-100";
      case "normal":
        return "bg-blue-50 text-[#1152A2] border-blue-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-14 pb-10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-blue-200 text-xs font-medium mb-0.5 tracking-wide uppercase">
                {t("sellerDashboard.welcomeBack")}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <button className="relative w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center">
                <IoNotifications className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF7C29] rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg">
                    {pendingCount}
                  </span>
                )}
              </button>
              <Link
                href="/account"
                className="w-11 h-11 rounded-2xl bg-[#EF7C29] flex items-center justify-center text-lg font-bold shadow-lg"
              >
                {user.avatar}
              </Link>
            </div>
          </div>

          {/* Header stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#EF7C29] flex items-center justify-center">
                  <IoEye className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-200 text-xs font-medium">{t("sellerDashboard.thisWeek")}</span>
              </div>
              <p className="text-3xl font-bold">{analytics?.profileViews ?? 0}</p>
              <p className="text-blue-200 text-xs mt-0.5">{t("sellerDashboard.profileViews")}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <IoChatbubbles className="w-4 h-4 text-white" />
                </div>
                <span className="text-blue-200 text-xs font-medium">{t("sellerDashboard.thisWeek")}</span>
              </div>
              <p className="text-3xl font-bold">{newMessageCount}</p>
              <p className="text-blue-200 text-xs mt-0.5">{t("sellerDashboard.newMessages")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 max-w-lg mx-auto -mt-4 space-y-5">
        {/* More Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <IoFlash className="w-5 h-5 text-[#EF7C29]" />
            </div>
            <p className="text-2xl font-bold text-[#EF7C29]">{pendingCount}</p>
            <p className="text-gray-500 text-xs mt-0.5">{t("sellerDashboard.pendingRequests")}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <IoStorefront className="w-5 h-5 text-[#1152A2]" />
            </div>
            <p className="text-2xl font-bold text-[#1152A2]">{productCount}</p>
            <p className="text-gray-500 text-xs mt-0.5">{t("sellerDashboard.productsListed")}</p>
          </div>
        </div>

        {/* Performance */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                <IoTrendingUp className="w-4 h-4 text-[#1152A2]" />
              </div>
              <h2 className="font-bold text-gray-900">{t("sellerDashboard.performance")}</h2>
            </div>
            <div className="flex items-center gap-5">
              <div>
                <StarRating value={avgRating} readonly size="sm" />
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-semibold text-gray-800">{avgRating}</span> · {reviews.length} reviews
                </p>
              </div>
              {seller?.responseTime && (
                <div className="border-l border-gray-100 pl-5">
                  <p className="text-xs font-semibold text-gray-700">Response Time</p>
                  <p className="text-xs text-gray-500 mt-0.5">{seller.responseTime}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Popular Items */}
        {popularItems.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{t("sellerDashboard.popularItems")}</h2>
              <Link href="/inventory" className="text-xs font-semibold text-[#1152A2] flex items-center gap-1">
                Manage <IoChevronForward className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {popularItems.slice(0, 4).map((item, idx) => {
                const views = analytics?.itemViews?.[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xs font-bold text-gray-300 w-4 text-center">{idx + 1}</span>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        <IoStorefront className="w-4 h-4 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-[#EF7C29] font-bold">{Number(item.price).toLocaleString()} RWF</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          item.stock === 0
                            ? "bg-red-50 text-red-500"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {item.stock === 0 ? "Out" : "In stock"}
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
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">{t("sellerDashboard.newMatchRequests")}</h2>
            <Link href="/requests" className="text-xs font-semibold text-[#1152A2] flex items-center gap-1">
              {t("sellerDashboard.viewAll")} <IoChevronForward className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <IoListOutline className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No pending requests yet</p>
                <p className="text-xs text-gray-400 mt-1">Buyers will find you through AI matching</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">
                        {request.mission?.product || t("sellerDashboard.buyerRequest")}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {request.mission?.description?.slice(0, 60) ||
                          request.mission?.quantity ||
                          "Product inquiry"}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border shrink-0 capitalize ${getUrgencyStyle(request.mission?.urgency || "normal")}`}
                    >
                      {request.mission?.urgency || "normal"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs font-medium text-gray-700">
                      {request.mission?.budgetMin && request.mission?.budgetMax
                        ? `${parseInt(request.mission.budgetMin).toLocaleString()} – ${parseInt(request.mission.budgetMax).toLocaleString()} RWF`
                        : t("sellerDashboard.budgetTbd")}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
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
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-[#EF7C29]/30 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-[#EF7C29] transition-colors">
                <IoAdd className="w-5 h-5 text-[#EF7C29] group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">{t("sellerDashboard.addProduct")}</p>
                <p className="text-xs text-gray-400">{t("sellerDashboard.updateInventory")}</p>
              </div>
            </Link>
            <Link
              href="/messages"
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3 hover:shadow-md hover:border-[#1152A2]/30 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-[#1152A2] transition-colors">
                <IoChatbubbles className="w-5 h-5 text-[#1152A2] group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Messages</p>
                <p className="text-xs text-gray-400">Chat with buyers</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <BottomNav role="seller" />
    </div>
  );
}
