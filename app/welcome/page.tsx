"use client";

import Link from "next/link";
import Image from "next/image";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#1152A2] flex flex-col">
      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 lg:px-8 max-w-2xl mx-auto w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="DeLingua"
              width={56}
              height={56}
              className="rounded-2xl"
            />
          </div>
          <span className="text-3xl font-bold text-white">DeLingua</span>
        </div>

        {/* Hero Text */}
        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
          Rwanda&apos;s Smart
          <br />
          <span className="text-[#EF7C29]">Marketplace</span>
        </h1>

        <p className="text-lg lg:text-xl text-slate-300 mb-12 max-w-md">
          Connect with verified Rwandan suppliers, create sourcing missions, and
          find perfect matches for your business needs.
        </p>

        {/* Features */}
        <div className="space-y-4 mb-12">
          {[
            {
              icon: "🇷🇼",
              title: "Made in Rwanda",
              desc: "Support local suppliers and grow Rwanda's economy",
            },
            {
              icon: "🎯",
              title: "Smart Matching",
              desc: "AI-powered supplier matching based on your needs",
            },
            {
              icon: "⚡",
              title: "Fast Discovery",
              desc: "Find the right suppliers in Kigali and beyond",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-slate-300">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/onboarding"
            className="block w-full py-4 bg-[#EF7C29] text-white text-center font-semibold rounded-2xl hover:bg-[#d96a1f]"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="block w-full py-4 border border-white/20 text-white text-center font-semibold rounded-2xl"
          >
            I already have an account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 lg:px-8 pb-8 max-w-2xl mx-auto w-full">
        <p className="text-center text-sm text-slate-400">
          Trusted by 1000+ businesses across Europe
        </p>
      </div>
    </div>
  );
}
