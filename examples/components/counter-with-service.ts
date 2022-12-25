import { Layer } from '@effect/io/Layer'
import { pipe } from '@fp-ts/data/Function'
import { Tag } from '@typed/context/index.js'

import * as Fx from '@typed/fx/index.js'
import { html } from '@typed/html/index.js'

export interface CounterName {
  readonly name: string
}

export const CounterName = Tag<CounterName>()

export const Counter = Fx.gen(function* ($) {
  const model = yield* $(Fx.makeRef(() => 0))

  return html`
    <button onclick=${model.update((x) => x - 1)}>Decrement</button>
    <button onclick=${model.update((x) => x + 1)}>Increment</button>

    <p>
      ${CounterName.withFx((e) =>
        pipe(
          model,
          Fx.map((x) => `${e.name}: ${x}`),
        ),
      )}
    </p>
  `
})

export const layer: (name: string) => Layer<never, never, CounterName> = (name) =>
  CounterName.layerOf({ name })
