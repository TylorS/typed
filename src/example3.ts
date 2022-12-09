import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { provideDomServices } from './DOM/DomServices.js'
import { RenderContext, drainInto, html } from './HTML/index.js'
import { homeRoute, makeRoute } from './Router/Route.js'
import * as Router from './Router/Router.js'

const fooRoute = makeRoute('/foo')
const barRoute = makeRoute('/bar')
const bazRoute = makeRoute('/baz')
const quuxRoute = makeRoute('/quux/:something')

const Counter = Fx.fromFxGen(function* ($) {
  const router = yield* $(Router.getRouter)

  return html`<div>
    <h1>App Shell</h1>

    <nav>
      <a href="${homeRoute.createPath({})}">Home</a>
      <a href="${fooRoute.createPath({})}">Foo</a>
      <a href="${barRoute.createPath({})}">Bar</a>
      <a href="${bazRoute.createPath({})}">Baz</a>
      <a href="${quuxRoute.createPath({ something: 'hello' })}">Hello</a>
      <a href="${quuxRoute.createPath({ something: 'world' })}">World</a>
    </nav>

    ${Fx.mergeAll([
      router.define(homeRoute).match(() => html`<div>Select a link</div>`),
      router.define(fooRoute).match(() => html`<div>Foo</div>`),
      router.define(barRoute).match(() => html`<div>Bar</div>`),
      router.define(bazRoute).match(() => html`<div>Baz</div>`),
      router.define(quuxRoute).match(({ something }) => html`<div>Quux: ${something}</div>`),
    ])}
  </div>`
})

const program = pipe(
  Counter,
  drainInto(document.body),
  RenderContext.provideClient,
  Effect.provideSomeLayer(Router.live),
  provideDomServices(window),
)

Effect.unsafeRunAsync(program)
