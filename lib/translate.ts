const SUPPORTED_LANGS = new Set(["en", "fr", "de", "es", "zh", "rw", "sw"]);
const TIMEOUT_MS = 10_000;

export async function translateText(
  text: string,
  targetLang: string,
): Promise<string> {
  if (!text || !text.trim()) return text;
  if (!SUPPORTED_LANGS.has(targetLang)) return text;

  // If a custom internal endpoint is specified in env (e.g. Lingva/LibreTranslate), support it
  const customEndpoint = process.env.NEXT_PUBLIC_TRANSLATE_ENDPOINT;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    if (customEndpoint) {
      const url = `${customEndpoint}/api/v1/auto/${encodeURIComponent(
        targetLang,
      )}/${encodeURIComponent(text)}`;
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        if (data.translation) return data.translation;
      }
    }

    // Default: reliable Google Translate client endpoint
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang,
    )}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(googleUrl, { signal: controller.signal });
    if (!res.ok) return text;

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((segment: any) => (segment && segment[0]) || "")
        .join("");
      return translated.trim() || text;
    }

    return text;
  } catch (err) {
    console.error("translateText failed:", err);
    return text;
  } finally {
    clearTimeout(timer);
  }
}
