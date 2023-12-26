import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { renderLayer } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { html } from "@typed/template/RenderTemplate"
import { Effect, Layer } from "effect"

const Counter = Fx.gen(function*(_) {
  const count = yield* _(RefSubject.of(0))

  return html`<div>
    <p>Count: ${count}</p>
    <button onclick=${RefSubject.decrement(count)}>-</button>
    <button onclick=${RefSubject.increment(count)}>+</button>
  </div>`
})

renderLayer(Counter).pipe(
  Layer.provide(RenderContext.dom(window)),
  Layer.launch,
  Effect.runFork
)
