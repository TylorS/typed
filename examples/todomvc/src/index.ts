import * as Router from "@typed/router"
import * as Navigation from "@typed/navigation"
import { renderLayer } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"
import { Storage } from "@typed/dom/Storage"

const environment = Live.pipe(
  Layer.provideMerge(Storage.layer(localStorage)),
  Layer.provideMerge(Router.browser),
  Layer.provideMerge(Navigation.fromWindow),
  Layer.provideMerge(RenderContext.browser(window)),
)

TodoApp.pipe(renderLayer, Layer.provide(environment), Layer.launch, Effect.runFork)
