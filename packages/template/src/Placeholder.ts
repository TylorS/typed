/// <reference types="./internal/module-augmentation" />

import type { Fx } from "@typed/fx"
import { isFx, RefSubject } from "@typed/fx"
import type { Scope } from "effect"
import { Effect } from "effect"

export const PlaceholderTypeId = Symbol.for("@typed/template/Placholder")
export type PlaceholderTypeId = typeof PlaceholderTypeId

export interface Placeholder<out R = never, out E = never, out A = unknown> {
  readonly [PlaceholderTypeId]: {
    readonly _R: (_: never) => R
    readonly _E: (_: never) => E
    readonly _A: (_: never) => A
  }
}

export namespace Placeholder {
  export type Any<A = any> =
    | Placeholder<any, any, A>
    | Placeholder<any, never, A>
    | Placeholder<never, never, A>
    | Placeholder<never, any, A>

  export type Context<T> = [T] extends [never] ? never : T extends Placeholder<infer R, infer _E, infer _A> ? R : never
  export type Error<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer E, infer _A> ? E : never
  export type Success<T> = [T] extends [never] ? never : T extends Placeholder<infer _R, infer _E, infer A> ? A : never

  export function asRef<R = never, E = never, A = never>(
    placeholder: Placeholder<R, E, A>
  ): Effect.Effect<R | Scope.Scope, never, RefSubject.RefSubject<never, E, A>> {
    if (isFx<R, E, A>(placeholder) || Effect.isEffect(placeholder)) {
      return RefSubject.make(placeholder as Fx<R, E, A>)
    } else {
      return RefSubject.of(placeholder as A)
    }
  }
}
