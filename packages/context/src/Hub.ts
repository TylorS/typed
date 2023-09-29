/**
 * Contextual wrappers around @effect/io/Hub
 * @since 1.0.0
 */

import type * as Effect from "effect/Effect"
import * as H from "effect/Hub"
import * as Layer from "effect/Layer"
import type * as Q from "effect/Queue"
import type { Scope } from "effect/Scope"
import { withActions } from "@typed/context/Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "@typed/context/Identifier"
import { Tag } from "@typed/context/Tag"

/**
 * Contextual wrappers around @effect/io/Hub
 * @since 1.0.0
 * @category models
 */
export interface Hub<I, A> extends Tag<I, H.Hub<A>> {
  /**
   * The capacity of the Hub
   */
  readonly capacity: Effect.Effect<I, never, number>

  /**
   * Is the Hub active?
   */
  readonly isActive: Effect.Effect<I, never, boolean>

  /**
   * The current size of the Hub
   */
  readonly size: Effect.Effect<I, never, number>

  /**
   * Is the Hub full?
   */
  readonly isFull: Effect.Effect<I, never, boolean>

  /**
   * Is the Hub empty?
   */
  readonly isEmpty: Effect.Effect<I, never, boolean>

  /**
   * Shutdown the Hub
   */
  readonly shutdown: Effect.Effect<I, never, void>

  /**
   * Is the Hub shutdown?
   */
  readonly isShutdown: Effect.Effect<I, never, boolean>

  /**
   * Wait for the Hub to shutdown
   */
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // Hub

  /**
   * Publish a value to the Hub
   */
  readonly publish: (a: A) => Effect.Effect<I, never, boolean>

  /**
   * Publish multiple values to the Hub
   */
  readonly publishAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>

  /**
   * Subscribe to the Hub
   */
  readonly subscribe: Effect.Effect<I | Scope, never, Q.Dequeue<A>>

  // Constructors

  /**
   * Create a bounded Hub
   */
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a dropping Hub
   */
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a sliding Hub
   */
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create an unbounded Hub
   */
  readonly unbounded: Layer.Layer<never, never, I>
}

/**
 * Construct a Hub implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function Hub<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): Hub<IdentifierOf<I>, A>
  <const I>(identifier: I): Hub<IdentifierOf<I>, A>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): Hub<IdentifierOf<I>, A> => {
    const tag = withActions(Tag<I, H.Hub<A>>(identifier))

    return Object.assign(tag, {
      capacity: tag.with((d) => d.capacity()),
      isActive: tag.with((d) => d.isActive()),
      size: tag.withEffect((d) => d.size()),
      isFull: tag.withEffect((d) => d.isFull()),
      isEmpty: tag.withEffect((d) => d.isEmpty()),
      shutdown: tag.withEffect((d) => d.shutdown()),
      isShutdown: tag.withEffect((d) => d.isShutdown()),
      awaitShutdown: tag.withEffect((d) => d.awaitShutdown()),
      publish: (a: A) => tag.withEffect(H.publish(a)),
      publishAll: (a: Iterable<A>) => tag.withEffect(H.publishAll(a)),
      subscribe: tag.withEffect(H.subscribe),
      bounded: (capacity: number) => Layer.effect(tag, H.bounded(capacity)),
      dropping: (capacity: number) => Layer.effect(tag, H.dropping(capacity)),
      sliding: (capacity: number) => Layer.effect(tag, H.sliding(capacity)),
      unbounded: Layer.effect(tag, H.unbounded<A>())
    })
  }
}
