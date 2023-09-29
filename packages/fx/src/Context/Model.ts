/**
 * @typed/context/Model provides a way to group Refs together into a single Ref
 * that is utilized as a single unit from the Effect Context.
 * @since 1.18.0
 */

import type { Context } from "effect/Context"
import type { Equivalence } from "effect/Equivalence"
import * as Option from "effect/Option"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import { ContextBuilder } from "@typed/context/Builder"
import { Computed } from "@typed/fx/Computed"
import type { RefSubject } from "@typed/fx/Context"
import { Filtered } from "@typed/fx/Filtered"
import type { Fx } from "@typed/fx/Fx"
import { struct } from "@typed/fx/Fx"
import type { VersionedFxEffect } from "@typed/fx/FxEffect"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"

/**
 * @since 1.18.0
 * @category symbols
 */
export const ModelTypeId = Symbol.for("@typed/fx/Model")

/**
 * @since 1.18.0
 * @category symbols
 */
export type ModelTypeId = typeof ModelTypeId

type Any = RefSubject<any, any, any> | RefSubject<any, never, any> | Model<any>

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

  readonly mapEffect: <R2, E2, B>(
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => Effect.Effect<R2, E2, B>
  ) => Computed<Model.Identifier<Refs[keyof Refs]> | R2, Model.Error<Refs[keyof Refs]> | E2, B>

  readonly map: <B>(
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => B
  ) => Computed<Model.Identifier<Refs[keyof Refs]>, Model.Error<Refs[keyof Refs]>, B>

  readonly filterMapEffect: <R2, E2, B>(
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<Model.Identifier<Refs[keyof Refs]> | R2, Model.Error<Refs[keyof Refs]> | E2, B>

  readonly filterMap: <B>(
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => Option.Option<B>
  ) => Filtered<Model.Identifier<Refs[keyof Refs]>, Model.Error<Refs[keyof Refs]>, B>

  readonly filterEffect: <R2, E2>(
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<
    Model.Identifier<Refs[keyof Refs]> | R2,
    Model.Error<Refs[keyof Refs]> | E2,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  >

  readonly filter: (
    f: (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) => boolean
  ) => Filtered<
    Model.Identifier<Refs[keyof Refs]>,
    Model.Error<Refs[keyof Refs]>,
    {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    }
  >

  /**
   * Provide a Model to an Effect
   * @since 1.18.0
   */
  readonly of: (
    state: {
      readonly [K in keyof Refs]: Model.State<Refs[K]>
    },
    eqs?: MakeEqivalenceOptions<Refs>
  ) => Layer.Layer<never, never, Model.Identifier<Refs[keyof Refs]>>

  /**
   * Construct a Layer to provide a Model to an Effect
   * @since 1.18.0
   */
  readonly fromEffect: <R, E>(
    effect: Effect.Effect<
      R,
      E,
      {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    >,
    eqs?: MakeEqivalenceOptions<Refs>
  ) => Layer.Layer<Exclude<R, Scope>, E, Model.Identifier<Refs[keyof Refs]>>

  /**
   * Create a Layer from a Model using the Layers of each Ref
   * @since 1.18.0
   */
  readonly makeWith: <
    Opts extends {
      readonly [K in keyof Refs]: (
        ref: Refs[K]
      ) => Layer.Layer<any, any, Model.Identifier<Refs[K]>> | Layer.Layer<any, never, Model.Identifier<Refs[K]>>
    }
  >(
    options: Opts
  ) => Layer.Layer<
    Exclude<Layer.Layer.Context<ReturnType<Opts[keyof Refs]>>, Scope>,
    Layer.Layer.Error<ReturnType<Opts[keyof Refs]>>,
    Model.Identifier<Refs[keyof Refs]>
  >

  /**
   * Create a Layer from a Model using the Layers of each Ref
   * @since 1.18.0
   */
  readonly make: <
    Opts extends MakeOptions<Refs>
  >(
    options: Opts,
    eqs?: MakeEqivalenceOptions<Refs>
  ) => Layer.Layer<
    Exclude<Fx.Context<Opts[keyof Refs]>, Scope>,
    never,
    Model.Identifier<Refs[keyof Refs]>
  >
}

type MakeOptions<Refs extends Readonly<Record<string, Any>>> = {
  readonly [K in keyof Refs]: Refs[K] extends Model<infer Refs2> ? MakeOptions<Refs2>
    : Fx<any, Model.Error<Refs[K]>, Model.State<Refs[K]>>
}

type MakeEqivalenceOptions<Refs extends Readonly<Record<string, Any>>> = {
  readonly [K in keyof Refs]?: Refs[K] extends Model<infer Refs2> ? MakeEqivalenceOptions<Refs2>
    : Equivalence<Model.State<Refs[K]>>
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
      Effect.all(entries.map(([key, ref]) => Effect.map(ref.get, (v) => [key, v])), { concurrency: "unbounded" }),
      Object.fromEntries
    ) as Model<Refs>["get"]

    this.set = (
      state: {
        readonly [K in keyof Refs]: Model.State<Refs[K]>
      }
    ) =>
      Effect.all(
        entries.map(([k, ref]) => ref.set(state[k])),
        { concurrency: "unbounded", discard: true }
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

  of: Model<Refs>["of"] = (state, eqs) => {
    const [first, ...rest] = Object.entries(this.refs).map(
      ([k, ref]) =>
        ModelTypeId in ref ? ref.of(state[k], eqs?.[k] as any) : ref.make(Effect.succeed(state[k]), eqs?.[k] as any)
    )

    return Layer.mergeAll(
      first,
      ...rest
    ) as any
  }

  fromEffect: Model<Refs>["fromEffect"] = (effect, eq) => {
    const { of } = this

    return Layer.scopedContext(Effect.gen(function*(_) {
      const scope = yield* _(Effect.scope)
      const initial = yield* _(effect)
      const layer = of(initial, eq)
      const context = yield* _(Layer.buildWithScope(
        layer,
        scope
      ))

      return context as Context<Model.Identifier<Refs[keyof Refs]>>
    }))
  }

  makeWith: Model<Refs>["makeWith"] = (options) => {
    const { refs } = this

    return Layer.scopedContext(Effect.gen(function*(_) {
      const scope = yield* _(Effect.scope)

      let context = ContextBuilder.empty

      for (const [k, ref] of Object.entries(refs)) {
        context = context.mergeContext(
          yield* _(Layer.buildWithScope(
            options[k](ref as any),
            scope
          ))
        )
      }

      return context.context as Context<Model.Identifier<Refs[keyof Refs]>>
    }))
  }

  make: Model<Refs>["make"] = (options, eqs) =>
    this.makeWith(
      Object.fromEntries(
        Object.entries(options).map(([k, fx]) => [k, (ref: RefSubject<any, any, any>) => ref.make(fx, eqs?.[k] as any)])
      ) as any
    ) as any

  version = Effect.map(
    Effect.all(Object.values(this.refs).map((ref) => ref.version)),
    (versions) => versions.reduce((a, b) => a + b, 0)
  )

  mapEffect: Model<Refs>["mapEffect"] = (f) => Computed(this as any, f)

  map: Model<Refs>["map"] = (f) => this.mapEffect((state) => Effect.sync(() => f(state)))

  filterMapEffect: Model<Refs>["filterMapEffect"] = (f) => Filtered(this as any, f)

  filterMap: Model<Refs>["filterMap"] = (f) => this.filterMapEffect((state) => Effect.sync(() => f(state)))

  filterEffect: Model<Refs>["filterEffect"] = (f) =>
    this.filterMapEffect((state) => Effect.map(f(state), (b) => (b ? Option.some(state) : Option.none())))

  filter: Model<Refs>["filter"] = (f) => this.filterMap((state) => (f(state) ? Option.some(state) : Option.none()))
}
