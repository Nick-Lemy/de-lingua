"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

        <h1 className="text-3xl font-bold text-white mb-2">Murakaza neza</h1>
        <p className="text-slate-300 mb-8">Sign in to your DeLingua account</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="flex bg-white/10 rounded-md p-1 mb-6">
          <button
            onClick={() => setLoginMethod("email")}
            className={`flex-1 py-3 rounded-md text-sm font-medium ${
              loginMethod === "email"
                ? "bg-[#EF7C29] text-white"
                : "text-slate-300"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setLoginMethod("phone")}
            className={`flex-1 py-3 rounded-md text-sm font-medium ${
              loginMethod === "phone"
                ? "bg-[#EF7C29] text-white"
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
                  className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
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
                    className="w-full h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
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
                <div className="h-14 px-4 bg-white/10 border border-white/20 rounded-md text-white flex items-center text-sm">
                  +250
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="78X XXX XXX"
                  className="flex-1 h-14 px-5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-500 outline-none"
                  autoFocus
                />
              </div>
            </div>
          )}
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
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
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
