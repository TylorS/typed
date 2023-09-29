/**
 * Contextual wrapper for @effect/io/Pool
 *
 * @since 1.0.0
 */

import type { DurationInput } from "effect/Duration"
import type * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as P from "effect/Pool"
import type { Scope } from "effect/Scope"
import { withActions } from "@typed/context/Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

/**
 * Contextual wrapper for @effect/io/Pool
 * @since 1.0.0
 * @category models
 */
export interface Pool<I, E, A> extends Tag<I, P.Pool<E, A>> {
  readonly invalidate: (a: A) => Effect.Effect<I | Scope, never, void>
  readonly get: Effect.Effect<I | Scope, E, A>

  readonly make: <R>(options: {
    readonly acquire: Effect.Effect<R, E, A>
    readonly size: number
  }) => Layer.Layer<R, never, I>

  readonly makeWithTTL: <R>(
    options: {
      readonly acquire: Effect.Effect<R, E, A>
      readonly min: number
      readonly max: number
      readonly timeToLive: DurationInput
    }
  ) => Layer.Layer<R, never, I>
}

/**
 * Construct a Pool implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Pool<E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Pool<IdentifierOf<I>, E, A>
  <const I>(identifier: I): Pool<IdentifierOf<I>, E, A>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): Pool<IdentifierOf<I>, E, A> => {
    const tag = withActions(Tag<I, P.Pool<E, A>>(identifier))

    return Object.assign(
      tag,
      {
        get: tag.withEffect(P.get),
        invalidate: (a: A) => tag.withEffect(P.invalidate(a)),
        make: <R>(options: {
          readonly acquire: Effect.Effect<R, E, A>
          readonly size: number
        }) => Layer.scoped(tag, P.make(options)),
        makeWithTTL: <R>(
          options: {
            readonly acquire: Effect.Effect<R, E, A>
            readonly min: number
            readonly max: number
            readonly timeToLive: DurationInput
          }
        ) => Layer.scoped(tag, P.makeWithTTL(options))
      } as const
    ) satisfies Pool<IdentifierOf<I>, E, A>
  }
}
