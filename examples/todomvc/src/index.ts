import { Storage } from "@typed/dom/Storage"
import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { renderLayer } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

// We must eliminate the time it takes between diffing and patching the DOM
// There is a lot of time spent spinning up templates

const environment = Live.pipe(
  Layer.provideMerge(Storage.layer(localStorage)),
  Layer.provideMerge(Router.browser),
  Layer.provideMerge(Navigation.fromWindow),
  Layer.provideMerge(RenderContext.dom(window))
)

TodoApp.pipe(
  renderLayer,
  Layer.provide(environment),
  Layer.launch,
  Effect.scoped,
  Effect.runFork
)
