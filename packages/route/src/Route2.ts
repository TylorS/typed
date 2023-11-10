import * as Path from "@typed/path"
import { Effect, Option, Pipeable } from "effect"
import { dual } from "effect/Function"
import * as ptr from "path-to-regexp"

export interface Route<I, R, E, O> extends Pipeable.Pipeable {
  (input: I): Effect.Effect<R, E, Option.Option<O>>
}

export function Route<I, R, E, O, const B extends Readonly<Record<PropertyKey, any>> = {}>(
  match: (input: I) => Effect.Effect<R, E, Option.Option<O>>,
  additional?: B
): Route<I, R, E, O> & B {
  return Object.assign(match, {
    pipe() {
      return Pipeable.pipeArguments(this, arguments)
    }
  }, additional)
}

export namespace Route {
  export type Input<T> = T extends Route<infer I, infer _R, infer _E, infer _A> ? I : never
  export type Context<T> = T extends Route<infer _I, infer R, infer _E, infer _A> ? R : never
  export type Erorr<T> = T extends Route<infer _I, infer _R, infer E, infer _A> ? E : never
  export type Ouptut<T> = T extends Route<infer _I, infer _R, infer _E, infer A> ? A : never
}

export type RouteMake<I, A> = (input: I) => A

export namespace RouteMake {
  export type Input<T> = T extends RouteMake<infer I, infer _A> ? I : never
  export type Output<T> = T extends RouteMake<infer _I, infer A> ? A : never
}

export interface PathRoute<P extends string> extends
  Route<
    string,
    never,
    never,
    Path.ParamsOf<P>
  >
{
  readonly path: P

  readonly params: FromPathParams

  readonly make: <const Params extends Path.ParamsOf<P>>(input: Params) => Path.Interpolate<P, Params>

  readonly concat: <P2 extends string>(
    route: PathRoute<P2>,
    params?: FromPathParams
  ) => PathRoute<Path.PathJoin<readonly [P, P2]>>
}

export function fromPath<const P extends string>(path: P, params: FromPathParams = {}): PathRoute<P> {
  const match_ = ptr.match(path, { end: false, ...params.match })

  return Route(
    (path: string) =>
      Effect.sync(() => {
        const match = match_(path)

        return match === false
          ? Option.none()
          : Option.some({ ...match.params } as unknown as Path.ParamsOf<P>)
      }),
    {
      path,
      params,
      make: ptr.compile(path, params.make) as PathRoute<P>["make"],
      concat: (route, params) =>
        fromPath(Path.pathJoin(path, route.path), params ?? mergeRouteOptions(params, route.params))
    } as const
  )
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

export function mapEffect<I, R, E, O, R2, E2, B>(
  route: Route<I, R, E, O>,
  f: (matched: O) => Effect.Effect<R2, E2, B>
): Route<
  I,
  R | R2,
  E | E2,
  B
> {
  return Route((input: I) => route(input).pipe(Effect.flatten, Effect.flatMap(f), Effect.optionFromOptional))
}

export const map: {
  <O, B>(
    f: (matched: O) => B
  ): <I, R, E>(route: Route<I, R, E, O>) => Route<I, R, E, B>

  <I, R, E, O, B>(
    route: Route<I, R, E, O>,
    f: (matched: O) => B
  ): Route<I, R, E, B>
} = dual(
  2,
  function map<I, R, E, O, B>(
    route: Route<I, R, E, O>,
    f: (matched: O) => B
  ): Route<I, R, E, B> {
    return Route((input) => route(input).pipe(Effect.flatten, Effect.map(f), Effect.optionFromOptional))
  }
)
