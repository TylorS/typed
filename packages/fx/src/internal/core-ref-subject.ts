import { Ref, SubscriptionRef } from "effect"
import { type Cause, isInterrupted } from "effect/Cause"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import { sum } from "effect/Number"
import * as Option from "effect/Option"
import { getEquivalence } from "effect/ReadonlyArray"
import type * as Scope from "effect/Scope"
import { Computed } from "../Computed.js"
import { Filtered } from "../Filtered.js"
import type { Fx, FxInput } from "../Fx.js"
import { type RefSubject } from "../RefSubject.js"
import { Sink, WithContext } from "../Sink.js"
import type * as Subject from "../Subject.js"
import { ComputedTypeId, RefSubjectTypeId } from "../TypeId.js"
import { transformFx } from "../Versioned.js"
import { makeHoldSubject } from "./core-subject.js"
import * as core from "./core.js"
import { DeferredRef } from "./deferred-ref.js"
import { fromFxEffect } from "./fx.js"
import { matchFxInput } from "./matchers.js"
import { FxEffectBase } from "./protos.js"
import { run } from "./run.js"
import { share } from "./share.js"

export class RefSubjectImpl<R, E, A> extends FxEffectBase<R, E, A, R, E, A> implements RefSubject<R, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  private _version = 0
  private _lock: <R, E, A>(self: Effect.Effect<R, E, A>) => Effect.Effect<R, E, A>

  constructor(
    readonly initial: Effect.Effect<R, E, A>,
    readonly eq: Equivalence<A>,
    readonly ref: Ref.Ref<Option.Option<Fiber.Fiber<E, A>>>,
    readonly semaphore: Effect.Semaphore,
    readonly subject: Subject.Subject<R, E, A>
  ) {
    super()

    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)

    this._lock = semaphore.withPermits(1)
    this.subscriberCount = subject.subscriberCount
  }

  static make<R, E, A>(
    initial: Effect.Effect<R, E, A>,
    eq: Equivalence<A>,
    ref: Ref.Ref<Option.Option<Fiber.Fiber<E, A>>>,
    subject: Subject.Subject<R, E, A>,
    semaphore: Effect.Semaphore = Effect.unsafeMakeSemaphore(1)
  ): RefSubject<R, E, A> {
    return new RefSubjectImpl(initial, eq, ref, semaphore, subject) as any
  }

  onSuccess(a: A): Effect.Effect<R, never, unknown> {
    return this.set(a)
  }

  onFailure(cause: Cause<E>): Effect.Effect<R, never, unknown> {
    return Effect.tap(
      Ref.set(this.ref, Option.some(Fiber.failCause(cause))),
      () => this.subject.onFailure(cause)
    )
  }

  readonly version = Effect.sync((): number => this._version)

  readonly subscriberCount: Effect.Effect<R, never, number>

  readonly interrupt = Effect.suspend(() =>
    Effect.all([
      this.subject.interrupt,
      Ref.getAndSet(this.ref, Option.none()).pipe(
        Effect.flatten,
        Effect.flatMap(Fiber.interrupt),
        Effect.optionFromOptional
      )
    ])
  )

  toFx(): Fx<R, E, A> {
    return fromFxEffect(
      Effect.as(
        Ref.get(this.ref).pipe(Effect.flatMap((fiber) => Effect.asSome(this.getOrInitialize(fiber)))),
        this.subject
      )
    )
  }

  toEffect() {
    return this.get
  }

  readonly get: RefSubject<R, E, A>["get"] = Effect.suspend(() =>
    Effect.fromFiberEffect(
      Effect.flatMap(Ref.get(this.ref), (fiber) => this.getOrInitialize(fiber))
    )
  )

  readonly modifyEffect: RefSubject<R, E, A>["modifyEffect"] = (f) =>
    this._lock(
      this.get.pipe(
        Effect.flatMap((a) =>
          f(a).pipe(
            Effect.tap(([, a2]) =>
              Effect.if(this.eq(a, a2), {
                onTrue: this.setValue(a2),
                onFalse: Effect.zipRight(this.setValue(a2), this.emitValue(a2))
              })
            ),
            Effect.map(([b]) => b)
          )
        )
      )
    )

  readonly runUpdate: RefSubject<R, E, A>["runUpdate"] = (updates, onInterrupt) =>
    Effect.uninterruptibleMask((restore) =>
      Effect.flatMap(this.get, (initial) =>
        updates(this.get, this.setUnlocked).pipe(
          this._lock,
          restore,
          Effect.tapErrorCause(
            (cause) =>
              isInterrupted(cause)
                ? onInterrupt ?
                  Effect.flatMap(Effect.flatMap(this.get, onInterrupt), this.setUnlocked) :
                  this.setUnlocked(initial) :
                Effect.unit
          )
        ))
    )

  private setUnlocked = (a: A) =>
    this.get.pipe(
      Effect.matchCauseEffect({
        onFailure: () => Effect.zipLeft(this.setValue(a), this.emitValue(a)),
        onSuccess: (current) =>
          this.eq(current, a) ? this.setValue(a) : Effect.zipLeft(this.setValue(a), this.emitValue(a))
      })
    )

  readonly set = (a: A) =>
    Effect.catchAllCause(
      this.update(() => a),
      () => this._lock(Effect.tap(this.setValue(a), () => this.emitValue(a)))
    )

  readonly updateEffect = <R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>) =>
    this.modifyEffect((a) => f(a).pipe(Effect.map((a2) => [a2, a2] as const)))

  readonly modify = <B>(f: (a: A) => readonly [B, A]) => this.modifyEffect((a) => Effect.sync(() => f(a)))

  readonly update = (f: (a: A) => A) =>
    this.modify((a) => {
      const a2 = f(a)

      return [a2, a2]
    })

  readonly delete: Effect.Effect<R, never, Option.Option<A>> = this.modifyRef((fiber) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    return Effect.gen(function*(_) {
      const refCount = yield* _(that.subscriberCount)
      const currentValue = yield* _(that.getCurrentValue(fiber))

      that._version = 0

      if (refCount === 0) {
        return [currentValue, Option.none()] as const
      }

      // If we have active subscribers, we should re-initialize the ref
      return [currentValue, yield* _(Effect.asSome(that.initialize()))] as const
    }).pipe(
      Effect.catchAllCause((cause) => Effect.succeed([Option.none<A>(), Option.some(Fiber.failCause(cause))] as const))
    )
  })

  mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R | R2, E | E2, B> = (f) =>
    Computed(this, f)

  map: <B>(f: (a: A) => B) => Computed<R, E, B> = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))

  filterMapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>) => Filtered<R | R2, E | E2, B> = (
    f
  ) => Filtered(this, f)

  filterMap: <B>(f: (a: A) => Option.Option<B>) => Filtered<R, E, B> = (f) =>
    this.filterMapEffect((a) => Effect.sync(() => f(a)))

  filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ) => Filtered<R | R2, E | E2, A> = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  filter = (f: (a: A) => boolean) => this.filterMap(Option.liftPredicate(f))

  skipRepeats: (eq?: Equivalence<A> | undefined) => Computed<R, E, A> = (eq = equals) =>
    Computed<R, E, A, never, never, A>(
      transformFx<R, never, R, E, A, R, E, A, R, E, A>(
        this,
        core.skipRepeatsWith(eq)
      ),
      Effect.succeed
    )

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
    return Effect.as(Ref.set(this.ref, Option.some(Fiber.succeed(a))), a)
  }

  private emitValue(a: A) {
    return Effect.suspend(() => {
      this._version++

      return this.subject.onSuccess(a)
    })
  }

  private initialize(): Effect.Effect<R, never, Fiber.Fiber<E, A>> {
    return this.initial.pipe(
      Effect.tap((a) => this.emitValue(a)),
      Effect.tapErrorCause((cause) => this.subject.onFailure(cause)),
      Effect.forkDaemon,
      Effect.tap((fiber) => Ref.set(this.ref, Option.some(fiber)))
    )
  }

  private modifyRef<R2, E2, B>(
    f: (
      fiber: Option.Option<Fiber.Fiber<E, A>>
    ) => Effect.Effect<R2, E2, readonly [B, Option.Option<Fiber.Fiber<E, A>>]>
  ) {
    return Effect.suspend(() =>
      this._lock(
        Ref.get(this.ref).pipe(
          Effect.flatMap((fiber) =>
            f(fiber).pipe(Effect.flatMap(([b, a2]) => Ref.set(this.ref, a2).pipe(Effect.as(b))))
          )
        )
      )
    )
  }
}

