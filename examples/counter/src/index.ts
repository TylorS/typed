import { Document } from "@typed/dom/Document"
import { RootElement } from "@typed/dom/RootElement"
import * as Fx from "@typed/fx/Fx"
import * as Num from "@typed/fx/RefNumber"
import { render } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { html } from "@typed/template/RenderTemplate"
import { Effect } from "effect"

const Counter = Fx.gen(function*(_) {
  const count = yield* _(Num.of(0))

  return yield* _(html`<div>
    <p>Count: ${count}</p>
    <button onclick=${Num.decrement(count)}>-</button>
    <button onclick=${Num.increment(count)}>+</button>
  </div>`)
})

const program = Fx.drain(render(Counter))

const main = program.pipe(
  Effect.provide(RenderContext.browser),
  Document.provide(document),
  RootElement.provide({ rootElement: document.body }),
  Effect.scoped
)

Effect.runPromise(main).catch((error) => {
  console.error(error)
})
