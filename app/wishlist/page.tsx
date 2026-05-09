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
  IoSearch,
  IoClose,
} from "react-icons/io5";

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
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-14 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center shrink-0"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">My Wishlist</h1>
              <p className="text-blue-200 text-sm">
                {wishlist.length} saved supplier{wishlist.length !== 1 ? "s" : ""}
              </p>
            </div>
            {unseenAlerts.length > 0 && (
              <div className="relative w-10 h-10 rounded-xl bg-[#EF7C29] flex items-center justify-center">
                <IoNotifications className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#EF7C29] rounded-full text-[10px] font-bold flex items-center justify-center">
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
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Alerts</p>
            <div className="space-y-2">
              {unseenAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <IoNotifications className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {alert.sellerName} now has &ldquo;{alert.matchedItem}&rdquo;
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Matched your alert for &ldquo;{alert.keyword}&rdquo;
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkSeen(alert.id)}
                    className="w-8 h-8 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <IoCheckmark className="w-4 h-4 text-amber-700" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wishlist items */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <IoHeart className="w-8 h-8 text-red-200" />
            </div>
            <p className="font-bold text-gray-600">No saved suppliers</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              Tap the heart on a supplier to save them
            </p>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#EF7C29] text-white rounded-xl text-sm font-bold shadow-md shadow-orange-200/50 hover:bg-[#e06c1e] transition-colors"
            >
              <IoSearch className="w-4 h-4" />
              Discover Suppliers
            </Link>
          </div>
        ) : (
          wishlist.map((item) => (
            <div key={item.sellerId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Link href={`/sellers/${item.sellerId}`} className="contents">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1152A2] to-[#1a6bc9] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {item.sellerAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.sellerName}</p>
                      <p className="text-xs text-gray-500 truncate">{item.sellerCategory}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Saved {new Date(item.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(item.sellerId === editingId ? null : item.sellerId);
                        setEditKeyword(item.alertKeyword || "");
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        item.alertKeyword
                          ? "bg-[#1152A2]/10 text-[#1152A2]"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      title="Set alert"
                    >
                      <IoPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.sellerId)}
                      className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors"
                      title="Remove"
                    >
                      <IoHeartDislike className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Alert keyword display */}
                {item.alertKeyword && editingId !== item.sellerId && (
                  <div className="mt-3 flex items-center gap-2 bg-[#1152A2]/5 rounded-xl px-3 py-2">
                    <IoNotifications className="w-3.5 h-3.5 text-[#1152A2]" />
                    <span className="text-xs font-medium text-[#1152A2]">
                      Alert: &ldquo;{item.alertKeyword}&rdquo;
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(item.sellerId);
                        setEditKeyword(item.alertKeyword || "");
                      }}
                      className="ml-auto text-[10px] text-[#1152A2]/60 hover:text-[#1152A2]"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* Edit alert form */}
              {editingId === item.sellerId && (
                <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Alert keyword</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={editKeyword}
                        onChange={(e) => setEditKeyword(e.target.value)}
                        placeholder="e.g. tomatoes, rice..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 transition-all"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveKeyword(item);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      {editKeyword && (
                        <button
                          onClick={() => setEditKeyword("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2"
                        >
                          <IoClose className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleSaveKeyword(item)}
                      className="px-4 py-2.5 bg-[#1152A2] text-white text-sm rounded-xl font-semibold hover:bg-[#0d3d7a] transition-colors"
                    >
                      Save
                    </button>
                  </div>
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
