import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from './DOM/Document.js'
import { EventHandler, RenderContext, drainInto, html } from './HTML/index.js'

const Counter = Fx.fromFxGen(function* ($) {
  const count = yield* $(Fx.makeRefSubject(() => 0))

  return html`<div>
    <button onclick=${EventHandler(() => count.update((x) => x - 1))}>Decrement</button>
    <button onclick=${EventHandler(() => count.update((x) => x + 1))}>Increment</button>
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
