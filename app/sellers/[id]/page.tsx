"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSellerById } from "@/lib/storage";
import type { Seller } from "@/lib/storage";

export default function SellerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [mounted, setMounted] = useState(false);
  const missionId = searchParams?.get("mission");

  useEffect(() => {
    setMounted(true);
    const id = params?.id as string;
    if (!id) return;

    const foundSeller = getSellerById(id);
    if (!foundSeller) {
      router.push("/");
      return;
    }
    setSeller(foundSeller);
  }, [params, router]);

  if (!mounted || !seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="bg-black text-white px-6 lg:px-8 pt-14 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl font-bold">
                  {seller.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{seller.name}</h1>
                    {seller.verified && (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path
                          d="M9 12l2 2 4-4"
                          stroke="black"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-gray-400">{seller.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  ⭐ {seller.rating} ({seller.reviews} reviews)
                </span>
                <span>📍 {seller.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-8 max-w-4xl mx-auto mt-6 space-y-6">
        {/* About */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold mb-3 text-black">About</h3>
          <p className="text-sm text-gray-600">{seller.description}</p>
        </div>

        {/* Key Details */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="font-semibold mb-4 text-black">Key Details</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                📦
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-black">Minimum Order</p>
                <p className="text-gray-600 text-sm">{seller.minOrder}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                🚚
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-black">Service Range</p>
                <p className="text-gray-600 text-sm">{seller.serviceRange}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                ⏱️
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-black">Response Time</p>
                <p className="text-gray-600 text-sm">{seller.responseTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Certifications */}
        {seller.certifications.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold mb-3 text-black">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {seller.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium text-black"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inventory */}
        {seller.inventory.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-semibold mb-4 text-black">
              Available Products
            </h3>
            <div className="space-y-3">
              {seller.inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1 text-black">
                      {item.name}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>MOQ: {item.moq} units</span>
                      <span>•</span>
                      <span>Lead: {item.leadTime}</span>
                      <span>•</span>
                      <span
                        className={
                          item.stock > 0 ? "text-green-600" : "text-gray-400"
                        }
                      >
                        {item.stock > 0
                          ? `${item.stock} in stock`
                          : "On request"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">
                      €{item.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">per unit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {missionId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link
              href={`/chat/${missionId}?seller=${seller.id}`}
              className="block w-full py-4 rounded-2xl bg-black text-white text-center font-semibold hover:bg-gray-900 transition-colors"
            >
              Start Conversation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
