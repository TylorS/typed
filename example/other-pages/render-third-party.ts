import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import { createElement, Location, querySelector } from '@typed/dom'
import type { IntrinsicServices } from '@typed/framework/IntrinsicServices'
import * as Fx from '@typed/fx'
import type { ParamsOf, Route } from '@typed/route'
import { type Redirect, Router } from '@typed/router'

import { isFirstRender } from './helper.js'

export function renderThirdParty<R, E, Path extends string, R2, E2, R3, E3>(
  route: Route<R, E, Path>,
  id: string,
  server: (container: HTMLElement, params: ParamsOf<typeof route>) => Effect.Effect<R2, E2, void>,
  browser: (
    container: HTMLElement,
    initial: ParamsOf<typeof route>,
    params: Fx.Fx<R, E | Redirect, ParamsOf<typeof route>>,
    shouldHydrate: boolean,
  ) => Fx.Fx<R3, E3, HTMLElement>,
) {
  return (
    params: Fx.Fx<R, E | Redirect, ParamsOf<typeof route>>,
  ): Fx.Fx<IntrinsicServices | R2 | R3, E2 | E3, HTMLElement> =>
    Fx.gen(function* ($) {
      const location = yield* $(Location.get)
      const router = yield* $(Router.get)
      const initialParams: Option.Option<ParamsOf<typeof route>> = (yield* $(
        // Route will already be amended here since it has been matched. The function
        // parameter is used merely for type-inference
        router.route.match(location.pathname),
      )) as any
      const current = yield* $(querySelector(`#${id}`))
      const container = yield* $(
        pipe(
          current,
          Option.match(
            () =>
              pipe(
                createElement('div'),
                Effect.tap((d) => Effect.sync(() => (d.id = id))),
              ),
            Effect.succeed,
          ),
        ),
      )

      if (Option.isNone(initialParams)) {
        throw new Error(
          'Bug it should be impossible to run this page without matching the current route',
        )
      }

      if (import.meta.env.SSR) {
        return Fx.as(container)(
          Fx.fromEffect<R2 | R3, E2 | E3, void>(server(container, initialParams.value)),
        )
      }

      return browser(
        container,
        initialParams.value,
        params,
        isFirstRender() && Option.isSome(current),
      )
    })
}
