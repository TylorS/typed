import "./styles.css"

import { isAuthenticated } from "@/services"
import { fromWindow, Fx, Navigation, renderToLayer, Router } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel, pipe } from "effect"
import * as Ui from "./ui"

const onNotFound = Effect.gen(function*(_) {
  if (yield* _(Fx.first(isAuthenticated))) {
    return yield* _(new Navigation.RedirectError(Ui.pages.home.route))
  } else {
    return yield* _(new Navigation.RedirectError(Ui.pages.login.route))
  }
})

const main = pipe(Ui.router, Router.notFoundWith(onNotFound), Ui.layout, renderToLayer, Layer.launch)

pipe(
  main,
  Effect.provide(Ui.Live),
  Effect.provide(Storage.layer(localStorage)),
  Effect.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
  Effect.runPromise
).catch(console.error)
