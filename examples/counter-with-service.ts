import { Tag } from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

import * as Fx from '../packages/fx/dist/index.js'
import { runBrowser, html } from '../packages/html/dist/index.js'

interface Example {
  readonly name: string
}
const Example = Tag<Example>()

const Counter = Fx.gen(function* ($) {
  const model = yield* $(Fx.makeRef(() => 0))

  return html`
    <button onclick=${model.update((x) => x - 1)}>Decrement</button>
    <button onclick=${model.update((x) => x + 1)}>Increment</button>
    <p>
      ${Fx.serviceWithFx(Example)((e) =>
        pipe(
          model,
          Fx.map((x) => `${e.name}: ${x}`),
        ),
      )}
    </p>
  `
})

pipe(
  Counter,
  runBrowser(document.body),
  Fx.provideService(Example, { name: 'Count' }),
  Fx.unsafeRunAsync,
)
