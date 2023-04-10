import type { Trace } from '@effect/data/Debug'
import { methodWithTrace } from '@effect/data/Debug'
import { equals } from '@effect/data/Equal'
import { identity, pipe } from '@effect/data/Function'
import * as RR from '@effect/data/ReadonlyRecord'
import * as Equivalence from '@effect/data/typeclass/Equivalence'

import { Fx, Sink, isFx, Traced, FxTypeId } from './Fx.js'
import type { Subject } from './Subject.js'
import { combineAll } from './combineAll.js'
import type { Context } from './externals.js'
import { Effect, Fiber, MutableRef, Option, Ref } from './externals.js'
import { hold, HoldFx } from './hold.js'
import { map } from './map.js'
import { multicast } from './multicast.js'
import { never } from './never.js'
import { switchMapEffect } from './switchMap.js'

export const RefSubjectTypeId = Symbol.for('./RefSubject')
export type RefSubjectTypeId = typeof RefSubjectTypeId

export interface RefSubject<in out E, in out A> extends Subject<E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  readonly eq: Equivalence.Equivalence<A>

  readonly get: Effect.Effect<never, E, A>

  readonly modifyEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>,
  ) => Effect.Effect<R2, E | E2, B>

  readonly modify: <B>(f: (a: A) => readonly [B, A]) => Effect.Effect<never, E, B>

  readonly updateEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, A>,
  ) => Effect.Effect<R2, E | E2, A>

  readonly update: (f: (a: A) => A) => Effect.Effect<never, E, A>

  readonly set: (a: A) => Effect.Effect<never, E, A>

  readonly delete: Effect.Effect<never, E, Option.Option<A>>

  readonly mapEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>) => Computed<R2, E | E2, B>

  readonly map: <B>(f: (a: A) => B) => Computed<never, E, B>
}

export interface Computed<R, E, A> extends Fx<R, E, A> {
  readonly get: Effect.Effect<R, E, A>

  readonly mapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ) => Computed<R | R2, E | E2, B>

  readonly map: <B>(f: (a: A) => B) => Computed<R, E, B>
}

export function makeRef<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  eq: Equivalence.Equivalence<A> = equals,
): Effect.Effect<R, never, RefSubject<E, A>> {
  return Effect.contextWith(
    (ctx: Context.Context<R>) => new RefSubjectImpl(Effect.provideContext(effect, ctx), eq),
  )
}

export namespace RefSubject {
  export type Any = RefSubject<any, any> | RefSubject<never, any>

  export function tuple<S extends ReadonlyArray<Any>>(
    ...subjects: S
  ): RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    return new TupleRefSubjectImpl(subjects)
  }

  export function struct<S extends RR.ReadonlyRecord<Any>>(
    subjects: S,
  ): RefSubject<
    Fx.ErrorsOf<S[keyof S]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    return new StructRefSubjectImpl(subjects)
  }

  export function all<S extends ReadonlyArray<Any>>(
    subjects: S,
  ): RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >

  export function all<S extends RR.ReadonlyRecord<Any>>(
    subjects: S,
  ): RefSubject<
    Fx.ErrorsOf<S[string]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >

  export function all(subjects: any): any {
    return (Array.isArray(subjects) ? tuple(...subjects) : struct(subjects)) as any
  }

  export function unsafeMake<E, A>(
    get: Effect.Effect<never, E, A>,
    eq: Equivalence.Equivalence<A> = equals,
  ): RefSubject<E, A> {
    return new RefSubjectImpl(get, eq)
  }
}

