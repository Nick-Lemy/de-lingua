"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IoHome,
  IoHomeOutline,
  IoRocket,
  IoRocketOutline,
  IoStorefront,
  IoStorefrontOutline,
  IoPerson,
  IoPersonOutline,
  IoChatbubbles,
  IoChatbubblesOutline,
  IoSearch,
  IoSearchOutline,
  IoPeople,
  IoPeopleOutline,
} from "react-icons/io5";
import { useTranslation } from "@/lib/i18n";

interface BottomNavProps {
  role?: "buyer" | "seller";
}

export function BottomNav({ role = "buyer" }: BottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const buyerItems = [
    { href: "/", iconActive: IoHome, iconInactive: IoHomeOutline, label: t("nav.home") },
    { href: "/feed", iconActive: IoPeople, iconInactive: IoPeopleOutline, label: t("nav.feed") },
    { href: "/missions", iconActive: IoRocket, iconInactive: IoRocketOutline, label: t("nav.missions") },
    { href: "/messages", iconActive: IoChatbubbles, iconInactive: IoChatbubblesOutline, label: t("nav.messages") },
    { href: "/account", iconActive: IoPerson, iconInactive: IoPersonOutline, label: t("nav.account") },
  ];

  const sellerItems = [
    { href: "/seller-dashboard", iconActive: IoHome, iconInactive: IoHomeOutline, label: t("nav.dashboard") },
    { href: "/feed", iconActive: IoPeople, iconInactive: IoPeopleOutline, label: t("nav.feed") },
    { href: "/messages", iconActive: IoChatbubbles, iconInactive: IoChatbubblesOutline, label: t("nav.messages") },
    { href: "/account", iconActive: IoPerson, iconInactive: IoPersonOutline, label: t("nav.account") },
  ];

  const items = role === "seller" ? sellerItems : buyerItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-2 pb-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = isActive ? item.iconActive : item.iconInactive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-[#1152A2]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#1152A2] rounded-full" />
              )}
              <Icon className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : ""}`} />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
