import "./styles.css"

// import { getCurrentUserData } from "@/services"
import { isAuthenticated } from "@/services"
import { fromWindow, Fx, hydrateToLayer } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { RedirectError } from "@typed/navigation"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

Effect.gen(function*(_) {
  // Initialize the current user
  // yield* _(
  //   getCurrentUserData,
  //   Effect.forkScoped
  // )

  // Launch our UI application
  yield* _(Ui.router.notFound(onNotFound), Ui.layout, hydrateToLayer, Layer.launch)
}).pipe(
  Effect.provide(Ui.Live),
  Effect.provide(Storage.layer(localStorage)),
  Effect.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
  Effect.runFork
)

function onNotFound() {
  return Fx.fromEffect(Effect.gen(function*(_) {
    if (yield* _(isAuthenticated)) {
      return yield* _(new RedirectError({ path: Ui.pages.home.route.path }))
    } else {
      return yield* _(new RedirectError({ path: Ui.pages.login.route.path }))
    }
  }))
}
