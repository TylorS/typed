import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { renderLayer, RenderQueue, renderToLayer } from "@typed/template"
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

Counter.pipe(
  renderToLayer,
  Layer.provide(renderLayer(window)),
  Layer.provide(RenderQueue.mixed()),
  Layer.launch,
  Effect.runFork
)
