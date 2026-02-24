"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  getUserProfile,
  saveFeedPost,
  generateId,
  getSellers,
  getSellerById,
} from "@/lib/storage";
import {
  createFeedPost,
  generateId as generateFirebaseId,
  getAllSellers,
  getSellerById as getFirebaseSeller,
} from "@/lib/db";
import { generateFeedAISuggestions } from "@/app/actions/feed-matching";
import type {
  UserProfile,
  FeedPost,
  Seller,
  FeedAISuggestion,
} from "@/lib/types";
import {
  IoArrowBack,
  IoCheckmarkCircle,
  IoCamera,
  IoClose,
  IoSearchOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";

const categories = [
  "Agricultural Products",
  "Construction Materials",
  "Electronics & Tech",
  "Textiles & Garments",
  "Food & Beverages",
  "Handicrafts & Art",
  "Office Supplies",
  "Machinery & Equipment",
];

const urgencies = [
  { value: "urgent", label: "Urgent", sublabel: "1-3 days" },
  { value: "normal", label: "Normal", sublabel: "1-2 weeks" },
  { value: "flexible", label: "Flexible", sublabel: "1+ month" },
];

export default function CreateFeedPostPage() {
  const router = useRouter();
  const { user: authUser, isConfigured, loading: authLoading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "looking-for" as "looking-for" | "offering",
    title: "",
    description: "",
    category: "",
    budget: "",
    location: "",
    urgency: "" as "" | "urgent" | "normal" | "flexible",
    images: [] as string[],
  });

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted || authLoading) return;

    const loadUser = async () => {
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
    };

    loadUser();
  }, [mounted, authLoading, authUser, isConfigured, router]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return (
          formData.title.trim().length > 0 &&
          formData.description.trim().length > 0
        );
      case 2:
        return formData.category.length > 0;
      case 3:
        return formData.location.trim().length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const postId = isConfigured
        ? generateFirebaseId("post")
        : generateId("post");

      // Get AI suggestions if looking for something
      let aiSuggestions: FeedAISuggestion[] = [];
      if (formData.type === "looking-for") {
        try {
          const sellers = isConfigured ? await getAllSellers() : getSellers();
          aiSuggestions = await generateFeedAISuggestions(
            {
              title: formData.title,
              description: formData.description,
              category: formData.category,
              budget: formData.budget,
              location: formData.location,
            },
            sellers,
          );
        } catch (error) {
          console.error("AI suggestions failed:", error);
        }
      }

      const post: FeedPost = {
        id: postId,
        userId: user.id,
        userName: seller?.name || user.name,
        userAvatar: seller?.avatar || user.avatar,
        userRole: user.role,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: formData.budget || undefined,
        location: formData.location,
        urgency: formData.urgency || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        status: "active",
        createdAt: new Date().toISOString(),
        repliesCount: 0,
        aiSuggestions: aiSuggestions.length > 0 ? aiSuggestions : undefined,
      };

      if (isConfigured) {
        await createFeedPost(post);
      } else {
        saveFeedPost(post);
      }

      router.push(`/feed/${post.id}`);
    } catch (error) {
      console.error("Failed to create post:", error);
      setIsSubmitting(false);
    }
  };

  if (!mounted || authLoading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Create Post</h1>
              <p className="text-slate-300 text-xs">Step {step} of 3</p>
            </div>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EF7C29]"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-5 max-w-lg mx-auto mt-6">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                What would you like to post?
              </h2>
              <p className="text-sm text-gray-500">
                Share what you&apos;re looking for or offering
              </p>
            </div>

            {/* Post Type */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setFormData({ ...formData, type: "looking-for" })
                }
                className={`p-4 rounded-md border-2 text-left ${
                  formData.type === "looking-for"
                    ? "border-[#EF7C29] bg-[#EF7C29]/5"
                    : "border-gray-200"
                }`}
              >
                <div className="text-2xl mb-2">
                  <IoSearchOutline className="w-7 h-7 text-[#EF7C29]" />
                </div>
                <h3 className="font-semibold text-gray-900">Looking For</h3>
                <p className="text-xs text-gray-500 mt-1">Something you need</p>
              </button>
              <button
                onClick={() => setFormData({ ...formData, type: "offering" })}
                className={`p-4 rounded-md border-2 text-left ${
                  formData.type === "offering"
                    ? "border-[#1152A2] bg-[#1152A2]/5"
                    : "border-gray-200"
                }`}
              >
                <div className="text-2xl mb-2">
                  <IoStorefrontOutline className="w-7 h-7 text-[#1152A2]" />
                </div>
                <h3 className="font-semibold text-gray-900">Offering</h3>
                <p className="text-xs text-gray-500 mt-1">Something you have</p>
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                placeholder={
                  formData.type === "looking-for"
                    ? "e.g., Looking for office chairs"
                    : "e.g., Fresh vegetables available"
                }
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 focus:outline-none text-sm bg-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                placeholder="Describe what you need or what you're offering in detail..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 focus:outline-none text-sm bg-white resize-none"
              />
            </div>

            {/* Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (optional)
              </label>
              <div className="space-y-3">
                {/* Image Previews */}
                {formData.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter(
                              (_, i) => i !== idx,
                            );
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <IoClose className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {formData.images.length < 4 && (
                  <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-[#1152A2] hover:bg-[#1152A2]/5 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <IoCamera className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Add photos
                      </p>
                      <p className="text-xs text-gray-500">
                        Up to 4 images, max 2MB each
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 4 - formData.images.length;
                        const filesToProcess = files.slice(0, remaining);

                        filesToProcess.forEach((file) => {
                          if (file.size > 2 * 1024 * 1024) {
                            alert(
                              `${file.name} is too large. Max size is 2MB.`,
                            );
                            return;
                          }

                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64 = event.target?.result as string;
                            setFormData((prev) => ({
                              ...prev,
                              images: [...prev.images, base64],
                            }));
                          };
                          reader.readAsDataURL(file);
                        });

                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Select a category
              </h2>
              <p className="text-sm text-gray-500">
                Help others find your post
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`p-4 rounded-md border-2 text-left ${
                    formData.category === cat
                      ? "border-[#1152A2] bg-[#1152A2]/5"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {formData.category === cat && (
                      <IoCheckmarkCircle className="w-5 h-5 text-[#1152A2]" />
                    )}
                    <span className="font-medium text-sm text-gray-900">
                      {cat}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Additional details
              </h2>
              <p className="text-sm text-gray-500">
                Optional info to help with matching
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                placeholder="e.g., Kigali, Rwanda"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 focus:outline-none text-sm bg-white"
              />
            </div>

            {/* Budget (only for looking-for) */}
            {formData.type === "looking-for" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 50,000 - 100,000 RWF"
                  value={formData.budget}
                  onChange={(e) =>
                    setFormData({ ...formData, budget: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 focus:outline-none text-sm bg-white"
                />
              </div>
            )}

            {/* Urgency */}
            {formData.type === "looking-for" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency (optional)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {urgencies.map((u) => (
                    <button
                      key={u.value}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          urgency:
                            formData.urgency === u.value
                              ? ""
                              : (u.value as "urgent" | "normal" | "flexible"),
                        })
                      }
                      className={`p-3 rounded-md border-2 text-center ${
                        formData.urgency === u.value
                          ? u.value === "urgent"
                            ? "border-red-500 bg-red-50"
                            : "border-[#1152A2] bg-[#1152A2]/5"
                          : "border-gray-200"
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">
                        {u.label}
                      </p>
                      <p className="text-[10px] text-gray-500">{u.sublabel}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestion Info */}
            {formData.type === "looking-for" && (
              <div className="bg-linear-to-r from-[#1152A2]/5 to-[#EF7C29]/5 rounded-md p-4 border border-[#1152A2]/10">
                <div className="flex items-center gap-2 mb-2">
                  <HiSparkles className="w-5 h-5 text-[#EF7C29]" />
                  <span className="font-semibold text-[#1152A2]">
                    AI Matching
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  When you post, our AI will automatically find and suggest
                  matching suppliers based on your requirements.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 z-50">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-semibold"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-[#1152A2] text-white rounded-md font-semibold disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 py-3 bg-[#EF7C29] text-white rounded-md font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <HiSparkles className="w-5 h-5" />
                  Post to Feed
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
