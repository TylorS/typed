import { Effect, Layer } from "effect";
import { Fx } from "@typed/fx";
import * as Router from "@typed/router";
import { DomRenderTemplate, render } from "@typed/template";
import { appRoutes } from "./app.js";

await appRoutes.pipe(
  render(document.getElementById("app")!),
  Fx.drainLayer,
  Layer.provide(Router.BrowserRouter(window)),
  Layer.provide(DomRenderTemplate.using(window.document)),
  Layer.launch,
  Effect.runPromise,
);
