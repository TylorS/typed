import { component } from "@typed/astro/Component";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template";

/** Zero-argument islands retain separate state even though their exported Fx is shared. */
export default component(function* () {
  const count = yield* RefSubject.make(0);
  return [
    html`<button class="summary-button" @click=${RefSubject.update(count, (n) => n + 1)}>
      Add
    </button>`,
    "Total: ",
    html`<output class="summary-count">${count}</output>`,
  ];
});
