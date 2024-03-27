/**
 * @since 1.0.0
 */

import "./internal/module-augmentation.js"

/**
 * @since 1.0.0
 */
export const PlaceholderTypeId = Symbol.for("@typed/template/Placholder")
/**
 * @since 1.0.0
 */
export type PlaceholderTypeId = typeof PlaceholderTypeId

/**
 * @since 1.0.0
 */
export interface Placeholder<A = unknown, E = never, R = never> {
  readonly [PlaceholderTypeId]: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}

/**
 * @since 1.0.0
 */
export namespace Placeholder {
  /**
   * @since 1.0.0
   */
  export type Any<A = any> =
    | Placeholder<A, any, any>
    | Placeholder<A, never, any>
    | Placeholder<A>
    | Placeholder<A, any>

  /**
   * @since 1.0.0
   */
  export type Context<T> = [T] extends [never] ? never
    : [T] extends [Placeholder<infer _A, infer _E, infer R>] ? R
    : never
  /**
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [never] ? never
    : [T] extends [Placeholder<infer _A, infer E, infer _R>] ? E
    : never
  /**
   * @since 1.0.0
   */
  export type Success<T> = [T] extends [never] ? never
    : [T] extends [Placeholder<infer A, infer _E, infer _R>] ? A
    : never
}
