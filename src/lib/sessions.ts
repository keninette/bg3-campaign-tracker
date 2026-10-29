import { getCollection } from "astro:content";

export async function getSessionNumbers(): Promise<number[]> {
  const sessions = await getCollection("sessions");
  return [...new Set(sessions.map((session) => session.data.session))].sort(
    (a, b) => b - a,
  );
}

export async function getSessionTexts(session: number) {
  const sessions = await getCollection("sessions");
  return sessions
    .filter((text) => text.data.session === session)
    .sort((a, b) => a.data.order - b.data.order);
}

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export const homeUrl = `${base}/`;

export function pageUrl(path: string): string {
  return `${base}/${path}/`;
}

export function sessionUrl(session: number): string {
  return pageUrl(`session/${session}`);
}
