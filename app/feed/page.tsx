"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getUserProfile, getFeedPosts } from "@/lib/storage";
import { getAllFeedPosts } from "@/lib/db";
import type { UserProfile, FeedPost } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { IoAdd, IoTime, IoLocationSharp, IoChatbubbles } from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";

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

export default function FeedPage() {
  const router = useRouter();
  const { user: authUser, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<"all" | "looking" | "offering">(
    "all",
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
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
        const fbPosts = await getAllFeedPosts();
        setPosts(fbPosts);
      } else {
        const localUser = getUserProfile();
        if (!localUser) {
          router.push("/onboarding");
          return;
        }
        currentUser = localUser;
        setPosts(getFeedPosts().filter((p) => p.status === "active"));
      }

      setUser(currentUser);
    };

    loadData();
  }, [mounted, loading, authUser, isConfigured, router]);

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by tab
    if (activeTab === "looking") {
      filtered = filtered.filter((p) => p.type === "looking-for");
    } else if (activeTab === "offering") {
      filtered = filtered.filter((p) => p.type === "offering");
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (p) =>
          p.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          selectedCategory.toLowerCase().includes(p.category.toLowerCase()),
      );
    }

    return filtered;
  }, [posts, activeTab, selectedCategory]);

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case "urgent":
        return "bg-red-100 text-red-700";
      case "normal":
        return "bg-[#1152A2]/10 text-[#1152A2]";
      case "flexible":
        return "bg-gray-100 text-gray-700";
      default:
        return "";
    }
  };

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">Community Feed</h1>
              <p className="text-slate-300 text-sm">
                {posts.length} active posts
              </p>
            </div>
            <Link
              href="/feed/create"
              className="w-11 h-11 rounded-xl bg-[#EF7C29] flex items-center justify-center"
            >
              <IoAdd className="w-6 h-6" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                activeTab === "all"
                  ? "bg-white text-[#1152A2]"
                  : "text-white/80"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("looking")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                activeTab === "looking"
                  ? "bg-white text-[#1152A2]"
                  : "text-white/80"
              }`}
            >
              Looking For
            </button>
            <button
              onClick={() => setActiveTab("offering")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                activeTab === "offering"
                  ? "bg-white text-[#1152A2]"
                  : "text-white/80"
              }`}
            >
              Offering
            </button>
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

        {/* Posts */}
        <div className="space-y-4 mt-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <HiSparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No posts yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Be the first to post what you&apos;re looking for!
              </p>
              <Link
                href="/feed/create"
                className="inline-block px-5 py-2.5 bg-[#EF7C29] text-white rounded-xl text-sm font-semibold"
              >
                Create Post
              </Link>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/feed/${post.id}`}
                className="block bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#1152A2] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {post.userAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                          {post.userName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            post.type === "looking-for"
                              ? "bg-[#EF7C29]/10 text-[#EF7C29]"
                              : "bg-[#1152A2]/10 text-[#1152A2]"
                          }`}
                        >
                          {post.type === "looking-for"
                            ? "Looking for"
                            : "Offering"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <IoTime className="w-3 h-3" />
                        {formatTime(post.createdAt)}
                        {post.location && (
                          <>
                            <span className="mx-1">•</span>
                            <IoLocationSharp className="w-3 h-3" />
                            {post.location}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {post.description}
                  </p>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div
                      className={`mb-3 ${post.images.length === 1 ? "" : "grid grid-cols-2 gap-2"}`}
                    >
                      {post.images.slice(0, 4).map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative overflow-hidden rounded-lg ${
                            post.images!.length === 1 ? "h-48" : "h-24"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`${post.title} - ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {idx === 3 && post.images!.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white font-bold">
                                +{post.images!.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                      {post.category}
                    </span>
                    {post.budget && (
                      <span className="px-2.5 py-1 bg-[#1152A2]/10 text-[#1152A2] rounded-lg text-xs font-medium">
                        Budget: {post.budget}
                      </span>
                    )}
                    {post.urgency && (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${getUrgencyBadge(
                          post.urgency,
                        )}`}
                      >
                        {post.urgency}
                      </span>
                    )}
                  </div>

                  {/* AI Suggestions Preview */}
                  {post.aiSuggestions && post.aiSuggestions.length > 0 && (
                    <div className="bg-linear-to-r from-[#1152A2]/5 to-[#EF7C29]/5 rounded-xl p-3 mb-3 border border-[#1152A2]/10">
                      <div className="flex items-center gap-2 mb-2">
                        <HiSparkles className="w-4 h-4 text-[#EF7C29]" />
                        <span className="text-xs font-semibold text-[#1152A2]">
                          AI found {post.aiSuggestions.length} matching
                          suppliers
                        </span>
                      </div>
                      <div className="flex -space-x-2">
                        {post.aiSuggestions.slice(0, 3).map((suggestion, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-[#1152A2] text-white flex items-center justify-center text-xs font-bold border-2 border-white"
                          >
                            {suggestion.sellerAvatar}
                          </div>
                        ))}
                        {post.aiSuggestions.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold border-2 border-white">
                            +{post.aiSuggestions.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <IoChatbubbles className="w-4 h-4" />
                        {post.repliesCount}{" "}
                        {post.repliesCount === 1 ? "reply" : "replies"}
                      </span>
                    </div>
                    <span className="text-sm text-[#1152A2] font-medium">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
