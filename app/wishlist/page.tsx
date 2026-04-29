"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getWishlistByBuyer,
  removeFromWishlist as removeFromWishlistLocal,
  getWishlistAlertsByBuyer,
  markAlertSeen as markAlertSeenLocal,
  updateWishlistAlert as updateAlertLocal,
} from "@/lib/storage";
import {
  getWishlistByBuyer as getFirebaseWishlist,
  removeFromWishlist as removeFromWishlistFirebase,
  getWishlistAlertsByBuyer as getFirebaseAlerts,
  markAlertSeen as markAlertSeenFirebase,
  updateWishlistAlert as updateAlertFirebase,
} from "@/lib/db";
import type { UserProfile, WishlistItem, WishlistAlert } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import {
  IoHeart,
  IoHeartDislike,
  IoArrowBack,
  IoNotifications,
  IoPencil,
  IoCheckmark,
  IoLocationSharp,
} from "react-icons/io5";
import { HiStar } from "react-icons/hi2";

export default function WishlistPage() {
  const router = useRouter();
  const { user: authUser, loading, isConfigured } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [alerts, setAlerts] = useState<WishlistAlert[]>([]);
  const [mounted, setMounted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKeyword, setEditKeyword] = useState("");

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
        const [wl, als] = await Promise.all([
          getFirebaseWishlist(currentUser.id),
          getFirebaseAlerts(currentUser.id),
        ]);
        setWishlist(wl);
        setAlerts(als);
      } else {
        currentUser = getUserProfile();
        if (!currentUser) {
          router.push("/onboarding");
          return;
        }
        setWishlist(getWishlistByBuyer(currentUser.id));
        setAlerts(getWishlistAlertsByBuyer(currentUser.id));
      }

      if (currentUser.role !== "buyer") {
        router.push("/");
        return;
      }

      setUser(currentUser);
    };

    loadData();
  }, [mounted, loading, authUser, isConfigured, router]);

  const handleRemove = async (sellerId: string) => {
    if (!user) return;
    if (isConfigured) {
      await removeFromWishlistFirebase(user.id, sellerId);
    } else {
      removeFromWishlistLocal(user.id, sellerId);
    }
    setWishlist((prev) => prev.filter((w) => w.sellerId !== sellerId));
  };

  const handleMarkSeen = async (alertId: string) => {
    if (isConfigured) {
      await markAlertSeenFirebase(alertId);
    } else {
      markAlertSeenLocal(alertId);
    }
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, seen: true } : a)));
  };

  const handleSaveKeyword = async (item: WishlistItem) => {
    if (!user) return;
    const kw = editKeyword.trim();
    if (isConfigured) {
      await updateAlertFirebase(user.id, item.sellerId, kw, !!kw);
    } else {
      updateAlertLocal(user.id, item.sellerId, kw, !!kw);
    }
    setWishlist((prev) =>
      prev.map((w) =>
        w.sellerId === item.sellerId
          ? { ...w, alertKeyword: kw, alertEnabled: !!kw }
          : w,
      ),
    );
    setEditingId(null);
    setEditKeyword("");
  };

  const unseenAlerts = alerts.filter((a) => !a.seen);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">My Wishlist</h1>
              <p className="text-slate-300 text-sm">{wishlist.length} saved suppliers</p>
            </div>
            {unseenAlerts.length > 0 && (
              <div className="relative">
                <IoNotifications className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF7C29] rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unseenAlerts.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-4 space-y-4">
        {/* Unseen alerts */}
        {unseenAlerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Alerts</p>
            {unseenAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2">
                  <IoNotifications className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.sellerName} now has &ldquo;{alert.matchedItem}&rdquo;
                    </p>
                    <p className="text-xs text-gray-500">
                      Matched your alert for &ldquo;{alert.keyword}&rdquo;
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkSeen(alert.id)}
                  className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0"
                >
                  <IoCheckmark className="w-4 h-4 text-amber-700" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Wishlist items */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <IoHeart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">No saved suppliers</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">
              Tap the heart on a supplier to save them
            </p>
            <Link
              href="/discover"
              className="inline-block px-5 py-2 bg-[#EF7C29] text-white rounded-md text-sm font-semibold"
            >
              Discover Suppliers
            </Link>
          </div>
        ) : (
          wishlist.map((item) => (
            <div key={item.sellerId} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <Link href={`/sellers/${item.sellerId}`} className="contents">
                  <div className="w-12 h-12 rounded-md bg-[#1152A2] text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {item.sellerAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.sellerName}</p>
                    <p className="text-xs text-gray-500">{item.sellerCategory}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <IoLocationSharp className="w-3 h-3" />
                      <span>Saved {new Date(item.savedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>

                <div className="flex gap-2 shrink-0">
                  {/* Edit alert keyword */}
                  <button
                    onClick={() => {
                      setEditingId(item.sellerId === editingId ? null : item.sellerId);
                      setEditKeyword(item.alertKeyword || "");
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                    title="Set alert"
                  >
                    <IoPencil className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(item.sellerId)}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"
                    title="Remove"
                  >
                    <IoHeartDislike className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Alert keyword display */}
              {item.alertKeyword && editingId !== item.sellerId && (
                <div className="mt-2 flex items-center gap-1 text-xs text-[#1152A2]">
                  <IoNotifications className="w-3 h-3" />
                  <span>Alert: &ldquo;{item.alertKeyword}&rdquo;</span>
                </div>
              )}

              {/* Edit alert form */}
              {editingId === item.sellerId && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={editKeyword}
                    onChange={(e) => setEditKeyword(e.target.value)}
                    placeholder="Alert keyword (e.g. tomatoes)"
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-md outline-none focus:border-[#1152A2]"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveKeyword(item)}
                    className="px-3 py-2 bg-[#1152A2] text-white text-xs rounded-md font-medium"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
