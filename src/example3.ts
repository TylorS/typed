import * as Effect from '@effect/core/io/Effect'
import { millis } from '@tsplus/stdlib/data/Duration'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Tag } from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { provideDomServices } from './DOM/DomServices.js'
import { pushState } from './DOM/History.js'
import { EventHandler, RenderContext, drainInto, html } from './HTML/index.js'
import { homeRoute, makeRoute } from './Router/Route.js'
import * as Router from './Router/Router.js'

const fooRoute = makeRoute('/foo')
const barRoute = makeRoute('/bar')
const bazRoute = makeRoute('/baz')
const quuxRoute = makeRoute('/quux/:something')
const loginRoute = makeRoute('/login')

interface AuthService {
  readonly isAuthenticated: Effect.Effect<never, never, boolean>
}
const AuthService = Tag<AuthService>()
const isAuthenticated = Effect.serviceWithEffect(AuthService, (a) => a.isAuthenticated)
const secretRoute = makeRoute('/secret').guard(
  () => isAuthenticated,
  () => pushState(null, loginRoute.path),
)

const App = Fx.fromFxGen(function* ($) {
  const isAuthenticated = yield* $(Fx.makeRefSubject(() => false))

  const childView = pipe(
    Router.use((router) =>
      router
        .match(fooRoute, () => html`<h2>Foo</h2>`)
        .match(barRoute, () => html`<h2>Bar</h2>`)
        .match(bazRoute, () => html`<h2>Baz</h2>`)
        .match(quuxRoute, ({ something }) => html`<h2>Quux: ${something}</h2>`)
        .match(
          loginRoute,
          () => html`<h2>Login</h2>

            <p>Are you human?</p>

            <button onclick=${EventHandler(() => isAuthenticated.set(true))}>Yes</button>
            <button onclick=${EventHandler(() => isAuthenticated.set(false))}>No</button>`,
        )
        .match(secretRoute, () => html`<h2>Secret</h2>`)
        .match(homeRoute, () => html`<h2>Home</h2>`)
        .noMatch(() => html`<h2>404</h2>`),
    ),
    Fx.provideService(AuthService, { isAuthenticated: isAuthenticated.get }),
  )

  return html`<div>
    <h1>App Shell</h1>
    <nav>
      <ul>
        <li><a href="${homeRoute.path}">Home</a></li>
        <li><a href="${fooRoute.path}">Foo</a></li>
        <li><a href="${barRoute.path}">Bar</a></li>
        <li><a href="${bazRoute.path}">Baz</a></li>
        <li><a href="${quuxRoute.createPath({ something: 'hello' })}">Hello</a></li>
        <li><a href="${quuxRoute.createPath({ something: 'world' })}">World</a></li>
        <li><a href="${loginRoute.path}">Login</a></li>
        ${pipe(
          isAuthenticated,
          Fx.switchMap((isAuthenticated) =>
            isAuthenticated
              ? html`<li><a href="${secretRoute.path}">Secret</a></li>`
              : Fx.succeed(null),
          ),
        )}
      </ul>
    </nav>

    ${childView}
  </div>`
})

const program = pipe(
  App,
  drainInto(document.body),
  RenderContext.provideClient,
  Effect.provideSomeLayer(Router.routerLayer),
  provideDomServices(window),
)

Effect.unsafeRunPromiseExit(program).then(console.log)
