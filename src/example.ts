import * as Effect from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from './DOM/Document.js'
import { EventHandler } from './HTML/EventHandler.js'
import { RenderContext } from './HTML/RenderContext.js'
import { render } from './HTML/render.js'
import { html } from './HTML/tag.js'

const Counter = Fx.fromFxEffect(
  Effect.gen(function* ($) {
    const count = yield* $(Fx.makeRefSubject(() => 0))

    return html`<div>
      <button onclick=${EventHandler(() => count.update((n) => n - 1))}>Decrement</button>

      <button onclick=${EventHandler(() => count.update((n) => n + 1))}>Increment</button>

      <p>Count: ${count}</p>
    </div>`
  }),
)

const program = pipe(
  Counter,
  Fx.scanEffect(document.body, render),
  Fx.runDrain,
  RenderContext.provide,
  Effect.provideService(Document.Tag, document),
)

Effect.unsafeRunAsync(program)
