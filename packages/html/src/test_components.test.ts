import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { it } from 'vitest'

import { RenderEvent } from './RenderEvent.js'
import { RenderTemplate, html } from './RenderTemplate.js'

export const counter: Fx.Fx<Scope.Scope | RenderTemplate, never, RenderEvent> = Fx.gen(
  function* ($) {
    const count = yield* $(Fx.makeRef(Effect.succeed(0)))
    const increment = count.update((n) => n + 1)
    const decrement = count.update((n) => n - 1)

    return html`
      <button id="decrement" onclick=${decrement}>-</button>
      <span id="count">${count}</span>
      <button id="increment" onclick=${increment}>+</button>
    `
  },
)

it('is great', () => {
  // This is here to keep vitest happy, but it's not actually testing anything.
  // We have this file named with .test to ensure any dependencies it utilizes are considered devDependencies.
})
