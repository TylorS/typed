import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import type { ParamsOf, Route } from '@typed/route'
import type { ReactElement } from 'react'

import { renderThirdParty } from '../render-third-party.js'

export function renderReact<R, E, Path extends string, R2, E2>(
  route: Route<R, E, Path>,
  Component: (params: ParamsOf<typeof route>) => Effect.Effect<R2, E2, ReactElement>,
) {
  return renderThirdParty(
    route,
    'react-root',
    (params) =>
      Effect.gen(function* ($) {
        const { renderToString } = yield* $(Effect.promise(() => import('react-dom/server')))

        return renderToString(yield* $(Component(params)))
      }),
    (container, initialParams, params, shouldHydrate) =>
      Fx.gen(function* ($) {
        const { createRoot, hydrateRoot } = yield* $(
          Effect.promise(() => import('react-dom/client')),
        )
        const root: import('react-dom/client').Root = shouldHydrate
          ? hydrateRoot(container, yield* $(Component(initialParams)))
          : createRoot(container)

        return pipe(
          params,
          Fx.switchMapEffect(Component),
          Fx.map((reactElement) => (root.render(reactElement), container)),
          Fx.onInterrupt(() => Effect.sync(() => root.unmount())),
        )
      }),
  )
}
