import * as Router from "@typed/router"
import { RenderContext, renderLayer } from "@typed/template"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

TodoApp.pipe(
  renderLayer,
  Layer.use(Live),
  Layer.use(Router.browser),
  Layer.use(RenderContext.browser(window)),
  Layer.launch,
  Effect.runFork
)
