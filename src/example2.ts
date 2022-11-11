import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from './DOM/Document.js'
import { DomSource } from './DOM/DomSource.js'
import { html } from './HTML/index.js'
import { run } from './run.js'

const Counter = Fx.fromFxGen(function* ($) {
  const dom = yield* $(DomSource.get)
  const decrement = pipe(dom, DomSource.query('.dec'), DomSource.events('click'), Fx.as(-1))
  const increment = pipe(dom, DomSource.query('.inc'), DomSource.events('click'), Fx.as(+1))
  const count = pipe(
    Fx.mergeAll([decrement, increment]),
    Fx.scan(0, (x, y) => x + y),
  )

  return html`<div>
    <button class="dec">Decrement</button>
    <button class="inc">Increment</button>
    <p>Count: ${count}</p>
  </div>`
})

const main = pipe(Counter, run(document.body), Document.provide(document))

Effect.unsafeRunAsync(main)
