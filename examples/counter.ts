import { pipe } from '@fp-ts/data/Function'
import { provideBrowserIntrinsics } from '@typed/framework/provideIntrinsics.js'

import * as Fx from '@typed/fx/index.js'
import { html, renderInto } from '@typed/html/index.js'

const Counter = Fx.gen(function* ($) {
  const count = yield* $(Fx.makeRef(() => 0))

  return html`
    <button onclick=${count.update((x) => x - 1)}>Decrement</button>
    <button onclick=${count.update((x) => x + 1)}>Increment</button>
    <p>Count: ${count}</p>
  `
})

pipe(Counter, renderInto(document.body), provideBrowserIntrinsics(window), Fx.unsafeRunAsync)
