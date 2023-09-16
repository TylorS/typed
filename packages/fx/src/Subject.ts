/**
 * Subjects are the basis for sharing events between multiple consumers in an effecient manner
 * and for event-bus-like functionality.
 * @since 1.18.0
 */

import type * as Effect from "@effect/io/Effect"
import type { Fx } from "@typed/fx/Fx"
import * as internal from "@typed/fx/internal/core-subject"
import type { Sink } from "@typed/fx/Sink"

/**
 * A Subject is an Fx which is also a Sink, and can be used to
 * broadcast events to many consumers.
 * @since 1.18.0
 * @category models
 */
export interface Subject<R, E, A> extends Fx<R, E, A>, Sink<E, A> {
  readonly subscriberCount: Effect.Effect<never, never, number>
}

/**
 * Constructs a Subject that can be used to broadcast events to many consumers.
 * @since 1.18.0
 * @category constructors
 */
export const make: <E, A>() => Subject<never, E, A> = internal.makeSubject

/**
 * Constructs a Subject that can be used to broadcast events to many consumers.
 * If a previous event has been consumed previously, any "late" subscribers will
 * receive that previous event.
 * @since 1.18.0
 * @category constructors
 */
export const makeHold: <E, A>() => Subject<never, E, A> = internal.makeHoldSubject

/**
 * Constructs a Subject that can be used to broadcast events to many consumers.
 * If a previous event has been consumed previously, any "late" subscribers will
 * receive _up to_ `capacity` previous events.
 * @since 1.18.0
 * @category constructors
 */
export const makeReplay: <E, A>(capacity: number) => Subject<never, E, A> = internal.makeReplaySubject
