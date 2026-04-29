"use client";

import type { ReactNode } from "react";

interface AnalyticsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: string;
}

export function AnalyticsCard({ icon, label, value, sublabel, accent = "text-[#1152A2]" }: AnalyticsCardProps) {
  return (
    <div className="bg-white rounded-md p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      <p className="text-gray-500 text-xs">{label}</p>
      {sublabel && <p className="text-gray-400 text-[10px] mt-0.5">{sublabel}</p>}
    </div>
  );
}
