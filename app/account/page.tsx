"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getUserProfile, clearUserProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui";
import { BottomNav } from "@/components/BottomNav";
import { IoArrowBack, IoMail, IoLogOut } from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, signOut, isConfigured, loading } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isConfigured) {
      if (!loading && !authUser) {
        router.push("/onboarding");
      } else {
        setUser(authUser);
      }
    } else {
      const localUser = getUserProfile();
      if (!localUser) {
        router.push("/onboarding");
      } else {
        setUser(localUser);
      }
    }
  }, [mounted, loading, authUser, isConfigured, router]);

  const handleSignOut = async () => {
    if (isConfigured) {
      await signOut();
    } else {
      clearUserProfile();
    }
    router.push("/onboarding");
  };

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">{t("account.title")}</h1>
          </div>

          {/* User Card */}
          <div className="bg-white/10 rounded-md p-5 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#EF7C29] flex items-center justify-center text-2xl font-bold">
                {user.avatar}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{user.name}</h2>
                <p className="text-slate-300 text-sm flex items-center gap-1.5">
                  <IoMail className="w-3.5 h-3.5" />
                  {user.email}
                </p>
                <span className="inline-block mt-2 px-2.5 py-0.5 bg-white/20 rounded-lg text-xs font-medium capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5 max-w-xl mx-auto mt-6">
        {/* Preferences Summary */}
        {user.preferences && (
          <div className="mt-6 bg-white rounded-md border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">
              {t("account.preferences")}
            </h3>
            <div className="space-y-3 text-sm">
              {user.preferences.categories.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("account.categories")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.preferences.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user.preferences.budgetBehavior && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("account.budgetBehavior")}
                  </p>
                  <span className="px-2 py-1 bg-[#1152A2]/10 text-[#1152A2] rounded-lg text-xs">
                    {user.preferences.budgetBehavior}
                  </span>
                </div>
              )}
              {user.preferences.locationRadius && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {t("account.locationRadius")}
                  </p>
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                    {user.preferences.locationRadius}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Business Profile Summary */}
        {user.businessProfile && (
          <div className="mt-6 bg-white rounded-md border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">
              {t("account.businessProfile")}
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("account.category")}
                </p>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                  {user.businessProfile.category}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("account.serviceRange")}
                </p>
                <span className="px-2 py-1 bg-[#1152A2]/10 text-[#1152A2] rounded-lg text-xs">
                  {user.businessProfile.serviceRange}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {t("account.capacity")}
                </p>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                  {user.businessProfile.capacity}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <div className="mt-8">
          <Button
            variant="danger"
            fullWidth
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2"
          >
            <IoLogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>

        {/* Version Info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          DeLingua v1.0.0
        </p>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
