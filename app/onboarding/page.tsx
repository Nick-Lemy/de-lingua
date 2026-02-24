"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isFirebaseConfigured } from "@/lib/firebase";
import { signUp } from "@/lib/auth";
import {
  saveUserProfile,
  generateId,
  createSellerFromUser,
} from "@/lib/storage";

const buyerSteps = [
  {
    title: "What do you usually buy?",
    subtitle: "Select your main categories",
    type: "multi",
    key: "categories",
    options: [
      "Agricultural Products",
      "Construction Materials",
      "Electronics & Tech",
      "Textiles & Garments",
      "Food & Beverages",
      "Handicrafts & Art",
      "Office Supplies",
      "Machinery & Equipment",
      "Other",
    ],
  },
  {
    title: "What's your budget behavior?",
    subtitle: "This helps us find the right matches",
    type: "single",
    key: "budgetBehavior",
    options: ["Low-cost first", "Quality-first", "Premium only", "Flexible"],
  },
  {
    title: "Where do you prefer to source?",
    subtitle: "Set your location preference",
    type: "single",
    key: "locationRadius",
    options: [
      "Kigali City",
      "Within Province",
      "Nationwide (Rwanda)",
      "East Africa",
      "International",
    ],
  },
  {
    title: "What matters most to you?",
    subtitle: "Select your values",
    type: "multi",
    key: "values",
    options: [
      "Made in Rwanda",
      "Eco-friendly",
      "Fast delivery",
      "Certified quality",
      "Bulk discounts",
      "Flexible MOQ",
    ],
  },
];

const sellerSteps = [
  {
    title: "What do you sell?",
    subtitle: "Select your main categories",
    type: "multi",
    key: "categories",
    options: [
      "Agricultural Products",
      "Construction Materials",
      "Electronics & Tech",
      "Textiles & Garments",
      "Food & Beverages",
      "Handicrafts & Art",
      "Office Supplies",
      "Machinery & Equipment",
      "Other",
    ],
  },
  {
    title: "What's your business size?",
    subtitle: "Help buyers understand your capacity",
    type: "single",
    key: "capacity",
    options: [
      "Solo entrepreneur",
      "Small business (2-10)",
      "Mid-size (11-50)",
      "Enterprise (50+)",
    ],
  },
  {
    title: "Your delivery radius?",
    subtitle: "How far do you ship?",
    type: "single",
    key: "serviceRange",
    options: [
      "Kigali City",
      "Within Province",
      "Nationwide (Rwanda)",
      "East Africa",
      "International",
    ],
  },
  {
    title: "Minimum order value?",
    subtitle: "Set your business constraints",
    type: "single",
    key: "minOrderQty",
    options: [
      "No minimum",
      "50,000 RWF+",
      "200,000 RWF+",
      "500,000 RWF+",
      "1,000,000 RWF+",
    ],
  },
];

