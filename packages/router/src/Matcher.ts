import * as Chunk from '@effect/data/Chunk'
import * as Debug from '@effect/data/Debug'
import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { ParamsOf } from '@typed/path'
import { Route } from '@typed/route'

import { Match, MatchOptions } from './Match.js'
import { Redirect } from './Redirect.js'
import { matchRoutes } from './matchRoutes.js'
import { Router } from './router.js'

export interface Matcher<Matches extends ReadonlyArray<Match.Any>> {
  readonly match: <P extends string, R, E, A, Opts extends MatchOptions.Any<P> = MatchOptions<P>>(
    route: Route<P>,
    render: (params: Fx.Filtered<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>,
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
    render: () => Promise<(params: Fx.Filtered<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>>,
    options?: Opts,
  ) => Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]>

  readonly notFound: <R, E, A>(
    render: (params: Fx.Filtered<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ) => Fx.Fx<
    Router | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Match.Success<Matches[number]>
  >
}

export function Matcher<const Matches extends ReadonlyArray<Match.Any>>(
  matches: Chunk.Chunk<Match.Any>,
): Matcher<Matches> {
  return {
    match<P extends string, R, E, A, Opts extends MatchOptions.Any<P> = never>(
      route: Route<P>,
      render: (params: Fx.Filtered<never, never, ParamsOf<P>>) => Fx.Fx<R, E, A>,
      options?: Opts,
    ): Matcher<readonly [...Matches, Match<P, Fx.Fx<R, E, A>, Opts>]> {
      return Matcher(Chunk.append(matches, Match(route, render, options || {})))
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
  }
}

export const { match, matchLazy } = Matcher<readonly []>(Chunk.empty())

export const notFound: {
  <R, E, A>(
    render: (params: Fx.Filtered<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ): <Matches extends readonly Match.Any[]>(
    matcher: Matcher<Matches>,
  ) => Fx.Fx<
    Router<string> | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Fx.Fx.OutputOf<Match.Rendered<Matches[number]>>
  >

  <Matches extends readonly Match.Any[], R, E, A>(
    matcher: Matcher<Matches>,
    render: (params: Fx.Filtered<never, never, Readonly<Record<string, string>>>) => Fx.Fx<R, E, A>,
  ): Fx.Fx<
    Router<string> | R | Match.Context<Matches[number]>,
    Exclude<E | Match.Error<Matches[number]>, Redirect>,
    A | Fx.Fx.OutputOf<Match.Rendered<Matches[number]>>
  >
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <Matches extends readonly Match.Any[], R, E, A>(
      matcher: Matcher<Matches>,
      render: (
        params: Fx.Filtered<never, never, Readonly<Record<string, string>>>,
      ) => Fx.Fx<R, E, A>,
    ) =>
      matcher.notFound(render).addTrace(trace),
)

export const redirectEffect: {
  <R, E>(effect: Effect.Effect<R, E, never>): <Matches extends readonly Match.Any[]>(
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
} = Debug.dualWithTrace(
  2,
  (trace) =>
    <Matches extends readonly Match.Any[], R, E>(
      matcher: Matcher<Matches>,
      effect: Effect.Effect<R, E, never>,
    ) =>
      notFound(matcher, () => Fx.fromEffect(effect)).addTrace(trace),
)
