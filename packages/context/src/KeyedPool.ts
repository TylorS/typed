import type { DurationInput } from "@effect/data/Duration"
import type * as Effect from "@effect/io/Effect"
import * as KP from "@effect/io/KeyedPool"
import type { Layer } from "@effect/io/Layer"
import type { Scope } from "@effect/io/Scope"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

export interface KeyedPool<I, K, E, A> extends Tag<I, KP.KeyedPool<K, E, A>> {
  readonly invalidate: (a: A) => Effect.Effect<I | Scope, never, void>
  readonly get: (key: K) => Effect.Effect<I | Scope, E, A>

  readonly make: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: number
  }) => Layer<R, never, I>

  readonly makeWith: <R>(options: {
    readonly acquire: (key: K) => Effect.Effect<R, E, A>
    readonly size: (key: K) => number
  }) => Layer<R, never, I>

  readonly makeWithTTL: <R>(
    options: {
      readonly acquire: (key: K) => Effect.Effect<R, E, A>
      readonly min: (key: K) => number
      readonly max: (key: K) => number
      readonly timeToLive: DurationInput
    }
  ) => Layer<R, never, I>

  readonly makeWithTTLBy: <R>(
    options: {
      readonly acquire: (key: K) => Effect.Effect<R, E, A>
      readonly min: (key: K) => number
      readonly max: (key: K) => number
      readonly timeToLive: (key: K) => DurationInput
    }
  ) => Layer<R, never, I>
}

export function KeyedPool<K, E, A>(): <const I extends IdentifierFactory<any>>(
  identifier: I
) => KeyedPool<IdentifierOf<I>, K, E, A>

export function KeyedPool<K, E, A>(): <const I>(identifier: I) => KeyedPool<IdentifierOf<I>, K, E, A>

export function KeyedPool<K, E, A>() {
  return <const I extends IdentifierInput<any>>(identifier: I): KeyedPool<IdentifierOf<I>, K, E, A> => {
    const tag = Tag<I, KP.KeyedPool<K, E, A>>(identifier)

    return Object.assign(
      tag,
      {
        get: (k: K) => tag.withEffect(KP.get(k)),
        invalidate: (a: A) => tag.withEffect(KP.invalidate(a)),
        make: <R>(options: {
          readonly acquire: (key: K) => Effect.Effect<R, E, A>
          readonly size: number
        }) => tag.scoped(KP.make(options)),
        makeWith: <R>(
          options: {
            readonly acquire: (key: K) => Effect.Effect<R, E, A>
            readonly size: (key: K) => number
          }
        ) => tag.scoped(KP.makeWith(options)),
        makeWithTTL: <R>(
          options: {
            readonly acquire: (key: K) => Effect.Effect<R, E, A>
            readonly min: (key: K) => number
            readonly max: (key: K) => number
            readonly timeToLive: DurationInput
          }
        ) => tag.scoped(KP.makeWithTTL(options)),
        makeWithTTLBy: <R>(
          options: {
            readonly acquire: (key: K) => Effect.Effect<R, E, A>
            readonly min: (key: K) => number
            readonly max: (key: K) => number
            readonly timeToLive: (key: K) => DurationInput
          }
        ) => tag.scoped(KP.makeWithTTLBy(options))
      } as const
    )
  }
}
