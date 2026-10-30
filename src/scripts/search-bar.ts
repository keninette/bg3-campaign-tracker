// Shows the clear button while there is text, and clears on click or Escape.
// Clearing fires an `input` event, so the page reacts to it like to typing.
class SearchBar extends HTMLElement {
  connectedCallback() {
    const input = this.querySelector("input")!;
    const clear = this.querySelector("button")!;

    const update = () => (clear.hidden = !input.value);
    const reset = () => {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    };

    input.addEventListener("input", update);
    clear.addEventListener("click", reset);
    // Escape clears in every browser, not only those with a native search field.
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && input.value) {
        event.preventDefault();
        reset();
      }
    });
  }
}

customElements.define("search-bar", SearchBar);
