import { component } from "@typed/astro/Component";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import * as Effect from "effect/Effect";
import { curriculumDemo } from "../../tutorial/Demos.js";

export default component(function* ({ id }: { readonly id: string }) {
  // Client-only previews render immediately; counters await their source to adopt the server DOM.
  const demo = id.startsWith("todo-")
    ? Fx.fromEffect(Effect.tryPromise(() => curriculumDemo(id))).pipe(
        Fx.catch(() =>
          Fx.succeed(
            html`<p role="alert">
              The interactive example could not load. Reload the page to try again.
            </p>`,
          ),
        ),
        Fx.prepend(html`<p role="status">Loading the interactive example…</p>`),
        Fx.switchMap((view) => html`${view}`),
      )
    : yield* Effect.promise(() => curriculumDemo(id));
  return html`<div class="curriculum-demo" data-demo=${id}>${demo}</div>`;
});
