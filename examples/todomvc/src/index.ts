import * as Navigation from "@typed/navigation"
import * as Router from "@typed/router"
import { renderLayer } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

TodoApp.pipe(
  renderLayer,
  Layer.use(Live),
  Layer.use(Router.browser),
  Layer.use(Navigation.fromWindow),
  Layer.use(RenderContext.browser(window)),
  Layer.launch,
  Effect.runFork
)
