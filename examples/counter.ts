import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'

import * as Fx from '../packages/fx/dist/index.js'
import { runBrowser, html } from '../packages/html/dist/index.js'

const Counter = Fx.gen(function* ($) {
  const count = yield* $(Fx.makeRef(() => 0))

  return html`
    <button onclick=${count.update((x) => x - 1)}>Decrement</button>
    <button onclick=${count.update((x) => x + 1)}>Increment</button>
    <p>Count: ${count}</p>
  `
})

pipe(Counter, runBrowser(document.body), Effect.unsafeRunAsync)
