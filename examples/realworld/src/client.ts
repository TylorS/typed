import "./styles.css"

import { getCurrentUserData } from "@/services/CurrentUser"
import { fromWindow, hydrateToLayer } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

Effect.gen(function*(_) {
  yield* _(Effect.log("Starting RealWorld Example"))

  // Initialize the current user
  yield* _(
    getCurrentUserData,
    Effect.forkScoped
  )

  // Launch our UI application
  yield* _(Ui.router.redirect(Ui.pages.home.route), hydrateToLayer, Layer.launch)
}).pipe(
  Effect.provide(Layer.suspend(() => environment)),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
  Effect.runFork
)

const environment = Ui.Live.pipe(
  Layer.provideMerge(
    Layer.mergeAll(
      Storage.layer(localStorage),
      fromWindow(window, { rootElement: document.getElementById("app")! })
    )
  )
)