/**
 * Construct a RefSubject from any Fx value.

/**
 * Construct a RefSubject with a lazily initialized value.
 * @since 1.18.0
 * @category constructors
 */
export function fromEffect<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> {
  return Effect.contextWithEffect((ctx) =>
    Effect.suspend(() => {
      const ref = unsafeMake(Effect.provide(initial, ctx), makeHoldSubject<E, A>(), eq)

      return Effect.as(Effect.addFinalizer(() => ref.interrupt), ref)
    })
  )
}

/**
 * Construct a RefSubject from a synchronous value.
 * @since 1.18.0
 * @category constructors
 */
export function of<A, E = never>(
  initial: A,
  eq?: Equivalence<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, A>> {
  return fromEffect<never, E, A>(Effect.succeed(initial), eq)
}

/**
 * @since 1.18.0
 * @category constructors
 */
export function make<A, E = never>(
  iterable: Iterable<A>,
  eq?: Equivalence<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, ReadonlyArray<A>>>
export function make<R, E, A>(
  refSubject: RefSubject<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject.Derived<R, never, E, A>>
export function make<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>
export function make<R, E, A>(
  fx: FxInput<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>

export function make<R, E, A>(
  fx: FxInput<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, any>> {
  return matchFxInput(fx, {
    RefSubject: (ref) => derivedRefSubject(ref, eq),
    Fx: (fx) => fxAsRef(fx, eq),
    Effect: (effect) => fromEffect(effect, eq),
    Cause: (cause) => fromEffect(Effect.failCause(cause), eq),
    Iterable: (iterable) => fromEffect<R, E, any>(Effect.succeed(Array.from(iterable)), getEquivalence(eq || equals)),
    Otherwise: (value) => of(value, eq)
  })
}

const fxAsRef = <R, E, A>(
  fx: Fx<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> =>
  Effect.gen(function*($) {
    const deferred = new DeferredRef<E, A>(yield* $(Deferred.make<E, A>()))
    const ref = yield* $(fromEffect<never, E, A>(deferred, eq))

    const done = (exit: Exit.Exit<E, A>) =>
      Effect.flatMap(deferred.done(exit), (closed) => closed ? Effect.unit : Exit.match(exit, ref))

    yield* $(Effect.forkScoped(run(
      fx,
      Sink(
        (e) => done(Exit.failCause(e)),
        (a) => done(Exit.succeed(a))
      )
    )))

    yield* $(Effect.addFinalizer(() => ref.interrupt))

    return ref
  })

const derivedRefSubject = <R, E, A>(
  source: RefSubject<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject.Derived<R, never, E, A>> =>
  Effect.gen(function*($) {
    const deferred = new DeferredRef<E, A>(yield* $(Deferred.make<E, A>()))
    const ref = yield* $(fromEffect<never, E, A>(deferred, eq))

    const done = (exit: Exit.Exit<E, A>) =>
      Effect.flatMap(deferred.done(exit), (closed) => closed ? Effect.unit : Exit.match(exit, ref))

    yield* $(Effect.forkScoped(run(
      source,
      Sink(
        (e) => done(Exit.failCause(e)),
        (a) => done(Exit.succeed(a))
      )
    )))

    yield* $(Effect.addFinalizer(() => ref.interrupt))

    const derived: RefSubject.Derived<R, never, E, A> = Object.assign(ref, {
      persist: Effect.matchCauseEffect(ref, source)
    })

    return derived
  })

/**
 * @since 1.18.0
 * @category constructors
 */
export function makeWithExtension<R, E, A, B>(
  effect: Effect.Effect<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<never, E, A> & B>
export function makeWithExtension<R, E, A, B>(
  fx: FxInput<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A> & B>

export function makeWithExtension<R, E, A, B>(
  fx: FxInput<R, E, A>,
  f: (ref: RefSubject<never, E, A>) => B,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, any> & B> {
  return Effect.map(make(fx, eq), (ref) => Object.assign(ref, f(ref)))
}

/**
 * Construct a RefSubject with an initial value and the specified subject.
 * @since 1.18.0
 * @category constructors
 */
export function unsafeMake<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  subject: Subject.Subject<R, E, A>,
  eq: Equivalence<A> = equals
): RefSubject<R, E, A> {
  return RefSubjectImpl.make(
    initial,
    eq,
    Ref.unsafeMake<Option.Option<Fiber.Fiber<E, A>>>(Option.none()),
    subject
  )
}

const UNBOUNDED = { concurrency: "unbounded" } as const

export function tuple<const REFS extends ReadonlyArray<RefSubject.Any>>(...refs: REFS): RefSubject<
  RefSubject.Context<REFS[number]>,
  RefSubject.Error<REFS[number]>,
  { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }
> {
  type _R = RefSubject.Context<REFS[number]>
  type _E = RefSubject.Error<REFS[number]>
  type _A = { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }

  const effect = Effect.all(refs, UNBOUNDED) as Effect.Effect<
    _R,
    _E,
    _A
  >

  const fx = core.combine(refs) as Fx<_R, _E, _A>
  const sink: WithContext<_R, _E, _A> = WithContext(
    (cause) => Effect.all(refs.map((ref) => ref.onFailure(cause as any))),
    (values) => Effect.all(refs.map((ref, i) => ref.onSuccess(values[i])))
  )

  return unsafeMake(
    effect,
    {
      ...fx,
      ...sink,
      subscriberCount: Effect.map(
        Effect.all(refs.map((ref) => ref.subscriberCount)),
        (counts) => counts.reduce((a, b) => a + b, 0)
      ),
      interrupt: Effect.all(refs.map((ref) => ref.interrupt))
    }
  )
}

export function struct<const REFS extends Readonly<Record<PropertyKey, RefSubject.Any>>>(
  refs: REFS
): RefSubject<
  RefSubject.Context<REFS[string]>,
  RefSubject.Error<REFS[string]>,
  { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }
> {
  type _R = RefSubject.Context<REFS[string]>
  type _E = RefSubject.Error<REFS[string]>
  type _A = { readonly [K in keyof REFS]: RefSubject.Success<REFS[K]> }

  const effect = Effect.all(refs, UNBOUNDED) as Effect.Effect<
    _R,
    _E,
    _A
  >

  const fx = core.struct(refs) as Fx<_R, _E, _A>
  const entries = Object.entries(refs)
  const values = Object.values(refs)
  const sink: WithContext<_R, _E, _A> = WithContext(
    (cause) => Effect.all(values.map((ref) => ref.onFailure(cause as any))),
    (values) => Effect.all(entries.map(([k, ref]) => ref.onSuccess(values[k])))
  )

  return unsafeMake(
    effect,
    {
      ...fx,
      ...sink,
      subscriberCount: Effect.map(
        Effect.all(values.map((ref) => ref.subscriberCount)),
        (counts) => counts.reduce(sum, 0)
      ),
      interrupt: Effect.all(values.map((ref) => ref.interrupt))
    }
  )
}

export function fromSubscriptionRef<A>(
  subscriptionRef: SubscriptionRef.SubscriptionRef<A>
): Effect.Effect<Scope.Scope, never, RefSubject.Derived<never, never, never, A>> {
  return Effect.suspend(() => {
    const effect = SubscriptionRef.get(subscriptionRef)
    const subject = makeHoldSubject<never, A>()
    const fx = share(core.fromStream(subscriptionRef.changes), subject)
    const ref: RefSubject<never, never, A> = unsafeMake(effect, {
      ...fx,
      onSuccess: subject.onSuccess,
      onFailure: subject.onFailure,
      subscriberCount: subject.subscriberCount,
      interrupt: subject.interrupt
    })

    const derived: RefSubject.Derived<never, never, never, A> = Object.assign(ref, {
      persist: ref.updateEffect((value) => SubscriptionRef.setAndGet(subscriptionRef, value))
    })

    return Effect.as(Effect.addFinalizer(() => ref.interrupt), derived)
  })
}
