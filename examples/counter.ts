import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { Document } from '@typed/dom/index.js'
import * as Fx from '@typed/fx/index.js'
import { EventHandler, RenderContext, drainInto, html } from '@typed/html/index.js'

const Counter = Fx.gen(function* ($) {
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
  RenderContext.provideBrowser,
  Document.provide(document),
)

Effect.unsafeRunAsync(program)
