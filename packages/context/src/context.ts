/* eslint-disable @typescript-eslint/no-unused-vars */
import * as C from '@effect/data/Context'
import * as Effect from '@effect/io/Effect'
import * as Layer from '@effect/io/Layer'
import type * as Scope from '@effect/io/Scope'
import * as Fx from '@typed/fx'

import { ContextBuilder } from './builder.js'
import { IdentifierInput, IdentifierOf, identifierToString, makeIdentifier } from './identifier.js'
import { Actions, Builder, Layers, Provide, Tagged } from './interfaces.js'

/**
 * Provides extensions to the `Context` module's Tag implementation to
 * provide a more ergonomic API for working with Effect + Fx.
 */
export interface Tag<I, S = I> extends C.Tag<I, S>, Tagged<I, S> {}

export function Tag<const I extends IdentifierInput<any>, S = I>(
  id?: I | string,
): Tag<IdentifierOf<I>, S> {
  return Tag.tag(C.Tag<IdentifierOf<I>, S>(identifierToString(makeIdentifier(id))))
}

export namespace Tag {
  export type Identifier<T> = [T] extends [C.Tag<infer I, infer _>]
    ? I
    : [T] extends [Tagged<infer I, infer _>]
    ? I
    : never

  export type Service<T> = [T] extends [C.Tag<infer _, infer S>]
    ? S
    : [T] extends [Tagged<infer _, infer S>]
    ? S
    : never

  export function actions<I, S>(tag: C.Tag<I, S>): Actions<I, S> {
    return {
      with: <A>(f: (s: S) => A) => Effect.map(tag, f),
      withEffect: <R, E, A>(f: (s: S) => Effect.Effect<R, E, A>) => Effect.flatMap(tag, f),
      withFx: <R, E, A>(f: (s: S) => Fx.Fx<R, E, A>) => Fx.fromFxEffect(Effect.map(tag, f)),
    }
  }

  export function provide<I, S>(tag: C.Tag<I, S>): Provide<I, S> {
    return {
      provide: (s: S) => Effect.provideService(tag, s),
      provideFx: (s: S) => Fx.provideService(tag, s),
    }
  }

  export function layers<I, S>(tag: C.Tag<I, S>): Layers<I, S> {
    return {
      layer: <R, E>(effect: Effect.Effect<R, E, S>) => Layer.effect(tag, effect),
      layerScoped: <R, E>(effect: Effect.Effect<R | Scope.Scope, E, S>) =>
        Layer.scoped(tag, effect),
      layerOf: (s: S) => Layer.succeed(tag, s),
    }
  }

  export function builder<I, S>(tag: C.Tag<I, S>): Builder<I, S> {
    return {
      build: (s: S) => ContextBuilder.fromTag(tag, s),
    }
  }

  export function tagged<I, S>(tag: C.Tag<I, S>): Tagged<I, S> {
    return {
      ...actions(tag),
      ...provide(tag),
      ...layers(tag),
      ...builder(tag),
    }
  }

  export function tag<I, S>(tag: C.Tag<I, S>): Tag<I, S> {
    return Object.assign(tag, tagged(tag))
  }
}

export {
  type TagTypeId,
  type TypeId,
  type ValidTagsById,
  type Context,
  isContext,
  isTag,
  empty,
  make,
  add,
  get,
  unsafeGet,
  getOption,
  merge,
  pick,
} from '@effect/data/Context'