export default function OnboardingPage() {
  const [customCategory, setCustomCategory] = useState("");
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "seller" | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [showNameEmail, setShowNameEmail] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, string[]>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if Firebase is configured
    setIsConfigured(isFirebaseConfigured());
  }, []);

  const steps = role === "buyer" ? buyerSteps : sellerSteps;
  const currentStep = steps[step];

  const handleSelect = (option: string) => {
    const key = currentStep.key;
    const current = preferences[key] || [];

    if (currentStep.type === "single") {
      setPreferences({ ...preferences, [key]: [option] });
    } else {
      if (current.includes(option)) {
        setPreferences({
          ...preferences,
          [key]: current.filter((o) => o !== option),
        });
      } else {
        setPreferences({ ...preferences, [key]: [...current, option] });
      }
    }
  };

  const isSelected = (option: string) => {
    return (preferences[currentStep.key] || []).includes(option);
  };

  const isCategoryStep = currentStep.key === "categories";
  const selectedCategories = preferences.categories || [];
  const isOtherSelected =
    isCategoryStep && selectedCategories.includes("Other");
  const canContinue = isCategoryStep
    ? selectedCategories.length > 0 &&
      (!isOtherSelected || customCategory.trim().length > 0)
    : (preferences[currentStep.key] || []).length > 0;

  const handleContinue = () => {
    // If "Other" is selected, replace it with the custom value
    if (isCategoryStep && isOtherSelected && customCategory.trim().length > 0) {
      const filtered = selectedCategories.filter((cat) => cat !== "Other");
      setPreferences({
        ...preferences,
        categories: [...filtered, customCategory.trim()],
      });
    }
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Show name/email form before saving
      setShowNameEmail(true);
    }
  };

  const handleFinish = async () => {
    if (!name.trim() || !email.trim()) return;
    if (isConfigured && !password.trim()) return;

    setError("");
    setIsSubmitting(true);

    try {
      const userPreferences =
        role === "buyer"
          ? {
              categories: preferences.categories || [],
              budgetBehavior: preferences.budgetBehavior?.[0] || "",
              locationRadius: preferences.locationRadius?.[0] || "",
              values: preferences.values || [],
            }
          : undefined;

      const businessProfile =
        role === "seller"
          ? {
              storeName: storeName.trim() || name.trim(),
              category: preferences.categories?.[0] || "",
              products: preferences.categories || [],
              minOrderQty: preferences.minOrderQty?.[0] || "",
              location: preferences.locationRadius?.[0] || "Kigali, Rwanda",
              serviceRange: preferences.serviceRange?.[0] || "",
              capacity: preferences.capacity?.[0] || "",
            }
          : undefined;

      if (isConfigured) {
        // Use Firebase Auth
        await signUp(
          email.trim(),
          password,
          name.trim(),
          role!,
          userPreferences,
          businessProfile,
        );
      } else {
        // Use localStorage
        const userId = generateId("user");
        const userProfile = {
          id: userId,
          name: name.trim(),
          email: email.trim(),
          role: role!,
          avatar: name.trim()[0].toUpperCase(),
          preferences: userPreferences,
          businessProfile,
        };
        saveUserProfile(userProfile);

        // If seller, also create a Seller entry
        if (role === "seller") {
          createSellerFromUser(userProfile);
        }
      }

      router.push("/");
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen pt-8 lg:pt-0 bg-[#1152A2] flex flex-col">
        <div className="flex-1 flex flex-col justify-center px-6 lg:px-8 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-md flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="DeLingua"
                width={48}
                height={48}
                className="rounded-md"
              />
            </div>
            <span className="text-2xl font-bold text-white">DeLingua</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            Welcome to
            <br />
            DeLingua
          </h1>
          <p className="text-slate-300 text-base lg:text-lg mb-16">
            Choose your role to get started
          </p>

          <div className="space-y-4">
            <button onClick={() => setRole("buyer")} className="w-full">
              <div className="bg-white/10 border border-white/20 rounded-md p-6">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-2">
                      I&apos;m a Buyer
                    </h3>
                    <p className="text-slate-300">
                      Looking for suppliers and products
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-md bg-[#EF7C29] flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            <button onClick={() => setRole("seller")} className="w-full">
              <div className="bg-white/10 border border-white/20 rounded-md p-6">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-2">
                      I&apos;m a Seller
                    </h3>
                    <p className="text-slate-300">
                      Ready to showcase my products
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-md bg-white/20 flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="px-6 lg:px-8 pb-10 max-w-2xl mx-auto w-full relative z-10">
          <Link
            href="/login"
            className="block w-full py-4 text-slate-300 text-center text-sm"
          >
            I already have an account
          </Link>
        </div>
      </div>
    );
  }

  if (showNameEmail) {
    const canSubmit = isConfigured
      ? name.trim() &&
        email.trim() &&
        password.trim() &&
        password.length >= 6 &&
        (role !== "seller" || storeName.trim())
      : name.trim() && email.trim() && (role !== "seller" || storeName.trim());

    return (
      <div className="min-h-screen bg-[#1152A2] flex flex-col">
        <div className="flex-1 px-6 lg:px-8 pt-14 max-w-2xl mx-auto w-full">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
            Almost done!
          </h1>
          <p className="text-slate-300 text-base mb-10">
            {isConfigured
              ? "Create your account to get started"
              : "Tell us who you are"}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-md text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
              />
            </div>
            {role === "seller" && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Store / Business name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g., Kigali Fresh Produce, TechHub Rwanda"
                  className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
                />
                <p className="mt-2 text-xs text-slate-400">
                  This is how buyers will see your business
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
              />
            </div>
            {isConfigured && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Password must be at least 6 characters
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 lg:px-8 pb-10 max-w-2xl mx-auto w-full">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowNameEmail(false);
                setError("");
              }}
              disabled={isSubmitting}
              className="flex-1 py-4 border border-white/20 text-white font-semibold rounded-md disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={!canSubmit || isSubmitting}
              className={`flex-1 py-4 font-semibold rounded-md flex items-center justify-center gap-2 ${
                canSubmit && !isSubmitting
                  ? "bg-[#EF7C29] text-white hover:bg-[#d96a1f]"
                  : "bg-white/20 text-white/40 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Get Started"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1152A2] flex flex-col">
      <div className="px-6 lg:px-8 pt-14 max-w-2xl mx-auto w-full">
        <div className="flex gap-2 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${
                i <= step ? "bg-[#EF7C29]" : "bg-white/20"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-300">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <div className="flex-1 px-6 lg:px-8 pt-12 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
          {currentStep.title}
        </h1>
        <p className="text-slate-300 text-base">{currentStep.subtitle}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          {currentStep.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`px-6 py-4 rounded-md text-sm font-medium ${
                isSelected(option)
                  ? "bg-[#EF7C29] text-white border border-[#EF7C29]"
                  : "bg-white/10 border border-white/20 text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {isOtherSelected && (
          <div className="mt-6">
            <label className="block text-xs font-semibold text-gray-200 mb-2">
              Please specify your category
            </label>
            <input
              type="text"
              placeholder="Enter your category"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
              autoFocus
            />
          </div>
        )}
      </div>

      <div className="px-6 lg:px-8 pb-10 max-w-2xl mx-auto w-full">
        <div className="flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 border border-white/20 text-white font-semibold rounded-md"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex-1 py-4 font-semibold rounded-md ${
              canContinue
                ? "bg-[#EF7C29] text-white hover:bg-[#d96a1f]"
                : "bg-white/20 text-white/40 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
