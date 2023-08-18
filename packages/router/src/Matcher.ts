import * as Chunk from '@effect/data/Chunk'
import * as Debug from '@effect/data/Function'
import * as Pipeable from '@effect/data/Pipeable'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { RenderContext } from '@typed/html'
import { ParamsOf } from '@typed/path'
import { Route } from '@typed/route'

import { Match, MatchOptions } from './Match.js'
import { Redirect } from './Redirect.js'
import { matchRoutes } from './matchRoutes.js'
import { Router } from './router.js'

export interface Matcher<Matches extends ReadonlyArray<Match.Any>> extends Pipeable.Pipeable {
  /** @internal */
  readonly matches: Chunk.Chunk<Match.Any>

  /**
   * Matches a route to an Fx
   */
  readonly match: <P extends string, R, E, A, Opts extends MatchOptions.Any<P> = MatchOptions<P>>(
    route: Route<P>,
    render: (params: Fx.Filtered<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>,
    options?: Opts,
  ) => Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]>

  /**
   * Matches a route to a value
   */
  readonly matchTo: <P extends string, A, Opts extends MatchOptions.Any<P> = MatchOptions<P>>(
    route: Route<P>,
    to: (params: ParamsOf<P>) => A,
    options?: Opts,
  ) => Matcher<readonly [...Matches, Match<P, Fx.Fx<never, never, A>, Opts>]>

  /**
   * Matches a route to a lazy Fx
   */
  readonly matchLazy: <
    P extends string,
    R,
    E,
    A,
    Opts extends MatchOptions.Any<P> = MatchOptions<P>,
  >(
    route: Route<P>,
    render: () => Promise<(params: Fx.Filtered<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>>,
    options?: Opts,
  ) => Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]>

  /**
   * The default way to turn a Matcher into an Fx is by providing an Fx to run when
   * no routes match.
   */
  readonly notFound: <R, E, A>(
    render: (params: Fx.Filtered<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ) => Fx.Fx<
    Router | RenderContext | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Match.Success<Matches[number]>
  >

  /**
   * Redirect to a route when no routes match. This variant will only utilize
   * the route provided to it.
   */
  readonly redirect: <P extends string>(
    route: Route<P>,
    ...params: [keyof ParamsOf<P>] extends [never] ? [] : [ParamsOf<P>]
  ) => Fx.Fx<
    Router | RenderContext | Match.Context<Matches[number]>,
    Exclude<Match.Error<Matches[number]>, Redirect>,
    Match.Success<Matches[number]>
  >

  /**
   * Redirect to a route when no routes match. This variant will utilize the
   * parent Router to redirect a route relative to it.
   */
  readonly relativeRedirect: <P extends string>(
    route: Route<P>,
    ...params: [keyof ParamsOf<P>] extends [never] ? [] : [ParamsOf<P>]
  ) => Fx.Fx<
    Router | RenderContext | Match.Context<Matches[number]>,
    Cause.NoSuchElementException | Exclude<Match.Error<Matches[number]>, Redirect>,
    Match.Success<Matches[number]>
  >

  readonly concat: <OtherMatches extends ReadonlyArray<Match.Any>>(
    other: Matcher<OtherMatches>,
  ) => Matcher<readonly [...Matches, ...OtherMatches]>
}

export function Matcher<const Matches extends ReadonlyArray<Match.Any>>(
  matches: Chunk.Chunk<Match.Any>,
): Matcher<Matches> {
  function match<P extends string, R, E, A, Opts extends MatchOptions.Any<P> = never>(
    route: Route<P>,
    render: (params: Fx.Filtered<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>,
    options?: Opts,
  ): Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]> {
    return Matcher(Chunk.append(matches, Match(route, render, options || {})))
  }

  const self: Matcher<Matches> = {
    matches,
    match,
    matchTo<P extends string, A, Opts extends MatchOptions.Any<P> = never>(
      route: Route<P>,
      to: (params: ParamsOf<P>) => A,
      options?: Opts,
    ): Matcher<readonly [...Matches, Match<P, Fx.Fx<never, never, A>, Opts>]> {
      return match(route, (params) => params.map(to), options)
    },
    matchLazy<P extends string, R, E, A, Opts extends MatchOptions.Any<P> = never>(
      route: Route<P>,
      render: () => Promise<(params: Fx.Filtered<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>>,
      options?: Opts,
    ): Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]> {
      return Matcher(Chunk.append(matches, Match.lazy(route, render, options || {})))
    },

    notFound: <R, E, A>(
      render: (
        params: Fx.Filtered<never, never, Readonly<Record<string, string>>>,
      ) => Fx.Fx<R, E, A>,
    ) => Fx.scoped(matchRoutes(Chunk.toReadonlyArray(matches) as Matches, render)),

    redirect: (route, params?) =>
      redirectEffect(
        self,
        Redirect.redirect(route.make(params || ({} as any)), {
          history: 'replace',
        }),
      ),

    relativeRedirect: (route, params?) =>
      redirectEffect(
        self,
        Router.withEffect((router: Router) =>
          Effect.gen(function* ($) {
            const parentParams: ParamsOf<string> = yield* $(router.params)
            const allParams = { ...parentParams, ...params }
            const nested = router.route.concat(route)
            const url = nested.make(allParams as any)

            return yield* $(Redirect.redirect(url, { history: 'replace' }))
          }),
        ),
      ),

    concat: <OtherMatches extends ReadonlyArray<Match.Any>>(
      other: Matcher<OtherMatches>,
    ): Matcher<readonly [...Matches, ...OtherMatches]> => {
      return Matcher(Chunk.appendAll(matches, other.matches))
    },

    pipe() {
      // eslint-disable-next-line prefer-rest-params
      return Pipeable.pipeArguments(this, arguments)
    },
  }

  return self
}

export const { match, matchTo, matchLazy } = Matcher<readonly []>(Chunk.empty())

export const notFound: {
  <R, E, A>(
    render: (params: Fx.Filtered<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ): <Matches extends readonly Match.Any[]>(
    matcher: Matcher<Matches>,
  ) => Fx.Fx<
    Router | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Fx.Fx.Success<Match.Rendered<Matches[number]>>
  >

  <Matches extends readonly Match.Any[], R, E, A>(
    matcher: Matcher<Matches>,
    render: (params: Fx.Filtered<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ): Fx.Fx<
    Router | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Fx.Fx.Success<Match.Rendered<Matches[number]>>
  >
} = Debug.dual(
  2,
  <Matches extends readonly Match.Any[], R, E, A>(
    matcher: Matcher<Matches>,
    render: (params: Fx.Filtered<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ) => matcher.notFound(render),
)

export const redirectEffect: {
  <R, E>(
    effect: Effect.Effect<R, E, never>,
  ): <Matches extends readonly Match.Any[]>(
    matcher: Matcher<Matches>,
  ) => Fx.Fx<
    Router | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    Match.Success<Matches[number]>
  >

  <Matches extends readonly Match.Any[], R, E>(
    matcher: Matcher<Matches>,
    effect: Effect.Effect<R, E, never>,
  ): Fx.Fx<
    Router | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    Match.Success<Matches[number]>
  >
} = Debug.dual(
  2,
  <Matches extends readonly Match.Any[], R, E>(
    matcher: Matcher<Matches>,
    effect: Effect.Effect<R, E, never>,
  ) => notFound(matcher, () => Fx.fromEffect(effect)),
)
