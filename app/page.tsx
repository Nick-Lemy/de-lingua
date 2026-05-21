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
  IoArrowForward,
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

        const [fbSellers, fbMissions] = await Promise.all([
          getAllSellers(),
          getMissionsByBuyer(currentUser.id),
        ]);
        setSellers(fbSellers);
        setMissions(fbMissions);
        const fbAlerts = await getFirebaseAlerts(currentUser.id);
        setUnseenAlerts(fbAlerts.filter((a) => !a.seen).length);
      } else {
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
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMissionCount = missions.filter(
    (m) => m.status === "finding" || m.status === "matched",
  ).length;

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-14 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-blue-200 text-xs font-medium mb-0.5 tracking-wide uppercase">
                {t("home.greeting")}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/wishlist"
                className="relative w-11 h-11 rounded-2xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
              >
                <IoNotifications className="w-5 h-5" />
                {unseenAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF7C29] rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg">
                    {unseenAlerts}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="w-11 h-11 rounded-2xl bg-[#EF7C29] flex items-center justify-center text-lg font-bold shadow-lg"
              >
                {user.avatar}
              </Link>
            </div>
          </div>

          {/* Active Missions Banner */}
          {activeMissionCount > 0 && (
            <Link
              href="/missions"
              className="flex items-center justify-between bg-white/15 hover:bg-white/20 transition-colors rounded-2xl px-4 py-3.5 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#EF7C29] flex items-center justify-center">
                  <IoRocket className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{activeMissionCount} active {activeMissionCount === 1 ? "mission" : "missions"}</p>
                  <p className="text-blue-200 text-xs">{t("home.activeMissions")}</p>
                </div>
              </div>
              <IoChevronForward className="w-4 h-4 text-blue-200" />
            </Link>
          )}
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto -mt-4">
        {/* Create Mission CTA */}
        <Link
          href="/missions/create"
          className="flex items-center justify-between bg-[#EF7C29] text-white rounded-2xl px-5 py-4 shadow-xl shadow-orange-200/60 hover:bg-[#e06c1e] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <IoAdd className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t("home.createMission")}</h2>
              <p className="text-orange-100 text-xs mt-0.5">{t("home.findSuppliers")}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <IoArrowForward className="w-4 h-4" />
          </div>
        </Link>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <Link href="/missions" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#1152A2]/30 transition-colors">
            <p className="text-2xl font-bold text-[#1152A2]">{missions.length}</p>
            <p className="text-gray-500 text-xs mt-1 font-medium leading-tight">{t("home.stats.missions")}</p>
          </Link>
          <Link href="/discover" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#EF7C29]/30 transition-colors">
            <p className="text-2xl font-bold text-[#EF7C29]">{sellers.length}</p>
            <p className="text-gray-500 text-xs mt-1 font-medium leading-tight">{t("home.stats.suppliers")}</p>
          </Link>
          <Link href="/matches" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-green-300 transition-colors">
            <p className="text-2xl font-bold text-green-600">{activeMissionCount}</p>
            <p className="text-gray-500 text-xs mt-1 font-medium leading-tight">{t("home.stats.matches")}</p>
          </Link>
        </div>

        {/* Suggested Suppliers */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">
              {t("home.suggestedSuppliers")}
            </h3>
            <Link
              href="/discover"
              className="flex items-center gap-1 text-xs font-semibold text-[#1152A2]"
            >
              {t("home.seeAll")}
              <IoChevronForward className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {sellers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <IoStorefront className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">{t("home.noSuppliersYet")}</p>
                <p className="text-xs text-gray-400 mt-1">{t("home.suppliersWillAppear")}</p>
              </div>
            ) : (
              sellers.slice(0, 3).map((seller) => (
                <div key={seller.id} className="relative group">
                  <Link
                    href={`/sellers/${seller.id}`}
                    className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1152A2]/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1152A2] to-[#1a6bc9] text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
                        {seller.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {seller.name}
                          </h4>
                          {seller.verified && (
                            <IoCheckmarkCircle className="w-4 h-4 text-[#1152A2] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-1.5 truncate">{seller.category}</p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs">
                            <HiStar className="w-3 h-3 text-amber-400" />
                            <span className="font-medium text-gray-700">{seller.rating}</span>
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <IoLocationSharp className="w-3 h-3" />
                            {seller.location}
                          </span>
                        </div>
                      </div>
                      <IoChevronForward className="w-4 h-4 text-gray-300 group-hover:text-[#1152A2] transition-colors shrink-0" />
                    </div>
                  </Link>
                  <div className="absolute top-3.5 right-10">
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
