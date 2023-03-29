import type * as Context from '@effect/data/Context'
import { flow, pipe } from '@effect/data/Function'
import * as Option from '@effect/data/Option'
import type * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import type * as Layer from '@effect/io/Layer'
import * as P from '@typed/path'
import * as ptr from 'path-to-regexp'

export interface Route<out R, out E, in out Path extends string> {
  /**
   * The path of the route
   */
  readonly path: Path

  /**
   * Create a path from the given params
   */
  readonly make: <Params extends P.ParamsOf<Path>>(params: Params) => P.Interpolate<Path, Params>

  /**
   * Match a path against the route
   */
  readonly match: (path: string) => Effect.Effect<R, E, Option.Option<P.ParamsOf<Path>>>

  /**
   * Add a guard to this Route, if the guard fails, the `onNoMatch` route will be called
   * with the params of the current route.
   */
  readonly guard: <R2 = never, E2 = never, R3 = never, E3 = never>(
    guard: (params: P.ParamsOf<Path>, path: string) => Effect.Effect<R2, E2, boolean>,
    onNoMatch?: (params: P.ParamsOf<Path>, path: string) => Effect.Effect<R3, E3, unknown>,
  ) => Route<R | R2 | R3, E | E2 | E3, Path>

  /**
   * Concatenate two routes together
   */
  readonly concat: <R2, E2, Path2 extends string>(
    route: Route<R2, E2, Path2>,
  ) => Route<R | R2, E | E2, P.PathJoin<readonly [Path, Path2]>>

  /**
   * Handle all causes from the route
   */
  readonly catchAllCause: <R2, E2>(
    f: (cause: Cause.Cause<E>) => Effect.Effect<R2, E2, Option.Option<P.ParamsOf<Path>>>,
  ) => Route<R | R2, E2, Path>

  /**
   * Handle all errors from the route
   */
  readonly catchAll: <R2, E2>(
    f: (e: E) => Effect.Effect<R2, E2, Option.Option<P.ParamsOf<Path>>>,
  ) => Route<R | R2, E2, Path>
}

export function Route<R = never, E = never, Path extends string = string>(
  path: Path,
  match: Route<R, E, Path>['match'] = Route.makeMatch<Path>(path),
): Route<R, E, Path> {
  const route: Route<R, E, Path> = {
    path,
    make: ptr.compile(path) as Route<R, E, Path>['make'],
    match,
    guard: (g, no) => pipe(route, guard(g, no)),
    concat: (r) => pipe(route, concat(r)),
    catchAllCause: (f) => Route(path, flow(match, Effect.catchAllCause(f))),
    catchAll: (f) => Route(path, flow(match, Effect.catchAll(f))),
  }

  return route
}

export namespace Route {
  export function makeMatch<P extends string>(path: P): Route<never, never, P>['match'] {
    const parse_ = ptr.match(path, { end: false })

    return (input: string) =>
      Effect.sync(() => {
        const match = parse_(input)

        return !match ? Option.none() : Option.some({ ...match.params } as unknown as P.ParamsOf<P>)
      })
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export type ResourcesOf<T> = T extends Route<infer R, infer _E, infer _A> ? R : never
export type ErrorsOf<T> = T extends Route<infer _R, infer _E, infer _A> ? _E : never
export type PathOf<T> = T extends Route<infer _R, infer _E, infer A> ? A : never
/* eslint-enable @typescript-eslint/no-unused-vars */

export type ParamsOf<T> = P.ParamsOf<PathOf<T>>

export const guard =
  <Path extends string, R2 = never, E2 = never, R3 = never, E3 = never>(
    guard: (params: P.ParamsOf<Path>, path: string) => Effect.Effect<R2, E2, boolean>,
    onNoMatch?: (params: P.ParamsOf<Path>, path: string) => Effect.Effect<R3, E3, unknown>,
  ) =>
  <R, E>(route: Route<R, E, Path>) =>
    Route(route.path, (path: string) =>
      Effect.gen(function* ($) {
        const params = yield* $(route.match(path))

        if (Option.isNone(params)) {
          return Option.none()
        }

        const matched = yield* $(guard(params.value, path))

        if (!matched) {
          if (onNoMatch) {
            yield* $(onNoMatch(params.value, path))
          }

          return Option.none()
        }

        return params
      }),
    )

export const concat =
  <R2, E2, Path2 extends string>(otherRoute: Route<R2, E2, Path2>) =>
  <R, E, Path extends string>(
    route: Route<R, E, Path>,
  ): Route<R | R2, E | E2, P.PathJoin<[Path, Path2]>> => {
    const concatPath = (
      route.path === '/'
        ? otherRoute.path
        : otherRoute.path === '/'
        ? route.path
        : (route.path + otherRoute.path).replace(/\/{1,}/g, '/').replace(/\/$/, '') || '/'
    ) as P.PathJoin<[Path, Path2]>

    const concatMatch = (path: string) =>
      Effect.gen(function* ($) {
        const aParams = yield* $(route.match(path))

        if (Option.isNone(aParams)) {
          return Option.none()
        }

        const aPath = route.make(aParams.value)
        const remainingPath = P.pathJoin(path.replace(aPath, '')) || '/'
        const bParams = yield* $(otherRoute.match(remainingPath))

        if (Option.isNone(bParams)) {
          return Option.none()
        }

        return Option.some({
          ...aParams.value,
          ...bParams.value,
        } as unknown as P.ParamsOf<P.PathJoin<[Path, Path2]>>)
      })

    return Route(concatPath, concatMatch)
  }

export const base = Route('/')

export const home = base.guard((_, p) => Effect.succeed(p === '/'))

export function provideContext<R>(context: Context.Context<R>) {
  return <E, Path extends string>(route: Route<R, E, Path>): Route<never, E, Path> =>
    Route(route.path, (path) => Effect.provideContext(context)(route.match(path)))
}

export function provideService<I, S>(tag: Context.Tag<I, S>, service: S) {
  return <R, E, Path extends string>(route: Route<R, E, Path>): Route<Exclude<R, I>, E, Path> =>
    Route(route.path, (path) => Effect.provideService(tag, service)(route.match(path)))
}

export function provideSomeLayer<R2, E2, S>(layer: Layer.Layer<R2, E2, S>) {
  return <R, E, Path extends string>(
    route: Route<R, E, Path>,
  ): Route<R2 | Exclude<R, S>, E | E2, Path> =>
    Route(route.path, (path) => Effect.provideSomeLayer(layer)(route.match(path)))
}

export function provideLayer<R0, E2, R>(layer: Layer.Layer<R0, E2, R>) {
  return <E, Path extends string>(route: Route<R, E, Path>): Route<R0, E | E2, Path> =>
    Route(route.path, (path) => Effect.provideLayer(layer)(route.match(path)))
}
