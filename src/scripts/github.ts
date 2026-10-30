// Edits content files through the GitHub API, using a personal access token.
// The token is never stored: it is kept in memory until the page is closed or reloaded.
const OWNER = "keninette";
const REPO = `${OWNER}/bg3-campaign-tracker`;
const BRANCH = "main";

let token: string | null = null;

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

async function getToken(): Promise<string | null> {
  token ??= await askToken();
  return token;
}

function forgetToken() {
  token = null;
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

// Sets `available` in the frontmatter, adding the field when it is missing.
function withAvailable(markdown: string, available: boolean): string {
  const frontmatter = markdown.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0];
  if (!frontmatter) throw new Error("En-tête du fichier introuvable.");
  const eol = frontmatter.includes("\r\n") ? "\r\n" : "\n";
  const updated = /^available:.*$/m.test(frontmatter)
    ? frontmatter.replace(/^available:.*$/m, `available: ${available}`)
    : frontmatter.replace(/\r?\n---$/, `${eol}available: ${available}${eol}---`);
  return updated + markdown.slice(frontmatter.length);
}

async function failure(response: Response): Promise<Error> {
  // A rejected token is forgotten so the next click asks for a new one.
  if (response.status === 401) forgetToken();
  const { message } = await response.json().catch(() => ({}));
  return new Error(`Erreur GitHub ${response.status}${message ? ` : ${message}` : ""}`);
}

export async function setAvailable(path: string, available: boolean): Promise<void> {
  const token = await getToken();
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

  const markdown = decode(content);
  const updated = withAvailable(markdown, available);
  if (updated === markdown) return;

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
}
