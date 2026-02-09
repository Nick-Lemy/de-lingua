"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile, getSellers, getMissions } from "@/lib/storage";
import { getAllSellers, getMissionsByBuyer } from "@/lib/db";
import type { UserProfile, Seller, Mission } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import {
  IoRocket,
  IoCheckmarkCircle,
  IoAdd,
  IoLocationSharp,
  IoChevronForward,
  IoStorefront,
} from "react-icons/io5";
import { HiStar } from "react-icons/hi2";

export default function HomePage() {
  const router = useRouter();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeMissionCount = missions.filter(
    (m) => m.status === "finding" || m.status === "matched",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-slate-300 text-xs font-medium mb-1">
                Murakaza neza
              </p>
              <h1 className="text-xl font-bold">{user.name}</h1>
            </div>
            <Link
              href="/account"
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold"
            >
              {user.avatar}
            </Link>
          </div>

          {/* Active Missions Card */}
          {activeMissionCount > 0 && (
            <Link
              href="/missions"
              className="block bg-white/10 rounded-2xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <IoRocket className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-xs font-medium">
                      Active Missions
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
          className="block bg-emerald-600 text-white rounded-2xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <IoAdd className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold">Create Mission</h2>
                <p className="text-emerald-100 text-xs">
                  Find suppliers quickly
                </p>
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
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1 font-medium">Missions</p>
            <p className="text-lg font-bold text-slate-800">
              {missions.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1 font-medium">Suppliers</p>
            <p className="text-lg font-bold text-slate-800">{sellers.length}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200">
            <p className="text-gray-500 text-xs mb-1 font-medium">Active</p>
            <p className="text-lg font-bold text-slate-800">
              {activeMissionCount}
            </p>
          </div>
        </div>

        {/* Suggested Suppliers */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">
              Suggested Suppliers
            </h3>
            <Link
              href="/discover"
              className="text-xs font-medium text-slate-600"
            >
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {sellers.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <IoStorefront className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No suppliers yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Suppliers will appear when they join DeLingua
                </p>
              </div>
            ) : (
              sellers.slice(0, 3).map((seller) => (
                <Link
                  key={seller.id}
                  href={`/sellers/${seller.id}`}
                  className="block bg-white rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 text-white flex items-center justify-center text-base font-bold shrink-0">
                      {seller.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900">
                          {seller.name}
                        </h4>
                        {seller.verified && (
                          <IoCheckmarkCircle className="w-4 h-4 text-emerald-600" />
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
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
