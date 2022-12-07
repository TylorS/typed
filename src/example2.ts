import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from './DOM/Document.js'
import { RenderContext, drainInto, html, makeElementRef } from './HTML/index.js'

const Counter = Fx.fromFxGen(function* ($) {
  const ref = yield* $(makeElementRef<HTMLDivElement>())
  const decrement = pipe(ref.query('.dec').events('click'), Fx.as(-1))
  const increment = pipe(ref.query('.inc').events('click'), Fx.as(+1))
  const count = pipe(
    Fx.mergeAll([decrement, increment]),
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
  RenderContext.provideClient,
  Document.provide(document),
)

Effect.unsafeRunAsync(program)
