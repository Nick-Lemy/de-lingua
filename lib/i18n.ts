import { useEffect, useState } from "react";

const LANGUAGE_FILES: Record<string, string> = {
  en: "/i18n/en.json",
  fr: "/i18n/fr.json",
  de: "/i18n/de.json",
  es: "/i18n/es.json",
  zh: "/i18n/zh.json",
  rw: "/i18n/rw.json",
};

const STORAGE_KEY = "preferredLanguage";
const CHANGE_EVENT = "preferredLanguageChange";

export function getPreferredLanguage(): string {
  if (typeof window !== "undefined") {
    try {
      const lang = localStorage.getItem(STORAGE_KEY);
      if (lang && LANGUAGE_FILES[lang]) return lang;
    } catch {
      // ignore
    }
  }
  return "en";
}

export function setLanguage(lang: string): void {
  if (typeof window === "undefined") return;
  if (!LANGUAGE_FILES[lang]) return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    console.error("setLanguage failed", err);
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: lang }));
}

export function useTranslation() {
  const [lang, setLang] = useState<string>(() => getPreferredLanguage());
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetch(LANGUAGE_FILES[lang])
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTranslations(data);
      })
      .catch((err) => console.error("i18n load failed", err));
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail && LANGUAGE_FILES[detail]) setLang(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && LANGUAGE_FILES[e.newValue]) {
        setLang(e.newValue);
      }
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function t(key: string, vars?: Record<string, string | number>) {
    let text = translations[key] || key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replaceAll(`{${k}}`, String(v));
      });
    }
    return text;
  }

  return { t, lang };
}
