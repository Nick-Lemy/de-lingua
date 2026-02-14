"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isFirebaseConfigured } from "@/lib/firebase";
import { signIn, signInWithGoogle } from "@/lib/auth";
import { getUserProfile } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isConfigured = isFirebaseConfigured();

  const handleLogin = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      if (isConfigured) {
        if (loginMethod === "email") {
          if (!email.trim() || !password.trim()) {
            setError("Email and password are required");
            setIsSubmitting(false);
            return;
          }
          const user = await signIn(email.trim(), password);
          if (user) {
            router.push("/");
          } else {
            setError("Login failed. Please try again.");
            setIsSubmitting(false);
          }
        } else {
          // Phone auth - for now show info message
          setError(
            "Phone authentication coming soon. Please use email or Google sign-in.",
          );
          setIsSubmitting(false);
        }
      } else {
        // For localStorage mode, just redirect to home if there's a profile
        const profile = getUserProfile();
        if (profile && profile.email === email.trim()) {
          router.push("/");
        } else {
          setError("No account found. Please sign up first.");
          setIsSubmitting(false);
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setIsSubmitting(false);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isConfigured) {
      setError("Google sign-in requires Firebase configuration.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const user = await signInWithGoogle();
      if (user) {
        router.push("/");
      } else {
        setError("Google sign-in failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setIsSubmitting(false);
      setError(err.message || "Google sign-in failed. Please try again.");
    }
  };

  const canSubmit =
    loginMethod === "email"
      ? isConfigured
        ? email.trim() && password.trim()
        : email.trim()
      : phone.trim();

  return (
    <div className="min-h-screen bg-slate-800 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-8 max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="3" fill="#064e3b" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">DeLingua</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Murakaza neza</h1>
        <p className="text-slate-300 mb-8">Sign in to your DeLingua account</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="flex bg-white/10 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium ${
              loginMethod === "email"
                ? "bg-emerald-600 text-white"
                : "text-slate-300"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium ${
              loginMethod === "phone"
                ? "bg-emerald-600 text-white"
                : "text-slate-300"
            }`}
          >
            Phone
          </button>
        </div>

        <div className="space-y-5">
          {loginMethod === "email" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.rw"
                  className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-gray-500 outline-none"
                  autoFocus
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
                    placeholder="Enter your password"
                    className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-gray-500 outline-none"
                  />
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Phone number
              </label>
              <div className="flex gap-2">
                <div className="h-14 px-4 bg-white/10 border border-white/20 rounded-2xl text-white flex items-center text-sm">
                  +250
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="78X XXX XXX"
                  className="flex-1 h-14 px-5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-gray-500 outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={!canSubmit || isSubmitting}
          className={`w-full mt-6 py-4 font-semibold rounded-2xl flex items-center justify-center gap-2 ${
            canSubmit && !isSubmitting
              ? "bg-emerald-600 text-white"
              : "bg-slate-600 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-slate-400 text-sm">or continue with</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Social Login */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || !isConfigured}
          className="w-full py-4 font-medium rounded-2xl bg-white text-slate-800 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-slate-300 mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-white font-semibold">
            Sign up
          </Link>
        </p>
      </div>

      {/* Footer indicator */}
      <div className="px-6 pb-8 max-w-md mx-auto w-full">
        <p className="text-center text-xs text-slate-400">
          {isConfigured
            ? "Secure login with Firebase"
            : "Demo mode - Local storage only"}
        </p>
      </div>
    </div>
  );
}
