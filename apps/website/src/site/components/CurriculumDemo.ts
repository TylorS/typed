/* oxlint-disable require-yield -- Astro components accept stateless generator bodies. */
import { component } from "@typed/astro/Component";
import { html } from "@typed/template";
import { curriculumDemo } from "../../tutorial/Demos.js";

export default component(function* ({ id }: { readonly id: string }) {
  const demo = curriculumDemo(id);
  if (!demo) throw new Error(`Unknown curriculum demo: ${id}`);
  return html`<div class="curriculum-demo" data-demo=${id}>${demo}</div>`;
});
