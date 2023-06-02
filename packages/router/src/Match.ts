import * as Effect from '@effect/io/Effect'
import * as Fx from '@typed/fx'
import { NavigationError } from '@typed/navigation'
import { ParamsOf } from '@typed/path'
import { Route } from '@typed/route'

export type MatchOptions<
  P extends string,
  Guard extends Effect.Effect<any, NavigationError, boolean> = Effect.Effect<
    never,
    NavigationError,
    boolean
  >,
  Matched extends Effect.Effect<any, any, any> = Effect.Effect<never, never, unknown>,
> = {
  readonly guard?: (params: ParamsOf<P>) => Guard
  readonly onMatch?: (params: ParamsOf<P>) => Matched
}

export namespace MatchOptions {
  export type Any<P extends string> =
    | MatchOptions<P, any, any>
    | MatchOptions<P, never, never>
    | MatchOptions<P, any, never>
    | MatchOptions<P, never, any>
}

export type Match<
  in out P extends string,
  out Rendered extends Fx.Fx<any, any, any>,
  in out Options extends MatchOptions<P, any, any> = MatchOptions<P>,
> = {
  readonly route: Route<P>
  readonly render: (params: Fx.Computed<never, never, ParamsOf<P>>) => Rendered
  readonly options?: Options
}

export namespace Match {
  export type Any = Match<any, any, any> | Match<any, any, never>

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Rendered<M extends Any> = M extends Match<any, infer R, infer _> ? R : never

  export type Options<M extends Any> = M extends Match<any, any, infer Options> ? Options : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Guard<M extends Any> = [Options<M>] extends [MatchOptions<any, infer Guard, infer _>]
    ? Guard
    : never

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export type Matched<M extends Any> = Options<M> extends MatchOptions<any, infer _, infer Matched>
    ? Matched
    : never

  export type Context<M extends Any> =
    | Fx.Fx.ResourcesOf<Rendered<M>>
    | ([Guard<M>] extends [never] ? never : Effect.Effect.Context<Guard<M>>)
    | ([Matched<M>] extends [never] ? never : Effect.Effect.Context<Matched<M>>)

  export type Error<M extends Any> =
    | Fx.Fx.ErrorsOf<Rendered<M>>
    | ([Guard<M>] extends [never] ? never : Exclude<Effect.Effect.Error<Guard<M>>, NavigationError>)
    | ([Matched<M>] extends [never] ? never : Effect.Effect.Error<Matched<M>>)

  export type Success<M extends Any> = Fx.Fx.OutputOf<Rendered<M>>
}

export function Match<P extends string, Rendered extends Fx.Fx<any, any, any>>(
  route: Route<P>,
  render: (params: Fx.Computed<never, never, ParamsOf<P>>) => Rendered,
): Match<P, Rendered, MatchOptions<P>>

export function Match<
  P extends string,
  Rendered extends Fx.Fx<any, any, any>,
  Options extends MatchOptions.Any<P>,
>(
  route: Route<P>,
  render: (params: Fx.Computed<never, never, ParamsOf<P>>) => Rendered,
  options: Options,
): Match<P, Rendered, Options>

export function Match<
  P extends string,
  Rendered extends Fx.Fx<any, any, any>,
  Options extends MatchOptions.Any<P> = MatchOptions<P, never, never>,
>(
  route: Route<P>,
  render: (params: Fx.Computed<never, never, ParamsOf<P>>) => Rendered,
  options?: Options,
): Match<P, Rendered, Options> | Match<P, Rendered, never> {
  return {
    route,
    render,
    options,
  }
}

Match.lazy = function <
  P extends string,
  Rendered extends Fx.Fx<any, any, any>,
  Options extends MatchOptions.Any<P> = MatchOptions<P>,
>(
  route: Route<P>,
  render: () => Promise<(params: Fx.Computed<never, never, ParamsOf<P>>) => Rendered>,
  options?: Options,
): Match<P, Rendered, Options> | Match<P, Rendered, never> {
  return {
    route,
    render: (params) => Fx.promiseFx(() => render().then((f) => f(params))) as Rendered,
    options,
  }
}
