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
import { IoArrowBack } from "react-icons/io5";

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

  // Form state
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canReview = user?.role === "buyer" && missionId && !alreadyReviewed;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-md bg-white/10 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Reviews</h1>
              <p className="text-slate-300 text-sm">{seller.name}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">{avgRating || "—"}</p>
              <StarRating value={avgRating} readonly size="sm" />
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <p className="font-semibold">{reviews.length} reviews</p>
              <SellerBadges badges={seller.badges ?? []} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5 space-y-4">
        {/* Leave a Review form */}
        {canReview && !submitted && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-3">Leave a Review</h2>
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-1">Your rating</p>
              <StarRating value={rating} onChange={setRating} size="md" />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 200))}
              placeholder="Share your experience..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[#1152A2] resize-none"
            />
            <p className="text-xs text-gray-400 text-right mb-3">{comment.length}/200</p>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || rating === 0}
              className="w-full py-3 bg-[#EF7C29] text-white rounded-md font-semibold disabled:opacity-40 hover:bg-[#d96a1f]"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="font-semibold text-green-800">Thank you for your review!</p>
          </div>
        )}

        {alreadyReviewed && !submitted && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-sm text-blue-700">You&apos;ve already reviewed this seller for this mission.</p>
          </div>
        )}

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to review this seller</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-[#1152A2] text-white flex items-center justify-center font-bold text-sm">
                  {review.buyerAvatar}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{review.buyerName}</p>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
