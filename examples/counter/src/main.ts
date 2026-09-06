import { component } from "@typed/ui/Component";
import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const Counter = component(function* () {
  // Allocate per mounted view so separate counters keep independent state.
  const count = yield* RefSubject.make(0);

  return html`<section aria-label="Counter">
    <p>Count: ${count}</p>
    <button onclick=${RefSubject.increment(count)}>Increment</button>
    <button onclick=${RefSubject.decrement(count)}>Decrement</button>
  </section>`;
});

// Keep the running lifetime here; importing a view should not mount it.
await render(html`<main>${Counter}</main>`, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
