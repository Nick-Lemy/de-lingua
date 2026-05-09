"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  getSellerById,
  getReviewsBySeller,
  hasReviewedSeller,
  saveReview,
  updateSellerRatingAndBadges,
  generateId,
} from "@/lib/storage";
import {
  getSellerById as getFirebaseSeller,
  getReviewsBySeller as getFirebaseReviews,
  hasReviewedSeller as firebaseHasReviewed,
  createReview,
  updateSellerRatingAndBadges as firebaseUpdateBadges,
} from "@/lib/db";
import type { UserProfile, Seller, Review } from "@/lib/types";
import { StarRating } from "@/components/StarRating";
import { SellerBadges } from "@/components/SellerBadges";
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";
import { HiStar } from "react-icons/hi2";

export default function ReviewsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const sellerId = params?.sellerId as string;
  const missionId = searchParams?.get("mission") || "";
  const initialRating = parseInt(searchParams?.get("initialRating") || "0");

  const [user, setUser] = useState<UserProfile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mounted, setMounted] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const [rating, setRating] = useState(initialRating || 5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading || !sellerId) return;

    const loadData = async () => {
      const isConfigured = isFirebaseConfigured();
      let currentUser: UserProfile | null = null;

      if (isConfigured) {
        currentUser = authUser || null;
      } else {
        currentUser = getUserProfile();
      }

      setUser(currentUser);

      let foundSeller: Seller | null = null;
      let foundReviews: Review[] = [];

      if (isConfigured) {
        [foundSeller, foundReviews] = await Promise.all([
          getFirebaseSeller(sellerId),
          getFirebaseReviews(sellerId),
        ]);
      } else {
        foundSeller = getSellerById(sellerId);
        foundReviews = getReviewsBySeller(sellerId);
      }

      if (!foundSeller) {
        router.push("/discover");
        return;
      }

      setSeller(foundSeller);
      setReviews(foundReviews);

      if (currentUser && missionId) {
        const reviewed = isConfigured
          ? await firebaseHasReviewed(currentUser.id, sellerId, missionId)
          : hasReviewedSeller(currentUser.id, sellerId, missionId);
        setAlreadyReviewed(reviewed);
      }
    };

    loadData();
  }, [mounted, authLoading, authUser, sellerId, missionId, router]);

  const handleSubmitReview = async () => {
    if (!user || !seller || rating === 0 || !missionId || submitting) return;

    setSubmitting(true);
    try {
      const isConfigured = isFirebaseConfigured();
      const review: Review = {
        id: generateId("rev"),
        sellerId: seller.id,
        buyerId: user.id,
        buyerName: user.name,
        buyerAvatar: user.avatar,
        rating,
        comment: comment.trim(),
        missionId,
        createdAt: new Date().toISOString(),
      };

      const allReviews = [...reviews, review];

      if (isConfigured) {
        await createReview(review);
        await firebaseUpdateBadges(seller.id, allReviews);
      } else {
        saveReview(review);
        updateSellerRatingAndBadges(seller.id, allReviews);
      }

      setReviews(allReviews);
      setAlreadyReviewed(true);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  if (!mounted || !seller) {
    return (
      <div className="min-h-screen bg-[#f8faff] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canReview = user?.role === "buyer" && missionId && !alreadyReviewed;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="min-h-screen bg-[#f8faff] pb-12">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1152A2] via-[#1a6bc9] to-[#0d3d7a] text-white px-5 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center shrink-0"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Reviews</h1>
              <p className="text-blue-200 text-sm">{seller.name}</p>
            </div>
          </div>

          {/* Rating summary */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-5">
              <div className="text-center shrink-0">
                <p className="text-5xl font-bold">{avgRating || "—"}</p>
                <StarRating value={avgRating} readonly size="sm" />
                <p className="text-blue-200 text-xs mt-1">{reviews.length} reviews</p>
              </div>
              <div className="w-px h-16 bg-white/20" />
              <div className="flex-1 space-y-1.5">
                {ratingDistribution.map(({ star, pct }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-blue-200 w-3">{star}</span>
                    <HiStar className="w-3 h-3 text-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(seller.badges ?? []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <SellerBadges badges={seller.badges ?? []} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5 space-y-4">
        {/* Leave a Review */}
        {canReview && !submitted && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Leave a Review</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Your rating</p>
              <StarRating value={rating} onChange={setRating} size="md" />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              placeholder="Share your experience with this supplier..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 resize-none transition-all"
            />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400">{comment.length}/200</span>
            </div>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
              className="w-full py-4 bg-[#EF7C29] text-white rounded-xl font-bold shadow-md shadow-orange-200/50 disabled:opacity-40 hover:bg-[#e06c1e] transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <IoCheckmarkCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-bold text-green-800">Review submitted!</p>
            <p className="text-sm text-green-600 mt-1">Thank you for your feedback.</p>
          </div>
        )}

        {alreadyReviewed && !submitted && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
            <p className="text-sm font-medium text-blue-700">You&apos;ve already reviewed this seller for this mission.</p>
          </div>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
              <HiStar className="w-6 h-6 text-amber-300" />
            </div>
            <p className="font-semibold text-gray-600">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to share your experience</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1152A2] to-[#1a6bc9] text-white flex items-center justify-center font-bold shrink-0">
                    {review.buyerAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{review.buyerName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <StarRating value={review.rating} readonly size="sm" />
                    {review.comment && (
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
