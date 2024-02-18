/**
 * @since 1.0.0
 */

import "./internal/module-augmentation.js"
import type { Fx } from "@typed/fx/Fx"
import { isFx } from "@typed/fx/Fx"
import * as RefSubject from "@typed/fx/RefSubject"
import * as Effect from "effect/Effect"
import type * as Scope from "effect/Scope"

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
  export type Context<T> = [T] extends [never] ? never : T extends Placeholder<infer _A, infer _E, infer R> ? R : never
  /**
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [never] ? never : T extends Placeholder<infer _A, infer E, infer _R> ? E : never
  /**
   * @since 1.0.0
   */
  export type Success<T> = [T] extends [never] ? never : T extends Placeholder<infer A, infer _E, infer _R> ? A : never

  /**
   * @since 1.0.0
   */
  export function asRef<A = never, E = never, R = never>(
    placeholder: Placeholder<A, E, R> | Fx<A, E, R> | Effect.Effect<A, E, R> | A
  ): Effect.Effect<RefSubject.RefSubject<A, E>, never, R | Scope.Scope> {
    if (isFx<A, E, R>(placeholder) || Effect.isEffect(placeholder)) {
      return RefSubject.make(placeholder as Fx<A, E, R>)
    } else {
      return RefSubject.of<A, E>(placeholder as A)
    }
  }
}
