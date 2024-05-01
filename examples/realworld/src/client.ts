import "./styles.css"

import { isAuthenticated } from "@/services"
import { hydrateFromWindow, hydrateToLayer, Navigation, Router } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel, pipe } from "effect"
import * as Ui from "./ui"

const onNotFound = Effect.gen(function*(_) {
  if (yield* _(isAuthenticated)) {
    return yield* _(new Navigation.RedirectError(Ui.pages.home.route))
  } else {
    return yield* _(new Navigation.RedirectError(Ui.pages.login.route))
  }
})

pipe(
  Ui.router,
  Router.notFoundWith(onNotFound),
  Ui.layout,
  hydrateToLayer,
  Layer.launch,
  Effect.provide(Ui.Live),
  Effect.provide(Storage.layer(localStorage)),
  Effect.provide(hydrateFromWindow(window, { rootElement: document.getElementById("app")! })),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
  Effect.ignoreLogged,
  Effect.runFork
)