class RefSubjectImpl<E, A> extends HoldFx<never, E, A> implements RefSubject<E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
  readonly initializeFiber: Ref.Ref<Option.Option<Fiber.RuntimeFiber<E, A>>> = Ref.unsafeMake(
    Option.none(),
  )

  constructor(
    readonly initialize: Effect.Effect<never, E, A>,
    readonly eq: Equivalence.Equivalence<A>,
  ) {
    super(never<E, A>())

    this.modifyEffect = this.modifyEffect.bind(this)
  }

  run<R2>(sink: Sink<R2, E, A>) {
    return Effect.suspend(() => {
      const current = MutableRef.get(this.current)

      if (Option.isNone(current)) {
        return pipe(
          this.get,
          Effect.catchAllCause(sink.error),
          Effect.flatMap(() => super.run(sink)),
        )
      }

      return super.run(sink)
    })
  }

  readonly event: RefSubject<E, A>['event'] = methodWithTrace(
    (trace) => (a: A) => Effect.catchAllCause(this.set(a), this.error).traced(trace),
  )

  readonly end = methodWithTrace(
    (trace) => () =>
      Effect.suspend(() => (this.fiber ? Fiber.interrupt(this.fiber) : Effect.unit())).traced(
        trace,
      ),
  )

  readonly get: RefSubject<E, A>['get'] = Effect.suspend(() =>
    pipe(
      MutableRef.get(this.current),
      Option.match(
        () =>
          pipe(
            Ref.get(this.initializeFiber),
            Effect.flatMap(
              Option.match(
                () =>
                  this.lock(
                    pipe(
                      Effect.forkDaemon(this.initialize),
                      Effect.tap((fiber) => Ref.set(this.initializeFiber, Option.some(fiber))),
                      Effect.flatMap(Fiber.join),
                      Effect.tap((a) => super.event(a)),
                    ),
                  ),
                Fiber.join,
              ),
            ),
          ),
        Effect.succeed,
      ),
    ),
  )

  modifyEffect<R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) {
    return methodWithTrace(
      (trace) =>
        <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) =>
          Effect.flatMap(this.get, (a1) =>
            this.lock(
              Effect.flatMap(f(a1), ([b, a2]) =>
                Effect.suspend(() => {
                  MutableRef.set(this.current, Option.some(a2))

                  if (this.eq(a1, a2)) {
                    return Effect.succeed(b)
                  }

                  return Effect.as(super.event(a2), b)
                }),
              ),
            ),
          ).traced(trace),
    )(f)
  }

  readonly modify: RefSubject<E, A>['modify'] = (f) =>
    this.modifyEffect((a) => Effect.sync(() => f(a)))

  readonly updateEffect: RefSubject<E, A>['updateEffect'] = (f) =>
    this.modifyEffect((a) => Effect.map(f(a), (a) => [a, a]))

  readonly update: RefSubject<E, A>['update'] = (f) =>
    this.updateEffect((a) => Effect.sync(() => f(a)))

  readonly set: RefSubject<E, A>['set'] = (a) => this.update(() => a)

  readonly delete: RefSubject<E, A>['delete'] = Effect.suspend(() => {
    const current = MutableRef.get(this.current)

    if (Option.isSome(current)) {
      MutableRef.set(this.current, Option.none())

      // If there are any observers we must re-initial
      if (this.observers.length > 0) {
        return Effect.as(Effect.flatMap(this.get, this.event), current)
      }
    }

    return Effect.succeed<Option.Option<A>>(current)
  })

  readonly mapEffect: RefSubject<E, A>['mapEffect'] = <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ) => new ComputedImpl<never, E, A, R2, E2, B>(this, f)

  readonly map: RefSubject<E, A>['map'] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))
}

class TupleRefSubjectImpl<S extends ReadonlyArray<RefSubject.Any>>
  extends HoldFx<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >
  implements
    RefSubject<
      Fx.ErrorsOf<S[number]>,
      {
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }
    >
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
  readonly eq: Equivalence.Equivalence<{ readonly [K in keyof S]: Fx.OutputOf<S[K]> }>

  constructor(readonly subjects: S) {
    super(hold(combineAll(...subjects)) as any)

    this.eq = Equivalence.tuple(...subjects.map((s) => s.eq)) as Equivalence.Equivalence<{
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }>
  }

  end() {
    return Effect.all(this.subjects.map((s) => s.end()))
  }

  readonly get: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['get'] = Effect.suspend(
    () =>
      Effect.all(this.subjects.map((s) => s.get)) as Effect.Effect<
        never,
        Fx.ErrorsOf<S[number]>,
        {
          readonly [K in keyof S]: Fx.OutputOf<S[K]>
        }
      >,
  )

  modifyEffect<R2, E2, B>(
    f: (a: {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }) => Effect.Effect<R2, E2, readonly [B, { readonly [K in keyof S]: Fx.OutputOf<S[K]> }]>,
  ) {
    const { current, subjects } = this

    return pipe(
      this.get,
      Effect.flatMap((a) =>
        this.lock(
          Effect.gen(function* ($) {
            const [b, a2] = yield* $(f(a))

            MutableRef.set(current, Option.some(a2))

            yield* $(Effect.all(subjects.map((s, i) => s.set(a2[i]))))

            return b
          }),
        ),
      ),
    )
  }

  readonly modify: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['modify'] = (f) => this.modifyEffect((a) => Effect.sync(() => f(a)))

  readonly updateEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['updateEffect'] = (f) => this.modifyEffect((a) => Effect.map(f(a), (a) => [a, a]))

  readonly update: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['update'] = (f) => this.updateEffect((a) => Effect.sync(() => f(a)))

  readonly set: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['set'] = (a) => this.update(() => a)

  readonly delete: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['delete'] = Effect.suspend(() => {
    const current = MutableRef.get(this.current)

    if (Option.isSome(current)) {
      MutableRef.set(this.current, Option.none())

      // If there are any observers we must re-initial
      if (this.observers.length > 0) {
        return Effect.as(Effect.flatMap(this.get, this.event), current)
      }
    }

    return Effect.succeed<
      Option.Option<{
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }>
    >(current)
  })

  readonly mapEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['mapEffect'] = <R2, E2, B>(
    f: (a: {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }) => Effect.Effect<R2, E2, B>,
  ) =>
    new ComputedImpl<
      never,
      Fx.ErrorsOf<S[number]>,
      {
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      },
      R2,
      E2,
      B
    >(this, f)

  readonly map: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['map'] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))
}

