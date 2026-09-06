import { expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Fx from "@typed/fx/Fx";
import { html } from "../RenderTemplate.js";
import { HtmlRenderTemplate, renderToHtmlString } from "../Html.js";
import { DomRenderTemplate, render } from "../Render.js";

it("keeps optional ARIA attributes absent across SSR and matching-node hydration", () =>
  Effect.gen(function* () {
    const view = html`<dialog
      ...${{ "aria-labelledby": "search-heading", "aria-label": undefined, "aria-describedby": undefined }}
    >
      <h2 id="search-heading">Search</h2>
    </dialog>`;
    const markup = yield* renderToHtmlString(view).pipe(Effect.provide(HtmlRenderTemplate));
    const host = document.createElement("div");
    host.innerHTML = markup;
    document.body.append(host);
    yield* Effect.addFinalizer(() => Effect.sync(() => host.remove()));
    const dialog = host.querySelector("dialog");
    if (!dialog) throw new Error("Missing dialog");
    expect(dialog.hasAttribute("aria-label")).toBe(false);
    expect(dialog.hasAttribute("aria-describedby")).toBe(false);
    const [hydrated] = yield* render(view, host).pipe(
      Fx.provide(DomRenderTemplate.using(document)),
      Fx.take(1),
      Fx.collectUpTo(1),
    );
    expect(hydrated).toBe(dialog);
    expect(dialog.getAttribute("aria-labelledby")).toBe("search-heading");
    expect(dialog.hasAttribute("aria-label")).toBe(false);
    expect(dialog.hasAttribute("aria-describedby")).toBe(false);
  }).pipe(Effect.scoped, Effect.runPromise));
