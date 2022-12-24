import { Layer } from '@effect/io/Layer'
import { pipe } from '@fp-ts/data/Function'
import { Tag } from '@typed/context/index.js'

import * as Fx from '@typed/fx/index.js'
import { html } from '@typed/html/index.js'

export interface Example {
  readonly name: string
}

export const Example = Tag<Example>()

export const Counter = Fx.gen(function* ($) {
  const model = yield* $(Fx.makeRef(() => 0))

  return html`
    <button onclick=${model.update((x) => x - 1)}>Decrement</button>
    <button onclick=${model.update((x) => x + 1)}>Increment</button>

    <p>
      ${Example.withFx((e) =>
        pipe(
          model,
          Fx.map((x) => `${e.name}: ${x}`),
        ),
      )}
    </p>
  `
})

export const liveExample: Layer<never, never, Example> = Example.layerOf({ name: 'Live' })
