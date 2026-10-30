// Jumps to the bottom of the book page from its top half, and back to the top from its bottom half.
// Hidden while the page is too short to scroll.
class ScrollButton extends HTMLElement {
  connectedCallback() {
    const page = document.querySelector<HTMLElement>(".book-page");
    if (!page) return;
    const button = this.querySelector("button")!;
    const icon = button.querySelector("i")!;
    let down = true;

    const update = () => {
      const max = page.scrollHeight - page.clientHeight;
      this.hidden = max <= 1;
      down = page.scrollTop < max / 2;
      icon.classList.toggle("fa-arrow-down", down);
      icon.classList.toggle("fa-arrow-up", !down);
      const label = down ? "Aller en bas de la page" : "Revenir en haut de la page";
      button.setAttribute("aria-label", label);
      button.title = label;
    };

    page.addEventListener("scroll", update, { passive: true });
    // The content changes height when a lore entry opens or the search filters the index.
    const resize = new ResizeObserver(update);
    resize.observe(page);
    if (page.firstElementChild) resize.observe(page.firstElementChild);

    button.addEventListener("click", () => {
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      page.scrollTo({ top: down ? page.scrollHeight : 0, behavior: smooth ? "smooth" : "auto" });
    });

    update();
  }
}

customElements.define("scroll-button", ScrollButton);
