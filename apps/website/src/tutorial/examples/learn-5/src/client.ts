import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Effect, Layer } from "effect";
import { Counter } from "./Counter.js";

const host = document.getElementById("app");
if (host === null) throw new Error("Missing #app host");

// Attach inside the server's host so this view can reuse its existing DOM.
await render(Counter, host).pipe(
  Fx.drainLayer,
  Layer.provide(DomRenderTemplate.using(document)),
  Layer.launch,
  Effect.runPromise,
);
