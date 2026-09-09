import { RefSubject } from "@typed/fx";
import { component, html } from "@typed/template";
import { Effect, Schema } from "effect";

export const Counter = component(function* () {
  // The browser restores the server snapshot instead of replacing it with its default.
  const count = yield* RefSubject.hydrate(
    Schema.Finite,
    Effect.sync(() => (typeof document === "undefined" ? 7 : 0)),
  );

  const doubled = RefSubject.map(count, (value) => value * 2);

  // The root ref connects this subject to its serialized state during rendering.
  return html`<section class="counter-demo" aria-label="Counter" ref=${count}>
    <h2>Counter</h2>
    <div class="counter-demo__controls">
      <button type="button" onclick=${RefSubject.decrement(count)}>Decrease</button>
      <output aria-live="polite">${count}</output>
      <button type="button" onclick=${RefSubject.increment(count)}>Increase</button>
    </div>
    <p>Twice the count: ${doubled}</p>
  </section>`;
});
