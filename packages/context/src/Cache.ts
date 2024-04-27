/**
 * A Contextual wrapper around @effect/io/Cache
 * @since 1.0.0
 */
import * as C from "effect/Cache"
import type { DurationInput } from "effect/Duration"
import type { Effect } from "effect/Effect"
import type { Either } from "effect/Either"
import type { Exit } from "effect/Exit"
import * as Layer from "effect/Layer"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * A Contextual wrapper around @effect/io/Cache
 * @since 1.0.0
 * @category models
 */
export interface Cache<I, K, A, E> extends Tag<I, C.Cache<K, A, E>> {
  readonly get: (key: K) => Effect<A, E, I>

  readonly getEither: (key: K) => Effect<Either<A, A>, E, I>

  readonly refresh: (key: K) => Effect<void, E, I>

  readonly set: (key: K, value: A) => Effect<void, never, I>

  readonly make: <R>(
    options: {
      readonly capacity: number
      readonly timeToLive: DurationInput
      readonly lookup: C.Lookup<K, A, E, R>
    }
  ) => Layer.Layer<I, never, R>

  readonly makeWith: <R>(
    options: {
      readonly capacity: number
      readonly lookup: C.Lookup<K, A, E, R>
      readonly timeToLive: (exit: Exit<A, E>) => DurationInput
    }
  ) => Layer.Layer<I, never, R>
}

/**
 * Construct a Cache implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Cache<K, A, E = never>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Cache<IdentifierOf<I>, K, A, E>
  <const I>(identifier: I): Cache<IdentifierOf<I>, K, A, E>
} {
  function makeCache<const I extends IdentifierFactory<any>>(identifier: I): Cache<IdentifierOf<I>, K, A, E>
  function makeCache<const I>(identifier: I): Cache<IdentifierOf<I>, K, A, E>
  function makeCache<const I extends IdentifierInput<any>>(identifier: I): Cache<IdentifierOf<I>, K, A, E> {
    const tag = Tag<I, C.Cache<K, A, E>>(identifier).pipe(withActions)
    const self: Omit<Cache<IdentifierOf<I>, K, A, E>, keyof typeof tag> = {
      get: (key) => tag.withEffect((cache) => cache.get(key)),
      getEither: (key) => tag.withEffect((cache) => cache.getEither(key)),
      refresh: (key) => tag.withEffect((cache) => cache.refresh(key)),
      set: (key, value) => tag.withEffect((cache) => cache.set(key, value)),
      make: (options) => Layer.effect(tag, C.make(options)),
      makeWith: (options) => Layer.effect(tag, C.makeWith(options))
    }

    return Object.assign(tag, self)
  }

  return makeCache
}
