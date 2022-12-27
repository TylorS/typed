import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { Main } from '@typed/framework/Module.js'

import { createElement } from '@typed/dom/Document.js'
import * as Fx from '@typed/fx/index.js'
import { Route } from '@typed/route/Route.js'

export const route = Route('/react/:counter')

export const main = Main.make(route)((params) =>
  Fx.gen(function* ($) {
    // Lazy-load React and the Counter component
    const [{ createRoot }, Counter] = yield* $(
      Effect.promise(() =>
        Promise.all([
          import('react-dom/client'),
          import('../../components/react-counter.jsx').then((m) => m.Counter),
        ] as const),
      ),
    )
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
