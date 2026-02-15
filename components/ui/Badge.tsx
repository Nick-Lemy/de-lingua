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
    success: "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20",
    warning: "bg-[#EF7C29]/10 text-[#EF7C29] border-[#EF7C29]/20",
    danger: "bg-slate-100 text-slate-700 border-slate-200",
    info: "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20",
    purple: "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20",
    teal: "bg-[#1152A2]/10 text-[#1152A2] border-[#1152A2]/20",
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
