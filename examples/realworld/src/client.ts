import "./styles.css"

import { isAuthenticated } from "@/services"
import { fromWindow, Fx, renderToLayer, Navigation, Router } from "@typed/core"
import { Storage } from "@typed/dom/Storage"
import { Effect, Layer, Logger, LogLevel } from "effect"
import * as Ui from "./ui"

const onNotFound = Effect.gen(function*(_) {
  if (yield* _(Fx.first(isAuthenticated))) {
    return yield* _(new Navigation.RedirectError(Ui.pages.home.route))
  } else {
    return yield* _(new Navigation.RedirectError(Ui.pages.login.route))
  }
})

const main = Effect.gen(function* (_) {
  yield* _(Ui.router, Router.notFoundWith(onNotFound), Fx.tap(x => console.log(x)), Ui.layout, renderToLayer, Layer.launch)
})

main.pipe(
  Effect.provide(Ui.Live),
  Effect.provide(Storage.layer(localStorage)),
  Effect.provide(fromWindow(window, { rootElement: document.getElementById("app")! })),
  Logger.withMinimumLogLevel(LogLevel.Debug),
  Effect.scoped,
  Effect.runPromise
).catch(console.error)
