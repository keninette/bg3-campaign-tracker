import { normalize } from "../lib/normalize";

const index = document.querySelector<HTMLElement>("#lore-index");
const search = document.querySelector<HTMLInputElement>("#lore-search");
const empty = document.querySelector<HTMLElement>("#lore-empty");
const articles = document.querySelectorAll<HTMLElement>(".lore-article");
const groups = document.querySelectorAll<HTMLElement>("[data-group]");

// The hash selects the open entry; no hash shows the index.
function showFromHash() {
  let id = location.hash.slice(1);
  // A malformed escape such as "#100%" is used as is rather than breaking navigation.
  try {
    id = decodeURIComponent(id);
  } catch {}
  let found = false;
  articles.forEach((article) => {
    article.hidden = article.id !== id;
    if (!article.hidden) found = true;
  });
  if (index) index.hidden = found;
  document.querySelector(".book-page")?.scrollTo({ top: 0 });
}

// Folded text keeps, for each folded character, its index in the original,
// so a match found in folded text can be highlighted in the original.
interface Folded {
  text: string;
  folded: string;
  map: number[];
}

function fold(text: string): Folded {
  let folded = "";
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    for (const char of normalize(text[i])) {
      folded += char;
      map.push(i);
    }
  }
  return { text, folded, map };
}

function find({ folded, map }: Folded, query: string): [number, number] | null {
  const at = folded.indexOf(query);
  if (at === -1) return null;
  return [map[at], map[at + query.length - 1] + 1];
}

function mark(text: string): HTMLElement {
  const element = document.createElement("mark");
  element.textContent = text;
  return element;
}

// Shows the match with some context, cut on word boundaries.
const CONTEXT = 60;
function snippet(text: string, [start, end]: [number, number]): (string | Node)[] {
  let from = Math.max(0, start - CONTEXT);
  let to = Math.min(text.length, end + CONTEXT);
  const space = text.indexOf(" ", from);
  if (from > 0 && space !== -1 && space < start) from = space + 1;
  const lastSpace = text.lastIndexOf(" ", to);
  if (to < text.length && lastSpace > end) to = lastSpace;
  return [
    from > 0 ? "…" : "",
    text.slice(from, start),
    mark(text.slice(start, end)),
    text.slice(end, to),
    to < text.length ? "…" : "",
  ];
}

const items = [...document.querySelectorAll<HTMLElement>("[data-entry]")].map((item) => {
  const body = document.getElementById(item.dataset.entry ?? "")?.querySelector(".chapter-body");
  const link = item.querySelector("a")!;
  return {
    item,
    link,
    excerpt: item.querySelector<HTMLElement>(".lore-snippet")!,
    title: fold(link.textContent ?? ""),
    body: fold((body?.textContent ?? "").replace(/\s+/g, " ").trim()),
  };
});

function filter() {
  const query = normalize(search?.value.trim() ?? "");
  for (const { item, link, excerpt, title, body } of items) {
    const inTitle = query ? find(title, query) : null;
    const inBody = query && !inTitle ? find(body, query) : null;
    item.hidden = Boolean(query) && !inTitle && !inBody;

    link.replaceChildren(
      ...(inTitle
        ? [title.text.slice(0, inTitle[0]), mark(title.text.slice(...inTitle)), title.text.slice(inTitle[1])]
        : [title.text]),
    );
    excerpt.hidden = !inBody;
    excerpt.replaceChildren(...(inBody ? snippet(body.text, inBody) : []));
  }

  let visible = 0;
  groups.forEach((group) => {
    const groupVisible = group.querySelectorAll("[data-entry]:not([hidden])").length;
    group.hidden = groupVisible === 0;
    visible += groupVisible;
  });
  if (empty) empty.hidden = visible > 0;
}

window.addEventListener("hashchange", showFromHash);
search?.addEventListener("input", filter);
showFromHash();
