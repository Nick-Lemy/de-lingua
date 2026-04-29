"use client";

import { HiStar, HiOutlineStar } from "react-icons/hi";

interface StarRatingProps {
  value: number;
  onChange?: (n: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-5 h-5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
        >
          {star <= Math.round(value) ? (
            <HiStar className={`${iconSize} text-amber-400`} />
          ) : (
            <HiOutlineStar className={`${iconSize} text-amber-300`} />
          )}
        </button>
      ))}
    </div>
  );
}
