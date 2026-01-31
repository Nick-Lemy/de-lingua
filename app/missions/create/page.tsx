"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUserProfile,
  saveMission,
  getSellers,
  saveMatch,
  generateId,
} from "@/lib/storage";
import type { Mission, Match } from "@/lib/storage";
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";
import {
  MdLocalOffer,
  MdCategory,
  MdInventory,
  MdLocationOn,
  MdAccessTime,
} from "react-icons/md";

const categories = [
  "Office Supplies",
  "Electronics",
  "Packaging",
  "Furniture",
  "Cleaning Supplies",
  "Industrial Equipment",
  "Food & Beverage",
  "Marketing Materials",
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

  const handleSubmit = () => {
    const user = getUserProfile();
    if (!user) {
      router.push("/welcome");
      return;
    }

    const mission: Mission = {
      id: generateId(),
      buyerId: user.id,
      product: formData.product,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 0,
      budgetMin: parseInt(formData.budgetMin) || 0,
      budgetMax: parseInt(formData.budgetMax) || 0,
      urgency: formData.urgency as "urgent" | "normal" | "flexible",
      location: formData.location,
      description: formData.description,
      status: "finding",
      createdAt: new Date().toISOString(),
      matches: [],
    };

    saveMission(mission);

    const sellers = getSellers();
    const relevantSellers = sellers.filter(
      (s) =>
        s.category.toLowerCase().includes(formData.category.toLowerCase()) ||
        formData.category.toLowerCase().includes(s.category.toLowerCase()),
    );

    relevantSellers.forEach((seller) => {
      const matchScore = 85 + Math.floor(Math.random() * 15);
      const distance = Math.floor(Math.random() * 500) + 10;
      const budgetMid = (mission.budgetMin + mission.budgetMax) / 2;
      const sellerAvgPrice =
        seller.inventory.length > 0
          ? seller.inventory.reduce((sum, item) => sum + item.price, 0) /
            seller.inventory.length
          : budgetMid;
      const budgetFit =
        Math.abs(budgetMid - sellerAvgPrice) < budgetMid * 0.3
          ? "good"
          : "moderate";

      const match: Match = {
        id: generateId(),
        missionId: mission.id,
        sellerId: seller.id,
        sellerName: seller.name,
        sellerAvatar: seller.avatar,
        matchScore,
        distance: `${distance}km`,
        budgetFit: budgetFit as "good" | "moderate" | "high",
        stockStatus: seller.inventory.length > 0 ? "in-stock" : "on-request",
        whyMatch: `${seller.name} specializes in ${seller.category} and has ${seller.inventory.length} products in stock. ${seller.verified ? "Verified supplier." : ""} Average delivery in ${seller.responseTime}.`,
        status: "pending",
      };

      saveMatch(match);
    });

    router.push(`/missions/${mission.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 pt-12 pb-6">
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
              <p className="text-blue-100 text-xs">Step {step} of 5</p>
            </div>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm bg-white"
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
                  className={`p-3 rounded-xl text-left transition-all text-sm font-medium ${
                    formData.category === cat
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-blue-300"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Budget Range (€)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={formData.budgetMin}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMin: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm bg-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={formData.budgetMax}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMax: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm bg-white"
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
                  className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all ${
                    formData.urgency === urg.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-gray-200 text-gray-900 hover:border-blue-300"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{urg.label}</p>
                    <p
                      className={`text-xs ${formData.urgency === urg.value ? "text-blue-100" : "text-gray-500"}`}
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
                placeholder="e.g., Berlin, Hamburg, Munich..."
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm bg-white"
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-sm resize-none bg-white"
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
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/30"
          >
            {step < 5 ? "Continue" : "Find Suppliers"}
          </button>
        </div>
      </div>
    </div>
  );
}
