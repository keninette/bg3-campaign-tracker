import { getCollection } from "astro:content";

export async function getSessionNumbers(): Promise<number[]> {
  const texts = await getCollection("sessions");
  return [...new Set(texts.map((text) => text.data.session))].sort(
    (a, b) => b - a,
  );
}

export async function getSessionTexts(session: number) {
  const texts = await getCollection("sessions");
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

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const homeUrl = `${base}/`;

export function pageUrl(path: string): string {
  return `${base}/${path}/`;
}

export function sessionUrl(session: number): string {
  return pageUrl(`session/${session}`);
}
