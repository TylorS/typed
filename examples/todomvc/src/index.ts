import { Storage } from "@typed/dom/Storage"
import * as Fx from "@typed/fx/Fx"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { RenderQueue, renderToLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

const environment = Live.pipe(
  Layer.provideMerge(Storage.layer(localStorage)),
  Layer.provideMerge(Router.browser),
  Layer.provideMerge(Navigation.fromWindow)
)

TodoApp.pipe(
  Fx.provide(environment),
  renderToLayer,
  // Layer.provide(RenderQueue.sync),
  // Layer.provide(RenderQueue.raf),
  Layer.provide(RenderQueue.idle({ timeout: 2000 })),
  Layer.launch,
  Effect.runFork
)
