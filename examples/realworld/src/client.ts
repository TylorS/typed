import "./styles.css"

import { getCurrentUser } from "@/ui/services/CurrentUser"
import { fromWindow, hydrateToLayer } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

const main = Effect.gen(function*(_) {
  // Initialize the current user
  yield* _(
    getCurrentUser,
    Effect.forkScoped
  )

  // Launch our UI application
  yield* _(Ui.router.redirect(Ui.pages.home.route), hydrateToLayer, Layer.launch)
})

main.pipe(
  Effect.provide(Ui.Live),
  Effect.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Effect.provide(Storage.layer(localStorage)),
  Effect.scoped,
  Logger.withMinimumLogLevel(import.meta.env.PROD ? LogLevel.Info : LogLevel.Debug),
  Effect.runFork
)
