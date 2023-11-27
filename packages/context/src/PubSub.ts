/**
 * Contextual wrappers around @effect/io/PubSub
 * @since 1.0.0
 */

import type * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as PS from "effect/PubSub"
import type * as Q from "effect/Queue"
import type { Scope } from "effect/Scope"
import { withActions } from "./Extensions"
import type { IdentifierFactory, IdentifierInput, IdentifierOf } from "./Identifier"
import { Tag } from "./Tag"

/**
 * Contextual wrappers around @effect/io/PubSub
 * @since 1.0.0
 * @category models
 */
export interface PubSub<I, A> extends Tag<I, PS.PubSub<A>> {
  /**
   * The capacity of the PubSub
   */
  readonly capacity: Effect.Effect<I, never, number>

  /**
   * Is the PubSub active?
   */
  readonly isActive: Effect.Effect<I, never, boolean>

  /**
   * The current size of the PubSub
   */
  readonly size: Effect.Effect<I, never, number>

  /**
   * Is the PubSub full?
   */
  readonly isFull: Effect.Effect<I, never, boolean>

  /**
   * Is the PubSub empty?
   */
  readonly isEmpty: Effect.Effect<I, never, boolean>

  /**
   * Shutdown the PubSub
   */
  readonly shutdown: Effect.Effect<I, never, void>

  /**
   * Is the PubSub shutdown?
   */
  readonly isShutdown: Effect.Effect<I, never, boolean>

  /**
   * Wait for the PubSub to shutdown
   */
  readonly awaitShutdown: Effect.Effect<I, never, void>

  // PubSub

  /**
   * Publish a value to the PubSub
   */
  readonly publish: (a: A) => Effect.Effect<I, never, boolean>

  /**
   * Publish multiple values to the PubSub
   */
  readonly publishAll: (as: Iterable<A>) => Effect.Effect<I, never, boolean>

  /**
   * Subscribe to the PubSub
   */
  readonly subscribe: Effect.Effect<I | Scope, never, Q.Dequeue<A>>

  // Constructors

  /**
   * Create a bounded PubSub
   */
  readonly bounded: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a dropping PubSub
   */
  readonly dropping: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create a sliding PubSub
   */
  readonly sliding: (capacity: number) => Layer.Layer<never, never, I>

  /**
   * Create an unbounded PubSub
   */
  readonly unbounded: Layer.Layer<never, never, I>
}

/**
 * Construct a PubSub implementation to be utilized from the Effect Context.
 * @since 1.0.0
 * @category constructors
 */
export function PubSub<A>(): {
  <const I extends IdentifierFactory<any>>(identifier: I): PubSub<IdentifierOf<I>, A>
  <const I>(identifier: I): PubSub<IdentifierOf<I>, A>
} {
  return <const I extends IdentifierInput<any>>(identifier: I): PubSub<IdentifierOf<I>, A> => {
    const tag = withActions(Tag<I, PS.PubSub<A>>(identifier))

    return Object.assign(tag, {
      capacity: tag.with((d) => d.capacity()),
      isActive: tag.with((d) => d.isActive()),
      size: tag.withEffect((d) => d.size),
      isFull: tag.withEffect((d) => d.isFull),
      isEmpty: tag.withEffect((d) => d.isEmpty),
      shutdown: tag.withEffect((d) => d.shutdown),
      isShutdown: tag.withEffect((d) => d.isShutdown),
      awaitShutdown: tag.withEffect((d) => d.awaitShutdown),
      publish: (a: A) => tag.withEffect(PS.publish(a)),
      publishAll: (a: Iterable<A>) => tag.withEffect(PS.publishAll(a)),
      subscribe: tag.withEffect(PS.subscribe),
      bounded: (capacity: number) => Layer.effect(tag, PS.bounded(capacity)),
      dropping: (capacity: number) => Layer.effect(tag, PS.dropping(capacity)),
      sliding: (capacity: number) => Layer.effect(tag, PS.sliding(capacity)),
      unbounded: Layer.effect(tag, PS.unbounded<A>())
    })
  }
}
