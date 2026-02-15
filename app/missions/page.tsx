"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getMissions,
  getMatchesByMission,
} from "@/lib/storage";
import { getMissionsByBuyer as getFirebaseMissions } from "@/lib/db";
import type { UserProfile, Mission } from "@/lib/types";
import { IoRocket, IoAdd, IoTime } from "react-icons/io5";
import { BottomNav } from "@/components/BottomNav";

export default function MissionsPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    const loadData = async () => {
      const isConfigured = isFirebaseConfigured();

      if (isConfigured) {
        if (!authUser) {
          router.push("/onboarding");
          return;
        }
        setUser(authUser);
        const allMissions = await getFirebaseMissions(authUser.id);
        setMissions(
          allMissions.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      } else {
        const profile = getUserProfile();
        if (!profile) {
          router.push("/onboarding");
          return;
        }
        setUser(profile);
        const allMissions = getMissions().filter(
          (m) => m.buyerId === profile.id,
        );
        setMissions(
          allMissions.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      }
    };

    loadData();
  }, [mounted, authLoading, authUser, router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finding":
        return "bg-[#EF7C29]/10 text-[#EF7C29] border-[#EF7C29]/20";
      case "matched":
        return "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20";
      case "completed":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">My Missions</h1>
              <p className="text-slate-300 text-xs mt-1">
                {missions.length} total missions
              </p>
            </div>
            <Link
              href="/missions/create"
              className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <IoAdd className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Missions List */}
      <div className="px-5 max-w-lg mx-auto mt-6">
        {missions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <IoRocket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-2">
              No missions yet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first mission to find suppliers
            </p>
            <Link
              href="/missions/create"
              className="inline-block px-5 py-2.5 bg-[#EF7C29] text-white rounded-xl text-sm font-semibold hover:bg-[#d96a1f]"
            >
              Create Mission
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((mission) => {
              const matches = getMatchesByMission(mission.id);
              return (
                <Link
                  key={mission.id}
                  href={`/missions/${mission.id}`}
                  className="block bg-white rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 mb-1">
                        {mission.product}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {mission.category}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${getStatusColor(mission.status)}`}
                    >
                      {mission.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-gray-500 mb-0.5">Quantity</p>
                      <p className="font-semibold text-gray-900">
                        {mission.quantity} units
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Budget</p>
                      <p className="font-semibold text-gray-900">
                        €{mission.budgetMin}-€{mission.budgetMax}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-600">
                      {matches.length}{" "}
                      {matches.length === 1 ? "match" : "matches"}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <IoTime className="w-3 h-3" />
                      {new Date(mission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
