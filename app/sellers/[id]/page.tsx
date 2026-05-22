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
  getMissions,
  incrementProfileView as incrementProfileViewLocal,
  incrementItemView as incrementItemViewLocal,
} from "@/lib/storage";
import {
  getSellerById as getFirebaseSeller,
  getReviewsBySeller as getFirebaseReviews,
  getMissionsByBuyer,
  incrementProfileView as incrementProfileViewFirebase,
  incrementItemView as incrementItemViewFirebase,
} from "@/lib/db";
import type { Seller, Review, UserProfile, Mission } from "@/lib/types";
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
  const [buyerMissions, setBuyerMissions] = useState<Mission[]>([]);
  const [showMissionPicker, setShowMissionPicker] = useState(false);
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
        if (currentUser?.role === "buyer") {
          const missions = await getMissionsByBuyer(currentUser.id);
          setBuyerMissions(
            missions.filter((m) => m.status === "finding" || m.status === "matched"),
          );
        }
      } else {
        foundSeller = getSellerById(id);
        foundReviews = getReviewsBySeller(id);
        if (currentUser?.role === "buyer") {
          const missions = getMissions().filter(
            (m) =>
              m.buyerId === currentUser.id &&
              (m.status === "finding" || m.status === "matched"),
          );
          setBuyerMissions(missions);
        }
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
                {seller.subscriptionTier === "pro" && (
                  <span className="flex items-center gap-1 text-xs bg-[#EF7C29] px-2 py-0.5 rounded-full font-bold">
                    ⭐ Pro
                  </span>
                )}
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
      {user?.role === "buyer" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-pb">
          <div className="max-w-2xl mx-auto px-5 py-4 space-y-2">
            {/* WhatsApp single-tap for Pro sellers */}
            {seller.subscriptionTier === "pro" && seller.whatsappNumber && (
              <a
                href={`https://wa.me/${seller.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-bold shadow-md hover:bg-[#1ebe57] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Directly
              </a>
            )}
            {missionId ? (
              <Link
                href={`/chat/${missionId}?seller=${seller.id}`}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#EF7C29] text-white font-bold shadow-lg shadow-orange-200/60 hover:bg-[#e06c1e] transition-colors"
              >
                <IoChatbubble className="w-5 h-5" />
                Start Conversation
              </Link>
            ) : (
              <button
                onClick={() => setShowMissionPicker(true)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#EF7C29] text-white font-bold shadow-lg shadow-orange-200/60 hover:bg-[#e06c1e] transition-colors"
              >
                <IoChatbubble className="w-5 h-5" />
                Contact Seller
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mission Picker Modal */}
      {showMissionPicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowMissionPicker(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Select a Mission
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Which mission is this for?
            </p>
            {buyerMissions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">
                  You don&apos;t have any active missions yet.
                </p>
                <Link
                  href="/missions/create"
                  className="inline-block px-5 py-2.5 bg-[#EF7C29] text-white rounded-md text-sm font-semibold"
                >
                  Create a Mission
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {buyerMissions.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/chat/${mission.id}?seller=${seller.id}`}
                    className="block p-4 rounded-xl border border-gray-200 hover:border-[#EF7C29] hover:bg-orange-50 transition-colors"
                  >
                    <p className="font-semibold text-sm text-gray-900">
                      {mission.product}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {mission.category} · {mission.location}
                    </p>
                  </Link>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowMissionPicker(false)}
              className="w-full mt-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
