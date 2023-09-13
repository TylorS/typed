import * as C from "@effect/data/Context"
import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import type * as Scope from "@effect/io/Scope"
import { ContextBuilder } from "./Builder"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier"
import { makeIdentifier } from "./Identifier"
import type { Actions, Builder, Layers, Provide, Tagged } from "./Interface"

/**
 * Provides extensions to the `Context` module's Tag implementation to
 * provide a more ergonomic API for working with Effect + Fx.
 */
export interface Tag<I, S = I> extends C.Tag<I, S>, Tagged<I, S> {}

export function Tag<const I extends IdentifierFactory<any>, S = I>(
  id?: I | string
): Tag<IdentifierOf<I>, S>
export function Tag<const I, S = I>(
  id?: I | string
): Tag<IdentifierOf<I>, S>
export function Tag<const I extends IdentifierInput<any>, S = I>(
  id?: I | string
): Tag<IdentifierOf<I>, S> {
  return Tag.tag(C.Tag<IdentifierOf<I>, S>(makeIdentifier(id)))
}

export namespace Tag {
  export type Identifier<T> = [T] extends [C.Tag<infer I, infer _>] ? I
    : [T] extends [Tagged<infer I, infer _>] ? I
    : never

  export type Service<T> = [T] extends [C.Tag<infer _, infer S>] ? S
    : [T] extends [Tagged<infer _, infer S>] ? S
    : never

  export function actions<I, S>(tag: C.Tag<I, S>): Actions<I, S> {
    return {
      with: <A>(f: (s: S) => A) => Effect.map(tag, f),
      withEffect: <R, E, A>(f: (s: S) => Effect.Effect<R, E, A>) => Effect.flatMap(tag, f)
    }
  }

  export function provide<I, S>(tag: C.Tag<I, S>): Provide<I, S> {
    return {
      provide: (s: S) => Effect.provideService(tag, s),
      provideEffect: <R2, E2>(effect: Effect.Effect<R2, E2, S>) => Effect.provideServiceEffect(tag, effect)
    }
  }

  export function layers<I, S>(tag: C.Tag<I, S>): Layers<I, S> {
    return {
      layer: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.effect(tag, effect),
      scoped: <R, E>(effect: Effect.Effect<R | Scope.Scope, E, S>) => Layer.scoped(tag, effect),
      layerOf: (s: S) => Layer.succeed(tag, s)
    }
  }

  export function builder<I, S>(tag: C.Tag<I, S>): Builder<I, S> {
    return {
      build: (s: S) => ContextBuilder.fromTag(tag, s)
    }
  }

  export function tagged<I, S>(tag: C.Tag<I, S>): Tagged<I, S> {
    return {
      ...actions(tag),
      ...provide(tag),
      ...layers(tag),
      ...builder(tag)
    }
  }

  export function tag<I, S>(tag: C.Tag<I, S>): Tag<I, S> {
    return Object.assign(tag, tagged(tag))
  }
}
