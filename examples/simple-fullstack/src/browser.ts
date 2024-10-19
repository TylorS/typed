import { fromWindow } from "@typed/core"
import { hydrateToLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import { App } from "./app"

App.pipe(
  hydrateToLayer,
  Layer.provide(fromWindow(window)),
  Layer.launch,
  Effect.scoped,
  Effect.runFork
)
