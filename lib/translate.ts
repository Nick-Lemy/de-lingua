export async function translateText(
  text: string,
  targetLang: string,
): Promise<string> {
  // Lingva API endpoint; using auto detection for source language
  const url = `https://lingva.ml/api/v1/auto/${encodeURIComponent(
    targetLang,
  )}/${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`translation failed: ${res.status}`);
  }
  const data = await res.json();
  // expected shape { translation: string }
  return data.translation || "";
}
