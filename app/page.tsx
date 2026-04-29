"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile, getSellers, getMissions, getWishlistAlertsByBuyer } from "@/lib/storage";
import { getAllSellers, getMissionsByBuyer, getWishlistAlertsByBuyer as getFirebaseAlerts } from "@/lib/db";
import type { UserProfile, Seller, Mission } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { WishlistButton } from "@/components/WishlistButton";
import {
  IoRocket,
  IoCheckmarkCircle,
  IoAdd,
  IoLocationSharp,
  IoChevronForward,
  IoStorefront,
  IoNotifications,
} from "react-icons/io5";
import { HiStar } from "react-icons/hi2";

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [unseenAlerts, setUnseenAlerts] = useState(0);
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

        // Fetch from Firebase
        const [fbSellers, fbMissions] = await Promise.all([
          getAllSellers(),
          getMissionsByBuyer(currentUser.id),
        ]);
        setSellers(fbSellers);
        setMissions(fbMissions);
        const fbAlerts = await getFirebaseAlerts(currentUser.id);
        setUnseenAlerts(fbAlerts.filter((a) => !a.seen).length);
      } else {
        // LocalStorage fallback
        const localUser = getUserProfile();
        if (!localUser) {
          router.push("/onboarding");
          return;
        }
        currentUser = localUser;
        setSellers(getSellers());
        setMissions(getMissions().filter((m) => m.buyerId === currentUser!.id));
        const localAlerts = getWishlistAlertsByBuyer(currentUser.id);
        setUnseenAlerts(localAlerts.filter((a) => !a.seen).length);
      }

      if (currentUser?.role === "seller") {
        router.push("/seller-dashboard");
        return;
      }

      setUser(currentUser);
    };

    loadData();
  }, [mounted, loading, authUser, isConfigured, router]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMissionCount = missions.filter(
    (m) => m.status === "finding" || m.status === "matched",
  ).length;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-300 text-xs font-medium mb-1">
                {t("home.greeting")}
              </p>
              <h1 className="text-xl font-bold">{user.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/wishlist"
                className="relative w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <IoNotifications className="w-5 h-5" />
                {unseenAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF7C29] rounded-full text-[9px] font-bold flex items-center justify-center">
                    {unseenAlerts}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold"
              >
                {user.avatar}
              </Link>
            </div>
          </div>

          {/* Active Missions Card */}
          {activeMissionCount > 0 && (
            <Link href="/missions" className="block bg-white/10 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <IoRocket className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-xs font-medium">
                      {t("home.activeMissions")}
                    </p>
                    <p className="text-lg font-bold">{activeMissionCount}</p>
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-5">
        {/* Create Mission Button */}
        <Link
          href="/missions/create"
          className="block bg-[#EF7C29] text-white rounded-md p-4 hover:bg-[#d96a1f]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-md bg-white/20 flex items-center justify-center">
                <IoAdd className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold">{t("home.createMission")}</h2>
                <p className="text-white/80 text-xs">{t("home.findSuppliers")}</p>
              </div>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1 font-medium">{t("home.stats.missions")}</p>
            <p className="text-lg font-bold text-[#1152A2]">
              {missions.length}
            </p>
          </div>
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1 font-medium">{t("home.stats.suppliers")}</p>
            <p className="text-lg font-bold text-[#1152A2]">{sellers.length}</p>
          </div>
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1 font-medium">{t("home.stats.active")}</p>
            <p className="text-lg font-bold text-[#1152A2]">
              {activeMissionCount}
            </p>
          </div>
        </div>

        {/* Suggested Suppliers */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">
              {t("home.suggestedSuppliers")}
            </h3>
            <Link
              href="/discover"
              className="text-xs font-medium text-[#1152A2]"
            >
              {t("home.seeAll")}
            </Link>
          </div>
          <div className="space-y-3">
            {sellers.length === 0 ? (
              <div className="bg-white rounded-md p-6 border border-gray-200 text-center">
                <IoStorefront className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t("home.noSuppliersYet")}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {t("home.suppliersWillAppear")}
                </p>
              </div>
            ) : (
              sellers.slice(0, 3).map((seller) => (
                <div key={seller.id} className="relative">
                  <Link
                    href={`/sellers/${seller.id}`}
                    className="block bg-white rounded-md p-4 border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-md bg-[#1152A2] text-white flex items-center justify-center text-base font-bold shrink-0">
                        {seller.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {seller.name}
                          </h4>
                          {seller.verified && (
                            <IoCheckmarkCircle className="w-4 h-4 text-[#1152A2]" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {seller.category}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <HiStar className="w-3 h-3 text-amber-500" />
                            {seller.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoLocationSharp className="w-3 h-3" />
                            {seller.location}
                          </span>
                        </div>
                      </div>
                      <IoChevronForward className="w-4 h-4 text-gray-400" />
                    </div>
                  </Link>
                  <div className="absolute top-3 right-8">
                    <WishlistButton
                      sellerId={seller.id}
                      sellerName={seller.name}
                      sellerAvatar={seller.avatar}
                      sellerCategory={seller.category}
                      buyerId={user.id}
                      isConfigured={isConfigured}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
