/**
 * @typed/route is a small wrapper around path-to-regexp that provides a type-safe
 * way to create, match, and concatenate routes.
 * @since 1.0.0
 */

import * as Option from "effect/Option"
import * as Path from "@typed/path"
import * as ptr from "path-to-regexp"

/**
 * A Route is a data structure for creating and matching
 * paths based on path-to-regexp.
 * @since 1.0.0
 */
export interface Route<in out P extends string> {
  /**
   * The underlying path of the route
   * @since 1.0.0
   */
  readonly path: P

  /**
   * The options used to create the route
   * @since 1.0.0
   */
  readonly options?: RouteOptions

  /**
   * Create a path from a given set params
   * @since 1.0.0
   */
  readonly make: MakeRoute<P>

  /**
   * Match a path against this route
   * @since 1.0.0
   */
  readonly match: (path: string) => Option.Option<Path.ParamsOf<P>>

  /**
   * Concatenate this route with another route
   * @since 1.0.0
   */
  readonly concat: <const P2 extends string>(
    route: Route<P2>,
    options?: RouteOptions
  ) => Route<Path.PathJoin<readonly [P, P2]>>
}

/**
 * Create a Route from a path and optional options
 * @since 1.0.0
 */
export type MakeRoute<P extends string> = <const Params extends Path.ParamsOf<P>>(
  params: Params
) => Path.Interpolate<P, Params>

/**
 * Create a Route from a path and optional options to path-to-regexp
 * @since 1.0.0
 */
export function Route<const P extends string>(path: P, options?: RouteOptions): Route<P> {
  const match = Route.makeMatch(path, options?.match)
  const self: Route<P> = {
    path,
    options,
    make: ptr.compile(path, options?.make) as Route<P>["make"],
    match,
    concat<P2 extends string>(
      route: Route<P2>,
      overrides?: RouteOptions
    ): Route<Path.PathJoin<readonly [P, P2]>> {
      const opts = overrides ?? mergeRouteOptions(options, route.options)

      return Route(Path.pathJoin(path, route.path), opts)
    }
  }

  return self
}

function mergeRouteOptions(options1: RouteOptions | undefined, options2: RouteOptions | undefined) {
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
export interface RouteOptions {
  readonly make?: ptr.ParseOptions & ptr.TokensToFunctionOptions
  readonly match?: ptr.ParseOptions & ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
}

/**
 * @since 1.0.0
 */
export namespace Route {
  /**
   * Create a Route from a path and optional options
   * @since 1.0.0
   */
  export function makeMatch<P extends string>(
    path: P,
    options?: RouteOptions["match"]
  ): Route<P>["match"] {
    const parse_ = ptr.match(path, { end: false, ...options })

    return (input: string) => {
      const match = parse_(input)

      return !match
        ? Option.none()
        : Option.some({ ...match.params } as unknown as Path.ParamsOf<P>)
    }
  }
}

/**
 * Get the path of a Route
 * @since 1.0.0
 */
export type PathOf<T extends Route<any>> = [T] extends [Route<infer P>] ? P : never

/**
 * Get the params of a Route
 * @since 1.0.0
 */
export type ParamsOf<T extends Route<any>> = [T] extends [Route<infer P>] ? Path.ParamsOf<P> : never
