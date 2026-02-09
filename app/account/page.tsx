"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getUserProfile, clearUserProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui";
import { BottomNav } from "@/components/BottomNav";
import {
  IoArrowBack,
  IoPersonCircle,
  IoMail,
  IoSettings,
  IoLogOut,
  IoShield,
  IoNotifications,
  IoHelpCircle,
  IoChevronForward,
} from "react-icons/io5";

export default function AccountPage() {
  const router = useRouter();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    {
      icon: IoPersonCircle,
      label: "Edit Profile",
      description: "Update your personal information",
      href: "#",
    },
    {
      icon: IoNotifications,
      label: "Notifications",
      description: "Manage notification preferences",
      href: "#",
    },
    {
      icon: IoShield,
      label: "Privacy & Security",
      description: "Password and security settings",
      href: "#",
    },
    {
      icon: IoSettings,
      label: "Preferences",
      description: "App settings and customization",
      href: "#",
    },
    {
      icon: IoHelpCircle,
      label: "Help & Support",
      description: "FAQs and contact support",
      href: "#",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-5 pt-12 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"
            >
              <IoArrowBack className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Account</h1>
          </div>

          {/* User Card */}
          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-2xl font-bold">
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
      <div className="px-5 max-w-lg mx-auto mt-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
              <IoChevronForward className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Preferences Summary */}
        {user.preferences && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">
              Your Preferences
            </h3>
            <div className="space-y-3 text-sm">
              {user.preferences.categories.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Categories</p>
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
                  <p className="text-xs text-gray-500 mb-1">Budget Behavior</p>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                    {user.preferences.budgetBehavior}
                  </span>
                </div>
              )}
              {user.preferences.locationRadius && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Location Radius</p>
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
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">
              Business Profile
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs">
                  {user.businessProfile.category}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Service Range</p>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs">
                  {user.businessProfile.serviceRange}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Capacity</p>
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
          DeLingua v1.0.0 • {isConfigured ? "Firebase" : "Local Storage"}
        </p>
      </div>

      <BottomNav role={user.role} />
    </div>
  );
}
