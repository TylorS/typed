/**
 * @since 1.0.0
 */

import * as Guard from "@typed/fx/Guard"
import * as Path from "@typed/path"
import { Effect, Option, Pipeable } from "effect"
import { dual } from "effect/Function"
import * as ptr from "path-to-regexp"

/**
 * @since 1.0.0
 */
export interface Route<P extends string> extends Pipeable.Pipeable {
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

  readonly asGuard: () => Guard.Guard<string, Path.ParamsOf<P>>
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

  return {
    match,
    path,
    params,
    make: ptr.compile(path, params.make) as Route<P>["make"],
    concat: (route, overrides) =>
      fromPath(Path.pathJoin(path, route.path), overrides ?? mergeRouteOptions(params, route.params)),
    asGuard() {
      return (path: string) => Effect.sync(() => match(path))
    },
    pipe(this: Route<P>) {
      return Pipeable.pipeArguments(this, arguments)
    }
  } as const
}

function mergeRouteOptions(options1: FromPathParams | undefined, options2: FromPathParams | undefined) {
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

/**
 * @since 1.0.0
 */
export function asGuard<P extends string>(route: Route<P>): Guard.Guard<string, Path.ParamsOf<P>> {
  return route.asGuard()
}

/**
 * @since 1.0.0
 */
export const mapEffect: {
  <P extends string, B, E2, R2>(
    f: (params: Path.ParamsOf<P>) => Effect.Effect<B, E2, R2>
  ): (route: Route<P>) => Guard.Guard<string, B, E2, R2>

  <P extends string, B, E2, R2>(
    route: Route<P>,
    f: (params: Path.ParamsOf<P>) => Effect.Effect<B, E2, R2>
  ): Guard.Guard<string, B, E2, R2>
} = dual(2, function mapEffect<P extends string, B, E2, R2>(
  route: Route<P>,
  f: (params: Path.ParamsOf<P>) => Effect.Effect<B, E2, R2>
): Guard.Guard<string, B, E2, R2> {
  return Guard.mapEffect(asGuard(route), f)
})

/**
 * @since 1.0.0
 */
export const map: {
  <P extends string, B>(
    f: (params: Path.ParamsOf<P>) => B
  ): (route: Route<P>) => Guard.Guard<string, B>

  <P extends string, B>(
    route: Route<P>,
    f: (params: Path.ParamsOf<P>) => B
  ): Guard.Guard<string, B>
} = dual(2, function map<P extends string, B>(
  route: Route<P>,
  f: (params: Path.ParamsOf<P>) => B
): Guard.Guard<string, B> {
  return Guard.map(asGuard(route), f)
})

/**
 * @since 1.0.0
 */
export const filterMap: {
  <P extends string, B>(
    f: (params: Path.ParamsOf<P>) => Option.Option<B>
  ): (route: Route<P>) => Guard.Guard<string, B>

  <P extends string, B>(
    route: Route<P>,
    f: (params: Path.ParamsOf<P>) => Option.Option<B>
  ): Guard.Guard<string, B>
} = dual(2, function filterMap<P extends string, B>(
  route: Route<P>,
  f: (params: Path.ParamsOf<P>) => Option.Option<B>
): Guard.Guard<string, B> {
  return Guard.filterMap(asGuard(route), f)
})

/**
 * @since 1.0.0
 */
export const filter: {
  <P extends string>(
    f: (params: Path.ParamsOf<P>) => boolean
  ): (route: Route<P>) => Guard.Guard<string, Path.ParamsOf<P>>

  <P extends string>(
    route: Route<P>,
    f: (params: Path.ParamsOf<P>) => boolean
  ): Guard.Guard<string, Path.ParamsOf<P>>
} = dual(2, function filter<P extends string>(
  route: Route<P>,
  f: (params: Path.ParamsOf<P>) => boolean
): Guard.Guard<string, Path.ParamsOf<P>> {
  return Guard.filter(asGuard(route), f)
})

/**
 * @since 1.0.0
 */
export const tap: {
  <P extends string, B, E2, R2>(
    f: (params: Path.ParamsOf<P>) => Effect.Effect<B, E2, R2>
  ): (route: Route<P>) => Guard.Guard<string, Path.ParamsOf<P>, E2, R2>

  <P extends string, B, E2, R2>(
    route: Route<P>,
    f: (params: Path.ParamsOf<P>) => Effect.Effect<B, E2, R2>
  ): Guard.Guard<string, Path.ParamsOf<P>, E2, R2>
} = dual(2, function tap<P extends string, B, E2, R2>(
  route: Route<P>,
  f: (params: Path.ParamsOf<P>) => Effect.Effect<B, E2, R2>
): Guard.Guard<string, Path.ParamsOf<P>, E2, R2> {
  return Guard.tap(asGuard(route), f)
})

/**
 * @since 1.0.0
 */
export function any<Routes extends Readonly<Record<string, Route<any>>>>(
  routes: Routes
): Guard.Guard<string, AnyOutput<Routes>> {
  const entries = Object.entries(routes)

  return (input) =>
    Effect.sync(() => {
      for (const [_tag, route] of entries) {
        const match = route.match(input)
        if (Option.isSome(match)) return Option.some({ _tag, ...match.value } as AnyOutput<Routes>)
      }
      return Option.none()
    })
}

/**
 * @since 1.0.0
 */
export type AnyOutput<Routes extends Readonly<Record<string, Route<any>>>> = [
  {
    [K in keyof Routes]: [{ readonly _tag: K } & Route.ParamsOf<Routes[K]>] extends [infer R]
      ? { readonly [K in keyof R]: R[K] }
      : never
  }[keyof Routes]
] extends [infer R] ? R : never
