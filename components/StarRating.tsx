"use client";

import { useState } from "react";
import { HiStar, HiOutlineStar } from "react-icons/hi";

interface StarRatingProps {
  value: number;
  onChange?: (n: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-7 h-7";
  const gap = size === "sm" ? "gap-0.5" : "gap-1";
  const interactive = !readonly && !!onChange;
  const display = interactive && hovered > 0 ? hovered : Math.round(value);

  return (
    <div className={`flex items-center ${gap}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={`transition-transform ${interactive ? "cursor-pointer hover:scale-125 active:scale-110" : "cursor-default"}`}
        >
          {star <= display ? (
            <HiStar className={`${iconSize} text-amber-400`} />
          ) : (
            <HiOutlineStar className={`${iconSize} text-gray-300`} />
          )}
        </button>
      ))}
    </div>
  );
}
