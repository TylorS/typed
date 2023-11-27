/**
 * Contextual wrappers around @effect/io/KeyedPool
 * @since 1.0.0
 */

import type { DurationInput } from "effect/Duration"
import type * as Effect from "effect/Effect"
import * as KP from "effect/KeyedPool"
import * as Layer from "effect/Layer"
import type { Scope } from "effect/Scope"
import { withActions } from "./Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier"
import { Tag } from "./Tag"

/**
 * Contextual wrappers around @effect/io/KeyedPool
 * @since 1.0.0
 * @category models
 */
export interface KeyedPool<I, K, E, A> extends Tag<I, KP.KeyedPool<K, E, A>> {
  /**
   * Invalidates the specified item. This will cause the pool to eventually
   * reallocate the item, although this reallocation may occur lazily rather
   * than eagerly.
   */
  readonly invalidate: (a: A) => Effect.Effect<I | Scope, never, void>

  /**
   * Retrieves an item from the pool belonging to the given key in a scoped
   * effect. Note that if acquisition fails, then the returned effect will fail
   * for that same reason. Retrying a failed acquisition attempt will repeat the
   * acquisition attempt.
   */
  readonly get: (key: K) => Effect.Effect<I | Scope, E, A>

  /**
   * Makes a new pool with the specified options.
   */
  readonly make: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: number
  }) => Layer.Layer<R, never, I>

  /**
   * Makes a new pool with the specified options allowing for the size to be
   * dynamically determined by the key.
   */
  readonly makeWith: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: (key: K) => number
  }) => Layer.Layer<R, never, I>

  /**
   * Makes a new pool with the specified options allowing for the time to live.
   */
  readonly makeWithTTL: <R>(
    options: {
      readonly acquire: (key: K) => Effect.Effect<R, E, A>
      readonly min: (key: K) => number
      readonly max: (key: K) => number
      readonly timeToLive: DurationInput
    }
  ) => Layer.Layer<R, never, I>

  /**
   * Makes a new pool with the specified options allowing for the time to live
   * to be dynamically determined by the key.
   */
  readonly makeWithTTLBy: <R>(
    options: {
      readonly acquire: (key: K) => Effect.Effect<R, E, A>
      readonly min: (key: K) => number
      readonly max: (key: K) => number
      readonly timeToLive: (key: K) => DurationInput
    }
  ) => Layer.Layer<R, never, I>
}

/**
 * Construct a KeyedPool implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function KeyedPool<K, E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): KeyedPool<IdentifierOf<I>, K, E, A>
  <const I>(identifier: I): KeyedPool<IdentifierOf<I>, K, E, A>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): KeyedPool<IdentifierOf<I>, K, E, A> => {
    const tag = withActions(Tag<I, KP.KeyedPool<K, E, A>>(identifier))

    return Object.assign(
      tag,
      {
        get: (k: K) => tag.withEffect(KP.get(k)),
        invalidate: (a: A) => tag.withEffect(KP.invalidate(a)),
        make: <R>(options: {
          readonly acquire: (key: K) => Effect.Effect<R, E, A>
          readonly size: number
        }) => Layer.scoped(tag, KP.make(options)),
        makeWith: <R>(
          options: {
            readonly acquire: (key: K) => Effect.Effect<R, E, A>
            readonly size: (key: K) => number
          }
        ) => Layer.scoped(tag, KP.makeWith(options)),
        makeWithTTL: <R>(
          options: {
            readonly acquire: (key: K) => Effect.Effect<R, E, A>
            readonly min: (key: K) => number
            readonly max: (key: K) => number
            readonly timeToLive: DurationInput
          }
        ) => Layer.scoped(tag, KP.makeWithTTL(options)),
        makeWithTTLBy: <R>(
          options: {
            readonly acquire: (key: K) => Effect.Effect<R, E, A>
            readonly min: (key: K) => number
            readonly max: (key: K) => number
            readonly timeToLive: (key: K) => DurationInput
          }
        ) => Layer.scoped(tag, KP.makeWithTTLBy(options))
      } as const
    )
  }
}
