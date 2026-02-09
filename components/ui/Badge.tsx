"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "purple"
    | "teal";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-slate-100 text-slate-700 border-slate-200",
    danger: "bg-slate-100 text-slate-700 border-slate-200",
    info: "bg-slate-50 text-slate-700 border-slate-200",
    purple: "bg-slate-50 text-slate-700 border-slate-200",
    teal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
