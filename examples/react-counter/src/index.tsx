import * as Fx from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import { DomRenderEvent, renderToLayer } from "@typed/template"
import { Effect, Layer, Runtime } from "effect"
import * as React from "react"
import { createRoot } from "react-dom/client"

const Counter = Fx.gen(function*(_) {
  const count = yield* _(RefSubject.of(0))
  const scope = yield* _(Effect.scope)
  const runtime = yield* _(Effect.runtime<never>())
  const runFork = Runtime.runFork(runtime)
  const run = <A, E = never>(effect: Effect.Effect<A, E, never>) => runFork(effect, { scope })
  const inc = () => run(RefSubject.increment(count))
  const dec = () => run(RefSubject.decrement(count))

  return renderReact(Fx.map(count, (count) => (
    <>
      <p>{count}</p>
      <button onClick={inc}>+</button>
      <button onClick={dec}>-</button>
    </>
  )))
})

Counter.pipe(
  renderToLayer,
  Layer.launch,
  Effect.runFork
)

function renderReact<E = never, R = never>(reactNode: Fx.Fx<React.ReactNode, E, R>) {
  return Fx.suspend(() => {
    const el = document.createElement("div")
    el.classList.add("react-root")
    const root = createRoot(el)

    return Fx.map(reactNode, (node) => {
      root.render(node)
      return DomRenderEvent(el)
    })
  })
}
