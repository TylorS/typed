import { Storage } from "@typed/dom/Storage"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { renderLayer, RenderQueue, renderToLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

const environment = Live.pipe(
  Layer.provideMerge(Storage.layer(localStorage)),
  Layer.provideMerge(Router.browser),
  Layer.provideMerge(Navigation.fromWindow),
  Layer.provideMerge(renderLayer(window)),
  Layer.provideMerge(RenderQueue.mixed({ timeout: 2000 }))
)

TodoApp.pipe(
  renderToLayer,
  Layer.launch,
  Effect.provide(environment),
  Effect.runFork
)
