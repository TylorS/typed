/**
 * @typed/context/Model provides a way to group Refs together into a single Ref
 * that is utilized as a single unit from the Effect Context.
 * @since 1.18.0
 */

import type { Context } from "@effect/data/Context"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import type { Scope } from "@effect/io/Scope"
import { ScopedRefTypeId } from "@effect/io/ScopedRef"
import { ContextBuilder } from "@typed/context/Builder"
import type { RefSubject } from "@typed/fx/Context"
import { struct } from "@typed/fx/Fx"
import type { VersionedFxEffect } from "@typed/fx/FxEffect"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"

/**
 * @since 1.18.0
 * @category symbols
 */
export const ModelTypeId = Symbol.for("@typed/context/Model")

/**
 * @since 1.18.0
 * @category symbols
 */
export type ModelTypeId = typeof ModelTypeId

type Any = RefSubject<any, any, any> | RefSubject<any, never, any>

/**
 * A Model is a collection of Refs that can be utilized as a single unit from the Effect Context.
 * @since 1.18.0
 * @category models
 */
export interface Model<Refs extends Readonly<Record<string, Any>>> extends
  VersionedFxEffect<
    Model.Identifier<Refs[keyof Refs]>,
    Model.Identifier<Refs[keyof Refs]>,
    Model.Error<Refs[keyof Refs]>,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    },
    Model.Identifier<Refs[keyof Refs]>,
    Model.Error<Refs[keyof Refs]>,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  >
{
  readonly [ModelTypeId]: ModelTypeId

  /**
   * A Lens into a Ref from any given model at a particular key.
   * @since 1.18.0
   */
  readonly fromKey: <K extends keyof Refs>(key: K) => Refs[K]

  /**
   * Get the current state of the Model
   * @since 1.18.0
   */
  readonly get: Effect.Effect<
    Model.Identifier<Refs[keyof Refs]>,
    never,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  >

  /**
   * Set the state of the Model
   * @since 1.18.0
   */
  readonly set: (
    state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  ) => Effect.Effect<Model.Identifier<Refs[keyof Refs]>, never, void>

  /**
   * Update the state of the Model
   * @since 1.18.0
   */
  readonly update: (
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  ) => Effect.Effect<Model.Identifier<Refs[keyof Refs]>, never, void>

  /**
   * Modify the state of the Model and return a value
   * @since 1.18.0
   */
  readonly modify: <B>(
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => readonly [
      B,
      {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ]
  ) => Effect.Effect<Model.Identifier<Refs[keyof Refs]>, never, B>

  /**
   * Delete the model's state
   */
  readonly delete: Effect.Effect<
    Model.Identifier<Refs[keyof Refs]>,
    never,
    Option.Option<
      {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    >
  >

  // TODO: Model provision should enable all possibilities of RefSubject provision

  /**
   * Provide a Model to an Effect
   * @since 1.18.0
   */
  readonly provide: (
    state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  ) => <R, E, B>(
    effect: Effect.Effect<R, E, B>
  ) => Effect.Effect<Exclude<R, Model.Identifier<Refs[keyof Refs]>> | Scope, E, B>

  /**
   * Construct a Layer to provide a Model to an Effect
   * @since 1.18.0
   */
  readonly layer: <R, E>(
    effect: Effect.Effect<
      R,
      E,
      {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    >
  ) => Layer.Layer<Exclude<R, Scope>, E, Model.Identifier<Refs[keyof Refs]>>
}

/**
 * Create a Model from a collection of Refs.
 * @since 1.18.0
 * @category constructors
 */
export function Model<const Refs extends Readonly<Record<string, Any>>>(
  refs: Refs
): Model<Refs> {
  return new ModelImpl(refs) as any
}

/**
 * @since 1.18.0
 */
export namespace Model {
  /**
   * Extract the Identifier of a Model
   * @since 1.18.0
   */
  export type Identifier<T> = T extends RefSubject<infer I, infer _, infer __> ? I
    : T extends Model<infer R> ? { readonly [K in keyof R]: Identifier<R[K]> }[keyof R]
    : never

  /**
   * Extract the Error of a Model
   * @since 1.18.0
   */
  export type Error<T> = T extends RefSubject<infer _, infer E, infer _> ? E
    : T extends Model<infer R> ? { readonly [K in keyof R]: Error<R[K]> }[keyof R]
    : never

  /**
   * Extract the State of a Model
   * @since 1.18.0
   */
  export type State<T> = T extends RefSubject<infer _, infer __, infer S> ? S
    : T extends Model<infer R> ? { readonly [K in keyof R]: State<R[K]> }
    : never
}

class ModelImpl<Refs extends Readonly<Record<string, Any>>> extends FxEffectProto<
  Model.Identifier<Refs[keyof Refs]>,
  Model.Error<Refs[keyof Refs]>,
  {
    readonly [K in keyof Refs]: Model.State<Refs[K]>
  },
  Model.Identifier<Refs[keyof Refs]>,
  Model.Error<Refs[keyof Refs]>,
  {
    readonly [K in keyof Refs]: Model.State<Refs[K]>
  }
> implements Omit<Model<Refs>, ModuleAgumentedEffectKeysToOmit> {
  get: Model<Refs>["get"]
  set: Model<Refs>["set"]
  delete: Model<Refs>["delete"]

  constructor(readonly refs: Refs) {
    super()

    const entries = Object.entries(refs)

    this.get = Effect.map(
      Effect.all(entries.map(([key, ref]) => Effect.map(ref.get, (v) => [key, v]))),
      Object.fromEntries
    ) as Model<Refs>["get"]

    this.set = (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) =>
      Effect.all(
        entries.map(([k, ref]) => {
          const v = state[k]

          if (ScopedRefTypeId in ref) return ref.set(Effect.succeed(v))

          return ref.set(v)
        }),
        { discard: true }
      )

    this.delete = Effect.map(
      Effect.all(entries.map(([k, ref]) => Effect.map(ref.delete, Option.map((v) => [k, v] as const)))),
      (options) => Option.map(Option.all(options), Object.fromEntries)
    ) as Model<Refs>["delete"]
  }

  toFx() {
    return struct(this.refs) as any
  }

  toEffect() {
    return this.get
  }

  readonly [ModelTypeId]: ModelTypeId = ModelTypeId

  fromKey<K extends keyof Refs>(key: K): Refs[K] {
    return this.refs[key]
  }

  update = (
    f: (
      state: { readonly [K in keyof Refs]: Model.State<Refs[K]> }
    ) => { readonly [K in keyof Refs]: Model.State<Refs[K]> }
  ) => Effect.flatMap(this.get, (state) => this.set(f(state)))

  modify: <B>(
    f: (
      state: { readonly [K in keyof Refs]: Model.State<Refs[K]> }
    ) => readonly [B, { readonly [K in keyof Refs]: Model.State<Refs[K]> }]
  ) => Effect.Effect<Model.Identifier<Refs[keyof Refs]>, never, B> = (f) =>
    Effect.flatMap(this.get, (state) =>
      Effect.suspend(() => {
        const [b, newState] = f(state)

        return Effect.as(this.set(newState), b)
      }))

  provide: Model<Refs>["provide"] = (state: { readonly [K in keyof Refs]: Model.State<Refs[K]> }) => (effect) =>
    Object.entries(this.refs).reduce(
      (effect: Effect.Effect<any, any, any>, [k, ref]) => ref.provide(Effect.succeed(state[k]))(effect),
      effect
    )

  layer: Model<Refs>["layer"] = (effect) => {
    const { refs } = this

    return Layer.scopedContext(Effect.gen(function*(_) {
      const scope = yield* _(Effect.scope)
      const initial = yield* _(effect)

      let context = ContextBuilder.empty

      for (const [k, ref] of Object.entries(refs)) {
        context = context.mergeContext(
          yield* _(Layer.buildWithScope(
            (ref).make(Effect.succeed(initial[k])),
            scope
          ))
        )
      }

      return context.context as Context<Model.Identifier<Refs[keyof Refs]>>
    }))
  }

  version = Effect.map(
    Effect.all(Object.values(this.refs).map((ref) => ref.version)),
    (versions) => versions.reduce((a, b) => a + b, 0)
  )
}