class StructRefSubjectImpl<S extends RR.ReadonlyRecord<RefSubject.Any>>
  extends HoldFx<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >
  implements
    RefSubject<
      Fx.ErrorsOf<S[number]>,
      {
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }
    >
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
  readonly eq: Equivalence.Equivalence<{ readonly [K in keyof S]: Fx.OutputOf<S[K]> }>

  constructor(readonly subjects: S) {
    super(
      hold(
        map(
          combineAll(...Object.entries(subjects).map(([k, s]) => map(s, (x) => [k, x]))),
          Object.fromEntries,
        ),
      ) as any,
    )

    this.eq = Equivalence.struct(RR.map(subjects, (s) => s.eq)) as Equivalence.Equivalence<{
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }>
  }

  end() {
    return Effect.all(RR.map(this.subjects, (s) => s.end()))
  }

  readonly get: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['get'] = Effect.suspend(
    () =>
      Effect.all(RR.map(this.subjects, (s) => s.get)) as Effect.Effect<
        never,
        Fx.ErrorsOf<S[number]>,
        {
          readonly [K in keyof S]: Fx.OutputOf<S[K]>
        }
      >,
  )

  modifyEffect<R2, E2, B>(
    f: (a: {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }) => Effect.Effect<R2, E2, readonly [B, { readonly [K in keyof S]: Fx.OutputOf<S[K]> }]>,
  ) {
    const { current, subjects } = this

    return pipe(
      this.get,
      Effect.flatMap((a) =>
        this.lock(
          Effect.gen(function* ($) {
            const [b, a2] = yield* $(f(a))

            MutableRef.set(current, Option.some(a2))

            yield* $(Effect.all(RR.map(subjects, (s, i) => s.set(a2[i]))))

            return b
          }),
        ),
      ),
    )
  }

  readonly modify: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['modify'] = (f) => this.modifyEffect((a) => Effect.sync(() => f(a)))

  readonly updateEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['updateEffect'] = (f) => this.modifyEffect((a) => Effect.map(f(a), (a) => [a, a]))

  readonly update: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['update'] = (f) => this.updateEffect((a) => Effect.sync(() => f(a)))

  readonly set: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['set'] = (a) => this.update(() => a)

  readonly delete: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['delete'] = Effect.suspend(() => {
    const current = MutableRef.get(this.current)

    if (Option.isSome(current)) {
      MutableRef.set(this.current, Option.none())

      // If there are any observers we must re-initial
      if (this.observers.length > 0) {
        return Effect.as(Effect.flatMap(this.get, this.event), current)
      }
    }

    return Effect.succeed<
      Option.Option<{
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }>
    >(current)
  })

  readonly mapEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['mapEffect'] = <R2, E2, B>(
    f: (a: {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }) => Effect.Effect<R2, E2, B>,
  ) =>
    new ComputedImpl<
      never,
      Fx.ErrorsOf<S[number]>,
      {
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      },
      R2,
      E2,
      B
    >(this, f)

  readonly map: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['map'] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)))
}

class ComputedImpl<R, E, A, R2, E2, B> implements Computed<R | R2, E | E2, B> {
  readonly [FxTypeId] = {
    _R: identity,
    _E: identity,
    _A: identity,
  }

  readonly fx: Fx<R | R2, E | E2, B>

  constructor(
    readonly computed: Computed<R, E, A>,
    readonly f: (a: A) => Effect.Effect<R2, E2, B>,
  ) {
    // Create a stable reference to derived Fx
    this.fx = multicast(switchMapEffect(this.computed, this.f))
  }

  run<R3>(sink: Sink<R3, E | E2, B>) {
    return this.fx.run(sink)
  }

  traced(trace: Trace): Fx<R | R2, E | E2, B> {
    return Traced<R | R2, E | E2, B>(this, trace)
  }

  readonly get = Effect.flatMap(this.computed.get, this.f)

  readonly mapEffect: Computed<R | R2, E | E2, B>['mapEffect'] = <R3, E3, C>(
    f: (b: B) => Effect.Effect<R3, E3, C>,
  ): Computed<R | R2 | R3, E | E2 | E3, C> =>
    new ComputedImpl<R | R2, E | E2, B, R3, E3, C>(this, f)

  readonly map: Computed<R | R2, E | E2, B>['map'] = <C>(f: (b: B) => C) =>
    this.mapEffect((a) => Effect.sync(() => f(a)))
}

export function isRefSubject<E, A>(u: unknown): u is RefSubject<E, A> {
  return isFx<never, E, A>(u) && RefSubjectTypeId in u && u[RefSubjectTypeId] === RefSubjectTypeId
}
