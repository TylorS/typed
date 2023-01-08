import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import { createElement } from '@typed/dom'
import { Main } from '@typed/framework'
import * as Fx from '@typed/fx'
import { Route } from '@typed/route'
import React from 'react'

export const route = Route('/react/:counter')

export const main = Main.make(route)((params) =>
  Fx.gen(function* ($) {
    // Lazy-load React and the Counter component
    const [{ createRoot }, Counter] = yield* $(
      Effect.promise(() =>
        Promise.all([
          import('react-dom/client'),
          import('../../components/react-counter.js').then((m) => m.Counter),
        ] as const),
      ),
    )
    // TODO: Is there a way to make this work without creating a wrapper element?
    const container = yield* $(createElement('div'))
    container.id = 'react-root'
    const root = createRoot(container)

    return pipe(
      params,
      // Render our counter anytime the route params changes
      Fx.tap(({ counter }) => Effect.sync(() => root.render(<Counter name={counter} />))),
      // Cleanup our root when unmounted
      Fx.onInterrupt(() => Effect.sync(() => root.unmount())),
      // Anything that can be converted into an Fx of DOM nodes will work
      Fx.as(container),
    )
  }),
)
