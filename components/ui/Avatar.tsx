"use client";

import { useState } from "react";

interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        onError={() => setImgFailed(true)}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#1152A2] text-white flex items-center justify-center font-bold ${sizes[size]} ${className}`}
    >
      {initial}
    </div>
  );
}
