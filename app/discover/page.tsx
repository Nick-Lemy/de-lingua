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
  IoFilter,
  IoStorefront,
} from "react-icons/io5";
import { HiStar } from "react-icons/hi2";

const categories = [
  "All",
  "Agricultural Products",
  "Construction Materials",
  "Electronics & Tech",
  "Textiles & Garments",
  "Food & Beverages",
  "Handicrafts & Art",
  "Office Supplies",
  "Machinery & Equipment",
];

export default function DiscoverPage() {
  const router = useRouter();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [filteredSellers, setFilteredSellers] = useState<Seller[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
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

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (s) =>
          s.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(s.category.toLowerCase()),
      );
    }

    // Filter by search query
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

    setFilteredSellers(filtered);
  }, [searchQuery, selectedCategory, sellers]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold mb-4">Discover Suppliers</h1>

          {/* Search Bar */}
          <div className="relative">
            <IoSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suppliers, products, locations..."
              className="w-full h-12 pl-12 pr-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-[#1152A2] text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mt-4 mb-3">
          <p className="text-sm text-gray-500">
            {filteredSellers.length} supplier
            {filteredSellers.length !== 1 ? "s" : ""} found
          </p>
          <button className="flex items-center gap-1 text-sm text-[#1152A2] font-medium">
            <IoFilter className="w-4 h-4" />
            Filter
          </button>
        </div>

        {/* Supplier List */}
        <div className="space-y-3">
          {filteredSellers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <IoStorefront className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No suppliers found</p>
              <p className="text-sm text-gray-400 mt-1">
                {sellers.length === 0
                  ? "Suppliers will appear here when they join DeLingua"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            filteredSellers.map((seller) => (
              <Link
                key={seller.id}
                href={`/sellers/${seller.id}`}
                className="block bg-white rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1152A2] text-white flex items-center justify-center text-lg font-bold shrink-0">
                    {seller.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {seller.name}
                      </h4>
                      {seller.verified && (
                        <IoCheckmarkCircle className="w-4 h-4 text-[#1152A2] shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {seller.category}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <HiStar className="w-3 h-3 text-amber-500" />
                        {seller.rating} ({seller.reviews})
                      </span>
                      <span className="flex items-center gap-1">
                        <IoLocationSharp className="w-3 h-3" />
                        {seller.location}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                      {seller.description}
                    </p>
                  </div>
                  <IoChevronForward className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <BottomNav role="buyer" />
    </div>
  );
}
