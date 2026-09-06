import { component } from "@typed/ui/Component";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";

export const Counter = component(function* () {
  // Allocate per mounted view so separate counters keep independent state.
  const count = yield* RefSubject.make(0);
  // A read view avoids keeping a second mutable value in sync.
  const doubled = RefSubject.map(count, (value) => value * 2);

  return html`<section class="counter-demo" aria-label="Counter">
    <h2>Counter</h2>
    <div class="counter-demo__controls">
      <button type="button" onclick=${RefSubject.decrement(count)}>Decrease</button>
      <output aria-live="polite">${count}</output>
      <button type="button" onclick=${RefSubject.increment(count)}>Increase</button>
    </div>
    <p>Twice the count: ${doubled}</p>
  </section>`;
});
