import { dualWithTrace } from '@effect/data/Debug'
import { equals } from '@effect/data/Equal'
import type * as RA from '@effect/data/ReadonlyArray'
import * as RR from '@effect/data/ReadonlyRecord'
import * as Equivalence from '@effect/data/typeclass/Equivalence'
import type { RuntimeFiber } from '@effect/io/Fiber'

import { isFx } from '../BaseFx.js'

import type { Fx, Sink } from '@typed/fx/internal/Fx'
import { Mutable } from '@typed/fx/internal/Mutable'
import { Effect, Fiber, Option, pipe } from '@typed/fx/internal/externals'
import type { Context, Scope } from '@typed/fx/internal/externals'
import type { HoldSubject } from '@typed/fx/internal/subject/HoldSubject'
import { HoldSubjectImpl } from '@typed/fx/internal/subject/HoldSubject'

/**
 * A RefSubject is a lazily-instantiated Reference to a value. It also
 * implements
 */
export interface RefSubject<in out E, in out A> extends HoldSubject<E, A> {
  readonly [RefSubject.TypeId]: RefSubject.TypeId

  readonly eq: Equivalence.Equivalence<A>

  // Ref methods

  /**
   * Get the current value of the Ref. The value will be initialized if it hasn't
   * been already.
   */
  readonly get: Effect.Effect<never, E, A>

  /**
   * Set the current value of the Ref. Cannot fail because no value needs
   * to be initialized.
   */
  readonly set: (a: A) => Effect.Effect<never, never, A>

  /**
   * Modify the current value of the Ref with the specified effectful function.
   * The current value will be initialized if it hasn't been already.
   */
  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>,
  ) => Effect.Effect<R2, E | E2, B>

  /**
   * Modify the current value of the Ref with the specified function. The current
   * value will be initialized if it hasn't been already.
   */
  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, E, B>

  /**
   * Update the current value of the Ref with the specified effectful function.
   * The current value will be initialized if it hasn't been already.
   */
  readonly updateEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, A>,
  ) => Effect.Effect<R2, E | E2, A>

  /**
   * Update the current value of the Ref with the specified function. The current
   * value will be initialized if it hasn't been already.
   */
  readonly update: (f: (a: A) => A) => Effect.Effect<never, E, A>

  /**
   * Delete the current value of the Ref. Option.none() will be returned if the
   * has not been initialized yet. Option.some(a) will be returned if the Ref
   * has been initialized previously.
   */
  readonly delete: Effect.Effect<never, never, Option.Option<A>>

  // Computed methods

  /**
   * Compute a value from the current value of the Ref with an Effect.
   */
  readonly mapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
    eq?: Equivalence.Equivalence<B>,
  ) => Effect.Effect<R2 | Scope.Scope, never, Computed<E | E2, B>>

  /**
   * Compute a value from the current value of the Ref.
   */
  readonly map: <B>(
    f: (a: A) => B,
    eq?: Equivalence.Equivalence<B>,
  ) => Effect.Effect<Scope.Scope, never, Computed<E, B>>
}

export function makeRef<R, E, A>(
  initialize: Effect.Effect<R, E, A>,
  eq: Equivalence.Equivalence<A> = equals,
): Effect.Effect<R, never, RefSubject<E, A>> {
  return Effect.contextWith((ctx: Context.Context<R>) =>
    RefSubject.unsafeMake(Effect.provideContext(initialize, ctx), eq),
  )
}

