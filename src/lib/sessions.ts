import { getCollection } from "astro:content";

export async function getSessionNumbers(): Promise<number[]> {
  const texts = await getCollection("texts");
  return [...new Set(texts.map((text) => text.data.session))].sort(
    (a, b) => b - a,
  );
}

export async function getSessionTexts(session: number) {
  const texts = await getCollection("texts");
  return texts
    .filter((text) => text.data.session === session)
    .sort((a, b) => a.data.order - b.data.order);
}

export function textAnchor(id: string): string {
  return id.replace(/[^a-z0-9-]+/gi, "-");
}

export function textUrl(session: number, id: string): string {
  return `${sessionUrl(session)}#${textAnchor(id)}`;
}

export function sessionUrl(session: number): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/session/${session}/`;
}
