// Edits content files through the GitHub API, using a personal access token.
// The token is never kept: it is asked for on every change.
const OWNER = "keninette";
const REPO = `${OWNER}/bg3-campaign-tracker`;
const BRANCH = "main";

// A password field rather than prompt(), so the token is masked and a password manager can fill it.
function askToken(): Promise<string | null> {
  const dialog = document.createElement("dialog");
  dialog.className = "token-dialog";
  dialog.innerHTML = `
    <form method="dialog">
      <label for="github-token">Jeton GitHub (accès en écriture au contenu du dépôt) :</label>
      <input name="username" value="${OWNER}" autocomplete="username" hidden />
      <input id="github-token" name="token" type="password" autocomplete="current-password" required />
      <div class="token-dialog-actions">
        <button value="cancel" formnovalidate>Annuler</button>
        <button value="ok">Valider</button>
      </div>
    </form>`;
  document.body.append(dialog);
  const input = dialog.querySelector("input[type=password]") as HTMLInputElement;

  return new Promise((resolve) => {
    dialog.addEventListener("close", () => {
      resolve(dialog.returnValue === "ok" ? input.value.trim() || null : null);
      dialog.remove();
    });
    dialog.showModal();
  });
}

// The API sends file contents as base64 of the UTF-8 bytes.
function decode(base64: string): string {
  const bytes = Uint8Array.from(atob(base64.replace(/\s/g, "")), (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encode(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// Flips `available` in the frontmatter; a missing field counts as false, the schema default.
// A leading byte order mark, as some Windows editors write, is kept as is.
function toggled(markdown: string): { markdown: string; available: boolean } {
  const bom = markdown.startsWith("﻿") ? "﻿" : "";
  const text = markdown.slice(bom.length);
  const frontmatter = text.match(/^---\r?\n(?:[\s\S]*?\r?\n)?---(?=\r?\n|$)/)?.[0];
  if (!frontmatter) throw new Error("En-tête du fichier introuvable.");

  const field = /^available:[ \t]*(\S*).*$/m;
  const available = frontmatter.match(field)?.[1] !== "true";
  const eol = frontmatter.includes("\r\n") ? "\r\n" : "\n";
  const updated = field.test(frontmatter)
    ? frontmatter.replace(field, `available: ${available}`)
    : `${frontmatter.slice(0, -3)}available: ${available}${eol}---`;
  return { markdown: bom + updated + text.slice(frontmatter.length), available };
}

async function failure(response: Response): Promise<Error> {
  const { message } = await response.json().catch(() => ({}));
  return new Error(`Erreur GitHub ${response.status}${message ? ` : ${message}` : ""}`);
}

// Flips the entry from the file's current state on GitHub, not the state the page was built with,
// which may be out of date until the redeploy finishes. Returns the new state.
export async function toggleAvailable(path: string): Promise<boolean> {
  const token = await askToken();
  if (!token) throw new Error("Aucun jeton GitHub.");

  const url = `https://api.github.com/repos/${REPO}/contents/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };

  const current = await fetch(`${url}?ref=${BRANCH}`, { headers, cache: "no-store" });
  if (!current.ok) throw await failure(current);
  const { content, sha } = await current.json();

  const { markdown: updated, available } = toggled(decode(content));

  const response = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: `${available ? "Reveal" : "Hide"} ${path}`,
      content: encode(updated),
      sha,
      branch: BRANCH,
    }),
  });
  if (!response.ok) throw await failure(response);
  return available;
}