export function makeScopedRef<R, E, A>(
  initialize: Effect.Effect<R, E, A>,
  eq: Equivalence.Equivalence<A> = equals,
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> {
  return Effect.gen(function* ($) {
    const subject = yield* $(makeRef(initialize, eq))

    yield* $(Effect.addFinalizer(subject.end))

    return subject
  })
}

export namespace RefSubject {
  export const TypeId = Symbol.for('@typed/fx/RefSubject')
  export type TypeId = typeof TypeId

  export type Any =
    | RefSubject<any, any>
    | RefSubject<never, any>
    | Computed<any, any>
    | Computed<never, any>

  export function unsafeMake<E, A>(
    initialize: Effect.Effect<never, E, A>,
    eq: Equivalence.Equivalence<A> = equals,
  ): RefSubject<E, A> {
    return new RefSubjectImpl<E, A>(initialize, eq, Mutable(Option.none<A>()))
  }

  export function all<const P extends RA.NonEmptyReadonlyArray<Any>>(
    properties: P,
  ): RefSubject<Fx.ErrorsOf<P[number]>, { readonly [K in keyof P]: Fx.OutputOf<P[K]> }>

  export function all<const P extends Readonly<Record<string, Any>>>(
    properties: P,
  ): RefSubject<Fx.ErrorsOf<P[string]>, { readonly [K in keyof P]: Fx.OutputOf<P[K]> }>

  export function all<
    const P extends Readonly<Record<string, Any>> | RA.NonEmptyReadonlyArray<Any>,
  >(properties: P) {
    return Array.isArray(properties) ? tuple(...(properties as any)) : struct(properties as any)
  }

  export function struct<P extends Readonly<Record<string, Any>>>(
    properties: P,
  ): RefSubject<Fx.ErrorsOf<P[string]>, { readonly [K in keyof P]: Fx.OutputOf<P[K]> }> {
    return new StructRefSubject(properties)
  }

  export function tuple<P extends RA.NonEmptyReadonlyArray<Any>>(
    ...properties: P
  ): RefSubject<Fx.ErrorsOf<P[number]>, { readonly [K in keyof P]: Fx.OutputOf<P[K]> }> {
    return new TupleRefSubject(properties)
  }

  class RefSubjectImpl<E, A>
    extends HoldSubjectImpl<E, A, 'RefSubject'>
    implements RefSubject<E, A>
  {
    readonly [TypeId]: TypeId = TypeId

    // Ensure all modifications happen in FIFO order
    protected lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
    // Ensure only one fiber is initializing the value
    protected initFiber = Mutable<RuntimeFiber<E, A> | null>(null)

    constructor(
      readonly initialize: Effect.Effect<never, E, A>,
      readonly eq: Equivalence.Equivalence<A>,
      readonly current: Mutable<Option.Option<A>>,
    ) {
      super(current, 'RefSubject')

      this.event = this.event.bind(this)
      this.error = this.error.bind(this)
      this.end = this.end.bind(this)
      this.set = this.set.bind(this)
      this.mapEffect = this.mapEffect.bind(this)
      this.map = this.map.bind(this)
    }

    run(sink: Sink<E, A>) {
      return pipe(
        // Ensure Ref is initialized
        Effect.catchAllCause(this.get, sink.error),
        Effect.zipRight(super.run(sink)),
      )
    }

    event(a: A) {
      return this.set(a)
    }

    readonly get: Effect.Effect<never, E, A> = Effect.suspend(() => {
      const current = this.current.get()

      if (Option.isSome(current)) {
        return Effect.succeed(current.value)
      }

      const fiberOrNull = this.initFiber.get()

      if (fiberOrNull) {
        return Fiber.join<E, A>(fiberOrNull)
      }

      return this.lock(
        Effect.flatMap(Effect.fork(this.initialize), (actualFiber) => {
          this.initFiber.set(actualFiber)

          return pipe(
            Fiber.join(actualFiber),
            Effect.ensuring(Effect.sync(() => this.initFiber.set(null))),
            Effect.tap((a) => Effect.sync(() => this.current.set(Option.some(a)))),
          )
        }),
      )
    })

    modifyEffect<R2, E2, B>(
      f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>,
    ): Effect.Effect<R2, E | E2, B> {
      return Effect.flatMap(this.get, (currentValue) =>
        this.lock(Effect.flatMap(f(currentValue), ([b, a]) => Effect.as(this.setAndSend(a), b))),
      )
    }

    modify<B>(f: (a: A) => readonly [B, A]): Effect.Effect<never, E, B> {
      return this.modifyEffect((a) => Effect.sync(() => f(a)))
    }

    set(a: A): Effect.Effect<never, never, A> {
      return this.lock(Effect.flatMap(this.setValue(a), (a) => Effect.as(super.event(a), a)))
    }

    updateEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, A>): Effect.Effect<R2, E | E2, A> {
      return this.modifyEffect((a) => Effect.map(f(a), (a) => [a, a]))
    }

    update(f: (a: A) => A): Effect.Effect<never, E, A> {
      return this.updateEffect((a) => Effect.sync(() => f(a)))
    }

    get delete() {
      return this.lock(
        Effect.sync(() => {
          const option = this.current.get()

          this.current.set(Option.none<A>())

          return option
        }),
      )
    }

    mapEffect<R2, E2, B>(
      f: (a: A) => Effect.Effect<R2, E2, B>,
      eq?: Equivalence.Equivalence<B>,
    ): Effect.Effect<R2 | Scope.Scope, never, Computed<E | E2, B>> {
      return makeComputed(this, f, eq)
    }

    map<B>(
      f: (a: A) => B,
      eq?: Equivalence.Equivalence<B>,
    ): Effect.Effect<Scope.Scope, never, Computed<E, B>> {
      return this.mapEffect((a) => Effect.sync(() => f(a)), eq)
    }

    protected setValue(a: A): Effect.Effect<never, never, A> {
      return Effect.sync(() => {
        const current = this.current.get()

        if (Option.isSome(current) && this.eq(current.value, a)) {
          return current.value
        }

        this.current.set(Option.some(a))

        return a
      })
    }

    protected setAndSend(a: A) {
      return Effect.flatMap(this.setValue(a), (a) => Effect.as(super.event(a), a))
    }
  }

  type TupleErrors<Members extends ReadonlyArray<Any>> = Fx.ErrorsOf<Members[number]>
  type TupleOutput<Members extends ReadonlyArray<Any>> = {
    readonly [_ in keyof Members]: Fx.OutputOf<Members[_]>
  }

  class TupleRefSubject<Members extends ReadonlyArray<Any>>
    extends RefSubjectImpl<TupleErrors<Members>, TupleOutput<Members>>
    implements RefSubject<TupleErrors<Members>, TupleOutput<Members>>
  {
    constructor(readonly members: Members) {
      const current: Mutable<Option.Option<TupleOutput<Members>>> = {
        get: () =>
          Option.all(members.map((m) => m.current.get())) as Option.Option<TupleOutput<Members>>,
        set: (a) =>
          pipe(
            a,
            Option.match(
              () => {
                members.forEach((m) => m.current.set(Option.none()))
                return Option.none()
              },
              (a) => Option.all(a.map((a, i) => members[i].current.set(Option.some(a)))),
            ),
          ) as Option.Option<TupleOutput<Members>>,
      }

      super(
        Effect.allPar(members.map((m) => m.get)) as Effect.Effect<
          never,
          TupleErrors<Members>,
          TupleOutput<Members>
        >,
        Equivalence.tuple(...members.map((m) => m.eq)) as Equivalence.Equivalence<
          TupleOutput<Members>
        >,
        current,
      )
    }
  }

  type StructErrors<Members extends Readonly<Record<string, Any>>> = Fx.ErrorsOf<Members[string]>
  type StructOutput<Members extends Readonly<Record<string, Any>>> = {
    readonly [_ in keyof Members]: Fx.OutputOf<Members[_]>
  }

  class StructRefSubject<Members extends Readonly<Record<string, Any>>>
    extends RefSubjectImpl<StructErrors<Members>, StructOutput<Members>>
    implements RefSubject<StructErrors<Members>, StructOutput<Members>>
  {
    constructor(readonly members: Members) {
      const keys = Object.keys(members) as ReadonlyArray<keyof Members>

      const current: Mutable<Option.Option<StructOutput<Members>>> = {
        get: () =>
          Option.struct(RR.map(members, (m) => m.current.get())) as Option.Option<
            StructOutput<Members>
          >,
        set: (a) =>
          pipe(
            a,
            Option.match(
              () => {
                keys.forEach((k) => members[k].current.set(Option.none()))
                return Option.none()
              },
              (a) => Option.struct(RR.map(a, (a, i) => members[i].current.set(Option.some(a)))),
            ),
          ) as Option.Option<StructOutput<Members>>,
      }

      super(
        Effect.allPar(RR.map(members, (m) => m.get)) as Effect.Effect<
          never,
          StructErrors<Members>,
          StructOutput<Members>
        >,
        Equivalence.struct(RR.map(members, (m) => m.eq)) as Equivalence.Equivalence<
          StructOutput<Members>
        >,
        current,
      )
    }
  }
}

