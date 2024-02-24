/**
 * @since 1.0.0
 */

import type * as Guard from "@typed/guard"
import * as Path from "@typed/path"
import { Effect, Option, Pipeable } from "effect"
import * as ptr from "path-to-regexp"

/**
 * @since 1.0.0
 */
export interface Route<P extends string> extends Pipeable.Pipeable, Guard.AsGuard<string, Path.ParamsOf<P>> {
  readonly path: P

  readonly params: FromPathParams

  readonly match: (path: string) => Option.Option<Path.ParamsOf<P>>

  readonly make: <const Params extends Path.ParamsOf<P> = Path.ParamsOf<P>>(
    ...params: [keyof Params] extends [never] ? readonly [{}?] : readonly [Params]
  ) => Path.Interpolate<P, Params>

  readonly concat: <P2 extends string>(
    route: Route<P2>,
    params?: FromPathParams
  ) => Route<Path.PathJoin<readonly [P, P2]>>
}

/**
 * @since 1.0.0
 */
export namespace Route {
  /**
   * @since 1.0.0
   */
  export type Path<T> = T extends Route<infer P> ? P : never

  /**
   * @since 1.0.0
   */
  export type ParamsOf<T> = T extends Route<infer P> ? Path.ParamsOf<P> : never
}

/**
 * @since 1.0.0
 */
export function fromPath<const P extends string>(path: P, params: FromPathParams = {}): Route<P> {
  const match_ = ptr.match(path, { end: false, ...params.match })
  const match = (path: string) => {
    const match = match_(path)

    return match === false
      ? Option.none()
      : Option.some({ ...match.params } as unknown as Path.ParamsOf<P>)
  }

  let guard_: Guard.Guard<string, Path.ParamsOf<P>> | undefined

  return {
    match,
    path,
    params,
    make: ptr.compile(path, params.make) as Route<P>["make"],
    concat: (route, overrides) =>
      fromPath(Path.pathJoin(path, route.path), overrides ?? mergeFromPathParams(params, route.params)),
    asGuard() {
      return guard_ || (guard_ = (path: string) => Effect.succeed(match(path)))
    },
    pipe(this: Route<P>) {
      return Pipeable.pipeArguments(this, arguments)
    }
  } as const
}

function mergeFromPathParams(options1: FromPathParams | undefined, options2: FromPathParams | undefined) {
  if (options1 === undefined) {
    return options2
  } else if (options2 === undefined) {
    return options1
  } else {
    return {
      make: { ...options1.make, ...options2.make },
      match: { ...options1.match, ...options2.match }
    }
  }
}

/**
 * Options for creating and matching a route with path-to-regexp
 * @since 1.0.0
 */
/**
 * @since 1.0.0
 */
export interface FromPathParams {
  readonly make?: ptr.ParseOptions & ptr.TokensToFunctionOptions
  readonly match?: ptr.ParseOptions & ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
}
