"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserProfile, getSellers, getMissions } from "@/lib/storage";
import type { UserProfile, Seller, Mission } from "@/lib/storage";
import {
  IoHome,
  IoRocket,
  IoCheckmarkCircle,
  IoPerson,
  IoAdd,
  IoStorefront,
  IoLocationSharp,
} from "react-icons/io5";
import { HiStar } from "react-icons/hi2";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const profile = getUserProfile();
    if (!profile) {
      router.push("/welcome");
      return;
    }
    setUser(profile);
    setSellers(getSellers());
    setMissions(getMissions().filter((m) => m.buyerId === profile.id));
  }, [router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user.role === "seller") {
    router.push("/seller-dashboard");
    return null;
  }

  const activeMissionCount = missions.filter(
    (m) => m.status === "finding" || m.status === "matched",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-lg">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-blue-100 text-xs font-medium mb-1">
                Welcome back
              </p>
              <h1 className="text-xl font-bold">{user.name}</h1>
            </div>
            <Link
              href="/account"
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg font-bold"
            >
              {user.avatar}
            </Link>
          </div>

          {/* Active Missions Card */}
          {activeMissionCount > 0 && (
            <Link
              href="/missions"
              className="block bg-white/10 backdrop-blur-md rounded-2xl p-4 hover:bg-white/15 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <IoRocket className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-blue-100 text-xs font-medium">
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

      <div className="px-5 max-w-lg mx-auto -mt-4">
        {/* Create Mission Button */}
        <Link
          href="/missions/create"
          className="block bg-blue-600 text-white rounded-2xl p-4 shadow-lg hover:bg-blue-700 transition-all active:scale-95"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <IoAdd className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold">Create Mission</h2>
                <p className="text-blue-100 text-xs">Find suppliers quickly</p>
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
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-gray-500 text-xs mb-1">Missions</p>
            <p className="text-lg font-bold text-gray-900">{missions.length}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-gray-500 text-xs mb-1">Suppliers</p>
            <p className="text-lg font-bold text-gray-900">{sellers.length}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-gray-500 text-xs mb-1">Active</p>
            <p className="text-lg font-bold text-gray-900">
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
              className="text-xs font-medium text-blue-600"
            >
              See all
            </Link>
          </div>
          <div className="space-y-3">
            {sellers.slice(0, 3).map((seller) => (
              <Link
                key={seller.id}
                href={`/sellers/${seller.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all active:scale-98"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                    {seller.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-gray-900">
                        {seller.name}
                      </h4>
                      {seller.verified && (
                        <IoCheckmarkCircle className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {seller.category}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <HiStar className="w-3 h-3 text-yellow-500" />
                        {seller.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <IoLocationSharp className="w-3 h-3" />
                        {seller.location}
                      </span>
                    </div>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-400"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto px-5 h-16 flex items-center justify-around">
          <Link
            href="/"
            className="flex flex-col items-center gap-0.5 text-blue-600 py-2"
          >
            <IoHome className="w-6 h-6" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link
            href="/missions"
            className="flex flex-col items-center gap-0.5 text-gray-400 py-2"
          >
            <IoRocket className="w-6 h-6" />
            <span className="text-[10px] font-medium">Missions</span>
          </Link>
          <Link
            href="/matches"
            className="flex flex-col items-center gap-0.5 text-gray-400 py-2"
          >
            <IoStorefront className="w-6 h-6" />
            <span className="text-[10px] font-medium">Matches</span>
          </Link>
          <Link
            href="/account"
            className="flex flex-col items-center gap-0.5 text-gray-400 py-2"
          >
            <IoPerson className="w-6 h-6" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
