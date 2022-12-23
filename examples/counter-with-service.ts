import { Tag } from '@fp-ts/data/Context'
import { pipe } from '@fp-ts/data/Function'

import * as Fx from '../packages/fx/dist/index.js'
import { runBrowser, html } from '../packages/html/dist/index.js'

interface Example {
  readonly name: string
}
const Example = Object.assign(Tag<Example>(), {
  with: <R, E, A>(f: (t: Example) => Fx.Fx<R, E, A>) => Fx.serviceWithFx(Example)(f),
})

const Counter = Fx.gen(function* ($) {
  const model = yield* $(Fx.makeRef(() => 0))

  return html`
    <button onclick=${model.update((x) => x - 1)}>Decrement</button>
    <button onclick=${model.update((x) => x + 1)}>Increment</button>
    <p>
      ${Example.with((e) =>
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
