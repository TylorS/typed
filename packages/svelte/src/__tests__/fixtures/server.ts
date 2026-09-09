import * as Effect from "effect/Effect";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template/RenderTemplate";
import { render } from "svelte/server";
import { view } from "../../view.js";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import Typed from "@typed/svelte/Typed.svelte";
import Stateful from "./Stateful.svelte";
import RoundTrip from "./RoundTrip.svelte";
import { siblings } from "./trees.js";
import CapabilitiesRef from "./CapabilitiesRef.svelte";

export async function renderFixture(scenario: string, label: string) {
  if (scenario === "auto-identity") {
    const shared = view(Stateful, { label });
    return {
      html: await renderToHtmlString(siblings(shared, shared)).pipe(
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
        Effect.runPromise,
      ),
    };
  }
  if (scenario === "ref") {
    return Effect.gen(function* () {
      const ref = yield* RefSubject.make(Number(label));
      return {
        html: render(CapabilitiesRef, { props: { ref, options: { initial: Number(label) } } }).body,
      };
    }).pipe(Effect.scoped, Effect.runPromise);
  }
  if (scenario === "capabilities") {
    const { renderCapabilities } = await import("./capabilities-server.js");
    return renderCapabilities(label);
  }
  if (scenario === "round-trip") {
    return {
      html: await Effect.runPromise(
        Effect.scoped(
          renderToHtmlString(view(RoundTrip, { label }, { id: "round-trip" })).pipe(
            Effect.provide(HtmlRenderTemplate),
          ),
        ),
      ),
    };
  }
  if (scenario === "inverse") {
    const typedView = html`<button data-typed-counter>${label}</button>`;
    const output = await render(Typed, { props: { id: "inverse", value: typedView } });
    return { html: output.body, head: output.head };
  }
  const island = view(Stateful, { label }, { id: "counter" });
  return {
    html: await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(
          scenario === "siblings"
            ? siblings(island, view(Stateful, { label: "sibling" }, { id: "sibling" }))
            : island,
        ).pipe(Effect.provide(HtmlRenderTemplate)),
      ),
    ),
  };
}
