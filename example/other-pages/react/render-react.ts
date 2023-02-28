import { pipe } from '@effect/data/Function'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import type { ParamsOf, Route } from '@typed/route'
import type { ReactElement } from 'react'

import { renderThirdParty } from '../render-third-party.js'

export function renderReact<R, E, Path extends string>(
  route: Route<R, E, Path>,
  Component: (params: ParamsOf<typeof route>) => ReactElement,
) {
  return renderThirdParty(
    route,
    'react-root',
    (container, params) =>
      Effect.gen(function* ($) {
        const { renderToString } = yield* $(Effect.promise(() => import('react-dom/server')))

        container.id = 'react-root'
        container.innerHTML = renderToString(Component(params))
      }),
    (container, initialParams, params, shouldHydrate) =>
      Fx.gen(function* ($) {
        const { createRoot, hydrateRoot } = yield* $(
          Effect.promise(() => import('react-dom/client')),
        )
        const root = shouldHydrate
          ? hydrateRoot(container, Component(initialParams))
          : createRoot(container)

        return pipe(
          params,
          Fx.map((p) => (root.render(Component(p)), container)),
          Fx.onInterrupt(() => Effect.sync(() => root.unmount())),
        )
      }),
  )
}
