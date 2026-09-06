import { component } from "@typed/ui/Component";
import { RefSubject } from "@typed/fx";
import { html } from "@typed/template";
export const Counter = component(function* () {
  // Allocate per mounted view so separate counters keep independent state.
  const count = yield* RefSubject.make(0);

  return html`<section class="counter-demo" aria-label="Counter">
    <h2>Counter</h2>
    <div class="counter-demo__controls">
      <button type="button" onclick=${RefSubject.decrement(count)}>−</button>
      <output aria-live="polite">${count}</output>
      <button type="button" onclick=${RefSubject.increment(count)}>+</button>
    </div>
  </section>`;
});
