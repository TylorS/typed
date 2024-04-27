/**
 * Contextual wrappers around @effect/io/ScopedCache
 * @since 1.0.0
 */

import type * as C from "effect/Cache"
import type { DurationInput } from "effect/Duration"
import type { Effect } from "effect/Effect"
import type { Exit } from "effect/Exit"
import * as Layer from "effect/Layer"
import type { Option } from "effect/Option"
import type { Scope } from "effect/Scope"
import * as SC from "effect/ScopedCache"
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrappers around @effect/io/ScopedCache
 * @since 1.0.0
 */
export interface ScopedCache<I, K, A, E> extends Tag<I, SC.ScopedCache<K, A, E>> {
  readonly cacheStats: Effect<C.CacheStats, never, I>
  readonly contains: (key: K) => Effect<boolean, never, I>
  readonly entryStats: (key: K) => Effect<Option<C.EntryStats>, never, I>
  readonly get: (key: K) => Effect<A, E, I | Scope>
  readonly getOption: (key: K) => Effect<Option<A>, E, I | Scope>
  readonly getOptionComplete: (key: K) => Effect<Option<A>, E, I | Scope>
  readonly invalidate: (key: K) => Effect<void, never, I>
  readonly invalidateAll: Effect<void, never, I>
  readonly refresh: (key: K) => Effect<void, E, I>
  readonly size: Effect<number, never, I>

  readonly make: <R>(
    options: {
      readonly capacity: number
      readonly timeToLive: DurationInput
      readonly lookup: SC.Lookup<K, A, E, R>
    }
  ) => Layer.Layer<I, never, R>

  readonly makeWith: <R>(
    options: {
      readonly capacity: number
      readonly lookup: SC.Lookup<K, A, E, R>
      readonly timeToLive: (exit: Exit<A, E>) => DurationInput
    }
  ) => Layer.Layer<I, never, R>
}

/**
 * Construct a ScopedCache implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function ScopedCache<K, A, E = never>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, A, E>
  <const I>(identifier: I): ScopedCache<IdentifierOf<I>, K, A, E>
} {
  function makeScopedCache<const I extends IdentifierFactory<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, A, E>
  function makeScopedCache<const I>(identifier: I): ScopedCache<IdentifierOf<I>, K, A, E>
  function makeScopedCache<const I extends IdentifierInput<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, A, E> {
    const tag = withActions(Tag<I, SC.ScopedCache<K, A, E>>(identifier))
    const self: Omit<ScopedCache<IdentifierOf<I>, K, A, E>, keyof typeof tag> = {
      cacheStats: tag.withEffect((cache) => cache.cacheStats),
      contains: (key) => tag.withEffect((cache) => cache.contains(key)),
      entryStats: (key) => tag.withEffect((cache) => cache.entryStats(key)),
      get: (key) => tag.withEffect((cache) => cache.get(key)),
      getOption: (key) => tag.withEffect((cache) => cache.getOption(key)),
      getOptionComplete: (key) => tag.withEffect((cache) => cache.getOptionComplete(key)),
      invalidate: (key) => tag.withEffect((cache) => cache.invalidate(key)),
      invalidateAll: tag.withEffect((cache) => cache.invalidateAll),
      refresh: (key) => tag.withEffect((cache) => cache.refresh(key)),
      size: tag.withEffect((cache) => cache.size),
      make: (options) => Layer.scoped(tag, SC.make(options)),
      makeWith: (options) => Layer.scoped(tag, SC.makeWith(options))
    }

    return Object.assign(tag, self)
  }

  return makeScopedCache
}
