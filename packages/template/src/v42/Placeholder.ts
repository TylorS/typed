/**
 * @since 1.0.0
 */

import type { Types } from "effect"

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
export abstract class Placeholder<out A = unknown, out E = never, out R = never> {
  readonly [PlaceholderTypeId]!: {
    readonly _A: Types.Covariant<A>
    readonly _E: Types.Covariant<E>
    readonly _R: Types.Covariant<R>
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
    | null
    | undefined
    | void

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

/**
 * @since 1.0.0
 */
declare global {
  export interface String extends Placeholder<string> {}

  export interface Number extends Placeholder<number> {}

  export interface Boolean extends Placeholder<boolean> {}

  export interface Symbol extends Placeholder<symbol> {}

  export interface BigInt extends Placeholder<bigint> {}

  export interface Array<T> extends
    Placeholder<
      Array<Placeholder.Success<T>>,
      Placeholder.Error<T>,
      Placeholder.Context<T>
    >
  {}

  export interface ReadonlyArray<T> extends
    Placeholder<
      ReadonlyArray<Placeholder.Success<T>>,
      Placeholder.Error<T>,
      Placeholder.Context<T>
    >
  {}
}
