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
    const amount = yield* $(Fx.makeRefSubject(() => 1))

    return html`<div>
      <button
        onclick=${EventHandler(() =>
          pipe(
            amount.get,
            Effect.flatMap((n) => count.update((n2) => n2 - n)),
          ),
        )}
      >
        Decrement
      </button>

      <button
        onclick=${EventHandler(() =>
          pipe(
            amount.get,
            Effect.flatMap((n) => count.update((n2) => n2 + n)),
          ),
        )}
      >
        Increment
      </button>

      <input
        type="number"
        value=${amount}
        oninput=${EventHandler((e: InputEvent & { readonly currentTarget: HTMLInputElement }) =>
          amount.set(parseFloat(e.currentTarget.value)),
        )}
      />

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
