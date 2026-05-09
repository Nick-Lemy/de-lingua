const SUPPORTED_LANGS = new Set(["en", "fr", "de", "es", "zh", "rw"]);
const DEFAULT_ENDPOINT = "https://lingva.ml";
const TIMEOUT_MS = 10_000;

export async function translateText(
  text: string,
  targetLang: string,
): Promise<string> {
  if (!SUPPORTED_LANGS.has(targetLang)) return text;

  const endpoint =
    process.env.NEXT_PUBLIC_TRANSLATE_ENDPOINT || DEFAULT_ENDPOINT;
  const url = `${endpoint}/api/v1/auto/${encodeURIComponent(
    targetLang,
  )}/${encodeURIComponent(text)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return text;
    const data = await res.json();
    return data.translation || text;
  } catch (err) {
    console.error("translateText failed", err);
    return text;
  } finally {
    clearTimeout(timer);
  }
}
