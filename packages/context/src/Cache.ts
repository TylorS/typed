import type { DurationInput } from "@effect/data/Duration"
import type { Either } from "@effect/data/Either"
import * as C from "@effect/io/Cache"
import type { Effect } from "@effect/io/Effect"
import type { Exit } from "@effect/io/Exit"
import * as Layer from "@effect/io/Layer"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { withActions } from "@typed/context/Interface"
import { Tag } from "@typed/context/Tag"

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

export function Cache<K, E, A>() {
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
