"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  saveUserProfile,
  generateId,
  initializeDummyData,
} from "@/lib/storage";

const buyerSteps = [
  {
    title: "What do you usually buy?",
    subtitle: "Select your main categories",
    type: "multi",
    key: "categories",
    options: [
      "Electronics",
      "Office Supplies",
      "Industrial",
      "Textiles",
      "Food & Beverage",
      "Raw Materials",
      "Packaging",
      "Furniture",
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
    title: "How far can you source?",
    subtitle: "Set your location preference",
    type: "single",
    key: "locationRadius",
    options: [
      "Local (50km)",
      "Regional (200km)",
      "Nationwide",
      "EU Wide",
      "Global",
    ],
  },
  {
    title: "What matters most to you?",
    subtitle: "Select your values",
    type: "multi",
    key: "values",
    options: [
      "Eco-friendly",
      "Local suppliers",
      "Fast delivery",
      "Certified products",
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
      "Electronics",
      "Office Supplies",
      "Industrial",
      "Textiles",
      "Food & Beverage",
      "Raw Materials",
      "Packaging",
      "Furniture",
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
      "Local (50km)",
      "Regional (200km)",
      "Nationwide",
      "EU Wide",
      "Global",
    ],
  },
  {
    title: "Minimum order quantity?",
    subtitle: "Set your business constraints",
    type: "single",
    key: "minOrderQty",
    options: ["No minimum", "€100+", "€500+", "€1000+", "€5000+"],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<"buyer" | "seller" | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showNameEmail, setShowNameEmail] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Initialize dummy data on mount
    initializeDummyData();
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

  const canContinue = (preferences[currentStep.key] || []).length > 0;

  const handleContinue = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Show name/email form before saving
      setShowNameEmail(true);
    }
  };

  const handleFinish = () => {
    if (!name.trim() || !email.trim()) return;

    const userId = generateId("user");

    if (role === "buyer") {
      saveUserProfile({
        id: userId,
        name: name.trim(),
        email: email.trim(),
        role: "buyer",
        avatar: name.trim()[0].toUpperCase(),
        preferences: {
          categories: preferences.categories || [],
          budgetBehavior: preferences.budgetBehavior?.[0] || "",
          locationRadius: preferences.locationRadius?.[0] || "",
          values: preferences.values || [],
        },
      });
    } else {
      saveUserProfile({
        id: userId,
        name: name.trim(),
        email: email.trim(),
        role: "seller",
        avatar: name.trim()[0].toUpperCase(),
        businessProfile: {
          category: preferences.categories?.[0] || "",
          products: preferences.categories || [],
          minOrderQty: preferences.minOrderQty?.[0] || "",
          location: "Germany",
          serviceRange: preferences.serviceRange?.[0] || "",
          capacity: preferences.capacity?.[0] || "",
        },
      });
    }

    router.push("/");
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-blue-950 flex flex-col relative overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-indigo-800/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-purple-800/20 blur-3xl" />

        <div className="flex-1 flex flex-col justify-center px-6 lg:px-8 max-w-2xl mx-auto w-full relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" fill="#312e81" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">DeLingua</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
            Welcome to
            <br />
            the future of B2B
          </h1>
          <p className="text-indigo-200 text-base lg:text-lg mb-16">
            Choose your role to get started
          </p>

          <div className="space-y-4">
            <button onClick={() => setRole("buyer")} className="w-full group">
              <div className="bg-teal-900/80 backdrop-blur-md border-2 border-teal-700 rounded-3xl p-6 hover:bg-teal-800 transition-all">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-2">
                      I'm a Buyer
                    </h3>
                    <p className="text-teal-100">
                      Looking for suppliers and products
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-teal-700 flex items-center justify-center group-hover:bg-white transition-colors">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white group-hover:text-black transition-colors"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>

            <button onClick={() => setRole("seller")} className="w-full group">
              <div className="bg-orange-900/80 backdrop-blur-md border-2 border-orange-700 rounded-3xl p-6 hover:bg-orange-800 transition-all">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white mb-2">
                      I'm a Seller
                    </h3>
                    <p className="text-orange-100">
                      Ready to showcase my products
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-orange-700 flex items-center justify-center group-hover:bg-white transition-colors">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-white group-hover:text-orange-900 transition-colors"
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
            href="/"
            className="block w-full py-4 text-indigo-200 text-center text-sm hover:text-white transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>
    );
  }

  if (showNameEmail) {
    return (
      <div className="min-h-screen bg-indigo-950 flex flex-col relative overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-purple-800/20 blur-3xl" />

        <div className="flex-1 px-6 lg:px-8 pt-14 max-w-2xl mx-auto w-full relative z-10">
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
            Almost done!
          </h1>
          <p className="text-indigo-200 text-base mb-10">Tell us who you are</p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-14 px-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-gray-600 outline-none focus:border-white/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full h-14 px-5 bg-indigo-900/50 backdrop-blur-md border-2 border-indigo-700 rounded-2xl text-white placeholder:text-indigo-300 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="px-6 lg:px-8 pb-10 max-w-2xl mx-auto w-full relative z-10">
          <div className="flex gap-4">
            <button
              onClick={() => setShowNameEmail(false)}
              className="flex-1 py-4 border-2 border-indigo-700 text-white font-semibold rounded-2xl backdrop-blur-md hover:bg-indigo-900/50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={!name.trim() || !email.trim()}
              className={`flex-1 py-4 font-semibold rounded-2xl transition-all ${
                name.trim() && email.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-indigo-900/30 text-indigo-400 cursor-not-allowed"
              }`}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-indigo-800/20 blur-3xl" />

      <div className="px-6 lg:px-8 pt-14 max-w-2xl mx-auto w-full relative z-10">
        <div className="flex gap-2 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? "bg-indigo-400" : "bg-indigo-900"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-purple-200">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      <div className="flex-1 px-6 lg:px-8 pt-12 max-w-2xl mx-auto w-full relative z-10">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
          {currentStep.title}
        </h1>
        <p className="text-purple-200 text-base">{currentStep.subtitle}</p>

        <div className="mt-10 flex flex-wrap gap-3">
          {currentStep.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`px-6 py-4 rounded-2xl text-sm font-medium transition-all ${
                isSelected(option)
                  ? "bg-indigo-600 text-white border-2 border-indigo-500"
                  : "bg-purple-900/50 backdrop-blur-md border-2 border-purple-700 text-white hover:bg-purple-800"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-10 max-w-2xl mx-auto w-full relative z-10">
        <div className="flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 border-2 border-purple-700 text-white font-semibold rounded-2xl backdrop-blur-md hover:bg-purple-900/50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex-1 py-4 font-semibold rounded-2xl transition-all ${
              canContinue
                ? "bg-indigo-600 text-white hover:bg-indigo-500"
                : "bg-purple-900/30 text-purple-400 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
