"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IoHome,
  IoRocket,
  IoStorefront,
  IoPerson,
  IoChatbubbles,
  IoSearch,
  IoPeople,
} from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";

interface BottomNavProps {
  role?: "buyer" | "seller";
}

export function BottomNav({ role = "buyer" }: BottomNavProps) {
  const pathname = usePathname();

  const buyerItems = [
    { href: "/", icon: IoHome, label: "Home" },
    { href: "/feed", icon: IoPeople, label: "Feed" },
    { href: "/missions", icon: IoRocket, label: "Missions" },
    { href: "/messages", icon: IoChatbubbles, label: "Messages" },
    { href: "/account", icon: IoPerson, label: "Account" },
  ];

  const sellerItems = [
    { href: "/seller-dashboard", icon: IoHome, label: "Dashboard" },
    { href: "/feed", icon: IoPeople, label: "Feed" },
    {
      href: "/requests",
      icon: HiSparkles,
      label: "Requests",
    },
    { href: "/messages", icon: IoChatbubbles, label: "Messages" },
    { href: "/account", icon: IoPerson, label: "Account" },
  ];

  const items = role === "seller" ? sellerItems : buyerItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md ${
                isActive ? "text-[#1152A2]" : "text-gray-400"
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
