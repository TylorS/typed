import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import type { Layer } from '@effect/io/Layer'
import { Tag } from '@typed/context'
import * as Fx from '@typed/fx'
import { html } from '@typed/html'

export interface CounterName {
  readonly name: string
}

export const CounterName = Tag<CounterName>('CounterName')

export const Counter = Fx.gen(function* ($) {
  const count = yield* $(Fx.makeRef(Effect.sync(() => 0)))

  return html`<div>
    <button onclick=${count.update((x) => x - 1)}>Decrement</button>
    <button onclick=${count.update((x) => x + 1)}>Increment</button>

    <p>
      ${CounterName.withFx((e) =>
        pipe(
          count,
          Fx.map((x) => `${e.name}: ${x}`),
        ),
      )}
    </p>
  </div>`
})

export const layer: (name: string) => Layer<never, never, CounterName> = (name) =>
  CounterName.layerOf({ name })
