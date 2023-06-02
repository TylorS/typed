import { pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import * as Effect from '@effect/io/Effect'
import * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'
import { Navigation, NavigationError } from '@typed/navigation'
import { ParamsOf } from '@typed/path'

import { Match } from './Match.js'
import { Redirect } from './Redirect.js'
import { Router, getCurrentPathFromUrl } from './Router.js'

export function matchRoutes<
  const Matches extends ReadonlyArray<Match.Any>,
  R = never,
  E = never,
  A = never,
>(
  matches: Matches,
  onNotFound: (
    params: Fx.Computed<never, never, Readonly<Record<string, string>>>,
  ) => Fx.Fx<R, E, A> = () => Fx.empty(),
): Fx.Fx<
  Router | Navigation | R | Match.Context<Matches[number]> | Scope.Scope,
  Exclude<E | Match.Error<Matches[number]>, Redirect>,
  A | Match.Success<Matches[number]>
> {
  type _R = R | Match.Context<Matches[number]> | Router | Navigation | Scope.Scope
  type _E = E | Match.Error<Matches[number]> | Redirect
  type _A = A | Match.Success<Matches[number]>

  type RENDERABLE = Fx.Fx<_R, _E, _A>

  return Fx.gen(function* ($) {
    const navigation = yield* $(Navigation)
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
        match.route,
        render,
        match.options?.guard as
          | ((params: ParamsOf<string>) => Effect.Effect<_R, NavigationError, boolean>)
          | undefined,
        match.options?.onMatch as
          | ((params: ParamsOf<string>) => Effect.Effect<_R, _E, unknown>)
          | undefined,
      ] as const
    })

    const matched = yield* $(
      Fx.makeRef<never, any, RENDERABLE>(Effect.succeed<RENDERABLE>(Fx.empty())),
    )

    const matchPath = (path: string) =>
      Effect.gen(function* ($) {
        for (const [route, render, guard, onMatch] of matchers) {
          const params = route.match(path)

          if (Option.isSome(params)) {
            // If there is a guard and it fails, continue to next route
            if (guard && !(yield* $(guard(params.value)))) {
              continue
            }

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
      navigation.onNavigation((event) => matchPath(getCurrentPathFromUrl(event.destination.url))),
    )

    yield* $(Effect.addFinalizer(() => matched.end()))

    return pipe(
      matched,
      Redirect.switchMatch(
        (r) => Fx.as(Fx.fromEffect(navigation.navigate(r.url, r.options)), Option.none()),
        Fx.map(Option.some),
      ),
      Fx.compact,
    )
  })
}
