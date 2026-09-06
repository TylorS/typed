import { Effect, Layer } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";

const Counter = Fx.gen(function* () {
  const count = yield* RefSubject.make(0);

  return html`<p>Count: ${count}</p>
    <button onclick=${RefSubject.increment(count)}>Increment</button>
    <button onclick=${RefSubject.decrement(count)}>Decrement</button>`;
});

render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
