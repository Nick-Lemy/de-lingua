"use client";

import { useState, useEffect } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "zh", label: "中文" },
  { code: "rw", label: "Kinyarwanda" },
];

export function LanguageSwitcher() {
  const [selected, setSelected] = useState<string>("en");

  useEffect(() => {
    const stored = localStorage.getItem("preferredLanguage");
    if (stored && LANGUAGES.some(l => l.code === stored)) {
      setSelected(stored);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setSelected(lang);
    localStorage.setItem("preferredLanguage", lang);
    window.location.reload(); // reload to apply language everywhere
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Language:</span>
      <select
        value={selected}
        onChange={handleChange}
        className="px-2 py-1 rounded border border-gray-300 text-sm"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
