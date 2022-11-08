import * as Effect from '@effect/core/io/Effect'
import { range } from '@tsplus/stdlib/collections/Chunk'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Fx from '@typed/fx'

import { Document } from './DOM/Document.js'
import { Renderable } from './HTML/Renderable.js'
import { EventHandler, Hole, RenderContext, drainInto, html } from './HTML/index.js'
import { Counter } from './elmish-example.js'

const counterTemplate = <C extends Renderable>(
  label: string,
  count: Fx.RefSubject<never, number>,
  children?: C,
) =>
  html`<div>
    <button onclick=${EventHandler(() => count.update((x) => x - 1))}>Decrement</button>
    <button onclick=${EventHandler(() => count.update((x) => x + 1))}>Increment</button>
    <p>${label}: ${count}</p>

    ${children}
  </div>`

const Counters: Fx.Fx<never, never, Hole> = Fx.fromFxGen(function* ($) {
  const count = yield* $(Fx.makeRefSubject(() => 0))
  const counters = pipe(
    count,
    Fx.map((x) => Array.from(range(1, x))),
    Fx.exhaustMapList(() => Counter),
  )

  return counterTemplate('Counters', count, counters)
})

const program = pipe(
  Counters,
  drainInto(document.body),
  RenderContext.provide,
  Document.provide(document),
)

Effect.unsafeRunAsync(program)
