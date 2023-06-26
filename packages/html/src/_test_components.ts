import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { RenderEvent } from './RenderEvent.js'
import { RenderTemplate, html } from './RenderTemplate.js'

export const counter: Fx.Fx<Scope.Scope | RenderTemplate, never, RenderEvent> = Fx.gen(function* (
  $,
) {
  const count = yield* $(Fx.makeRef(Effect.succeed(typeof window !== 'undefined' ? 1 : 0)))
  const increment = count.update((n) => n + 1)
  const decrement = count.update((n) => n - 1)

  return html`
    <button id="decrement" onclick=${decrement}>-</button>
    <span id="count">${count}</span>
    <button id="increment" onclick=${increment}>+</button>
  `
})
