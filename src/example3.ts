import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import { Tag } from '@tsplus/stdlib/service/Tag'
import * as Fx from '@typed/fx'

import { provideDomServices } from './DOM/DomServices.js'
import { EventHandler, RenderContext, drainInto, html } from './HTML/index.js'
import { guard, homeRoute, makeRoute } from './Router/Route.js'
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
const authRoute = guard(makeRoute('/authed'), () => isAuthenticated)

const App = Fx.fromFxGen(function* ($) {
  const isAuthenticated = yield* $(Fx.makeRefSubject(() => false))

  return html`<div>
    <h1>App Shell</h1>

    <nav>
      <a href="${homeRoute.createPath({})}">Home</a>
      <a href="${fooRoute.createPath({})}">Foo</a>
      <a href="${barRoute.createPath({})}">Bar</a>
      <a href="${bazRoute.createPath({})}">Baz</a>
      <a href="${quuxRoute.createPath({ something: 'hello' })}">Hello</a>
      <a href="${quuxRoute.createPath({ something: 'world' })}">World</a>
      <a href="${loginRoute.createPath({})}">Login</a>
      ${pipe(
        isAuthenticated,
        Fx.switchMap((isAuthenticated) =>
          isAuthenticated ? html`<a href="${authRoute.createPath({})}">Secret</a>` : html``,
        ),
      )}
    </nav>

    ${Router.matchAll((router) => [
      router.define(homeRoute).match(() => html`<div>Select a link</div>`),
      router.define(fooRoute).match(() => html`<div>Foo</div>`),
      router.define(barRoute).match(() => html`<div>Bar</div>`),
      router.define(bazRoute).match(() => html`<div>Baz</div>`),
      router.define(quuxRoute).match(({ something }) => html`<div>Quux: ${something}</div>`),
      router.define(loginRoute).match(
        () => html`<div>
          <h1>Login</h1>
          <p>Are you human?</p>

          <button onclick=${EventHandler(() => isAuthenticated.set(true))}>Yes</button>
          <button onclick=${EventHandler(() => isAuthenticated.set(false))}>No</button>
        </div>`,
      ),
      pipe(
        router.define(authRoute).match(() => html`<div>Secret only for humans</div>`),
        Fx.provideService(AuthService, { isAuthenticated: isAuthenticated.get }),
      ),
    ])}
  </div>`
})

const program = pipe(
  App,
  drainInto(document.body),
  RenderContext.provideClient,
  Effect.provideSomeLayer(Router.live),
  provideDomServices(window),
)

Effect.unsafeRunAsync(program)
