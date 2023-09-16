/**
 * @typed/context/Model provides a way to group Refs together into a single Ref
 * that is utilized as a single unit from the Effect Context.
 * @since 1.0.0
 */

import * as Effect from "@effect/io/Effect"
import type { Scope } from "@effect/io/Scope"
import { ScopedRefTypeId } from "@effect/io/ScopedRef"
import type { Ref } from "@typed/context/Ref"
import type { ScopedRef } from "@typed/context/ScopedRef"
import type { SynchronizedRef } from "@typed/context/SynchronizedRef"

/**
 * A ModelRef<I, A> is a Ref/ScopedRef/SynchronizedRef that is part of a Model.
 * @since 1.0.0
 */
export type ModelRef<I, A> =
  | Ref<I, A>
  | ScopedRef<I, A>
  | SynchronizedRef<I, A>

/**
 * @since 1.0.0
 * @category symbols
 */
export const ModelTypeId = Symbol.for("@typed/context/Model")

/**
 * @since 1.0.0
 * @category symbols
 */
export type ModelTypeId = typeof ModelTypeId

/**
 * A Model is a collection of Refs that can be utilized as a single unit from the Effect Context.
 * @since 1.0.0
 */
export interface Model<Refs extends Readonly<Record<string, ModelRef<any, any> | Model<any>>>> {
  readonly [ModelTypeId]: ModelTypeId

  // Gain access to a Ref by key
  readonly fromKey: <K extends keyof Refs>(key: K) => Refs[K]

  // Simple Ref operations
  readonly get: Effect.Effect<Model.Identifier<this>, never, Model.State<this>>
  readonly set: (state: Model.State<this>) => Effect.Effect<Model.Identifier<this>, never, void>
  readonly update: (
    f: (state: Model.State<this>) => Model.State<this>
  ) => Effect.Effect<Model.Identifier<this>, never, void>
  readonly modify: <B>(
    f: (state: Model.State<this>) => readonly [B, Model.State<this>]
  ) => Effect.Effect<Model.Identifier<this>, never, B>

  // Provision
  readonly provide: (state: Model.State<this>) => <R, E, B>(
    effect: Effect.Effect<R, E, B>
  ) => Effect.Effect<Exclude<R, Model.Identifier<this>> | Scope, E, B>
}

/**
 * Create a Model from a collection of Refs.
 * @since 1.0.0
 */
export function Model<const Refs extends Readonly<Record<string, ModelRef<any, any> | Model<any>>>>(
  refs: Refs
): Model<Refs> {
  const self: Model<Refs> = {
    [ModelTypeId]: ModelTypeId,
    fromKey: (key) => refs[key],
    get: Effect.map(
      Effect.all(Object.entries(refs).map(([key, ref]) => Effect.map(ref.get, (v) => [key, v]))),
      Object.fromEntries
    ) as Model<Refs>["get"],
    set: (state) =>
      Effect.all(
        Object.entries(state).map(([k, v]) => {
          const ref = refs[k]

          if (ScopedRefTypeId in ref) return ref.set(Effect.succeed(v))

          return ref.set(v)
        }),
        { discard: true }
      ),
    update: (f) => Effect.flatMap(self.get, (state) => self.set(f(state))),
    modify: (f) =>
      Effect.flatMap(self.get, (state) =>
        Effect.suspend(() => {
          const [b, newState] = f(state)

          return Effect.as(self.set(newState), b)
        })),
    provide: (state) => (effect) =>
      Object.entries(refs).reduce(
        (effect: Effect.Effect<any, any, any>, [k, ref]) => ref.provide(state[k])(effect),
        effect
      )
  }

  return self
}

/**
 * @since 1.0.0
 */
export namespace Model {
  /**
   * Extract the Identifier of a Model
   * @since 1.0.0
   */
  export type Identifier<T> = T extends Ref<infer I, infer _> ? I
    : T extends ScopedRef<infer I, infer _> ? I
    : T extends SynchronizedRef<infer I, infer _> ? I
    : T extends Model<infer R> ? { readonly [K in keyof R]: Identifier<R[K]> }[keyof R]
    : never

  /**
   * Extract the State of a Model
   * @since 1.0.0
   */
  export type State<T> = T extends Ref<infer _, infer S> ? S
    : T extends ScopedRef<infer _, infer S> ? S
    : T extends SynchronizedRef<infer _, infer S> ? S
    : T extends Model<infer R> ? { readonly [K in keyof R]: State<R[K]> }
    : never

  /**
   * Type-level helper for use in an "extends" clause to constrain the type of a Model
   * but not the Context needed to provide them.
   * @since 1.0.0
   */
  export type Of<A> = {
    readonly [K in keyof A]: ModelRef<any, A[K]>
  }
}
