/**
 * Contextual wrappers around @effect/io/Resource
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as R from "effect/Resource"
import type * as Schedule from "effect/Schedule"
import type { IdentifierFactory, IdentifierOf } from "./Identifier.js"
import { Tag } from "./Tag.js"

/**
 * Contextual wrappers around @effect/io/Resource
 * @since 1.0.0
 * @category models
 */
export interface Resource<I, A, E> extends Tag<I, R.Resource<A, E>> {
  readonly get: Effect.Effect<A, E, I>

  readonly refresh: Effect.Effect<void, E, I>

  readonly auto: <R, Out, R2 = never>(
    acquire: Effect.Effect<A, E, R>,
    policy: Schedule.Schedule<Out, unknown, R2>
  ) => Layer.Layer<I, never, R | R2>

  readonly manual: <R>(acquire: Effect.Effect<A, E, R>) => Layer.Layer<I, never, R>
}

/**
 * Construct a Resource implementation to be utilized from the Effect Context.
 * @since 1.0.0
 */
export function Resource<A, E>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Resource<IdentifierOf<I>, A, E>
  <const I>(identifier: I): Resource<IdentifierOf<I>, A, E>
} {
  function makeResource<const I extends IdentifierFactory<any>>(identifier: I): Resource<IdentifierOf<I>, A, E>
  function makeResource<const I>(identifier: I): Resource<IdentifierOf<I>, A, E>
  function makeResource<const I>(identifier: I): Resource<IdentifierOf<I>, A, E> {
    const tag = Tag<I, R.Resource<A, E>>(identifier)

    const self: Omit<Resource<IdentifierOf<I>, A, E>, keyof typeof tag> = {
      get: Effect.flatMap(tag, R.get),
      refresh: Effect.flatMap(tag, R.refresh),
      auto: (acquire, policy) => Layer.scoped(tag, R.auto(acquire, policy)),
      manual: (acquire) => Layer.scoped(tag, R.manual(acquire))
    }

    return Object.assign(tag, self)
  }

  return makeResource
}
