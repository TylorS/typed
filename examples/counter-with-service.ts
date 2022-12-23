/// <reference types="vite/client" />

import { pipe } from '@fp-ts/data/Function'
import { Tag } from '@typed/context/index.js'

import * as Fx from '@typed/fx/index.js'
import { runBrowser, html } from '@typed/html/index.js'

import.meta.env

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
      ${Example.with((e) =>
        pipe(
          model,
          Fx.map((x) => `${e.name}: ${x}`),
        ),
      )}
    </p>
  `
})

pipe(Counter, runBrowser(document.body), Example.provideFx({ name: 'Counter' }), Fx.unsafeRunAsync)
