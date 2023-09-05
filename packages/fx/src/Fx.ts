import type * as Option from "@effect/data/Option"
import type * as Effect from "@effect/io/Effect"
import * as core from "@typed/fx/internal/core"
import type * as Sink from "@typed/fx/Sink"

export const FxTypeId: core.FxTypeId = core.FxTypeId
export type FxTypeId = typeof FxTypeId

/*
 * An Fx is "just" an Effect with the use of Sink to handle errors and events
 * as a pushed-based stream.
 */
export interface Fx<R, E, A> extends Effect.Effect<R | Sink.Sink<E, A>, never, unknown> {
  readonly [FxTypeId]: FxTypeId
}

export namespace Fx {
  /*
   * Ensure Sink is removed from the constructions of Fx
   */
  export type WithExclude<R, E, A> = Fx<Exclude<R, Sink.Sink<any, any>>, E, A> extends Fx<infer _R, infer _E, infer _A>
    ? Fx<_R, Sink.Sink.ExtractError<R> | _E, Sink.Sink.ExtractEvent<R> | _A>
    : never

  /**
   * Extract the Context of an Fx
   */
  export type Context<T extends Effect.Effect<any, any, any>> = Effect.Effect.Context<T> extends infer R ? R : never

  /**
   * Extract the Error of an Fx
   */
  export type Error<T extends Effect.Effect<any, any, any>> =
    | Sink.Sink.ExtractError<Effect.Effect.Context<T>>
    | Effect.Effect.Error<T>

  export type Success<T extends Effect.Effect<any, any, any>> = Sink.Sink.ExtractEvent<Effect.Effect.Context<T>>
}

export type FxInput<R, E, A> =
  | Fx<R, E, A>
  | Effect.Effect<R, E, A>

export type Adapter = core.Adapter

export const make: <R, E = never, A = never>(
  effect: Effect.Effect<R | Sink.Error<E> | Sink.Event<A>, never, unknown>
) => Fx.WithExclude<R, E, A> = core.makeSuspend

export const makeGen: <E extends Effect.EffectGen<any, any, any>>(
  f: (adapter: Adapter) => Generator<E, unknown, any>
) => Fx.WithExclude<
  core.GenResources<E>,
  core.GenError<E>,
  never
> = core.makeGen

export function fromEffect<A>(effect: Option.Option<A>): Fx.WithExclude<never, never, A>
export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx.WithExclude<R, E, A>
export function fromEffect<R, E, A>(effect: Effect.Effect<R, E, A>): Fx.WithExclude<R, E, A> {
  return core.fromEffect(effect)
}

export function fromInput<A>(effect: Option.Option<A>): Fx.WithExclude<never, never, A>
export function fromInput<R, E, A>(effect: Effect.Effect<R, E, A>): Fx.WithExclude<R, E, A>
export function fromInput<R, E, A>(effect: Fx<R, E, A>): Fx.WithExclude<R, E, A>
export function fromInput<R, E, A>(effect: FxInput<R, E, A>): Fx.WithExclude<R, E, A> {
  if (FxTypeId in effect) {
    return effect as any
  } else {
    return fromEffect(effect)
  }
}
