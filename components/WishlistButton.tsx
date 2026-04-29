"use client";

import { useEffect, useState } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import {
  isInWishlist as isInWishlistLocal,
  addToWishlist as addToWishlistLocal,
  removeFromWishlist as removeFromWishlistLocal,
  updateWishlistAlert as updateWishlistAlertLocal,
  generateId,
} from "@/lib/storage";
import {
  isInWishlist as isInWishlistFirebase,
  addToWishlist as addToWishlistFirebase,
  removeFromWishlist as removeFromWishlistFirebase,
  updateWishlistAlert as updateWishlistAlertFirebase,
} from "@/lib/db";

interface WishlistButtonProps {
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerCategory: string;
  buyerId: string;
  isConfigured: boolean;
}

export function WishlistButton({
  sellerId,
  sellerName,
  sellerAvatar,
  sellerCategory,
  buyerId,
  isConfigured,
}: WishlistButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (isConfigured) {
        const saved = await isInWishlistFirebase(buyerId, sellerId);
        setIsSaved(saved);
      } else {
        setIsSaved(isInWishlistLocal(buyerId, sellerId));
      }
    };
    if (buyerId && sellerId) check();
  }, [buyerId, sellerId, isConfigured]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      if (isSaved) {
        if (isConfigured) {
          await removeFromWishlistFirebase(buyerId, sellerId);
        } else {
          removeFromWishlistLocal(buyerId, sellerId);
        }
        setIsSaved(false);
      } else {
        const item = {
          id: generateId("wl"),
          buyerId,
          sellerId,
          sellerName,
          sellerAvatar,
          sellerCategory,
          savedAt: new Date().toISOString(),
          alertEnabled: false,
        };
        if (isConfigured) {
          await addToWishlistFirebase(item);
        } else {
          addToWishlistLocal(item);
        }
        setIsSaved(true);
        setShowAlert(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlert = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (keyword.trim()) {
      if (isConfigured) {
        await updateWishlistAlertFirebase(buyerId, sellerId, keyword.trim(), true);
      } else {
        updateWishlistAlertLocal(buyerId, sellerId, keyword.trim(), true);
      }
    }
    setShowAlert(false);
    setKeyword("");
  };

  const handleSkipAlert = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAlert(false);
    setKeyword("");
  };

  return (
    <div className="relative" onClick={(e) => e.preventDefault()}>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow-sm hover:scale-110 transition-transform"
        aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
      >
        {isSaved ? (
          <IoHeart className="w-5 h-5 text-[#EF7C29]" />
        ) : (
          <IoHeartOutline className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {showAlert && (
        <div
          className="absolute right-0 top-10 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-56"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold text-gray-800 mb-2">Set alert (optional)</p>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. tomatoes, rice..."
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:border-[#1152A2] mb-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAlert(e as unknown as React.MouseEvent);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveAlert}
              className="flex-1 py-1.5 bg-[#1152A2] text-white text-xs rounded-md font-medium"
            >
              Save
            </button>
            <button
              onClick={handleSkipAlert}
              className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
