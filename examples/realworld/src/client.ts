import * as CoreServices from "@typed/core/CoreServices"
import { hydrateToLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import * as Client from "./client/index"

hydrateToLayer(Client.router.redirect(Client.homeRoute)).pipe(
  Layer.provide(Client.Live),
  Layer.provide(CoreServices.fromWindow(window, { rootElement: document.getElementById("app")! })),
  Layer.launch,
  Effect.runFork
)
