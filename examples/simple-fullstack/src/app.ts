import { Fx, html, RefSubject, Route, Router } from "@typed/core"

const CounterRoute = Route.literal("counter")
const Counter = Fx.gen(function*() {
  const count = yield* RefSubject.of(0)

  return html`<div>
    <p>Count: ${count}</p>
    <button onclick=${RefSubject.decrement(count)}>-</button>
    <button onclick=${RefSubject.increment(count)}>+</button>
  </div>`
})

const HelloRoute = Route.home
const Hello = html`<h1>Hello World</h1>`

export const router = Router
  .match(CounterRoute, () => Counter)
  .match(HelloRoute, () => Hello)

export const App = router.pipe(Router.redirectTo(HelloRoute))
