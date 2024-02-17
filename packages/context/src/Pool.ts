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
import { withActions } from "./Extensions.js"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrapper for @effect/io/Pool
 * @since 1.0.0
 * @category models
 */
export interface Pool<I, A, E> extends Tag<I, P.Pool<A, E>> {
  readonly invalidate: (a: A) => Effect.Effect<void, never, I | Scope>
  readonly get: Effect.Effect<A, E, I | Scope>

  readonly make: <R>(options: {
    readonly acquire: Effect.Effect<A, E, R>
    readonly size: number
  }) => Layer.Layer<I, never, R>

  readonly makeWithTTL: <R>(
    options: {
      readonly acquire: Effect.Effect<A, E, R>
      readonly min: number
      readonly max: number
      readonly timeToLive: DurationInput
    }
  ) => Layer.Layer<I, never, R>
}

/**
 * Construct a Pool implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Pool<A, E>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Pool<IdentifierOf<I>, A, E>
  <const I>(identifier: I): Pool<IdentifierOf<I>, A, E>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): Pool<IdentifierOf<I>, A, E> => {
    const tag = withActions(Tag<I, P.Pool<A, E>>(identifier))

    return Object.assign(
      tag,
      {
        get: tag.withEffect(P.get),
        invalidate: (a: A) => tag.withEffect(P.invalidate(a)),
        make: <R>(options: {
          readonly acquire: Effect.Effect<A, E, R>
          readonly size: number
        }) => Layer.scoped(tag, P.make(options)),
        makeWithTTL: <R>(
          options: {
            readonly acquire: Effect.Effect<A, E, R>
            readonly min: number
            readonly max: number
            readonly timeToLive: DurationInput
          }
        ) => Layer.scoped(tag, P.makeWithTTL(options))
      } as const
    ) satisfies Pool<IdentifierOf<I>, A, E>
  }
}
