import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { EventHandler, Placeholder, Renderable, html } from '@typed/html'
import * as Route from '@typed/route'
import * as Router from '@typed/router'

// Type-safe routes
export const homeRoute = Route.Route('/', { match: { end: true } })
export const fooRoute = Route.Route('/foo/:foo')
export const barRoute = Route.Route('/bar/:bar')
export const fooBarRoute = fooRoute.concat(barRoute)

const counter = Fx.gen(function* ($) {
  const count = yield* $(Fx.makeRef(Effect.succeed(typeof window !== 'undefined' ? 1 : 0)))
  const increment = count.update((n) => n + 1)
  const decrement = count.update((n) => n - 1)

  return html`
    <button id="${'decrement'}" onclick=${decrement}>-</button>
    <span>${count}</span>
    <button id="${'increment'}" onclick=${increment}>+</button>
  `
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
  html`<main>
    <nav>
      <ul></ul>
    </nav>
    <section>${content}</section>
  </main>`

export const ListItemLink = <
  T extends Placeholder<any, any, string>,
  L extends Placeholder<any, any, string>,
>(
  to: T,
  label: L,
) =>
  Router.Link(
    { to, relative: false },
    ({ url, navigate }) => html`<li>
      <a href=${url} onclick=${EventHandler.preventDefault(() => navigate)}>${label}</a>
    </li>`,
  )
