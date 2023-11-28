/**
 * Subjects are the basis for sharing events between multiple consumers in an effecient manner
 * and for event-bus-like functionality.
 * @since 1.18.0
 */

import * as C from "@typed/context"
import type { Cause } from "effect/Cause"
import * as Effect from "effect/Effect"
import type * as Layer from "effect/Layer"
import { type Fx, ToFx } from "./Fx.js"
import * as internal from "./internal/core-subject.js"
import { provide } from "./internal/core.js"
import { fromFxEffect } from "./internal/fx.js"
import type { WithContext } from "./Sink.js"

/**
 * A Subject is an Fx which is also a Sink, and can be used to
 * broadcast events to many consumers.
 * @since 1.18.0
 * @category models
 */
export interface Subject<R, E, A> extends Fx<R, E, A>, WithContext<R, E, A> {
  readonly subscriberCount: Effect.Effect<R, never, number>
  readonly interrupt: Effect.Effect<R, never, void>
}

/**
 * @since 1.18.0
 */
export namespace Subject {
  /**
   * A Contextual wrapper around a Subject
   * @since 1.18.0
   * @category models
   */
  export interface Tagged<I, E, A> extends Subject<I, E, A> {
    readonly tag: C.Tagged<I, Subject<never, E, A>>

    readonly interrupt: Effect.Effect<I, never, void>

    readonly provide: (
      replay?: number
    ) => <R2, E2, B>(effect: Effect.Effect<R2, E2, B>) => Effect.Effect<Exclude<R2, I>, E2, B>

    readonly provideFx: (
      replay?: number
    ) => <R2, E2, B>(fx: Fx<R2, E2, B>) => Fx<Exclude<R2, I>, E2, B>

    readonly make: (replay?: number) => Layer.Layer<never, never, I>
  }
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

/**
 * Construct a contextual Subject
 * @since 1.18.0
 * @category constructors
 */
export function tagged<E, A>(): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
} {
  function makeTagged<const I extends C.IdentifierFactory<any>>(
    identifier: I
  ): Subject.Tagged<C.IdentifierOf<I>, E, A>
  function makeTagged<const I>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A>
  function makeTagged<const I>(identifier: I): Subject.Tagged<C.IdentifierOf<I>, E, A> {
    return new ContextImpl(C.Tagged<I, Subject<never, E, A>>(identifier))
  }

  return makeTagged
}

class ContextImpl<I, E, A> extends ToFx<I, E, A> implements Subject.Tagged<I, E, A> {
  interrupt: Subject.Tagged<I, E, A>["interrupt"]
  subscriberCount: Subject.Tagged<I, E, A>["subscriberCount"]

  constructor(readonly tag: C.Tagged<I, Subject<never, E, A>>) {
    super()

    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
    this.provide = this.provide.bind(this)
    this.make = this.make.bind(this)
    this.interrupt = tag.withEffect((subject) => subject.interrupt)
    this.subscriberCount = tag.withEffect((subject) => subject.subscriberCount)
  }

  toFx() {
    return fromFxEffect(this.tag)
  }

  onFailure(cause: Cause<E>) {
    return this.tag.withEffect((subject) => subject.onFailure(cause))
  }

  onSuccess(a: A) {
    return this.tag.withEffect((subject) => subject.onSuccess(a))
  }

  make(replay?: number): Layer.Layer<never, never, I> {
    return this.tag.layer(Effect.sync(() => {
      if (replay === undefined || replay <= 0) {
        return make<E, A>()
      } else if (replay === 1) {
        return makeHold<E, A>()
      } else {
        return makeReplay<E, A>(replay)
      }
    }))
  }

  provide: (replay?: number) => <R2, E2, B>(effect: Effect.Effect<R2, E2, B>) => Effect.Effect<Exclude<R2, I>, E2, B> =
    (replay) => (effect) => Effect.provide(effect, this.make(replay))

  provideFx: (replay?: number) => <R2, E2, B>(fx: Fx<R2, E2, B>) => Fx<Exclude<R2, I>, E2, B> = (replay) => (fx) =>
    provide(fx, this.make(replay))
}
