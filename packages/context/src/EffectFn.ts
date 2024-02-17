/**
 * EffectFn is a type-alias for a function that returns an Effect.
 * @since 1.0.0
 */

import type * as Effect from "effect/Effect"

/**
 * EffectFn is a type-alias for a function that returns an Effect.
 * @since 1.0.0
 * @category models
 */
export interface EffectFn<Args extends ReadonlyArray<any> = ReadonlyArray<any>, A = any, E = any, R = any> {
  (...args: Args): Effect.Effect<A, E, R>
}

/**
 * @since 1.0.0
 */
export namespace EffectFn {
  /**
   * A helper for utilizing an EffectFn in an `extends` clause.
   * @since 1.0.0
   * @category type-level
   */
  export type Extendable<T extends EffectFn> = T extends (
    ...args: infer Args
  ) => Effect.Effect<infer A, infer E, infer R> ? (...args: Args) => Effect.Effect<A, E, [R] extends [never] ? any : R>
    : never

  /**
   * A helper for extracting the arguments of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type ArgsOf<T extends EffectFn> = T extends (
    ...args: infer Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _A, infer _E, infer _R> ? Args
    : never

  /**
   * A helper for extracting the context of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type Context<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _A, infer _E, infer R> ? R
    : never

  /**
   * A helper for extracting the error of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type Error<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _A, infer E, infer _R> ? E
    : never

  /**
   * A helper for extracting the success of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type Success<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer A, infer _E, infer _R> ? A
    : never
}
