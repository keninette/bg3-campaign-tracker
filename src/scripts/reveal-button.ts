import { toggleAvailable } from "./github";

// Commits the entry's `available` flag; the deploy workflow publishes it about a minute later.
class RevealButton extends HTMLElement {
  connectedCallback() {
    const button = this.querySelector("button")!;
    const status = this.querySelector<HTMLElement>(".reveal-status")!;

    button.addEventListener("click", async () => {
      button.disabled = true;
      status.textContent = "Envoi…";
      try {
        const available = await toggleAvailable(this.dataset.path!);
        // Keep the index entry's icon in step with the new state.
        const article = this.closest<HTMLElement>(".lore-article");
        document
          .querySelector(`[data-entry="${article?.id}"]`)
          ?.classList.toggle("lore-unavailable", !available);
        button.textContent = available ? "Masquer aux joueurs" : "Révéler aux joueurs";
        status.textContent = `${available ? "Révélé" : "Masqué"}, en ligne d'ici une minute environ.`;
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
      } finally {
        button.disabled = false;
      }
    });
  }
}

customElements.define("reveal-button", RevealButton);
