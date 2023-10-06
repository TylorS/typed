/**
 * A Contextual wrapper around a Subject
 * @since 1.18.0
 */

import * as Context from "@typed/context"
import type { Fx } from "@typed/fx/Fx"
import { fromFxEffect, provide, ToFx } from "@typed/fx/Fx"
import type * as Sink from "@typed/fx/Sink"
import * as S from "@typed/fx/Subject"
import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import type * as Layer from "effect/Layer"

/**
 * A Contextual wrapper around a Subject
 * @since 1.18.0
 * @category models
 */
export interface Subject<I, E, A> extends Fx<I, E, A>, Sink.WithContext<I, E, A> {
  readonly tag: Context.Tagged<I, S.Subject<never, E, A>>

  readonly interrupt: Effect.Effect<I, never, void>

  readonly provide: (
    replay?: number
  ) => <R2, E2, B>(effect: Effect.Effect<R2, E2, B>) => Effect.Effect<Exclude<R2, I>, E2, B>

  readonly provideFx: (
    replay?: number
  ) => <R2, E2, B>(fx: Fx<R2, E2, B>) => Fx<Exclude<R2, I>, E2, B>

  readonly make: (replay?: number) => Layer.Layer<never, never, I>
}

/**
 * Construct a contextual Subject
 * @since 1.18.0
 * @category constructors
 */
export function Subject<E, A>(): {
  <const I extends Context.IdentifierFactory<any>>(identifier: I): Subject<Context.IdentifierOf<I>, E, A>
  <const I>(identifier: I): Subject<Context.IdentifierOf<I>, E, A>
} {
  function makeSubject<const I extends Context.IdentifierFactory<any>>(
    identifier: I
  ): Subject<Context.IdentifierOf<I>, E, A>
  function makeSubject<const I>(identifier: I): Subject<Context.IdentifierOf<I>, E, A>
  function makeSubject<const I>(identifier: I): Subject<Context.IdentifierOf<I>, E, A> {
    return new SubjectImpl(Context.Tagged<I, S.Subject<never, E, A>>(identifier))
  }

  return makeSubject
}

class SubjectImpl<I, E, A> extends ToFx<I, E, A> implements Subject<I, E, A> {
  constructor(readonly tag: Context.Tagged<I, S.Subject<never, E, A>>) {
    super()

    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
    this.provide = this.provide.bind(this)
    this.make = this.make.bind(this)
  }

  toFx() {
    return fromFxEffect(this.tag)
  }

  onFailure(cause: Cause.Cause<E>) {
    return this.tag.withEffect((subject) => subject.onFailure(cause))
  }

  onSuccess(a: A) {
    return this.tag.withEffect((subject) => subject.onSuccess(a))
  }

  interrupt: Effect.Effect<I, never, void> = this.tag.withEffect((subject) => subject.interrupt)

  make(replay?: number): Layer.Layer<never, never, I> {
    return this.tag.layer(Effect.sync(() => {
      if (replay === undefined || replay <= 0) {
        return S.make<E, A>()
      } else if (replay === 1) {
        return S.makeHold<E, A>()
      } else {
        return S.makeReplay<E, A>(replay)
      }
    }))
  }

  provide: (replay?: number) => <R2, E2, B>(effect: Effect.Effect<R2, E2, B>) => Effect.Effect<Exclude<R2, I>, E2, B> =
    (replay) => (effect) => Effect.provide(effect, this.make(replay))

  provideFx: (replay?: number) => <R2, E2, B>(fx: Fx<R2, E2, B>) => Fx<Exclude<R2, I>, E2, B> = (replay) => (fx) =>
    provide(fx, this.make(replay))
}
