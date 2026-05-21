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
      text = applyPlurals(text, vars, lang);
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replaceAll(`{${k}}`, String(v));
      });
    }
    return text;
  }

  return { t, lang };
}

function applyPlurals(
  text: string,
  vars: Record<string, string | number>,
  lang: string,
): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf("{", i);
    if (start === -1) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, start);

    let depth = 1;
    let j = start + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}") depth--;
      if (depth === 0) break;
      j++;
    }
    if (depth !== 0) {
      out += text.slice(start);
      break;
    }

    const inner = text.slice(start + 1, j);
    const pluralMatch = inner.match(/^\s*(\w+)\s*,\s*plural\s*,\s*([\s\S]*)$/);
    if (pluralMatch) {
      const [, varName, body] = pluralMatch;
      const raw = vars[varName];
      const num = Number(raw);
      let category = "other";
      if (Number.isFinite(num)) {
        try {
          category = new Intl.PluralRules(lang).select(num);
        } catch {
          category = new Intl.PluralRules("en").select(num);
        }
      }
      const branches = parsePluralBranches(body);
      out += branches[category] ?? branches.other ?? "";
    } else {
      out += "{" + inner + "}";
    }
    i = j + 1;
  }
  return out;
}

function parsePluralBranches(body: string): Record<string, string> {
  const branches: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i])) i++;
    const nameStart = i;
    while (i < body.length && /\w/.test(body[i])) i++;
    const name = body.slice(nameStart, i);
    if (!name) break;
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== "{") break;
    let depth = 1;
    i++;
    const contentStart = i;
    while (i < body.length && depth > 0) {
      if (body[i] === "{") depth++;
      else if (body[i] === "}") depth--;
      if (depth === 0) break;
      i++;
    }
    branches[name] = body.slice(contentStart, i);
    i++;
  }
  return branches;
}
