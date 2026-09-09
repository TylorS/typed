import { Ids } from "@typed/id/Ids";
import { DateTimes } from "@typed/id/DateTimes";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Effect, Layer } from "effect";
import { Services } from "./infrastructure.js";
import { TodoApp } from "./presentation.js";

await render(TodoApp, document.body).pipe(
  Fx.drainLayer,
  Layer.provide([Services.pipe(Layer.provide([Ids.Default, DateTimes.Default])), DomRenderTemplate]),
  Layer.launch,
  Effect.runPromise,
);
