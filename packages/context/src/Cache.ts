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
import { withActions } from "./Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier"
import { Tag } from "./Tag"

/**
 * A Contextual wrapper around @effect/io/Cache
 * @since 1.0.0
 * @category models
 */
export interface Cache<I, K, E, A> extends Tag<I, C.Cache<K, E, A>> {
  readonly get: (key: K) => Effect<I, E, A>

  readonly getEither: (key: K) => Effect<I, E, Either<A, A>>

  readonly refresh: (key: K) => Effect<I, E, void>

  readonly set: (key: K, value: A) => Effect<I, never, void>

  readonly make: <R>(
    options: {
      readonly capacity: number
      readonly timeToLive: DurationInput
      readonly lookup: C.Lookup<K, R, E, A>
    }
  ) => Layer.Layer<R, never, I>

  readonly makeWith: <R>(
    options: {
      readonly capacity: number
      readonly lookup: C.Lookup<K, R, E, A>
      readonly timeToLive: (exit: Exit<E, A>) => DurationInput
    }
  ) => Layer.Layer<R, never, I>
}

/**
 * Construct a Cache implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Cache<K, E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Cache<IdentifierOf<I>, K, E, A>
  <const I>(identifier: I): Cache<IdentifierOf<I>, K, E, A>
} {
  function makeCache<const I extends IdentifierFactory<any>>(identifier: I): Cache<IdentifierOf<I>, K, E, A>
  function makeCache<const I>(identifier: I): Cache<IdentifierOf<I>, K, E, A>
  function makeCache<const I extends IdentifierInput<any>>(identifier: I): Cache<IdentifierOf<I>, K, E, A> {
    const tag = Tag<I, C.Cache<K, E, A>>(identifier).pipe(withActions)
    const self: Omit<Cache<IdentifierOf<I>, K, E, A>, keyof typeof tag> = {
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