/**
 * A Computed is a readonly view of a current value that is computed from
 * the current value of a RefSubject.
 */
export interface Computed<E, A> extends Fx<never, E, A> {
  /**
   * The current value of the Computed.
   */
  readonly get: Effect.Effect<never, E, A>

  /**
   * Compute a new value from the current value of the Computed with an Effect.
   */
  readonly mapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ) => Effect.Effect<R2 | Scope.Scope, never, Computed<E | E2, B>>

  /**
   * Compute a new value from the current value of the Computed.
   */
  readonly map: <B>(f: (a: A) => B) => Effect.Effect<Scope.Scope, never, Computed<E, B>>

  /**
   * @internal
   */
  readonly current: Mutable<Option.Option<A>>

  /**
   * @internal
   */
  readonly eq: Equivalence.Equivalence<A>
}

export const makeComputed: {
  <E, A, R2, E2, B>(
    ref: RefSubject<E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>,
    eq?: Equivalence.Equivalence<B>,
  ): Effect.Effect<R2 | Scope.Scope, never, Computed<E | E2, B>>

  <A, R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>, eq?: Equivalence.Equivalence<B>): <E>(
    ref: RefSubject<E, A>,
  ) => Effect.Effect<R2 | Scope.Scope, never, Computed<E | E2, B>>
} = dualWithTrace(
  3,
  (trace) =>
    function makeComputed<E, A, R2, E2, B>(
      ref: RefSubject<E, A>,
      f: (a: A) => Effect.Effect<R2, E2, B>,
      eq?: Equivalence.Equivalence<B>,
    ): Effect.Effect<R2 | Scope.Scope, never, Computed<E | E2, B>> {
      return Effect.gen(function* ($) {
        const computed = yield* $(makeRef(Effect.flatMap(ref.get, f), eq))

        yield* $(
          Effect.forkScoped(
            Effect.matchCauseEffect(
              ref.observe((a) => computed.updateEffect(() => f(a))),
              computed.error,
              computed.end,
            ),
          ),
        )

        return computed
      }).traced(trace)
    },
)

export function isRefSubject<E, A>(u: unknown): u is RefSubject<E, A> {
  return isFx(u) && RefSubject.TypeId in u
}
