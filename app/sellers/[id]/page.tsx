"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getSellerById,
  getReviewsBySeller,
  getUserProfile,
  incrementProfileView as incrementProfileViewLocal,
  incrementItemView as incrementItemViewLocal,
} from "@/lib/storage";
import {
  getSellerById as getFirebaseSeller,
  getReviewsBySeller as getFirebaseReviews,
  incrementProfileView as incrementProfileViewFirebase,
  incrementItemView as incrementItemViewFirebase,
} from "@/lib/db";
import type { Seller, Review, UserProfile } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { SellerBadges } from "@/components/SellerBadges";
import { WishlistButton } from "@/components/WishlistButton";
import { FaMap, FaBoxOpen, FaTruck, FaClock } from "react-icons/fa";
import { BiLeftArrowAlt } from "react-icons/bi";

export default function SellerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user: authUser, isConfigured, loading: authLoading } = useAuth();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const missionId = searchParams?.get("mission");
  const viewTrackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadSeller = async () => {
      const id = params?.id as string;
      if (!id) return;

      const configured = isFirebaseConfigured();
      let foundSeller: Seller | null = null;
      let foundReviews: Review[] = [];

      // Load current user for wishlist button
      let currentUser: UserProfile | null = null;
      if (configured && authUser) {
        currentUser = authUser;
      } else {
        currentUser = getUserProfile();
      }
      setUser(currentUser);

      if (configured) {
        [foundSeller, foundReviews] = await Promise.all([
          getFirebaseSeller(id),
          getFirebaseReviews(id),
        ]);
      } else {
        foundSeller = getSellerById(id);
        foundReviews = getReviewsBySeller(id);
      }

      if (!foundSeller) {
        router.push("/");
        return;
      }
      setSeller(foundSeller);
      setReviews(foundReviews);

      // Track profile view (fire and forget)
      if (configured) {
        incrementProfileViewFirebase(id).catch(() => {});
      } else {
        incrementProfileViewLocal(id);
      }
    };

    if (!authLoading) loadSeller();
  }, [params, router, authUser, isConfigured, authLoading]);

  // Track item views via IntersectionObserver
  useEffect(() => {
    if (!seller || !seller.inventory.length) return;

    const configured = isFirebaseConfigured();
    const tracked = viewTrackedRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const itemId = (entry.target as HTMLElement).dataset.itemId;
            if (itemId && !tracked.has(itemId)) {
              tracked.add(itemId);
              if (configured) {
                incrementItemViewFirebase(seller.id, itemId).catch(() => {});
              } else {
                incrementItemViewLocal(seller.id, itemId);
              }
            }
          }
        });
      },
      { threshold: 0.5 },
    );

    const elements = document.querySelectorAll("[data-item-id]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [seller]);

  if (!seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : seller.rating;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-6 lg:px-8 pt-7 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="px-2 py-1 rounded-md bg-white/10 border border-white/20 flex items-center justify-center"
            >
              <BiLeftArrowAlt className="w-7 h-8" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-[#EF7C29] flex items-center justify-center text-md font-bold">
                  {seller.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{seller.name}</h1>
                    {seller.verified && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#EF7C29">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none" />
                      </svg>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs">{seller.category}</p>
                </div>
                {user?.role === "buyer" && (
                  <WishlistButton
                    sellerId={seller.id}
                    sellerName={seller.name}
                    sellerAvatar={seller.avatar}
                    sellerCategory={seller.category}
                    buyerId={user.id}
                    isConfigured={isFirebaseConfigured()}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm mb-2">
                <span className="flex gap-2 items-center">
                  <StarRating value={avgRating} readonly size="sm" />
                  <p>({reviews.length === 0 ? seller.reviews : reviews.length} reviews)</p>
                </span>
                <span className="flex gap-2 items-center">
                  <FaMap />
                  <p>{seller.location}</p>
                </span>
              </div>
              {(seller.badges ?? []).length > 0 && (
                <SellerBadges badges={seller.badges ?? []} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-8 max-w-4xl mx-auto mt-6 space-y-6">
        {/* About */}
        <div className="bg-white border border-gray-200 rounded-md p-5">
          <h3 className="font-semibold mb-3 text-black">About</h3>
          <p className="text-sm text-gray-600">{seller.description}</p>
        </div>

        {/* Key Details */}
        <div className="bg-white border border-gray-200 rounded-md p-5">
          <h3 className="font-semibold mb-4 text-black">Key Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0">
                <FaBoxOpen className="text-[#1152A2]" size={22} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-black">Minimum Order</p>
                <p className="text-gray-600 text-sm">{seller.minOrder}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0">
                <FaTruck className="text-[#1152A2]" size={22} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-black">Service Range</p>
                <p className="text-gray-600 text-sm">{seller.serviceRange}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0">
                <FaClock className="text-[#1152A2]" size={22} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-black">Response Time</p>
                <p className="text-gray-600 text-sm">{seller.responseTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications */}
        {seller.certifications.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-5">
            <h3 className="font-semibold mb-3 text-black">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {seller.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="px-3 py-2 bg-[#1152A2] text-white rounded-md text-sm font-medium"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews preview */}
        <div className="bg-white border border-gray-200 rounded-md p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-black">Reviews ({reviews.length})</h3>
            <Link
              href={`/reviews/${seller.id}${missionId ? `?mission=${missionId}` : ""}`}
              className="text-sm text-[#1152A2] font-medium"
            >
              {reviews.length === 0 ? "Leave a Review" : "See all →"}
            </Link>
          </div>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">{review.buyerName}</span>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory */}
        {seller.inventory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-md p-5">
            <h3 className="font-semibold mb-4 text-black">Available Products</h3>
            <div className="space-y-3">
              {seller.inventory.map((item) => (
                <div
                  key={item.id}
                  data-item-id={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3 w-full">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-base mb-1 text-black">{item.name}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                        <span>MOQ: {item.moq} units</span>
                        <span className="hidden sm:inline">•</span>
                        <span>Lead: {item.leadTime}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className={item.stock > 0 ? "text-[#1152A2]" : "text-gray-400"}>
                          {item.stock > 0 ? `${item.stock} in stock` : "On request"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex flex-row sm:flex-col items-end justify-between sm:justify-end gap-1">
                    <div>
                      <p className="font-semibold text-black text-base sm:text-right">
                        {Number(item.price)} RWF
                      </p>
                      <p className="text-xs text-gray-600 sm:text-right">per unit</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {missionId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link
              href={`/chat/${missionId}?seller=${seller.id}`}
              className="block w-full py-4 rounded-md bg-[#EF7C29] text-white text-center font-semibold hover:bg-[#d96a1f]"
            >
              Start Conversation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
