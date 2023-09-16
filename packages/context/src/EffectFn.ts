/**
 * EffectFn is a type-alias for a function that returns an Effect.
 * @since 1.0.0
 */

import type * as Effect from "@effect/io/Effect"

/**
 * EffectFn is a type-alias for a function that returns an Effect.
 * @since 1.0.0
 * @category models
 */
export interface EffectFn<Args extends ReadonlyArray<any> = ReadonlyArray<any>, R = any, E = any, A = any> {
  (...args: Args): Effect.Effect<R, E, A>
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
  ) => Effect.Effect<infer R, infer E, infer A> ? (...args: Args) => Effect.Effect<[R] extends [never] ? any : R, E, A>
    : never

  /**
   * A helper for extracting the arguments of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type ArgsOf<T extends EffectFn> = T extends (
    ...args: infer Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer _E, infer _A> ? Args
    : never

  /**
   * A helper for extracting the context of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type Context<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer R, infer _E, infer _A> ? R
    : never

  /**
   * A helper for extracting the error of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type Error<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer E, infer _A> ? E
    : never

  /**
   * A helper for extracting the success of an EffectFn.
   * @since 1.0.0
   * @category type-level
   */
  export type Success<T extends EffectFn> = T extends (
    ...args: infer _Args
  ) => // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Effect.Effect<infer _R, infer _E, infer A> ? A
    : never
}
