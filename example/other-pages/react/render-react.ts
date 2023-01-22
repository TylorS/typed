import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { createElement, Location, querySelector } from '@typed/dom'
import type { Main } from '@typed/framework'
import * as Fx from '@typed/fx'
import type { ParamsOf, Route } from '@typed/route'
import { type Redirect, Router } from '@typed/router'
import type { ReactElement } from 'react'

import { isFirstRender } from '../helper.js'

export function renderReact<R, Path extends string>(
  route: Route<R, Path>,
  Component: (params: ParamsOf<typeof route>) => ReactElement,
): Main<never, typeof route> {
  return (params: Fx.Fx<R, Redirect, ParamsOf<typeof route>>) =>
    Fx.gen(function* ($) {
      const location = yield* $(Location.get)
      const router = yield* $(Router.get)
      const initialParams: Option.Option<ParamsOf<typeof route>> = (yield* $(
        // Route will already be amended here since it has been matched. The function
        // parameter is used merely for type-inference
        router.route.match(location.pathname),
      )) as any

      if (Option.isNone(initialParams)) {
        throw new Error(
          'Bug it should be impossible to run this page without matching the current route',
        )
      }

      if (!import.meta.env.SSR) {
        const { createRoot, hydrateRoot } = yield* $(
          Effect.promise(() => import('react-dom/client')),
        )

        const current = yield* $(querySelector('#react-root'))
        const container = yield* $(
          pipe(
            current,
            Option.match(() => createElement('div'), Effect.succeed),
          ),
        )

        const root = pipe(
          current,
          Option.match(
            () => createRoot(container),
            () => {
              if (!isFirstRender()) {
                return createRoot(container)
              }

              return hydrateRoot(container, Component(initialParams.value))
            },
          ),
        )

        return pipe(
          params,
          Fx.map((p) => (root.render(Component(p)), container)),
          Fx.onInterrupt(() => Effect.sync(() => root.unmount())),
        )
      }

      const { renderToString } = yield* $(Effect.promise(() => import('react-dom/server')))
      const container = yield* $(createElement('div'))

      container.id = 'react-root'
      container.innerHTML = renderToString(Component(initialParams.value))

      return Fx.succeed(container)
    })
}
