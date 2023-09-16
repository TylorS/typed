/**
 * Contextual wrappers around @effect/io/Resource
 * @since 1.0.0
 */

import * as Effect from "@effect/io/Effect"
import * as Layer from "@effect/io/Layer"
import * as R from "@effect/io/Resource"
import type * as Schedule from "@effect/io/Schedule"
import type { IdentifierFactory, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

/**
 * Contextual wrappers around @effect/io/Resource
 * @since 1.0.0
 * @category models
 */
export interface Resource<I, E, A> extends Tag<I, R.Resource<E, A>> {
  readonly get: Effect.Effect<I, E, A>

  readonly refresh: Effect.Effect<I, E, void>

  readonly auto: <R, R2, Out>(
    acquire: Effect.Effect<R, E, A>,
    policy: Schedule.Schedule<R2, unknown, Out>
  ) => Layer.Layer<R | R2, never, I>

  readonly manual: <R>(acquire: Effect.Effect<R, E, A>) => Layer.Layer<R, never, I>
}

/**
 * Construct a Resource implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function Resource<E, A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Resource<IdentifierOf<I>, E, A>
  <const I>(identifier: I): Resource<IdentifierOf<I>, E, A>
} {
  function makeResource<const I extends IdentifierFactory<any>>(identifier: I): Resource<IdentifierOf<I>, E, A>
  function makeResource<const I>(identifier: I): Resource<IdentifierOf<I>, E, A>
  function makeResource<const I>(identifier: I): Resource<IdentifierOf<I>, E, A> {
    const tag = Tag<I, R.Resource<E, A>>(identifier)

    const self: Omit<Resource<IdentifierOf<I>, E, A>, keyof typeof tag> = {
      get: Effect.flatMap(tag, R.get),
      refresh: Effect.flatMap(tag, R.refresh),
      auto: (acquire, policy) => Layer.scoped(tag, R.auto(acquire, policy)),
      manual: (acquire) => Layer.scoped(tag, R.manual(acquire))
    }

    return Object.assign(tag, self)
  }

  return makeResource
}
