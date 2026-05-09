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
    } catch (err) {
      console.error("WishlistButton toggle failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlert = async (
    e: React.MouseEvent | React.KeyboardEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (keyword.trim()) {
      try {
        if (isConfigured) {
          await updateWishlistAlertFirebase(
            buyerId,
            sellerId,
            keyword.trim(),
            true,
          );
        } else {
          updateWishlistAlertLocal(buyerId, sellerId, keyword.trim(), true);
        }
      } catch (err) {
        console.error("updateWishlistAlert failed", err);
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
          className="absolute right-0 top-11 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-60"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-[#EF7C29]/10 flex items-center justify-center">
              <IoHeart className="w-3.5 h-3.5 text-[#EF7C29]" />
            </div>
            <p className="text-xs font-bold text-gray-800">Saved! Set an alert?</p>
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. tomatoes, rice..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#1152A2] focus:ring-2 focus:ring-[#1152A2]/10 mb-3 transition-all"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAlert(e);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveAlert}
              className="flex-1 py-2 bg-[#1152A2] text-white text-xs rounded-xl font-semibold hover:bg-[#0d3d7a] transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleSkipAlert}
              className="flex-1 py-2 bg-gray-100 text-gray-500 text-xs rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
