"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
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
import type { Mission } from "@/lib/types";
import { IoArrowBack, IoCheckmarkCircle } from "react-icons/io5";

// identifiers correspond to feed.categories / missions-specific category keys
const categories = [
  "agriculture",
  "construction",
  "electronics",
  "textiles",
  "food",
  "handicrafts",
  "office",
  "machinery",
  "other",
];

const urgencies = [
  { value: "urgent", labelKey: "feedCreate.urgency.urgent", sublabelKey: "feedCreate.urgency.urgent.sublabel" },
  { value: "normal", labelKey: "feedCreate.urgency.normal", sublabelKey: "feedCreate.urgency.normal.sublabel" },
  { value: "flexible", labelKey: "feedCreate.urgency.flexible", sublabelKey: "feedCreate.urgency.flexible.sublabel" },
];

export default function CreateMissionPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, isConfigured, loading: authLoading } = useAuth();
  // Remove user state, use authUser/localUser directly
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    product: "",
    category: "",
    customCategory: "",
    quantity: "",
    budgetMin: "",
    budgetMax: "",
    urgency: "",
    location: "",
    description: "",
  });

  // useEffect(() => {
  //   settrue);
  // }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isConfigured) {
      if (!authUser) {
        router.push("/onboarding");
        return;
      }
    } else {
      const localUser = getUserProfile();
      if (!localUser) {
        router.push("/onboarding");
        return;
      }
    }
  }, [authLoading, authUser, isConfigured, router]);

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
        if (formData.category === "Other") {
          return formData.customCategory.trim().length > 0;
        }
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
    const currentUser = isConfigured ? authUser : getUserProfile();
    if (!currentUser) return;

    const missionId = isConfigured
      ? generateFirebaseId("mission")
      : generateId("mission");

    const mission: Mission = {
      id: missionId,
      buyerId: currentUser.id,
      product: formData.product,
      category:
        formData.category === "Other"
          ? formData.customCategory
          : formData.category,
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
              className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{t("missions.createMission")}</h1>
              <p className="text-slate-300 text-xs">{t("feedCreate.step", { step, total: 5 })}</p>
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
                {t("missions.step1.title")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("missions.step1.desc")}
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder={t("missions.titlePlaceholder")}
                value={formData.product}
                onChange={(e) =>
                  setFormData({ ...formData, product: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t("missions.step2.title")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("missions.step2.desc")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`p-3 rounded-md text-left text-sm font-medium ${
                    formData.category === cat
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  {t(`feed.categories.${cat}`)}
                </button>
              ))}
            </div>
            {formData.category === "Other" && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Please specify your category
                </label>
                <input
                  type="text"
                  placeholder={t("onboarding.enterCategory")}
                  value={formData.customCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, customCategory: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t("missions.step3.title")}
              </h2>
              <p className="text-sm text-gray-500">{t("missions.step3.desc")}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                placeholder={t("missions.quantityPlaceholder")}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Budget Range (RWF)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder={t("missions.budgetMinPlaceholder")}
                  value={formData.budgetMin}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMin: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                />
                <input
                  type="number"
                  placeholder={t("missions.budgetMaxPlaceholder")}
                  value={formData.budgetMax}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetMax: e.target.value })
                  }
                  className="px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t("missions.step4.title")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("missions.step4.desc")}
              </p>
            </div>
            <div className="space-y-2">
              {urgencies.map((urg) => (
                <button
                  key={urg.value}
                  onClick={() =>
                    setFormData({ ...formData, urgency: urg.value })
                  }
                  className={`w-full p-4 rounded-md text-left flex items-center justify-between ${
                    formData.urgency === urg.value
                      ? "bg-slate-800 text-white"
                      : "bg-white border border-gray-200 text-gray-900"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{t(urg.labelKey)}</p>
                    <p
                      className={`text-xs ${formData.urgency === urg.value ? "text-slate-300" : "text-gray-500"}`}
                    >
                      {t(urg.sublabelKey)}
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
                {t("missions.deliveryLocation")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("missions.deliveryLocationDesc")}
              </p>
            </div>
            <div>
              <input
                type="text"
                placeholder={t("missions.locationPlaceholder")}
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                {t("missions.additionalDetailsOptional")}
              </label>
              <textarea
                placeholder={t("missions.requirementsPlaceholder")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:border-slate-800 focus:ring-2 focus:ring-slate-100 focus:outline-none text-sm resize-none bg-white"
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
            className="w-full py-3 rounded-md bg-[#EF7C29] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d96a1f]"
          >
            {step < 5 ? t("missions.continue") : t("missions.findSuppliers")}
          </button>
        </div>
      </div>
    </div>
  );
}
