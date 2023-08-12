import { identity, pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { RenderContext } from '@typed/html'
import { NavigationError } from '@typed/navigation'
import { ParamsOf } from '@typed/path'

import { Match } from './Match.js'
import { Redirect } from './Redirect.js'
import { Router, getCurrentPathFromUrl } from './router.js'

export function matchRoutes<
  const Matches extends ReadonlyArray<Match.Any>,
  R = never,
  E = never,
  A = never,
>(
  matches: Matches,
  onNotFound: (
    params: Fx.Filtered<never, never, Readonly<Record<string, string>>>,
  ) => Fx.Fx<R, E, A> = () => Fx.empty(),
): Fx.Fx<
  Router | RenderContext | Scope.Scope | R | Match.Context<Matches[number]>,
  Exclude<E | Match.Error<Matches[number]>, Redirect>,
  A | Match.Success<Matches[number]>
> {
  type _R = R | Match.Context<Matches[number]> | RenderContext | Router | Scope.Scope
  type _E = E | Match.Error<Matches[number]> | Redirect
  type _A = A | Match.Success<Matches[number]>

  type RENDERABLE = Fx.Fx<_R, _E, _A>

  return Fx.gen(function* ($) {
    const { environment } = yield* $(RenderContext)
    const isBrowser = environment === 'browser'
    const router = yield* $(Router)
    const notFound = onNotFound(router.params) as RENDERABLE
    const matchers = matches.map((match) => {
      const nestedRouter = router.define(match.route)
      const render = pipe(
        nestedRouter.params,
        match.render,
        Fx.provideService(Router, nestedRouter as Router),
        Fx.scoped,
      ) as RENDERABLE

      return [
        nestedRouter.route,
        render,
        match.options?.guard as
          | ((params: ParamsOf<string>) => Effect.Effect<_R, NavigationError, boolean>)
          | undefined,
        match.options?.onMatch as
          | ((params: ParamsOf<string>) => Effect.Effect<_R, _E, unknown>)
          | undefined,
      ] as const
    })
    const length = matchers.length

    const matched = yield* $(
      Fx.makeRef<never, any, RENDERABLE>(Effect.succeed<RENDERABLE>(Fx.empty())),
    )

    const matchPath = (path: string) =>
      Effect.gen(function* ($) {
        for (let i = 0; i < length; ++i) {
          const [route, render, guard, onMatch] = matchers[i]
          yield* $(Effect.logDebug(`Matching ${path} with ${route.path}`))
          const params = route.match(path)

          if (Option.isSome(params)) {
            // If there is a guard and it fails, continue to next route
            if (guard && !(yield* $(guard(params.value)))) {
              continue
            }

            yield* $(Effect.logDebug(`Matched ${path} with ${route.path}`))

            // If there is an onMatch handler, run it and catch any errors
            // This is useful when you want to add tracking when a route is matched
            if (onMatch) {
              yield* $(
                onMatch(params.value),
                Effect.catchAllCause((cause) => matched.error(cause)),
                Effect.forkScoped,
              )
            }

            return yield* $(matched.set(render))
          }
        }

        return yield* $(matched.set(notFound))
      })

    // Match a Route when navigation occurs
    yield* $(
      router.navigation.onNavigation((event) =>
        matchPath(getCurrentPathFromUrl(event.destination.url)),
      ),
    )

    return pipe(
      matched,
      isBrowser ? identity : Fx.take(1),
      Redirect.switchMatch(
        (r) => Fx.as(Fx.fromEffect(router.navigation.navigate(r.url, r.options)), Option.none()),
        Fx.map(Option.some),
      ),
      Fx.compact,
    )
  })
}
