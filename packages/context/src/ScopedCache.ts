/**
 * Contextual wrappers around @effect/io/ScopedCache
 * @since 1.0.0
 */

import type { DurationInput } from "effect/Duration"
import type { Option } from "effect/Option"
import type * as C from "effect/Cache"
import type { Effect } from "effect/Effect"
import type { Exit } from "effect/Exit"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import * as SC from "effect/ScopedCache"
import { withActions } from "@typed/context/Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

/**
 * Contextual wrappers around @effect/io/ScopedCache
 * @since 1.0.0
 */
export interface ScopedCache<I, K, E, A> extends Tag<I, SC.ScopedCache<K, E, A>> {
  readonly cacheStats: Effect<I, never, C.CacheStats>
  readonly contains: (key: K) => Effect<I, never, boolean>
  readonly entryStats: (key: K) => Effect<I, never, Option<C.EntryStats>>
  readonly get: (key: K) => Effect<I | Scope, E, A>
  readonly getOption: (key: K) => Effect<I | Scope, E, Option<A>>
  readonly getOptionComplete: (key: K) => Effect<I | Scope, E, Option<A>>
  readonly invalidate: (key: K) => Effect<I, never, void>
  readonly invalidateAll: Effect<I, never, void>
  readonly refresh: (key: K) => Effect<I, E, void>
  readonly size: Effect<I, never, number>

  readonly make: <R>(
    options: {
      readonly capacity: number
      readonly timeToLive: DurationInput
      readonly lookup: SC.Lookup<K, R, E, A>
    }
  ) => Layer.Layer<R, never, I>

  readonly makeWith: <R>(
    options: {
      readonly capacity: number
      readonly lookup: SC.Lookup<K, R, E, A>
      readonly timeToLive: (exit: Exit<E, A>) => DurationInput
    }
  ) => Layer.Layer<R, never, I>
}

/**
 * Construct a ScopedCache implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function ScopedCache<K, E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A>
  <const I>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A>
} {
  function makeScopedCache<const I extends IdentifierFactory<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A>
  function makeScopedCache<const I>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A>
  function makeScopedCache<const I extends IdentifierInput<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A> {
    const tag = withActions(Tag<I, SC.ScopedCache<K, E, A>>(identifier))
    const self: Omit<ScopedCache<IdentifierOf<I>, K, E, A>, keyof typeof tag> = {
      cacheStats: tag.withEffect((cache) => cache.cacheStats()),
      contains: (key) => tag.withEffect((cache) => cache.contains(key)),
      entryStats: (key) => tag.withEffect((cache) => cache.entryStats(key)),
      get: (key) => tag.withEffect((cache) => cache.get(key)),
      getOption: (key) => tag.withEffect((cache) => cache.getOption(key)),
      getOptionComplete: (key) => tag.withEffect((cache) => cache.getOptionComplete(key)),
      invalidate: (key) => tag.withEffect((cache) => cache.invalidate(key)),
      invalidateAll: tag.withEffect((cache) => cache.invalidateAll()),
      refresh: (key) => tag.withEffect((cache) => cache.refresh(key)),
      size: tag.withEffect((cache) => cache.size()),
      make: (options) => Layer.scoped(tag, SC.make(options)),
      makeWith: (options) => Layer.scoped(tag, SC.makeWith(options))
    }

    return Object.assign(tag, self)
  }

  return makeScopedCache
}
