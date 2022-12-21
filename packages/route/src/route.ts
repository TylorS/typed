import * as Effect from '@effect/io/Effect'
import * as Option from '@fp-ts/data/Option'
import { ParamsOf, Interpolate, PathJoin, pathJoin } from '@typed/path'
import * as ptr from 'path-to-regexp'

export interface Route<R, E, Path extends string> {
  /**
   * The path of the route
   */
  readonly path: Path

  /**
   * Create a path from the given params
   */
  readonly make: <Params extends ParamsOf<Path>>(params: Params) => Interpolate<Path, Params>

  /**
   * Match a path against the route
   */
  readonly match: (path: string) => Effect.Effect<R, E, Option.Option<ParamsOf<Path>>>

  /**
   * Add a guard to this Route, if the guard fails, the `onNoMatch` route will be called
   * with the params of the current route.
   */
  readonly guard: <R2, E2, R3, E3>(
    guard: (params: ParamsOf<Path>) => Effect.Effect<R2, E2, boolean>,
    onNoMatch: (params: ParamsOf<Path>) => Effect.Effect<R3, E3, unknown>,
  ) => Route<R | R2 | R3, E | E2 | E3, Path>

  /**
   * Concatenate two routes together
   */
  readonly concat: <R2, E2, Path2 extends string>(
    route: Route<R2, E2, Path2>,
  ) => Route<R | R2, E | E2, PathJoin<readonly [Path, Path2]>>
}

export function Route<R, E, Path extends string>(
  path: Path,
  match: Route<R, E, Path>['match'] = Route.makeMatch(path),
): Route<R, E, Path> {
  const route: Route<R, E, Path> = {
    path,
    make: ptr.compile(path) as Route<R, E, Path>['make'],
    match,
    guard: (g, no) => guard(route)(g, no),
    concat: (r) => concat(r)(route),
  }

  return route
}

export namespace Route {
  export function makeMatch<P extends string>(path: P) {
    const parse_ = ptr.match(path, { end: path === '/' })

    return (input: string) =>
      Effect.sync(() => {
        const match = parse_(input)

        return !match ? Option.none : Option.some({ ...match.params } as unknown as ParamsOf<P>)
      })
  }
}

export const guard =
  <R, E, Path extends string>(route: Route<R, E, Path>) =>
  <R2, E2, R3, E3>(
    guard: (params: ParamsOf<Path>) => Effect.Effect<R2, E2, boolean>,
    onNoMatch: (params: ParamsOf<Path>) => Effect.Effect<R3, E3, unknown>,
  ) =>
    Route(route.path, (path: string) =>
      Effect.gen(function* ($) {
        const params = yield* $(route.match(path))

        if (Option.isNone(params)) {
          return Option.none
        }

        const matched = yield* $(guard(params.value))

        if (!matched) {
          yield* $(onNoMatch(params.value))

          return Option.none
        }

        return params
      }),
    )

export const concat =
  <R2, E2, Path2 extends string>(otherRoute: Route<R2, E2, Path2>) =>
  <R, E, Path extends string>(
    route: Route<R, E, Path>,
  ): Route<R | R2, E | E2, PathJoin<[Path, Path2]>> => {
    const concatPath = ((route.path + otherRoute.path).replace(/\/{1,}/g, '/').replace(/\/$/, '') ||
      '/') as PathJoin<[Path, Path2]>

    const concatMatch = (path: string) =>
      Effect.gen(function* ($) {
        const aParams = yield* $(route.match(path))

        if (Option.isNone(aParams)) {
          return Option.none
        }

        const aPath = route.make(aParams.value)
        const remainingPath = pathJoin(path.replace(aPath, '')) || '/'
        const bParams = yield* $(otherRoute.match(remainingPath))

        if (Option.isNone(bParams)) {
          return Option.none
        }

        return Option.some({
          ...aParams.value,
          ...bParams.value,
        } as unknown as ParamsOf<PathJoin<[Path, Path2]>>)
      })

    return Route(concatPath, concatMatch)
  }
