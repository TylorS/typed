import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Effect, Layer } from "effect";

// This view has no local setup, so html is enough.
const Counter = html`<main>
  <h1>Counter</h1>
  <output>0</output>
</main>`;

await render(Counter, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
