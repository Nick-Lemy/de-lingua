"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  getUserProfile,
  getFeedPostById,
  getRepliesByPost,
  saveFeedReply,
  generateId,
  getSellerById,
} from "@/lib/storage";
import {
  getFeedPostById as getFirebasePost,
  getRepliesByPost as getFirebaseReplies,
  createFeedReply,
  generateId as generateFirebaseId,
  getSellerById as getFirebaseSeller,
} from "@/lib/db";
import type { UserProfile, FeedPost, FeedReply, Seller } from "@/lib/types";
import {
  IoArrowBack,
  IoTime,
  IoLocationSharp,
  IoSend,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoChatbubbles,
} from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";

export default function FeedPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user: authUser, isConfigured, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [post, setPost] = useState<FeedPost | null>(null);
  const [replies, setReplies] = useState<FeedReply[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyType, setReplyType] = useState<
    "have-it" | "interested" | "pass" | "comment"
  >("have-it");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyPrice, setReplyPrice] = useState("");
  const [replyAvailability, setReplyAvailability] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    const loadData = async () => {
      const postId = params?.id as string;
      if (!postId) return;

      let currentUser: UserProfile | null = null;

      if (isConfigured) {
        if (!authUser) {
          router.push("/onboarding");
          return;
        }
        currentUser = authUser;
      } else {
        currentUser = getUserProfile();
        if (!currentUser) {
          router.push("/onboarding");
          return;
        }
      }

      setUser(currentUser);

      // Load seller profile if user is a seller
      if (currentUser.role === "seller") {
        let sellerData: Seller | null = null;
        if (isConfigured) {
          sellerData = await getFirebaseSeller(currentUser.id);
        } else {
          sellerData = getSellerById(currentUser.id);
        }
        setSeller(sellerData);
      }

      // Load post
      let foundPost: FeedPost | null = null;
      let foundReplies: FeedReply[] = [];

      if (isConfigured) {
        foundPost = await getFirebasePost(postId);
        if (foundPost) {
          foundReplies = await getFirebaseReplies(postId);
        }
      } else {
        foundPost = getFeedPostById(postId);
        if (foundPost) {
          foundReplies = getRepliesByPost(postId);
        }
      }

      if (!foundPost) {
        router.push("/feed");
        return;
      }

      setPost(foundPost);
      setReplies(foundReplies);
    };

    loadData();
  }, [mounted, authLoading, authUser, isConfigured, params, router]);

  const handleSendReply = async () => {
    if (!user || !post || isSending) return;
    if (replyType !== "pass" && !replyMessage.trim()) return;

    setIsSending(true);

    // Only include price if non-empty string
    const reply: FeedReply = {
      id: isConfigured ? generateFirebaseId("reply") : generateId("reply"),
      postId: post.id,
      userId: user.id,
      userName: seller?.name || user.name,
      userAvatar: seller?.avatar || user.avatar,
      userRole: user.role,
      type: replyType,
      message:
        replyType === "pass" ? "Passed on this request" : replyMessage.trim(),
      ...(replyPrice.trim() ? { price: replyPrice } : {}),
      ...(replyAvailability.trim() ? { availability: replyAvailability } : {}),
      createdAt: new Date().toISOString(),
    };

    try {
      if (isConfigured) {
        await createFeedReply(reply);
      } else {
        saveFeedReply(reply);
      }

      setReplies([...replies, reply]);
      setShowReplyForm(false);
      setReplyMessage("");
      setReplyPrice("");
      setReplyAvailability("");
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsSending(false);
    }
  };

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

  const getReplyTypeStyle = (type: string) => {
    switch (type) {
      case "have-it":
        return "bg-green-100 text-green-700 border-green-200";
      case "interested":
        return "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20";
      case "pass":
        return "bg-gray-100 text-gray-500 border-gray-200";
      case "comment":
        return "bg-[#EF7C29]/10 text-[#EF7C29] border-[#EF7C29]/20";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getReplyTypeLabel = (type: string) => {
    switch (type) {
      case "have-it":
        return "I have this!";
      case "interested":
        return "Interested";
      case "pass":
        return "Passed";
      case "comment":
        return "Comment";
      default:
        return type;
    }
  };

  if (!mounted || authLoading || !user || !post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isOwner = post.userId === user.id;
  const canReply =
    user.role === "seller" && post.type === "looking-for" && !isOwner;
  const hasReplied = replies.some((r) => r.userId === user.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Post Details</h1>
              <p className="text-slate-300 text-xs">
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto mt-4">
        {/* Post Card */}
        <div className="bg-white rounded-md border border-gray-200 p-4 mb-4">
          {/* Author */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#1152A2] text-white flex items-center justify-center text-lg font-bold shrink-0">
              {post.userAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">
                  {post.userName}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    post.type === "looking-for"
                      ? "bg-[#EF7C29]/10 text-[#EF7C29]"
                      : "bg-[#1152A2]/10 text-[#1152A2]"
                  }`}
                >
                  {post.type === "looking-for" ? "Looking for" : "Offering"}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
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

          {/* Content */}
          <h2 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h2>
          <p className="text-gray-600 mb-4 whitespace-pre-wrap">
            {post.description}
          </p>

          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div
              className={`mb-4 ${post.images.length === 1 ? "" : "grid grid-cols-2 gap-2"}`}
            >
              {post.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-lg ${
                    post.images!.length === 1 ? "h-64" : "h-32"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${post.title} - ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(img, "_blank")}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
              {post.category}
            </span>
            {post.budget && (
              <span className="px-3 py-1.5 bg-[#1152A2]/10 text-[#1152A2] rounded-lg text-sm font-medium">
                Budget: {post.budget}
              </span>
            )}
            {post.urgency && (
              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                  post.urgency === "urgent"
                    ? "bg-red-100 text-red-700"
                    : post.urgency === "normal"
                      ? "bg-[#1152A2]/10 text-[#1152A2]"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {post.urgency}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                post.status === "active"
                  ? "bg-green-100 text-green-700"
                  : post.status === "fulfilled"
                    ? "bg-[#1152A2]/10 text-[#1152A2]"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {post.status}
            </span>
          </div>
        </div>

        {/* AI Suggestions */}
        {post.aiSuggestions && post.aiSuggestions.length > 0 && (
          <div className="bg-linear-to-br from-[#1152A2]/5 to-[#EF7C29]/5 rounded-md border border-[#1152A2]/10 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <HiSparkles className="w-5 h-5 text-[#EF7C29]" />
              <h3 className="font-semibold text-[#1152A2]">
                AI Suggested Suppliers
              </h3>
            </div>
            <div className="space-y-3">
              {post.aiSuggestions.map((suggestion, i) => (
                <Link
                  key={i}
                  href={`/sellers/${suggestion.sellerId}`}
                  className="flex items-center gap-3 bg-white rounded-md p-3 border border-[#1152A2]/10"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1152A2] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {suggestion.sellerAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {suggestion.sellerName}
                      </span>
                      <span className="text-sm text-[#EF7C29] font-semibold">
                        {suggestion.matchScore}% match
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.reason}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Replies Section */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <IoChatbubbles className="w-5 h-5 text-[#1152A2]" />
            Responses ({replies.length})
          </h3>

          {replies.length === 0 ? (
            <div className="bg-white rounded-md border border-gray-200 p-6 text-center">
              <p className="text-gray-500">No responses yet</p>
              {canReply && !hasReplied && (
                <p className="text-sm text-gray-400 mt-1">
                  Be the first to respond!
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-white rounded-md border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1152A2] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {reply.userAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {reply.userName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getReplyTypeStyle(
                            reply.type,
                          )}`}
                        >
                          {getReplyTypeLabel(reply.type)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatTime(reply.createdAt)}
                      </p>
                      <p className="text-gray-700 mt-2">{reply.message}</p>
                      {(reply.price || reply.availability) && (
                        <div className="flex gap-3 mt-2">
                          {reply.price && (
                            <span className="text-sm text-[#1152A2] font-medium">
                              Price: {reply.price}
                            </span>
                          )}
                          {reply.availability && (
                            <span className="text-sm text-gray-600">
                              Available: {reply.availability}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action for post owner */}
                  {isOwner && reply.type === "have-it" && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      <Link
                        href={`/sellers/${reply.userId}`}
                        className="flex-1 py-2 bg-[#1152A2] text-white rounded-lg text-sm font-medium text-center"
                      >
                        View Supplier
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply Form (for sellers) */}
      {canReply && !hasReplied && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 z-50">
          <div className="max-w-lg mx-auto">
            {!showReplyForm ? (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setReplyType("have-it");
                    setShowReplyForm(true);
                  }}
                  className="flex-1 py-3 bg-green-500 text-white rounded-md font-semibold flex items-center justify-center gap-2"
                >
                  <IoCheckmarkCircle className="w-5 h-5" />I Have This
                </button>
                <button
                  onClick={() => {
                    setReplyType("pass");
                    handleSendReply();
                  }}
                  className="px-5 py-3 bg-gray-200 text-gray-700 rounded-md font-semibold flex items-center justify-center gap-2"
                >
                  <IoCloseCircle className="w-5 h-5" />
                  Pass
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["have-it", "interested", "comment"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setReplyType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          replyType === type
                            ? getReplyTypeStyle(type)
                            : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}
                      >
                        {getReplyTypeLabel(type)}
                      </button>
                    ),
                  )}
                </div>

                {replyType === "have-it" && (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Your price (optional)"
                      value={replyPrice}
                      onChange={(e) => setReplyPrice(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1152A2] focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Availability (optional)"
                      value={replyAvailability}
                      onChange={(e) => setReplyAvailability(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1152A2] focus:outline-none"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Write your response..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-md text-sm focus:border-[#1152A2] focus:outline-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || isSending}
                    className="px-4 py-3 bg-[#1152A2] text-white rounded-md disabled:opacity-50"
                  >
                    <IoSend className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={() => setShowReplyForm(false)}
                  className="w-full text-sm text-gray-500 py-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Already replied message */}
      {canReply && hasReplied && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 z-50">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-gray-500 text-sm">
              <IoCheckmarkCircle className="w-4 h-4 inline mr-1 text-green-500" />
              You&apos;ve already responded to this post
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
