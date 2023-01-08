import * as Effect from '@effect/io/Effect'
import { pipe } from '@fp-ts/data/Function'
import * as Option from '@fp-ts/data/Option'
import { createElement, Location, querySelector } from '@typed/dom'
import { Main } from '@typed/framework'
import * as Fx from '@typed/fx'
import { RenderContext } from '@typed/html'
import { ParamsOf, Route } from '@typed/route'
import { Redirect } from '@typed/router'
import { ReactElement } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'

// Only the first render should ever use hydrate
let firstRender = true

export function renderReact<R, Path extends string>(
  route: Route<R, Path>,
  Component: (params: ParamsOf<typeof route>) => ReactElement,
): Main<never, typeof route> {
  return (params: Fx.Fx<R, Redirect, ParamsOf<typeof route>>) =>
    Fx.gen(function* ($) {
      const ctx = yield* $(RenderContext.get)
      const location = yield* $(Location.get)
      const initialParams = yield* $(route.match(location.pathname))

      if (Option.isNone(initialParams)) {
        throw new Error(
          'Bug it should be impossible to run this page without matching the current route',
        )
      }

      if (ctx.environment === 'browser') {
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
              if (!firstRender) {
                return createRoot(container)
              }

              firstRender = false

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

      const container = yield* $(createElement('div'))

      container.id = 'react-root'
      container.innerHTML = renderToString(Component(initialParams.value))

      return Fx.succeed(container)
    })
}
