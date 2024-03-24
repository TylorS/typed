import "./styles.css"

import { isAuthenticated } from "@/services"
import { fromWindow, Fx, hydrateToLayer, Navigation } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

const main = Effect.gen(function*(_) {
  yield* _(Ui.router.notFound(onNotFound), Ui.layout, hydrateToLayer, Layer.launch)
})

main.pipe(
  Effect.provide(Ui.Live),
  Effect.provide(Storage.layer(localStorage)),
  Effect.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
  Effect.runFork
)

function onNotFound() {
  return Fx.fromEffect(Effect.gen(function*(_) {
    if (yield* _(Fx.first(isAuthenticated))) {
      return yield* _(new Navigation.RedirectError({ path: Ui.pages.home.route.path }))
    } else {
      return yield* _(new Navigation.RedirectError({ path: Ui.pages.login.route.path }))
    }
  }))
}
