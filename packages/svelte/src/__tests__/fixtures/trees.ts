import { html } from "@typed/template/RenderTemplate";
import type { Renderable } from "@typed/template/Renderable";

// One literal shared by both environments makes fixture hydration independent
// of formatting changes in the browser and server test harnesses.
export function siblings<A extends Renderable.Any, B extends Renderable.Any>(first: A, second: B) {
  return html`<main>${first}<span data-between>between</span>${second}</main>`;
}
