import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { Effect } from "effect"
import { TodoApp } from "./presentation"

const program = Fx.drain(render(TodoApp))

const main = program.pipe(
  Effect.provide(RenderContext.browser),
  Document.provide(document),
  RootElement.provide({ rootElement: document.body }),
  Effect.scoped
)

Effect.runPromise(main).then(
  () => {
    console.log("Done!")
  },
  (error) => {
    console.error(error)
  }
)
