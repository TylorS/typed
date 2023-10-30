import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { Effect, Layer } from "effect"
import { TodoApp } from "./presentation"

TodoApp.pipe(
  render,
  Fx.drain,
  Effect.provide(
    Layer.mergeAll(
      RenderContext.browser,
      Document.layer(document),
      RootElement.layer({ rootElement: document.body })
    )
  ),
  Effect.runFork
)
