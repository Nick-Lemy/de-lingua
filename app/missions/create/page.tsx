"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getUserProfile,
  saveMission,
  getSellers,
  saveMatch,
  generateId,
} from "@/lib/storage";
import {
  createMission as createFirebaseMission,
  createMatch as createFirebaseMatch,
  getAllSellers,
  generateId as generateFirebaseId,
} from "@/lib/db";
import { generateAIMatches } from "@/app/actions/matching";
import type { Mission, Match } from "@/lib/types";
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";

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

export default function CreateMissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    product: "",
    category: "",
    quantity: "",
    budgetMin: "",
    budgetMax: "",
    urgency: "",
    location: "",
    description: "",
  });

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.product.trim().length > 0;
      case 2:
        return formData.category.length > 0;
      case 3:
        return (
          formData.quantity.trim().length > 0 &&
          formData.budgetMin &&
          formData.budgetMax
        );
      case 4:
        return formData.urgency.length > 0;
      case 5:
        return formData.location.trim().length > 0;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    const isConfigured = isFirebaseConfigured();
    const user = getUserProfile();
    if (!user) {
      router.push("/onboarding");
      return;
    }

    const missionId = isConfigured
      ? generateFirebaseId("mission")
      : generateId("mission");

    const mission: Mission = {
      id: missionId,
      buyerId: user.id,
      product: formData.product,
      category: formData.category,
      quantity: formData.quantity,
      budgetMin: formData.budgetMin,
      budgetMax: formData.budgetMax,
      urgency: formData.urgency as "urgent" | "normal" | "flexible",
      location: formData.location,
      description: formData.description,
      status: "finding",
      createdAt: new Date().toISOString(),
      matches: [],
    };

    if (isConfigured) {
      await createFirebaseMission(mission);
    } else {
      saveMission(mission);
    }

    // Get sellers and generate AI-powered matches
    const sellers = isConfigured ? await getAllSellers() : getSellers();
    const idPrefix = isConfigured ? "match" : "match";

    try {
      // Use AI matching (server action)
      const matches = await generateAIMatches(mission, sellers, idPrefix);

      // Save matches
      for (const match of matches) {
        const matchWithId = {
          ...match,
          id: isConfigured ? generateFirebaseId("match") : generateId("match"),
        };

        if (isConfigured) {
          await createFirebaseMatch(matchWithId);
        } else {
          saveMatch(matchWithId);
        }
      }
    } catch (error) {
      console.error("AI matching failed:", error);
      // Matches will be empty if AI fails - that's okay
    }

    router.push(`/missions/${mission.id}`);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Create Mission</h1>
              <p className="text-slate-300 text-xs">Step {step} of 5</p>
            </div>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EF7C29]"
              style={{ width: `${(step / 5) * 100}%` }}
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
                What do you need?
              </h2>
              <p className="text-sm text-gray-500">
                Describe the product or service
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder="e.g., Office chairs, USB cables..."
                value={formData.product}
                onChange={(e) =>
                  setFormData({ ...formData, product: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Select category
              </h2>
              <p className="text-sm text-gray-500">
                Helps us find the right suppliers
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`p-3 rounded-xl text-left text-sm font-medium ${
                    formData.category === cat
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Quantity & Budget
              </h2>
              <p className="text-sm text-gray-500">How much do you need?</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                placeholder="e.g., 50"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Budget Range (RWF)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={formData.budgetMin}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMin: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={formData.budgetMax}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMax: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                How urgent?
              </h2>
              <p className="text-sm text-gray-500">
                Helps suppliers prioritize
              </p>
            </div>
            <div className="space-y-2">
              {urgencies.map((urg) => (
                <button
                  key={urg.value}
                  onClick={() =>
                    setFormData({ ...formData, urgency: urg.value })
                  }
                  className={`w-full p-4 rounded-xl text-left flex items-center justify-between ${
                    formData.urgency === urg.value
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{urg.label}</p>
                    <p
                      className={`text-xs ${formData.urgency === urg.value ? "text-slate-300" : "text-gray-500"}`}
                    >
                      {urg.sublabel}
                    </p>
                  </div>
                  {formData.urgency === urg.value && (
                    <IoCheckmarkCircle className="w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Delivery location
              </h2>
              <p className="text-sm text-gray-500">
                Where should they deliver?
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder="e.g., Kigali, Musanze, Rubavu..."
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Additional details (optional)
              </label>
              <textarea
                placeholder="Any specific requirements..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm resize-none bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-3">
        <div className="max-w-lg mx-auto">
          <button
            onClick={step < 5 ? handleNext : handleSubmit}
            disabled={!canProceed()}
            className="w-full py-3 rounded-xl bg-[#EF7C29] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d96a1f]"
          >
            {step < 5 ? "Continue" : "Find Suppliers"}
          </button>
        </div>
      </div>
    </div>
  );
}
