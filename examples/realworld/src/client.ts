import { getCurrentUser } from "@/ui/services/CurrentUser"
import { fromWindow, hydrateToLayer } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

Effect.gen(function*(_) {
  yield* _(Effect.log("Starting RealWorld Example"))

  // Initialize the current user
  yield* _(
    getCurrentUser,
    Effect.forkScoped
  )

  // Launch our UI application
  yield* _(Ui.router.redirect(Ui.pages.home.route), hydrateToLayer, Layer.launch)
}).pipe(
  Effect.provide(Ui.Live),
  Effect.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Effect.provide(Storage.layer(localStorage)),
  Effect.scoped,
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.runFork
)
