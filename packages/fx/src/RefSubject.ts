/**
 * A RefSubject is the core abstraction for keeping state and subscribing to its
 * changes over time.
 *
 * @since 1.18.0
 */

import * as Equal from "@effect/data/Equal"
import type { Equivalence } from "@effect/data/Equivalence"
import * as Option from "@effect/data/Option"
import type { Cause } from "@effect/io/Cause"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as SynchronizedRef from "@effect/io/SynchronizedRef"
import type { Fx } from "@typed/fx/Fx"
import { fromFxEffect } from "@typed/fx/Fx"
import { makeHoldSubject, makeReplaySubject } from "@typed/fx/internal/core-subject"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import type * as Subject from "@typed/fx/Subject"

/**
 * A RefSubject is a Subject that has a current value that can be read and updated.
 * @since 1.18.0
 * @category models
 */
export interface RefSubject<in out E, in out A> extends Subject.Subject<never, E, A>, Effect.Effect<never, E, A> {
  readonly eq: Equivalence<A>
  readonly get: Effect.Effect<never, E, A>
  readonly set: (a: A) => Effect.Effect<never, never, A>
  readonly update: (f: (a: A) => A) => Effect.Effect<never, E, A>
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, E, B>
  readonly delete: Effect.Effect<never, never, Option.Option<A>>
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R2, E | E2, B>
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R2, E | E2, A>
}

/**
 * Construct a RefSubject with an initial value.
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>> {
  return Effect.contextWith((ctx) => unsafeMake(Effect.provideContext(initial, ctx), makeHoldSubject<E, A>(), eq))
}

/**
 * Construct a RefSubject with an initial value and a capacity for replaying events.
 * @since 1.18.0
 * @category constructors
 */
export function makeReplay<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  capacity: number,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>> {
  return Effect.contextWith((ctx) =>
    unsafeMake(Effect.provideContext(initial, ctx), makeReplaySubject<E, A>(capacity), eq)
  )
}

/**
 * Construct a RefSubject with an initial value and the specified subject.
 * @since 1.18.0
 * @category constructors
 */
export function unsafeMake<E, A>(
  initial: Effect.Effect<never, E, A>,
  subject: Subject.Subject<never, E, A>,
  eq: Equivalence<A> = Equal.equals
): RefSubject<E, A> {
  return RefSubjectImpl.make(
    initial,
    eq,
    SynchronizedRef.unsafeMake<Fiber.Fiber<E, A>>(Fiber.unit as any),
    subject
  )
}

class RefSubjectImpl<E, A> extends FxEffectProto<never, E, A, never, E, A>
  implements Omit<RefSubject<E, A>, ModuleAgumentedEffectKeysToOmit>
{
  constructor(
    readonly initial: Effect.Effect<never, E, A>,
    readonly eq: Equivalence<A>,
    readonly ref: SynchronizedRef.SynchronizedRef<Fiber.Fiber<E, A>>,
    readonly subject: Subject.Subject<never, E, A>
  ) {
    super()
  }

  static make<E, A>(
    initial: Effect.Effect<never, E, A>,
    eq: Equivalence<A>,
    ref: SynchronizedRef.SynchronizedRef<Fiber.Fiber<E, A>>,
    subject: Subject.Subject<never, E, A>
  ): RefSubject<E, A> {
    return new RefSubjectImpl(initial, eq, ref, subject) as any
  }

  onSuccess(a: A): Effect.Effect<never, never, unknown> {
    return this.set(a)
  }

  onFailure(cause: Cause<E>): Effect.Effect<never, never, unknown> {
    return SynchronizedRef.set(this.ref, Fiber.failCause(cause)).pipe(
      Effect.tap(() => this.subject.onFailure(cause))
    )
  }

  readonly subscriberCount: Effect.Effect<never, never, number> = this.subject.subscriberCount

  toFx(): Fx<never, E, A> {
    return fromFxEffect(
      Effect.as(SynchronizedRef.updateEffect(this.ref, (fiber) => this.getOrInitialize(fiber)), this.subject)
    )
  }

  toEffect() {
    return this.get
  }

  readonly get = Effect.fromFiberEffect(
    SynchronizedRef.updateAndGetEffect(
      this.ref,
      (fiber) => this.getOrInitialize(fiber)
    )
  )

  readonly set = (a: A) =>
    Effect.catchAllCause(this.update(() => a), () => Effect.tap(this.setValue(a), () => this.emitValue(a)))

  readonly modifyEffect = <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) =>
    SynchronizedRef.modifyEffect(
      this.ref,
      (fiber) =>
        this.getOrInitialize(fiber).pipe(
          Effect.fromFiberEffect,
          Effect.flatMap((a) => {
            return f(a).pipe(
              Effect.flatMap(([b, a2]) => {
                if (this.eq(a, a2)) {
                  return Effect.succeed([b, Fiber.succeed(a2)])
                }

                return this.emitValue(a2).pipe(Effect.as([b, Fiber.succeed(a2)]))
              })
            )
          })
        )
    )

  readonly updateEffect = <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) =>
    this.modifyEffect((a) => f(a).pipe(Effect.map((a2) => [a2, a2] as const)))

  readonly modify = <B>(f: (a: A) => readonly [B, A]) => this.modifyEffect((a) => Effect.sync(() => f(a)))

  readonly update = (f: (a: A) => A) =>
    this.modify((a) => {
      const a2 = f(a)

      return [a2, a2]
    })

  readonly delete: Effect.Effect<never, never, Option.Option<A>> = SynchronizedRef.modifyEffect(this.ref, (fiber) => {
    const { getCurrentValue, initialize, subscriberCount } = this

    return Effect.gen(function*(_) {
      const refCount = yield* _(subscriberCount)
      const currentValue = yield* _(getCurrentValue(fiber))

      if (refCount === 0) {
        return [currentValue, Fiber.unit as any] as const
      }

      return [currentValue, yield* _(initialize())] as const
    }).pipe(
      Effect.catchAllCause((cause) => Effect.succeed([Option.none<A>(), Fiber.failCause(cause)] as const))
    )
  })

  private getCurrentValue = (fiber: Fiber.Fiber<E, A>) => {
    return (fiber as any) === Fiber.unit ? Effect.succeedNone : Effect.asSome(Fiber.join(fiber))
  }

  private getOrInitialize(fiber: Fiber.Fiber<E, A>) {
    return (fiber as any) === Fiber.unit ? this.initialize() : Effect.succeed(fiber)
  }

  private setValue(a: A) {
    return Effect.as(SynchronizedRef.set(this.ref, Fiber.succeed(a)), a)
  }

  private emitValue(a: A) {
    return this.subject.onSuccess(a)
  }

  private initialize() {
    return this.initial.pipe(
      Effect.tap((a) => this.emitValue(a)),
      Effect.tapErrorCause((cause) => this.subject.onFailure(cause)),
      Effect.forkDaemon
    )
  }
}
