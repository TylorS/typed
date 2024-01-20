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
export interface Placeholder<out R = never, out E = never, out A = unknown> {
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
    | Placeholder<any, any, A>
    | Placeholder<any, never, A>
    | Placeholder<never, never, A>
    | Placeholder<never, any, A>

  /**
   * @since 1.0.0
   */
  export type Context<T> = [T] extends [never] ? never : T extends Placeholder<infer R, infer _E, infer _A> ? R : never
  /**
   * @since 1.0.0
   */
  export type Error<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer E, infer _A> ? E : never
  /**
   * @since 1.0.0
   */
  export type Success<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer _E, infer A> ? A : never

  /**
   * @since 1.0.0
   */
  export function asRef<R = never, E = never, A = never>(
    placeholder: Placeholder<R, E, A> | Fx<R, E, A> | Effect.Effect<R, E, A> | A
  ): Effect.Effect<R | Scope.Scope, never, RefSubject.RefSubject<never, E, A>> {
    if (isFx<R, E, A>(placeholder) || Effect.isEffect(placeholder)) {
      return RefSubject.make(placeholder as Fx<R, E, A>)
    } else {
      return RefSubject.of<A, E>(placeholder as A)
    }
  }
}
