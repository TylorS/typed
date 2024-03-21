import "./styles.css"

// import { getCurrentUserData } from "@/services"
import { fromWindow, hydrateToLayer } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

Effect.gen(function*(_) {
  console.log("Starting")
  // Initialize the current user
  // yield* _(
  //   getCurrentUserData,
  //   Effect.forkScoped
  // )

  // Launch our UI application
  yield* _(Ui.router.redirect(Ui.pages.home.route), Ui.layout, hydrateToLayer, Layer.launch)
}).pipe(
  Effect.provide(Ui.Live),
  Effect.provide(Storage.layer(localStorage)),
  Effect.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
  Effect.runFork
)
