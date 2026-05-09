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
import {
  IoCheckmarkCircle,
  IoLocationSharp,
  IoChatbubble,
  IoStorefront,
} from "react-icons/io5";
import { HiStar } from "react-icons/hi2";

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

      if (configured) {
        incrementProfileViewFirebase(id).catch(() => {});
      } else {
        incrementProfileViewLocal(id);
      }
    };

    if (!authLoading) loadSeller();
  }, [params, router, authUser, isConfigured, authLoading]);

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
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : seller.rating;

  const reviewCount = reviews.length === 0 ? seller.reviews : reviews.length;

  return (
    <div className="min-h-screen bg-[#f8faff] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-12 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-5 w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center"
          >
            <BiLeftArrowAlt className="w-6 h-6" />
          </button>

          {/* Seller identity */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EF7C29] flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg">
              {seller.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{seller.name}</h1>
                {seller.verified && (
                  <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                    <IoCheckmarkCircle className="w-3 h-3 text-[#EF7C29]" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-blue-200 text-sm mt-0.5">{seller.category}</p>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm">
                  <HiStar className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">{avgRating}</span>
                  <span className="text-blue-200">({reviewCount} reviews)</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm text-blue-200">
                  <IoLocationSharp className="w-3.5 h-3.5" />
                  {seller.location}
                </span>
              </div>

              {(seller.badges ?? []).length > 0 && (
                <div className="mt-3">
                  <SellerBadges badges={seller.badges ?? []} />
                </div>
              )}
            </div>

            {user?.role === "buyer" && (
              <div className="shrink-0">
                <WishlistButton
                  sellerId={seller.id}
                  sellerName={seller.name}
                  sellerAvatar={seller.avatar}
                  sellerCategory={seller.category}
                  buyerId={user.id}
                  isConfigured={isFirebaseConfigured()}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-5 max-w-2xl mx-auto mt-5 space-y-4">
        {/* About */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{seller.description}</p>
        </div>

        {/* Key Details */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Key Details</h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: FaBoxOpen, label: "Minimum Order", value: seller.minOrder },
              { icon: FaTruck, label: "Service Range", value: seller.serviceRange },
              { icon: FaClock, label: "Response Time", value: seller.responseTime },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="text-[#1152A2]" size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        {seller.certifications.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {seller.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-[#1152A2]/8 text-[#1152A2] rounded-xl text-xs font-semibold border border-[#1152A2]/15"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews preview */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">Reviews</h3>
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center">
                {reviewCount}
              </span>
            </div>
            <Link
              href={`/reviews/${seller.id}${missionId ? `?mission=${missionId}` : ""}`}
              className="text-xs font-semibold text-[#1152A2]"
            >
              {reviews.length === 0 ? "Leave a Review" : "See all →"}
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-400">No reviews yet — be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1152A2] to-[#1a6bc9] text-white flex items-center justify-center text-xs font-bold">
                      {review.buyerAvatar}
                    </div>
                    <span className="font-semibold text-sm text-gray-900">{review.buyerName}</span>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 pl-9">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory */}
        {seller.inventory.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Available Products</h3>
            <div className="space-y-4">
              {seller.inventory.map((item) => (
                <div
                  key={item.id}
                  data-item-id={item.id}
                  className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                      <IoStorefront className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mb-2">
                      <span>MOQ: {item.moq} units</span>
                      <span>·</span>
                      <span>Lead time: {item.leadTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-gray-900">
                        {Number(item.price).toLocaleString()} <span className="text-xs font-normal text-gray-400">RWF/unit</span>
                      </p>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          item.stock > 0
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        {item.stock > 0 ? `${item.stock} in stock` : "On request"}
                      </span>
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
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-pb">
          <div className="max-w-2xl mx-auto px-5 py-4">
            <Link
              href={`/chat/${missionId}?seller=${seller.id}`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#EF7C29] text-white font-bold shadow-lg shadow-orange-200/60 hover:bg-[#e06c1e] transition-colors"
            >
              <IoChatbubble className="w-5 h-5" />
              Start Conversation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
