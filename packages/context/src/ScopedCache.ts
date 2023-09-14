import type { DurationInput } from "@effect/data/Duration"
import type { Option } from "@effect/data/Option"
import type * as C from "@effect/io/Cache"
import type { Effect } from "@effect/io/Effect"
import type { Exit } from "@effect/io/Exit"
import * as Layer from "@effect/io/Layer"
import type { Scope } from "@effect/io/Scope"
import * as SC from "@effect/io/ScopedCache"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

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

export function ScopedCache<K, E, A>() {
  function makeScopedCache<const I extends IdentifierFactory<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A>
  function makeScopedCache<const I>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A>
  function makeScopedCache<const I extends IdentifierInput<any>>(identifier: I): ScopedCache<IdentifierOf<I>, K, E, A> {
    const tag = Tag<I, SC.ScopedCache<K, E, A>>(identifier)
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
