"use client";

import { useTranslation } from "@/lib/i18n";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  onClick,
  hover = false,
  padding = "md",
}: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-md border border-gray-100 shadow-sm 
        ${paddingStyles[padding]}
        ${hover ? "hover:shadow-md hover:border-gray-200 transition-all cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = "" }: CardTitleProps) {
  const { t } = useTranslation();
  return (
    <h3 className={`font-semibold text-gray-900 ${className}`}>
      {t("card.title")}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({
  children,
  className = "",
}: CardDescriptionProps) {
  const { t } = useTranslation();
  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      {t("card.description")}
    </p>
  );
}
