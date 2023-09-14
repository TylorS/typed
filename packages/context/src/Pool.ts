import type { DurationInput } from "@effect/data/Duration"
import type * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as P from "@effect/io/Pool"
import type { Scope } from "@effect/io/Scope"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

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

export function Pool<E, A>(): <const I extends IdentifierFactory<any>>(identifier: I) => Pool<IdentifierOf<I>, E, A>
export function Pool<E, A>(): <const I>(identifier: I) => Pool<IdentifierOf<I>, E, A>
export function Pool<E, A>() {
  return <const I extends IdentifierInput<any>>(identifier: I): Pool<IdentifierOf<I>, E, A> => {
    const tag = Tag<I, P.Pool<E, A>>(identifier)

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
