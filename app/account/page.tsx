"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getUserProfile, clearUserProfile, saveUserProfile, updateSeller as updateLocalSeller } from "@/lib/storage";
import { createOrUpdateUser, updateSeller as updateFirebaseSeller } from "@/lib/db";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui";
import { BottomNav } from "@/components/BottomNav";
import Link from "next/link";
import { IoArrowBack, IoMail, IoLogOut, IoPencil, IoCheckmark, IoClose, IoStar, IoTrashOutline } from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { deleteAccount } from "@/lib/auth";

export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user: authUser, signOut, isConfigured, loading, refreshUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(() => authUser || (typeof window !== "undefined" ? getUserProfile() : null));
  const [mounted, setMounted] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(() => (authUser?.name || (typeof window !== "undefined" ? getUserProfile()?.name : "") || ""));
  const [savingName, setSavingName] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
      if (!editingName) setNameValue(authUser.name);
    }
  }, [authUser, editingName]);

  useEffect(() => {
    if (!mounted || (loading && !user)) return;

    if (isConfigured) {
      if (!loading && !authUser && !user) {
        router.push("/onboarding");
      }
    } else {
      const localUser = user || getUserProfile();
      if (!localUser) {
        router.push("/onboarding");
      }
    }
  }, [mounted, loading, authUser, isConfigured, router, user]);

  const handleSignOut = async () => {
    if (isConfigured) {
      await signOut();
    } else {
      clearUserProfile();
    }
    router.push("/onboarding");
  };

  const handleSaveName = async () => {
    if (!user || !nameValue.trim() || nameValue.trim() === user.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const newAvatar = nameValue.trim()[0].toUpperCase();
    const updated: UserProfile = { ...user, name: nameValue.trim(), avatar: newAvatar };
    try {
      if (isConfigured) {
        await createOrUpdateUser(updated);
        if (user.role === "seller") {
          await updateFirebaseSeller(user.id, { name: nameValue.trim(), avatar: newAvatar });
        }
        await refreshUser();
      } else {
        saveUserProfile(updated);
        if (user.role === "seller") {
          updateLocalSeller(user.id, { name: nameValue.trim(), avatar: newAvatar });
        }
        setUser(updated);
      }
      setEditingName(false);
    } catch (err) {
      console.error("Failed to save name:", err);
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleting) return;
    setDeleting(true);
    try {
      await deleteAccount(user.id);
      await signOut();
      router.push("/onboarding");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setDeleting(false);
    }
  };

  if ((!mounted && !user) || (loading && !user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1152A2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-[#1152A2] text-white px-5 safe-area-header pb-8">
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
              <div className="w-16 h-16 rounded-full bg-[#EF7C29] flex items-center justify-center text-2xl font-bold shrink-0">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="flex-1 h-9 px-3 bg-white/20 border border-white/30 rounded-md text-white placeholder:text-white/50 outline-none text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="w-8 h-8 rounded-md bg-green-500/80 flex items-center justify-center shrink-0"
                    >
                      {savingName ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <IoCheckmark className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setNameValue(user.name);
                      }}
                      className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center shrink-0"
                    >
                      <IoClose className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold">{user.name}</h2>
                    <button
                      onClick={() => setEditingName(true)}
                      className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center"
                    >
                      <IoPencil className="w-3.5 h-3.5 text-white/70" />
                    </button>
                  </div>
                )}
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
      <div className="px-5 max-w-xl mx-auto mt-6 space-y-6">
        <LanguageSwitcher />

        {/* Subscription (sellers only) */}
        {user.role === "seller" && (
          <Link
            href="/subscription"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EF7C29]/10 flex items-center justify-center">
                <IoStar className="w-5 h-5 text-[#EF7C29]" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Subscription Plan</p>
                <p className="text-xs text-gray-500 capitalize">
                  DeLingua {user.subscriptionTier || "Lite"}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#1152A2]">Manage →</span>
          </Link>
        )}

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
        <div className="mt-8 space-y-3">
          <Button
            variant="danger"
            fullWidth
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2"
          >
            <IoLogOut className="w-5 h-5" />
            Sign Out
          </Button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-3 px-4 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <IoTrashOutline className="w-4 h-4" />
            {t("account.deleteAccount")}
          </button>
        </div>

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <IoTrashOutline className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">
                  {t("account.deleteAccountConfirmTitle")}
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {t("account.deleteAccountConfirmDesc")}
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("account.deleting")}
                    </>
                  ) : (
                    t("account.deleteAccountConfirmBtn")
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  {t("account.deleteAccountCancelBtn")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Version Info */}
        <p className="text-center text-xs text-gray-400 mt-6">
          DeLingua v1.0.0
        </p>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
