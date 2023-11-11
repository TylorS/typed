import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { Effect, Layer } from "effect"
import { Live } from "./infrastructure"
import { TodoApp } from "./presentation"

TodoApp.pipe(
  render,
  Fx.drainLayer,
  Layer.use(
    Layer.mergeAll(
      Live,
      RenderContext.browser,
      Document.layer(document),
      RootElement.layer({ rootElement: document.body })
    )
  ),
  Layer.launch,
  Effect.runFork
)
