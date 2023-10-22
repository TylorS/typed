import { Computed } from "@typed/fx/Computed"
import { Filtered } from "@typed/fx/Filtered"
import type { Fx, FxInput } from "@typed/fx/Fx"
import * as core from "@typed/fx/internal/core"
import { makeHoldSubject } from "@typed/fx/internal/core-subject"
import { DeferredRef } from "@typed/fx/internal/deferred-ref"
import { fromFxEffect } from "@typed/fx/internal/fx"
import { FxEffectProto } from "@typed/fx/internal/fx-effect-proto"
import { matchFxInput } from "@typed/fx/internal/matchers"
import type { ModuleAgumentedEffectKeysToOmit } from "@typed/fx/internal/protos"
import { run } from "@typed/fx/internal/run"
import { type RefSubject } from "@typed/fx/RefSubject"
import { Sink, WithContext } from "@typed/fx/Sink"
import type * as Subject from "@typed/fx/Subject"
import { RefSubjectTypeId } from "@typed/fx/TypeId"
import type { Cause } from "effect/Cause"
import * as Deferred from "effect/Deferred"
import * as Effect from "effect/Effect"
import { equals } from "effect/Equal"
import type { Equivalence } from "effect/Equivalence"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import * as Option from "effect/Option"
import { getEquivalence } from "effect/ReadonlyArray"
import type * as Scope from "effect/Scope"
import * as SynchronizedRef from "effect/SynchronizedRef"

export class RefSubjectImpl<R, E, A> extends FxEffectProto<R, E, A, R, E, A>
  implements Omit<RefSubject<R, E, A>, ModuleAgumentedEffectKeysToOmit>
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  private _version = 0

  constructor(
    readonly initial: Effect.Effect<R, E, A>,
    readonly eq: Equivalence<A>,
    readonly ref: SynchronizedRef.SynchronizedRef<Option.Option<Fiber.Fiber<E, A>>>,
    readonly subject: Subject.Subject<R, E, A>
  ) {
    super()

    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)
  }

  static make<R, E, A>(
    initial: Effect.Effect<R, E, A>,
    eq: Equivalence<A>,
    ref: SynchronizedRef.SynchronizedRef<Option.Option<Fiber.Fiber<E, A>>>,
    subject: Subject.Subject<R, E, A>
  ): RefSubject<R, E, A> {
    return new RefSubjectImpl(initial, eq, ref, subject) as any
  }

  onSuccess(a: A): Effect.Effect<R, never, unknown> {
    return this.set(a)
  }

  onFailure(cause: Cause<E>): Effect.Effect<R, never, unknown> {
    return Effect.tap(
      SynchronizedRef.set(this.ref, Option.some(Fiber.failCause(cause))),
      () => this.subject.onFailure(cause)
    )
  }

  readonly version = Effect.sync((): number => this._version)

  readonly subscriberCount: Effect.Effect<R, never, number> = this.subject.subscriberCount

  readonly interrupt = Effect.suspend(() =>
    Effect.all([
      this.subject.interrupt,
      SynchronizedRef.get(this.ref).pipe(Effect.flatten, Effect.flatMap(Fiber.interrupt), Effect.optionFromOptional)
    ])
  )

  toFx(): Fx<R, E, A> {
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

  readonly get = (
    Effect.fromFiberEffect(
      SynchronizedRef.modifyEffect(
        this.ref,
        (fiber) => Effect.map(this.getOrInitialize(fiber), (f) => [f, Option.some(f)] as const)
      )
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

  readonly delete: Effect.Effect<R, never, Option.Option<A>> = SynchronizedRef.modifyEffect(this.ref, (fiber) => {
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
    this._version++

    return this.subject.onSuccess(a)
  }

  private initialize(): Effect.Effect<R, never, Fiber.Fiber<E, A>> {
    return this.initial.pipe(
      Effect.tap((a) => this.emitValue(a)),
      Effect.tapErrorCause((cause) => this.subject.onFailure(cause)),
      Effect.forkDaemon
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
): Effect.Effect<R, never, RefSubject<never, E, A>> {
  return Effect.contextWith((ctx) => unsafeMake(Effect.provide(initial, ctx), makeHoldSubject<E, A>(), eq))
}

/**
 * Construct a RefSubject from a synchronous value.
 * @since 1.18.0
 * @category constructors
 */
export function of<A, E = never>(
  initial: A,
  eq?: Equivalence<A>
): Effect.Effect<never, never, RefSubject<never, E, A>> {
  return fromEffect<never, E, A>(Effect.succeed(initial), eq)
}

/**
 * @since 1.18.0
 * @category constructors
 */
export function make<A, E = never>(
  iterable: Iterable<A>,
  eq?: Equivalence<A>
): Effect.Effect<never, never, RefSubject<never, E, ReadonlyArray<A>>>
export function make<R, E, A>(
  refSubject: RefSubject<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject.Derived<R, never, E, A>>
export function make<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R, never, RefSubject<never, E, A>>
export function make<R, E, A>(
  fx: FxInput<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>

export function make<R, E, A>(
  fx: FxInput<R, E, A>,
  eq?: Equivalence<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, any>> {
  return matchFxInput(fx, {
    RefSubject: (ref) => derivedRefSubject(ref, eq), // TODO: Expand
    Fx: (fx) => fxAsRef(fx, eq),
    Stream: (stream) => fxAsRef(core.fromStream(stream), eq),
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

    const derived: RefSubject.Derived<R, never, E, A> = Object.assign(ref, {
      commit: Effect.matchCauseEffect(ref, source)
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
    SynchronizedRef.unsafeMake<Option.Option<Fiber.Fiber<E, A>>>(Option.none()),
    subject
  )
}

const UNBOUNDED = { concurrency: "unbounded" } as const

export function tuple<const REFS extends ReadonlyArray<RefSubject<any, any, any>>>(...refs: REFS): RefSubject<
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
    (cause) => Effect.all(refs.map((ref) => ref.onFailure(cause)), UNBOUNDED),
    (values) => Effect.all(refs.map((ref, i) => ref.onSuccess(values[i])), UNBOUNDED)
  )

  return unsafeMake(
    effect,
    {
      ...fx,
      ...sink,
      subscriberCount: Effect.map(
        Effect.all(refs.map((ref) => ref.subscriberCount), UNBOUNDED),
        (counts) => counts.reduce((a, b) => a + b, 0)
      ),
      interrupt: Effect.all(refs.map((ref) => ref.interrupt), UNBOUNDED)
    }
  )
}

export function struct<const REFS extends Readonly<Record<PropertyKey, RefSubject<any, any, any>>>>(
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
    (cause) => Effect.all(values.map((ref) => ref.onFailure(cause)), UNBOUNDED),
    (values) => Effect.all(entries.map(([k, ref]) => ref.onSuccess(values[k])), UNBOUNDED)
  )

  return unsafeMake(
    effect,
    {
      ...fx,
      ...sink,
      subscriberCount: Effect.map(
        Effect.all(values.map((ref) => ref.subscriberCount), UNBOUNDED),
        (counts) => counts.reduce((a, b) => a + b, 0)
      ),
      interrupt: Effect.all(values.map((ref) => ref.interrupt), UNBOUNDED)
    }
  )
}
