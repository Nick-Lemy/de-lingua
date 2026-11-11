import { useEffect, useState, useSyncExternalStore } from "react";
import en from "../public/i18n/en.json";
import rw from "../public/i18n/rw.json";
import fr from "../public/i18n/fr.json";
import de from "../public/i18n/de.json";
import es from "../public/i18n/es.json";
import zh from "../public/i18n/zh.json";

export const DICTIONARIES: Record<string, Record<string, string>> = {
  en,
  rw,
  fr,
  de,
  es,
  zh,
};

const STORAGE_KEY = "preferredLanguage";
const CHANGE_EVENT = "preferredLanguageChange";

export function getPreferredLanguage(): string {
  if (typeof window !== "undefined") {
    try {
      const lang = localStorage.getItem(STORAGE_KEY);
      if (lang && DICTIONARIES[lang]) return lang;
    } catch {
      // ignore
    }
  }
  return "en";
}

export function setLanguage(lang: string): void {
  if (typeof window === "undefined") return;
  if (!DICTIONARIES[lang]) return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (err) {
    console.error("setLanguage failed", err);
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: lang }));
}

function subscribeToLanguageChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function useTranslation() {
  const lang = useSyncExternalStore(
    subscribeToLanguageChange,
    getPreferredLanguage,
    () => "en",
  );

  function t(key: string, vars?: Record<string, string | number>): string {
    const dict = DICTIONARIES[lang] || DICTIONARIES.en;
    let text = dict[key];
    // Fallback to English if translation is missing in the chosen language
    if (text === undefined && lang !== "en") {
      text = DICTIONARIES.en[key];
    }
    // NEVER expose raw variable keys (e.g. "nav.messages", "home.stats.matches") to the user!
    if (text === undefined) {
      return "";
    }
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
