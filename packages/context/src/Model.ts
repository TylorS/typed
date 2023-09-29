/**
 * @typed/context/Model provides a way to group Refs together into a single Ref
 * that is utilized as a single unit from the Effect Context.
 * @since 1.0.0
 */

import { ContextBuilder } from "@typed/context/Builder"
import type { Ref } from "@typed/context/Ref"
import type { ScopedRef } from "@typed/context/ScopedRef"
import type { SynchronizedRef } from "@typed/context/SynchronizedRef"
import type { Context } from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import { ScopedRefTypeId } from "effect/ScopedRef"

/**
 * A ModelRef<I, A> is a Ref/ScopedRef/SynchronizedRef that is part of a Model.
 * @since 1.0.0
 * @category models
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
 * @category models
 */
export interface Model<Refs extends Readonly<Record<string, ModelRef<any, any> | Model<any>>>> {
  readonly [ModelTypeId]: ModelTypeId

  /**
   * A Lens into a Ref from any given model at a particular key.
   * @since 1.0.0
   */
  readonly fromKey: <K extends keyof Refs>(key: K) => Refs[K]

  /**
   * Get the current state of the Model
   * @since 1.0.0
   */
  readonly get: Effect.Effect<Model.Identifier<this>, never, Model.State<this>>

  /**
   * Set the state of the Model
   * @since 1.0.0
   */
  readonly set: (state: Model.State<this>) => Effect.Effect<Model.Identifier<this>, never, void>

  /**
   * Update the state of the Model
   * @since 1.0.0
   */
  readonly update: (
    f: (state: Model.State<this>) => Model.State<this>
  ) => Effect.Effect<Model.Identifier<this>, never, void>

  /**
   * Modify the state of the Model and return a value
   * @since 1.0.0
   */
  readonly modify: <B>(
    f: (state: Model.State<this>) => readonly [B, Model.State<this>]
  ) => Effect.Effect<Model.Identifier<this>, never, B>

  /**
   * Provide a Model to an Effect
   * @since 1.0.0
   */
  readonly provide: (state: Model.State<this>) => <R, E, B>(
    effect: Effect.Effect<R, E, B>
  ) => Effect.Effect<Exclude<R, Model.Identifier<this>> | Scope, E, B>

  /**
   * Construct a Layer to provide a Model to an Effect
   * @since 1.0.0
   */
  readonly layer: <R, E>(
    effect: Effect.Effect<R, E, Model.State<this>>
  ) => Layer.Layer<Exclude<R, Scope>, E, Model.Identifier<this>>
}

/**
 * Create a Model from a collection of Refs.
 * @since 1.0.0
 * @category constructors
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
      ),
    layer: (effect) =>
      Layer.scopedContext(Effect.gen(function*(_) {
        const scope = yield* _(Effect.scope)
        const initial = yield* _(effect)

        let context = ContextBuilder.empty

        for (const [k, ref] of Object.entries(refs)) {
          context = context.mergeContext(
            yield* _(Layer.buildWithScope(
              ref.layer(Effect.succeed(initial[k])),
              scope
            ))
          )
        }

        return context.context as Context<Model.Identifier<typeof self>>
      }))
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
