import { Counter } from "./Counter.js";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Effect, Layer } from "effect";

// Keep the running lifetime here; importing Counter should not mount it.
await render(html`<main>${Counter}</main>`, document.body).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate),
  Layer.launch,
  Effect.runPromise,
);
