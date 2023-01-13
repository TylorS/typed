import type { Layer } from '@effect/io/Layer'
import { pipe } from '@fp-ts/data/Function'
import { Tag } from '@typed/context'
import * as Fx from '@typed/fx'
import { html } from '@typed/html'

export interface CounterName {
  readonly name: string
}

export const CounterName = Tag<CounterName>()

export const Counter = Fx.gen(function* ($) {
  const count = yield* $(Fx.makeRef(() => 0))

  return html`
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
  `
})

export const layer: (name: string) => Layer<never, never, CounterName> = (name) =>
  CounterName.layerOf({ name })
