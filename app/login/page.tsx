"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { isFirebaseConfigured } from "@/lib/firebase";
import { signIn, forgotPassword } from "@/lib/auth";
import { getUserProfile } from "@/lib/storage";
import { useTranslation } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const isConfigured = isFirebaseConfigured();

  const handleLogin = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      if (isConfigured) {
        if (!email.trim() || !password.trim()) {
          setError(t("login.errorEmailPassword"));
          setIsSubmitting(false);
          return;
        }
        const user = await signIn(email.trim(), password);
        if (user) {
          router.push("/");
        } else {
          setError(t("login.errorLoginFailed"));
          setIsSubmitting(false);
        }
      } else {
        const profile = getUserProfile();
        if (profile && profile.email === email.trim()) {
          router.push("/");
        } else {
          setError(t("login.errorNoAccount"));
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setIsSubmitting(false);
      if (err.code === "auth/user-not-found") {
        setError(t("login.errorNoAccountWithEmail"));
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError(t("login.errorIncorrectPassword"));
      } else if (err.code === "auth/invalid-email") {
        setError(t("login.errorInvalidEmail"));
      } else {
        setError(err.message || t("login.errorLoginFailed"));
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setResetError("");
    setResetSubmitting(true);
    try {
      await forgotPassword(forgotEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || "Failed to send reset email.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const canSubmit = email.trim() && password.trim();

  return (
    <div className="min-h-screen bg-[#1152A2] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-8 max-w-md mx-auto w-full">
        {/* Logo */}
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

        <h1 className="text-3xl font-bold text-white mb-2">
          {t("login.title")}
        </h1>
        <p className="text-slate-300 mb-8">{t("login.subtitle")}</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t("login.emailAddress")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailAddress")}
              className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                {t("login.password")}
              </label>
              {isConfigured && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotPassword(true);
                    setResetSent(false);
                    setResetError("");
                  }}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  {t("login.forgotPassword")}
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.password")}
              className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleLogin()}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={!canSubmit || isSubmitting}
          className={`w-full mt-6 py-4 font-semibold rounded-md flex items-center justify-center gap-2 ${
            canSubmit && !isSubmitting
              ? "bg-[#EF7C29] text-white hover:bg-[#d96a1f]"
              : "bg-slate-600 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t("login.signingIn")}
            </>
          ) : (
            t("login.signIn")
          )}
        </button>

        <p className="text-center text-slate-300 mt-8">
          {t("login.noAccount")}{" "}
          <Link href="/onboarding" className="text-white font-semibold">
            {t("login.signUp")}
          </Link>
        </p>
      </div>

      <div className="px-6 pb-8 max-w-md mx-auto w-full">
        <p className="text-center text-xs text-slate-400">
          {isConfigured ? t("login.secureFirebase") : t("login.demoMode")}
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 pb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {t("login.resetPassword")}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {t("login.resetPasswordDesc")}
            </p>

            {resetSent ? (
              <div className="p-4 bg-green-50 rounded-md text-green-700 text-sm mb-5">
                {t("login.resetEmailSent")}
              </div>
            ) : (
              <>
                {resetError && (
                  <div className="p-3 bg-red-50 rounded-md text-red-600 text-sm mb-4">
                    {resetError}
                  </div>
                )}
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder={t("login.emailAddress")}
                  className="w-full h-12 px-4 border border-gray-200 rounded-md text-gray-900 outline-none mb-4 focus:border-[#1152A2]"
                  autoFocus
                />
                <button
                  onClick={handleForgotPassword}
                  disabled={!forgotEmail.trim() || resetSubmitting}
                  className="w-full py-3 rounded-md bg-[#1152A2] text-white font-semibold disabled:opacity-50 mb-3"
                >
                  {resetSubmitting ? t("login.sending") : t("login.sendResetEmail")}
                </button>
              </>
            )}

            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full py-3 rounded-md border border-gray-200 text-gray-700 font-medium"
            >
              {t("login.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
