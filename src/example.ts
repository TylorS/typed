import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from './DOM/Document.js'
import { EventHandler, Hole, RenderContext, drainInto, html } from './HTML/index.js'

const Counter: Fx.Fx<never, never, Hole> = Fx.fromFxEffect(
  Effect.gen(function* ($) {
    const count = yield* $(Fx.makeRefSubject(() => 0))

    return html`<div>
      <button onclick=${EventHandler(() => count.update((x) => x - 1))}>Decrement</button>
      <button onclick=${EventHandler(() => count.update((x) => x + 1))}>Increment</button>
      <p>Count: ${count}</p>
    </div>`
  }),
)

const program = pipe(
  Counter,
  drainInto(document.body),
  RenderContext.provide,
  Document.provide(document),
)

Effect.unsafeRunAsync(program)
