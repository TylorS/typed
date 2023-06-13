import * as Fx from '@typed/fx'
import { Renderable, html } from '@typed/html'
import * as Route from '@typed/route'
import * as Router from '@typed/router'
import * as Effect from '@effect/io/Effect'

// Type-safe routes
export const homeRoute = Route.Route('/', { match: { end: true } })
export const fooRoute = Route.Route('/foo/:foo')
export const barRoute = Route.Route('/bar/:bar')
export const fooBarRoute = fooRoute.concat(barRoute)

const counter = Fx.gen(function*($) {
  const count = yield* $(Fx.makeRef(Effect.succeed(0)))
  const increment = count.update((n) => n + 1)
  const decrement = count.update((n) => n - 1)

  return html`
    <div>
      <button onclick=${increment}>+</button>
      <button onclick=${decrement}>-</button>
      <span>${count}</span>
    </div>`
})

// Router
export const router = Router.match(
  fooBarRoute,
  (params) => html`<div>Foo: ${params.map((p) => p.foo)}; Bar: ${params.map((p) => p.bar)}</div>`,
)
  .match(fooRoute, (params) => html`<div>Foo: ${params.map((p) => p.foo)}</div>`)
  .match(barRoute, (params) => html`<div>Bar: ${params.map((p) => p.bar)}</div>`)
  .match(homeRoute, () => html`<div>Home</div>`)
  .notFound(() => counter)

// Layout
export const layout = <Content extends Renderable<any, any>>(content: Content) =>
  html`<main>${content}</main>`
