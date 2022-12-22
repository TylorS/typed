import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import { Document } from '../packages/dom/dist/index.js'
import * as Fx from '../packages/fx/dist/index.js'
import { makeElementRef, RenderContext, drainInto, html } from '../packages/html/dist/index.js'

const Counter = Fx.gen(function* ($) {
  const ref = yield* $(makeElementRef<HTMLDivElement>())
  const inc = Fx.as(+1)(ref.query('.inc').events('click'))
  const dec = Fx.as(-1)(ref.query('.dec').events('click'))
  const count = pipe(
    Fx.mergeAll(inc, dec),
    Fx.scan(0, (x, y) => x + y),
  )

  return html`<div ref=${ref}>
    <button class="dec">Decrement</button>
    <button class="inc">Increment</button>
    <p>Count: ${count}</p>
  </div>`
})

const program = pipe(
  Counter,
  drainInto(document.body),
  RenderContext.provideBrowser,
  Document.provide(document),
)

Effect.unsafeRunAsync(program)
