import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { Main } from '@typed/framework/Module.js'
import { Counter } from 'components/react-counter.js'
import { createRoot } from 'react-dom/client'

import { createElement } from '@typed/dom/Document.js'
import * as Fx from '@typed/fx/index.js'
import { Route } from '@typed/route/Route.js'

export const route = Route('/react/:counter')

export const main = Main.make(route)((params) =>
  Fx.gen(function* ($) {
    // TODO: Is there a way to make this work without creating a wrapper element?
    const container = yield* $(createElement('div'))
    const root = createRoot(container)

    return pipe(
      params,
      Fx.tap(({ counter }) => Effect.sync(() => root.render(<Counter name={counter} />))),
      Fx.as(container),
      Fx.onInterrupt(() => Effect.sync(() => root.unmount())),
    )
  }),
)
