import { useEffect, useState } from "react";

const LANGUAGE_FILES: Record<string, string> = {
  en: "/i18n/en.json",
  fr: "/i18n/fr.json",
  de: "/i18n/de.json",
  es: "/i18n/es.json",
  zh: "/i18n/zh.json",
  rw: "/i18n/rw.json",
};

export function getPreferredLanguage(): string {
  if (typeof window !== "undefined") {
    const lang = localStorage.getItem("preferredLanguage");
    if (lang && LANGUAGE_FILES[lang]) return lang;
  }
  return "en";
}

export function useTranslation() {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const lang = getPreferredLanguage();

  useEffect(() => {
    fetch(LANGUAGE_FILES[lang])
      .then((res) => res.json())
      .then((data) => setTranslations(data));
  }, [lang]);

  function t(key: string, vars?: Record<string, string | number>) {
    let text = translations[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }

  return { t, lang };
}
