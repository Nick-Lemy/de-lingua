"use client";

import { useTranslation } from "@/lib/i18n";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "w-4 h-4 border",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-2",
  };

  return (
    <div
      className={`${sizes[size]} border-[#1152A2] border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-500">
        {message ? t(message) : t("loading.message")}
      </p>
    </div>
  );
}
