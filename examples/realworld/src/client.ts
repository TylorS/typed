import { fromWindow, hydrateToLayer } from "@typed/core"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

Ui.router.redirect(Ui.pages.home.route).pipe(
  hydrateToLayer,
  Layer.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Layer.launch,
  Effect.scoped,
  Logger.withMinimumLogLevel(import.meta.env.PROD ? LogLevel.Info : LogLevel.Debug),
  Effect.runFork
)
