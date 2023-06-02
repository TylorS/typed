import * as Debug from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { Navigation } from '@typed/navigation'
import { ParamsOf } from '@typed/path'
import { Route } from '@typed/route'

import { Match, MatchOptions } from './Match.js'
import { Redirect } from './Redirect.js'
import { Router } from './Router.js'
import { matchRoutes } from './matchRoutes.js'

export interface Matcher<Matches extends ReadonlyArray<Match.Any>> {
  readonly matches: Matches

  readonly match: <P extends string, R, E, A, Opts extends MatchOptions.Any<P> = MatchOptions<P>>(
    route: Route<P>,
    render: (params: Fx.Computed<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>,
    options?: Opts,
  ) => Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]>

  readonly matchLazy: <
    P extends string,
    R,
    E,
    A,
    Opts extends MatchOptions.Any<P> = MatchOptions<P>,
  >(
    route: Route<P>,
    render: () => Promise<(params: Fx.Computed<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>>,
    options?: Opts,
  ) => Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]>

  readonly notFound: <R, E, A>(
    render: (params: Fx.Computed<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ) => Fx.Fx<
    Router | Navigation | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Match.Success<Matches[number]>
  >
}

export function Matcher<const Matches extends ReadonlyArray<Match.Any>>(
  matches: Matches,
): Matcher<Matches> {
  return {
    matches,

    match<P extends string, R, E, A, Opts extends MatchOptions.Any<P> = never>(
      route: Route<P>,
      render: (params: Fx.Computed<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>,
      options?: Opts,
    ): Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]> {
      return Matcher([...matches, Match(route, render, options || {})] as any)
    },

    matchLazy<P extends string, R, E, A, Opts extends MatchOptions.Any<P> = never>(
      route: Route<P>,
      render: () => Promise<(params: Fx.Computed<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>>,
      options?: Opts,
    ): Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]> {
      return Matcher([...matches, Match.lazy(route, render, options || {})] as any)
    },

    notFound: <R, E, A>(
      render: (
        params: Fx.Computed<never, never, Readonly<Record<string, string>>>,
      ) => Fx.Fx<R, E, A>,
    ) => Fx.scoped(matchRoutes(matches, render)),
  }
}

export const { match, matchLazy } = Matcher([] as const)

export const notFound: {
  <R, E, A>(
    render: (params: Fx.Computed<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ): <Matches extends readonly Match.Any[]>(
    matcher: Matcher<Matches>,
  ) => Fx.Fx<
    Navigation | Router<string> | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Fx.Fx.OutputOf<Match.Rendered<Matches[number]>>
  >

  <Matches extends readonly Match.Any[], R, E, A>(
    matcher: Matcher<Matches>,
    render: (params: Fx.Computed<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ): Fx.Fx<
    Navigation | Router<string> | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Fx.Fx.OutputOf<Match.Rendered<Matches[number]>>
  >
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <Matches extends readonly Match.Any[], R, E, A>(
      matcher: Matcher<Matches>,
      render: (
        params: Fx.Computed<never, never, Readonly<Record<string, string>>>,
      ) => Fx.Fx<R, E, A>,
    ) =>
      matcher.notFound(render).addTrace(trace),
)

export const redirectEffect: {
  <R, E>(effect: Effect.Effect<R, E, never>): <Matches extends readonly Match.Any[]>(
    matcher: Matcher<Matches>,
  ) => Fx.Fx<
    Router | Navigation | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    Match.Success<Matches[number]>
  >

  <Matches extends readonly Match.Any[], R, E>(
    matcher: Matcher<Matches>,
    effect: Effect.Effect<R, E, never>,
  ): Fx.Fx<
    Router | Navigation | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    Match.Success<Matches[number]>
  >
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <Matches extends readonly Match.Any[], R, E>(
      matcher: Matcher<Matches>,
      effect: Effect.Effect<R, E, never>,
    ) =>
      notFound(matcher, () => Fx.fromEffect(effect)).addTrace(trace),
)
