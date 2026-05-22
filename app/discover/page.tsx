"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getUserProfile, getSellers } from "@/lib/storage";
import { getAllSellers } from "@/lib/db";
import type { UserProfile, Seller } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import {
  IoSearch,
  IoLocationSharp,
  IoCheckmarkCircle,
  IoChevronForward,
  IoClose,
  IoStorefront,
} from "react-icons/io5";
import { HiStar } from "react-icons/hi2";
import { useTranslation } from "@/lib/i18n";
import { WishlistButton } from "@/components/WishlistButton";

// category identifiers correspond to translation keys under feed.categories
const categories = [
  "all",
  "agriculture",
  "construction",
  "electronics",
  "textiles",
  "food",
  "handicrafts",
  "office",
  "machinery",
];

export default function DiscoverPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
        const fbSellers = await getAllSellers();
        setSellers(fbSellers);
        setFilteredSellers(fbSellers);
      } else {
        const localUser = getUserProfile();
        if (!localUser) {
          router.push("/onboarding");
          return;
        }
        currentUser = localUser;
        const localSellers = getSellers();
        setSellers(localSellers);
        setFilteredSellers(localSellers);
      }

      setUser(currentUser);
    };

    loadData();
  }, [mounted, loading, authUser, isConfigured, router]);

  useEffect(() => {
    let filtered = sellers;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (s) =>
          s.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(s.category.toLowerCase()),
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          s.location.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query),
      );
    }

    // Pro sellers always pinned at top
    filtered = [...filtered].sort((a, b) => {
      const tierOrder = { pro: 0, plus: 1, lite: 2 };
      const aOrder = tierOrder[a.subscriptionTier || "lite"];
      const bOrder = tierOrder[b.subscriptionTier || "lite"];
      return aOrder - bOrder;
    });

    setFilteredSellers(filtered);
  }, [searchQuery, selectedCategory, sellers]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-14 pb-5 shadow-lg">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold tracking-tight mb-4">{t("discover.title")}</h1>

          {/* Search Bar */}
          <div className="relative">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("discover.searchPlaceholder")}
              className="w-full h-12 pl-12 pr-10 bg-white/15 border border-white/25 rounded-2xl text-white placeholder:text-white/50 outline-none focus:bg-white/20 focus:border-white/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
              >
                <IoClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-4 -mx-0 px-5 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-[#1152A2] text-white shadow-md shadow-blue-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#1152A2]/30"
              }`}
            >
              {t(`feed.categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="px-5 mt-4 mb-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filteredSellers.length}</span>{" "}
            {t("discover.resultsCount", { count: filteredSellers.length }).replace(String(filteredSellers.length), "").trim() || "suppliers"}
          </p>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="text-xs text-[#EF7C29] font-semibold flex items-center gap-1"
            >
              <IoClose className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* Supplier List */}
        <div className="px-5 space-y-3 pb-4">
          {filteredSellers.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <IoStorefront className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-700 font-semibold">{t("discover.noSuppliers")}</p>
              <p className="text-sm text-gray-400 mt-1 px-8">
                {sellers.length === 0
                  ? t("discover.noSuppliersExplain")
                  : t("discover.tryAdjust")}
              </p>
            </div>
          ) : (
            filteredSellers.map((seller) => (
              <div key={seller.id} className="relative group">
                <Link
                  href={`/sellers/${seller.id}`}
                  className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#1152A2]/20 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1152A2] to-[#1a6bc9] text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
                      {seller.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="font-semibold text-gray-900 truncate">{seller.name}</h4>
                        {seller.verified && (
                          <IoCheckmarkCircle className="w-4 h-4 text-[#1152A2] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate">{seller.category}</p>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <HiStar className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-medium text-gray-700">{seller.rating}</span>
                          <span className="text-xs text-gray-400">({seller.reviews})</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <IoLocationSharp className="w-3 h-3" />
                          {seller.location}
                        </span>
                      </div>
                      {seller.description && (
                        <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">
                          {seller.description}
                        </p>
                      )}
                    </div>
                    <IoChevronForward className="w-4 h-4 text-gray-300 group-hover:text-[#1152A2] transition-colors shrink-0" />
                  </div>
                </Link>
                {user.role === "buyer" && (
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
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
