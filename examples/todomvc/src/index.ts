import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import * as Route from "@typed/route"
import { CurrentRoute } from "@typed/router"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { Effect, Layer } from "effect"
import * as Option from "effect/Option"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

TodoApp.pipe(
  render,
  Fx.drainLayer,
  Layer.use(
    Layer.mergeAll(
      Live,
      Document.layer(document),
      RootElement.layer({ rootElement: document.body })
    )
  ),
  Layer.use(
    Layer.mergeAll(
      RenderContext.browser,
      CurrentRoute.layer({ route: Route.fromPath("/") as Route.Route<string>, parent: Option.none() })
    )
  ),
  Layer.launch,
  Effect.runFork
)
