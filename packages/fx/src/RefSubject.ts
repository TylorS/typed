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
import * as Deferred from "@effect/io/Deferred"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Fiber from "@effect/io/Fiber"
import type * as Scope from "@effect/io/Scope"
import * as SynchronizedRef from "@effect/io/SynchronizedRef"
import { Computed } from "@typed/fx/Computed"
import { Filtered } from "@typed/fx/Filtered"
import type { Fx } from "@typed/fx/Fx"
import { makeHoldSubject } from "@typed/fx/internal/core-subject"
import { fromFxEffect } from "@typed/fx/internal/fx"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import { matchFxKind } from "@typed/fx/internal/matchers"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import { run } from "@typed/fx/internal/run"
import { Sink } from "@typed/fx/Sink"
import type * as Subject from "@typed/fx/Subject"

/**
 * @since 1.18.0
 * @category symbols
 */
export const RefSubjectTypeId = Symbol.for("@typed/fx/RefSubject")

/**
 * @since 1.18.0
 * @category symbols
 */
export type RefSubjectTypeId = typeof RefSubjectTypeId

/**
 * A RefSubject is a Subject that has a current value that can be read and updated.
 * @since 1.18.0
 * @category models
 */
export interface RefSubject<in out E, in out A> extends Subject.Subject<never, E, A>, Effect.Effect<never, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * The Equivalence used to determine if a value has changed. Defaults to `Equal.equals`.
   * @since 1.18.0
   */
  readonly eq: Equivalence<A>

  /**
   * Get the current value of this RefSubject. If the RefSubject has not been initialized
   * then the initial value will be computed and returned. Concurrent calls to `get` will
   * only compute the initial value once.
   * @since 1.18.0
   */
  readonly get: Effect.Effect<never, E, A>

  /**
   * Set the current value of this RefSubject.
   * @since 1.18.0
   */
  readonly set: (a: A) => Effect.Effect<never, never, A>

  /**
   * Modify the current value of this RefSubject using the provided function.
   * @since 1.18.0
   */
  readonly update: (f: (a: A) => A) => Effect.Effect<never, E, A>

  /**
   * Modify the current value of this RefSubject and compute a new value.
   * @since 1.18.0
   */
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, E, B>

  /**
   * Delete the current value of this RefSubject. If it was not initialized the Option.none will be returned.
   * Otherwise the current value will be returned as an Option.some and the RefSubject will be uninitialized.
   * If there are existing subscribers to this RefSubject then the RefSubject will be re-initialized.
   * @since 1.18.0
   */
  readonly delete: Effect.Effect<never, never, Option.Option<A>>

  /**
   * Modify the current value of this RefSubject and compute a new value using the provided effectful function.
   * @since 1.18.0
   */
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ) => Effect.Effect<R2, E | E2, B>

  /**
   * Modify the current value of this RefSubject using the provided effectful function.
   * @since 1.18.0
   */
  readonly updateEffect: <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) => Effect.Effect<R2, E | E2, A>

  /**
   * Map the current value of this Computed to a new value using an Effect
   * @since 1.18.0
   */
  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B>

  /**
   * Map the current value of this Computed to a new value
   * @since 1.18.0
   */
  readonly map: <B>(f: (a: A) => B) => Computed<never, E, B>

  /**
   * Map the current value of this Filtered to a new value using an Effect
   * @since 1.18.0
   */
  readonly filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ) => Filtered<R2, E | E2, B>

  /**
   * Map the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B>

  /**
   * Filter the current value of this Filtered to a new value using an Effect
   */
  readonly filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<R2, E | E2, A>

  /**
   * Filter the current value of this Filtered to a new value
   * @since 1.18.0
   */
  readonly filter: (f: (a: A) => boolean) => Filtered<never, E, A>

  /**
   * A monotonic version number that is incremented every time the value of this RefSubject changes.
   * It is reset to 0 when the RefSubject is deleted.
   * @since 1.18.0
   */
  readonly version: Effect.Effect<never, never, number>
}

/**
 * Construct a RefSubject with a lazily initialized value.
 * @since 1.18.0
 * @category constructors
 */
export function fromEffect<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>> {
  return Effect.contextWith((ctx) => unsafeMake(Effect.provideContext(initial, ctx), makeHoldSubject<E, A>(), eq))
}

/**
 * Construct a RefSubject from a synchronous value.
 * @since 1.18.0
 * @category constructors
 */
export function of<A, E = never>(initial: A, eq?: Equivalence<A>): Effect.Effect<never, never, RefSubject<E, A>> {
  return fromEffect<never, E, A>(Effect.succeed(initial), eq)
}

/**
 * Construct a RefSubject from any Fx value.
 *
 * @since 1.18.0
 * @category constructors
 */
