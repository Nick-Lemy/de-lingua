"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "rw", label: "Kinyarwanda" },
];

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const getInitial = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("preferredLanguage");
      if (stored && LANGUAGES.some((l) => l.code === stored)) {
        return stored;
      }
    }
    return "en";
  };
  const [selected, setSelected] = useState<string>(getInitial);

  // keep language in sync if another tab changes it
  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem("preferredLanguage");
      if (stored && LANGUAGES.some((l) => l.code === stored)) {
        setSelected(stored);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelected(lang);
    localStorage.setItem("preferredLanguage", lang);
    window.location.reload(); // reload to apply language everywhere
  };

  return (
    <div className="max-w-xl mx-auto mt-6 p-4 bg-white rounded-md shadow-sm">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {t("language.label")}
      </label>
      <div className="relative">
        <select
          value={selected}
          onChange={handleChange}
          className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-md bg-white text-sm focus:border-[#1152A2] focus:ring-[#1152A2]/10"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 12a.75.75 0 01-.53-.22l-3-3a.75.75 0 011.06-1.06L10 10.94l2.47-2.47a.75.75 0 111.06 1.06l-3 3A.75.75 0 0110 12z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
