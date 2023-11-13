import * as Guard from "@typed/fx/Guard"
import * as Path from "@typed/path"
import { Effect, Option, Pipeable } from "effect"
import { dual } from "effect/Function"
import * as ptr from "path-to-regexp"

// TODO: More complete conversions to Guards map/tap/filter/filterMap

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

  readonly asGuard: () => Guard.Guard<string, never, never, Path.ParamsOf<P>>
}

export namespace Route {
  export type Path<T> = T extends Route<infer P> ? P : never

  export type ParamsOf<T> = T extends Route<infer P> ? Path.ParamsOf<P> : never
}

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
    concat: (route, params) =>
      fromPath(Path.pathJoin(path, route.path), params ?? mergeRouteOptions(params, route.params)),
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
export interface FromPathParams {
  readonly make?: ptr.ParseOptions & ptr.TokensToFunctionOptions
  readonly match?: ptr.ParseOptions & ptr.TokensToRegexpOptions & ptr.RegexpToFunctionOptions
}

export function asGuard<P extends string>(route: Route<P>): Guard.Guard<string, never, never, Path.ParamsOf<P>> {
  return route.asGuard()
}

export const mapEffect: {
  <P extends string, R2, E2, B>(
    f: (params: Path.ParamsOf<P>) => Effect.Effect<R2, E2, B>
  ): (route: Route<P>) => Guard.Guard<string, R2, E2, B>

  <P extends string, R2, E2, B>(
    route: Route<P>,
    f: (params: Path.ParamsOf<P>) => Effect.Effect<R2, E2, B>
  ): Guard.Guard<string, R2, E2, B>
} = dual(2, function mapEffect<P extends string, R2, E2, B>(
  route: Route<P>,
  f: (params: Path.ParamsOf<P>) => Effect.Effect<R2, E2, B>
): Guard.Guard<string, R2, E2, B> {
  return Guard.mapEffect(asGuard(route), f)
})

export const tap: {
  <P extends string, R2, E2, B>(
    f: (params: Path.ParamsOf<P>) => Effect.Effect<R2, E2, B>
  ): (route: Route<P>) => Guard.Guard<string, R2, E2, Path.ParamsOf<P>>

  <P extends string, R2, E2, B>(
    route: Route<P>,
    f: (params: Path.ParamsOf<P>) => Effect.Effect<R2, E2, B>
  ): Guard.Guard<string, R2, E2, Path.ParamsOf<P>>
} = dual(2, function tap<P extends string, R2, E2, B>(
  route: Route<P>,
  f: (params: Path.ParamsOf<P>) => Effect.Effect<R2, E2, B>
): Guard.Guard<string, R2, E2, Path.ParamsOf<P>> {
  return Guard.tap(asGuard(route), f)
})

export function any<Routes extends Readonly<Record<string, Route<any>>>>(
  routes: Routes
): Guard.Guard<string, never, never, AnyOutput<Routes>> {
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

export type AnyOutput<Routes extends Readonly<Record<string, Route<any>>>> = [
  {
    [K in keyof Routes]: [{ readonly _tag: K } & Route.ParamsOf<Routes[K]>] extends [infer R]
      ? { readonly [K in keyof R]: R[K] }
      : never
  }[keyof Routes]
] extends [infer R] ? R : never