export function make<R, E, A>(
  fx: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<E, A>>
export function make<R, E, A>(
  fx: Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>>

export function make<R, E, A>(
  fx: Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> {
  return matchFxKind(fx, {
    Fx: (fx) => fxAsRef(fx, eq),
    Effect: (effect) => fromEffect(effect, eq),
    Stream: (stream) => fxAsRef(stream, eq),
    Cause: (cause) => fromEffect(Effect.failCause(cause), eq)
  })
}

const fxAsRef = <R, E, A>(
  fx: Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> =>
  Effect.gen(function*($) {
    const deferred = yield* $(Deferred.make<E, A>())
    const ref = yield* $(fromEffect<never, E, A>(Deferred.await(deferred), eq))

    const done = (exit: Exit.Exit<E, A>) =>
      Effect.flatMap(Deferred.done(deferred, exit), (closed) => closed ? Effect.unit : Exit.match(exit, ref))

    yield* $(Effect.forkScoped(run(
      fx,
      Sink(
        (e) => done(Exit.failCause(e)),
        (a) => done(Exit.succeed(a))
      )
    )))

    return ref
  })

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
    SynchronizedRef.unsafeMake<Option.Option<Fiber.Fiber<E, A>>>(Option.none()),
    subject
  )
}

class RefSubjectImpl<E, A> extends FxEffectProto<never, E, A, never, E, A>
  implements Omit<RefSubject<E, A>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  #version = 0

  constructor(
    readonly initial: Effect.Effect<never, E, A>,
    readonly eq: Equivalence<A>,
    readonly ref: SynchronizedRef.SynchronizedRef<Option.Option<Fiber.Fiber<E, A>>>,
    readonly subject: Subject.Subject<never, E, A>
  ) {
    super()

    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)
  }

  static make<E, A>(
    initial: Effect.Effect<never, E, A>,
    eq: Equivalence<A>,
    ref: SynchronizedRef.SynchronizedRef<Option.Option<Fiber.Fiber<E, A>>>,
    subject: Subject.Subject<never, E, A>
  ): RefSubject<E, A> {
    return new RefSubjectImpl(initial, eq, ref, subject) as any
  }

  onSuccess(a: A): Effect.Effect<never, never, unknown> {
    return this.set(a)
  }

  onFailure(cause: Cause<E>): Effect.Effect<never, never, unknown> {
    return Effect.tap(
      SynchronizedRef.set(this.ref, Option.some(Fiber.failCause(cause))),
      () => this.subject.onFailure(cause)
    )
  }

  readonly version = Effect.sync((): number => this.#version)

  readonly subscriberCount: Effect.Effect<never, never, number> = this.subject.subscriberCount

  readonly interrupt = Effect.suspend(() =>
    Effect.all([
      this.subject.interrupt,
      SynchronizedRef.get(this.ref).pipe(Effect.flatten, Effect.flatMap(Fiber.interrupt), Effect.optionFromOptional)
    ])
  )

  toFx(): Fx<never, E, A> {
    return fromFxEffect(
      Effect.as(
        SynchronizedRef.updateEffect(this.ref, (fiber) => Effect.asSome(this.getOrInitialize(fiber))),
        this.subject
      )
    )
  }

  toEffect() {
    return this.get
  }

  readonly get = Effect.fromFiberEffect(
    SynchronizedRef.modifyEffect(
      this.ref,
      (fiber) => Effect.map(this.getOrInitialize(fiber), (f) => [f, Option.some(f)] as const)
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
            return Effect.flatMap(f(a), ([b, a2]) => {
              if (this.eq(a, a2)) {
                return Effect.succeed([b, Option.some(Fiber.succeed(a2))])
              }

              return this.emitValue(a2).pipe(Effect.as([b, Option.some(Fiber.succeed(a2))]))
            })
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
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    return Effect.gen(function*(_) {
      const refCount = yield* _(that.subscriberCount)
      const currentValue = yield* _(that.getCurrentValue(fiber))

      that.#version = 0

      if (refCount === 0) {
        return [currentValue, Option.none()] as const
      }

      return [currentValue, Option.some(yield* _(that.initialize()))] as const
    }).pipe(
      Effect.catchAllCause((cause) => Effect.succeed([Option.none<A>(), Option.some(Fiber.failCause(cause))] as const))
    )
  })

  mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B> = (f) =>
    Computed(this as any, f)

  map: <B>(f: (a: A) => B) => Computed<never, E, B> = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))

  filterMapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>) => Filtered<R2, E | E2, B> = (
    f
  ) => Filtered(this as any, f)

  filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<never, E, B> = (f) =>
    this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<R2, E | E2, A> = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter = (f: (a: A) => boolean) => this.filterMap(Option.liftPredicate(f))

  private getCurrentValue = (fiber: Option.Option<Fiber.Fiber<E, A>>) => {
    return Option.match(fiber, {
      onNone: () => Effect.succeedNone,
      onSome: (f) => Effect.asSome(Fiber.join(f))
    })
  }

  private getOrInitialize(fiber: Option.Option<Fiber.Fiber<E, A>>) {
    return Option.match(fiber, {
      onNone: () => this.initialize(),
      onSome: Effect.succeed
    })
  }

  private setValue(a: A) {
    return Effect.as(SynchronizedRef.set(this.ref, Option.some(Fiber.succeed(a))), a)
  }

  private emitValue(a: A) {
    this.#version++

    return this.subject.onSuccess(a)
  }

  private initialize(): Effect.Effect<never, never, Fiber.Fiber<E, A>> {
    return this.initial.pipe(
      Effect.tap((a) => this.emitValue(a)),
      Effect.tapErrorCause((cause) => this.subject.onFailure(cause)),
      Effect.forkDaemon
    )
  }
}
