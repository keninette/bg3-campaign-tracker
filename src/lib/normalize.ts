// Lowercase and strip accents so "é" matches "e" in search and grouping.
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}
