/**
 * Helpers for create contextual services that are single functions that return
 * an Effect.
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import type * as Layer from "effect/Layer"

import type { EffectFn } from "./EffectFn"
import { Tagged } from "./Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier"

/**
 * @category symbols
 * @since 1.0.0
 */
export const FnTypeId = Symbol.for("@typed/context/Fn")

/**
 * @category symbols
 * @since 1.0.0
 */
export type FnTypeId = typeof FnTypeId

/**
 * Fn is a helper for creating contextual services that are single functions that return
 * an Effect.
 * @since 1.0.0
 * @category models
 */
export interface Fn<I, T extends EffectFn> extends Tagged<I, T> {
  readonly [FnTypeId]: FnTypeId

  /**
   * Call your effectful function with the provided arguments.
   * @since 1.0.0
   */
  readonly apply: <Args extends EffectFn.ArgsOf<T>>(
    ...args: Args
  ) => Effect.Effect<I | EffectFn.Context<T>, EffectFn.Error<T>, EffectFn.Success<T>>

  /**
   * A helper to implement a Layer for your effectful function which
   * has more context requirements than the interface it is implementing.
   * @since 1.0.0
   */
  readonly implement: <T2 extends EffectFn.Extendable<T>>(
    implementation: T2
  ) => Layer.Layer<EffectFn.Context<T2>, never, I>

  /**
   * A helper for implementing an providing a Layer to an Effect.
   * @since 1.0.0
   */
  readonly provideImplementation: {
    <T2 extends EffectFn.Extendable<T>>(
      implementation: T2
    ): <R, E, A>(
      effect: Effect.Effect<R, E, A>
    ) => Effect.Effect<Exclude<R, I> | EffectFn.Context<T2>, E | EffectFn.Error<T2>, A>

    <R, E, A, T2 extends EffectFn.Extendable<T>>(
      effect: Effect.Effect<R, E, A>,
      implementation: T2
    ): Effect.Effect<Exclude<R, I> | EffectFn.Context<T2>, E | EffectFn.Error<T2>, A>
  }
}

/**
 * Create a new Fn
 * @since 1.0.0
 * @category constructors
 */
export function Fn<T extends EffectFn>(): {
  <const Id extends IdentifierFactory<any>>(id: Id): Fn<IdentifierOf<Id>, T>
  <const Id>(id: Id): Fn<IdentifierOf<Id>, T>
} {
  function makeFn<const Id extends IdentifierFactory<any>>(id: Id): Fn<IdentifierOf<Id>, T>
  function makeFn<const Id>(id: Id): Fn<IdentifierOf<Id>, T>
  function makeFn<const Id extends IdentifierInput<any>>(id: Id): Fn<IdentifierOf<Id>, T> {
    // Add id for debugging
    return Object.assign(wrap(Tagged<Id, T>(id)), { id })
  }

  return makeFn
}

const wrap = <I, S extends EffectFn>(tagged: Tagged<I, S>): Fn<I, S> => {
  const implement = <T2 extends EffectFn.Extendable<S>>(
    implementation: T2
  ): Layer.Layer<EffectFn.Context<T2>, never, I> =>
    tagged.layer(
      Effect.map(
        Effect.context<EffectFn.Context<T2>>(),
        (c) => ((...a: any) => Effect.provide(implementation(...a), c)) as any
      )
    )

  return Object.assign(tagged, {
    [FnTypeId]: FnTypeId,
    apply: (...args: EffectFn.ArgsOf<S>) => tagged.withEffect((f) => f(...args)),
    implement,
    provideImplementation: dual(
      2,
      <R, E, A, T2 extends EffectFn.Extendable<S>>(
        effect: Effect.Effect<R, E, A>,
        implementation: T2
      ): Effect.Effect<Exclude<R, I> | EffectFn.Context<T2>, E | EffectFn.Error<T2>, A> =>
        Effect.provide(effect, implement(implementation))
    )
  }) as Fn<I, S>
}

/**
 * @since 1.0.0
 */
export namespace Fn {
  /**
   * Extract the Identifier of a Fn
   * @since 1.0.0
   * @category type-level
   */
  export type Identifier<T extends Fn<any, any>> = T extends Fn<infer K, any> ? K : never

  /**
   * Extract the EffectFn of a Fn
   * @since 1.0.0
   * @category type-level
   */
  export type FnOf<T extends Fn<any, any>> = T extends Fn<any, infer F> ? F : never

  /**
   * Any Fn
   * @since 1.0.0
   * @category type-level
   */
  export type Any = Fn<any, any>

  /**
   * Extract the Identifier of a Fn
   * @since 1.0.0
   * @category type-level
   */
  export type Context<T extends Fn<any, any>> = T extends Fn<infer K, infer F>
    ? K | Effect.Effect.Context<ReturnType<F>>
    : never
}
