import * as Fx from "@typed/fx/Fx"
import * as Num from "@typed/fx/RefNumber"
import { renderLayer } from "@typed/template/Render"
import * as RenderContext from "@typed/template/RenderContext"
import { html } from "@typed/template/RenderTemplate"
import { Effect, Layer } from "effect"

const Counter = Fx.gen(function*(_) {
  const count = yield* _(Num.of(0))

  return html`<div>
    <p>Count: ${count}</p>
    <button onclick=${Num.decrement(count)}>-</button>
    <button onclick=${Num.increment(count)}>+</button>
  </div>`
})

renderLayer(Counter).pipe(
  Layer.provide(RenderContext.browser(window)),
  Layer.launch,
  Effect.runFork
)
