import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Services } from "./infrastructure";
import { TodoApp } from "./presentation";

await render(TodoApp, document.body).pipe(
  Fx.drainLayer,
  Layer.provide([Services, DomRenderTemplate]),
  Layer.launch,
  Effect.runPromise,
);
