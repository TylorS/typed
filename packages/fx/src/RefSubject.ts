import type { Trace } from '@effect/data/Debug'
import { methodWithTrace } from '@effect/data/Debug'
import { equals } from '@effect/data/Equal'
import * as Equal from '@effect/data/Equal'
import { identity, pipe } from '@effect/data/Function'
import * as Hash from '@effect/data/Hash'
import * as MutableRef from '@effect/data/MutableRef'
import * as Option from '@effect/data/Option'
import * as RR from '@effect/data/ReadonlyRecord'
import * as Equivalence from '@effect/data/typeclass/Equivalence'
import * as Cause from '@effect/io/Cause'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import { ChannelTypeId } from '@effect/stream/Channel'
import { SinkTypeId } from '@effect/stream/Sink'
import { StreamTypeId } from '@effect/stream/Stream'

import { Fx, Sink, isFx, FxTypeId } from './Fx.js'
import type { Subject } from './Subject.js'
import { combineAll } from './combineAll.js'
import { compact } from './filterMap.js'
import { HoldFx } from './hold.js'
import { map } from './map.js'
import { multicast } from './multicast.js'
import { never } from './never.js'
import { switchMapEffect } from './switchMap.js'

export const RefSubjectTypeId = Symbol.for('./RefSubject')
export type RefSubjectTypeId = typeof RefSubjectTypeId

export interface RefSubject<in out E, in out A> extends Subject<E, A>, Computed<never, E, A> {
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

  readonly addTrace: (trace: Trace) => RefSubject<E, A>
}

export interface Computed<R, E, A>
  extends Fx<R, E, A>,
    Effect.Effect<R, E | Cause.NoSuchElementException, A> {
  readonly get: Effect.Effect<R, E | Cause.NoSuchElementException, A>

  readonly mapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ) => Computed<R | R2, E | E2, B>

  readonly map: <B>(f: (a: A) => B) => Computed<R, E, B>

  readonly filterMapEffect: <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) => Computed<R | R2, E | E2, B>

  readonly filterMap: <B>(f: (a: A) => Option.Option<B>) => Computed<R, E, B>

  readonly filterEffect: <R2, E2>(
    f: (a: A) => Effect.Effect<R2, E2, boolean>,
  ) => Computed<R | R2, E | E2, A>

  readonly filter: (f: (a: A) => boolean) => Computed<R, E, A>

  readonly addTrace: (trace: Trace) => Computed<R, E, A>
}

export function makeRef<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  eq: Equivalence.Equivalence<A> = equals,
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> {
  return Effect.gen(function* (_) {
    const context = yield* _(Effect.context<R>())
    const ref = RefSubject.unsafeMake(Effect.provideContext(effect, context), eq)

    // Ensure underlying Fiber is interrupted when scope closes
    yield* _(Effect.addFinalizer(() => ref.end()))

    return ref
  })
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
    //
    return new TupleRefSubjectImpl(subjects) as unknown as RefSubject<
      Fx.ErrorsOf<S[number]>,
      {
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }
    >
  }

  export function struct<S extends RR.ReadonlyRecord<Any>>(
    subjects: S,
  ): RefSubject<
    Fx.ErrorsOf<S[keyof S]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    //
    return new StructRefSubjectImpl(subjects) as unknown as RefSubject<
      Fx.ErrorsOf<S[keyof S]>,
      {
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }
    >
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
    //
    return new RefSubjectImpl(get, eq) as unknown as RefSubject<E, A>
  }
}

const refSubjectVariant = {
  _R: identity,
  _E: identity,
  _A: identity,
}

//
class RefSubjectImpl<E, A> extends HoldFx<never, E, A> implements RefSubject<E, A> {
  readonly _tag = 'Commit'
  public i2: any = undefined
  public trace: Trace = undefined;

  readonly [Effect.EffectTypeId] = refSubjectVariant;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  /* I Don't really want this to be here */
  readonly [SinkTypeId] = refSubjectVariant as any;
  readonly [ChannelTypeId] = refSubjectVariant as any;
  readonly [StreamTypeId] = refSubjectVariant

  readonly lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
  readonly initializeFiber: MutableRef.MutableRef<Option.Option<Fiber.RuntimeFiber<E, A>>> =
    MutableRef.make(Option.none())

  readonly eq: Equivalence.Equivalence<A>

  constructor(readonly i0: Effect.Effect<never, E, A>, readonly i1: Equivalence.Equivalence<A>) {
    super(never<E, A>())

    this.modifyEffect = this.modifyEffect.bind(this)
    this.eq = i1
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

  readonly addTrace = (trace: Trace): RefSubject<E, A> => {
    if (trace) {
      //
      return new TracedRefSubjectImpl(this, trace)
    }
    //
    return this
  }

  readonly event: RefSubject<E, A>['event'] = methodWithTrace(
    (trace) => (a: A) => Effect.catchAllCause(this.set(a), this.error).traced(trace),
  )

  readonly end = methodWithTrace(
    (trace) => () =>
      Effect.suspend(() =>
        Effect.zipPar(this.interruptFibers(), this.interruptInitializeFiber()),
      ).traced(trace),
  )

  protected interruptFibers() {
    return this.fiber ? Fiber.interrupt(this.fiber) : Effect.unit()
  }

  protected interruptInitializeFiber() {
    const fiber = MutableRef.get(this.initializeFiber)
    if (Option.isSome(fiber)) {
      return Fiber.interrupt(fiber.value)
    }

    return Effect.unit()
  }

  readonly get: RefSubject<E, A>['get'] = Effect.suspend(() =>
    pipe(
      MutableRef.get(this.current),
      Option.match(
        () =>
          pipe(
            MutableRef.get(this.initializeFiber),
            Option.match(
              () =>
                this.lock(
                  Effect.uninterruptibleMask((restore) =>
                    pipe(
                      Effect.forkDaemon(restore(this.i0)),
                      Effect.tap((fiber) =>
                        Effect.sync(() => MutableRef.set(this.initializeFiber, Option.some(fiber))),
                      ),
                      Effect.flatMap(Fiber.join),
                      Effect.tap((a) =>
                        Effect.suspend(() => {
                          MutableRef.set(this.current, Option.some(a))
                          MutableRef.set(this.initializeFiber, Option.none())

                          return super.event(a)
                        }),
                      ),
                    ),
                  ),
                ),
              Fiber.join,
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

                  if (this.i1(a1, a2)) {
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
    }

    return Effect.succeed<Option.Option<A>>(current)
  })

  readonly filterMapEffect: RefSubject<E, A>['filterMapEffect'] = <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) => new ComputedImpl(this as unknown as RefSubject<E, A>, f)

  readonly filterMap: RefSubject<E, A>['filterMap'] = (f) =>
    this.filterMapEffect((a) => Effect.sync(() => f(a)))

  readonly filterEffect: RefSubject<E, A>['filterEffect'] = <R2, E2>(
    predicate: (a: A) => Effect.Effect<R2, E2, boolean>,
  ) =>
    this.filterMapEffect((a) =>
      Effect.map(predicate(a), (b) => (b ? Option.some(a) : Option.none())),
    )

  readonly filter: RefSubject<E, A>['filter'] = (predicate) =>
    this.filterEffect((a) => Effect.sync(() => predicate(a)))

  readonly mapEffect: RefSubject<E, A>['mapEffect'] = <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ) => this.filterMapEffect((a) => Effect.map(f(a), Option.some))

  readonly map: RefSubject<E, A>['map'] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)));

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  traced(trace: Trace): Effect.Effect<never, E, A> {
    if (trace) {
      const traced = new RefSubjectImpl(this.i0, this.i1)
      traced.trace = trace
      return traced as any
    }

    return this as any
  }

  commit(): Effect.Effect<never, E, A> {
    return this.get.traced(this.trace)
  }
}

//
class TracedRefSubjectImpl<E, A> implements RefSubject<E, A> {
  readonly _tag = 'Commit'
  public i2: any = undefined
  public trace: Trace = undefined;

  readonly [Effect.EffectTypeId] = refSubjectVariant;
  readonly [FxTypeId] = refSubjectVariant;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId
  readonly eq: Equivalence.Equivalence<A>;

  /* I Don't really want this to be here */
  readonly [SinkTypeId] = refSubjectVariant as any;
  readonly [ChannelTypeId] = refSubjectVariant as any;
  readonly [StreamTypeId] = refSubjectVariant

  constructor(readonly i0: RefSubject<E, A>, readonly i1: Trace) {
    this.eq = i0.eq
  }

  run<R2>(sink: Sink<R2, E, A>) {
    return this.i0.run(sink).traced(this.i1)
  }

  readonly event: RefSubject<E, A>['event'] = (f) => this.i0.event(f).traced(this.i1)

  readonly error: RefSubject<E, A>['error'] = (e) => this.i0.error(e).traced(this.i1)

  readonly end = () => this.i0.end().traced(this.i1)

  readonly get = this.i0.get.traced(this.i1)

  readonly modifyEffect: RefSubject<E, A>['modifyEffect'] = (f) =>
    this.i0.modifyEffect(f).traced(this.i1)

  readonly modify: RefSubject<E, A>['modify'] = (f) => this.i0.modify(f).traced(this.i1)

  readonly updateEffect: RefSubject<E, A>['updateEffect'] = (f) =>
    this.i0.updateEffect(f).traced(this.i1)

  readonly update: RefSubject<E, A>['update'] = (f) => this.i0.update(f).traced(this.i1)

  readonly set: RefSubject<E, A>['set'] = (a) => this.i0.set(a).traced(this.i1)

  readonly delete: RefSubject<E, A>['delete'] = this.i0.delete.traced(this.i1)

  readonly filterMapEffect: RefSubject<E, A>['filterMapEffect'] = (f) =>
    this.i0.filterMapEffect(f).addTrace(this.i1)

  readonly filterMap: RefSubject<E, A>['filterMap'] = (f) => this.i0.filterMap(f).addTrace(this.i1)

  readonly filterEffect: RefSubject<E, A>['filterEffect'] = (f) =>
    this.i0.filterEffect(f).addTrace(this.i1)

  readonly filter: RefSubject<E, A>['filter'] = (f) => this.i0.filter(f).addTrace(this.i1)

  readonly mapEffect: RefSubject<E, A>['mapEffect'] = (f) => this.i0.mapEffect(f).addTrace(this.i1)

  readonly map: RefSubject<E, A>['map'] = (f) => this.i0.map(f).addTrace(this.i1);

  [Equal.symbol] = this.i0[Equal.symbol];
  [Hash.symbol] = this.i0[Hash.symbol]

  //
  readonly addTrace: (trace: Trace) => RefSubject<E, A> = (trace) => {
    if (trace) {
      //
      return new TracedRefSubjectImpl(this, trace)
    }

    return this
  }

  traced(trace: Trace): Effect.Effect<never, E, A> {
    if (trace) {
      //
      return new TracedRefSubjectImpl(this, trace) as any
    }

    return this as any
  }

  commit(): Effect.Effect<never, E, A> {
    return this.get
  }
}

//
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
  readonly _tag = 'Commit'
  public trace: Trace = undefined;

  readonly [Effect.EffectTypeId] = refSubjectVariant;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  /* I Don't really want this to be here */
  readonly [SinkTypeId] = refSubjectVariant as any;
  readonly [ChannelTypeId] = refSubjectVariant as any;
  readonly [StreamTypeId] = refSubjectVariant

  readonly i1: Equivalence.Equivalence<{
    readonly [K in keyof S]: Fx.OutputOf<S[K]>
  }>
  public i2: any = undefined

  readonly lock = Effect.unsafeMakeSemaphore(1).withPermits(1)

  readonly eq: Equivalence.Equivalence<{
    readonly [K in keyof S]: Fx.OutputOf<S[K]>
  }>

  constructor(readonly i0: S) {
    super(combineAll(...i0) as any)

    this.eq = this.i1 = Equivalence.tuple(...i0.map((s) => s.eq))
  }

  end() {
    return Effect.allPar(this.i0.map((s) => s.end()))
  }

  readonly get: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['get'] = Effect.suspend(
    () =>
      Effect.allPar(this.i0.map((s) => s.get)) as Effect.Effect<
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
    const { current, i0 } = this

    return pipe(
      this.get,
      Effect.flatMap((a) =>
        this.lock(
          Effect.gen(function* ($) {
            const [b, a2] = yield* $(f(a))

            MutableRef.set(current, Option.some(a2))

            yield* $(Effect.allPar(i0.map((s, i) => s.set(a2[i]))))

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
    }

    return Effect.succeed<
      Option.Option<{
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }>
    >(current)
  })

  //
  readonly filterMapEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filterMapEffect'] = (f) => new ComputedImpl(this, f) as any

  readonly filterMap: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filterMap'] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  readonly filterEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filterEffect'] = (predicate) =>
    this.filterMapEffect((a) =>
      Effect.map(predicate(a), (b) => (b ? Option.some(a) : Option.none())),
    )

  readonly filter: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filter'] = (predicate) => this.filterEffect((a) => Effect.sync(() => predicate(a)))

  readonly mapEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['mapEffect'] = (f) => this.filterMapEffect((a) => Effect.map(f(a), Option.some))

  readonly map: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['map'] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)));

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  readonly addTrace = (
    trace: Trace,
  ): RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > => {
    if (trace) {
      //
      return new TracedRefSubjectImpl(this, trace)
    }

    //
    return this
  }

  traced(trace: Trace): Effect.Effect<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    if (trace) {
      const traced = new TupleRefSubjectImpl(this.i0)
      traced.trace = trace
      return traced as any
    }

    return this as any
  }

  commit(): Effect.Effect<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    return this.get.traced(this.trace)
  }
}

//
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
  readonly _tag = 'Commit'
  public trace: Trace = undefined;

  readonly [Effect.EffectTypeId] = refSubjectVariant;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;

  /* I Don't really want this to be here */
  readonly [SinkTypeId] = refSubjectVariant as any;
  readonly [ChannelTypeId] = refSubjectVariant as any;
  readonly [StreamTypeId] = refSubjectVariant

  readonly i1: Equivalence.Equivalence<{ readonly [K in keyof S]: Fx.OutputOf<S[K]> }>
  public i2: any = undefined

  readonly lock = Effect.unsafeMakeSemaphore(1).withPermits(1)

  readonly eq: Equivalence.Equivalence<{ readonly [K in keyof S]: Fx.OutputOf<S[K]> }>

  constructor(readonly i0: S) {
    super(
      map(
        combineAll(...Object.entries(i0).map(([k, s]) => map(s, (x) => [k, x]))),
        Object.fromEntries,
      ) as any,
    )

    this.i1 = this.eq = Equivalence.struct(RR.map(i0, (s) => s.eq)) as Equivalence.Equivalence<{
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }>
  }

  end() {
    return Effect.allPar(RR.map(this.i0, (s) => s.end()))
  }

  readonly get: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['get'] = Effect.suspend(
    () =>
      Effect.allPar(RR.map(this.i0, (s) => s.get)) as Effect.Effect<
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
    const { current, i0: subjects } = this

    return pipe(
      this.get,
      Effect.flatMap((a) =>
        this.lock(
          Effect.gen(function* ($) {
            const [b, a2] = yield* $(f(a))

            MutableRef.set(current, Option.some(a2))

            yield* $(Effect.allPar(RR.map(subjects, (s, i) => s.set(a2[i]))))

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
    }

    return Effect.succeed<
      Option.Option<{
        readonly [K in keyof S]: Fx.OutputOf<S[K]>
      }>
    >(current)
  })

  //
  readonly filterMapEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filterMapEffect'] = (f) => new ComputedImpl(this, f) as any

  readonly filterMap: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filterMap'] = (f) => this.filterMapEffect((a) => Effect.sync(() => f(a)))

  readonly filterEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filterEffect'] = (predicate) =>
    this.filterMapEffect((a) =>
      Effect.map(predicate(a), (b) => (b ? Option.some(a) : Option.none())),
    )

  readonly filter: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['filter'] = (predicate) => this.filterEffect((a) => Effect.sync(() => predicate(a)))

  readonly mapEffect: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['mapEffect'] = (f) => this.filterMapEffect((a) => Effect.map(f(a), Option.some))

  readonly map: RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >['map'] = (f) => this.mapEffect((a) => Effect.sync(() => f(a)));

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  readonly addTrace = (
    trace: Trace,
  ): RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > => {
    if (trace) {
      //
      return new TracedRefSubjectImpl(this, trace)
    }
    //
    return this
  }

  traced(trace: Trace): Effect.Effect<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    if (trace) {
      const traced = new StructRefSubjectImpl(this.i0)
      traced.trace = trace
      return traced as any
    }

    return this as any
  }

  commit(): Effect.Effect<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    return this.get.traced(this.trace)
  }
}

//
class ComputedImpl<R, E, A, R2, E2, B> implements Computed<R | R2, E | E2, B> {
  readonly [FxTypeId] = refSubjectVariant

  readonly _tag = 'Commit'
  public trace: Trace = undefined;

  readonly [Effect.EffectTypeId] = refSubjectVariant;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;
  /* I Don't really want this to be here */
  readonly [SinkTypeId] = refSubjectVariant as any;
  readonly [ChannelTypeId] = refSubjectVariant as any;
  readonly [StreamTypeId] = refSubjectVariant

  readonly i2: Fx<R | R2, E | E2, B>

  constructor(
    readonly i0: Computed<R, E, A>,
    readonly i1: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ) {
    // Create a stable reference to derived Fx
    this.i2 = multicast(compact(switchMapEffect(this.i0, this.i1)))
  }

  run<R3>(sink: Sink<R3, E | E2, B>) {
    return this.i2.run(sink)
  }

  addTrace(trace: Trace): Computed<R | R2, E | E2, B> {
    return new TracedComputed<R | R2, E | E2, B>(this, trace)
  }

  readonly get: Computed<R | R2, E | E2, B>['get'] = Effect.flatten(
    Effect.flatMap(this.i0.get, this.i1),
  )

  readonly filterMapEffect: Computed<R | R2, E | E2, B>['filterMapEffect'] = <R3, E3, C>(
    f: (b: B) => Effect.Effect<R3, E3, Option.Option<C>>,
  ): Computed<R | R2 | R3, E | E2 | E3, C> =>
    new ComputedImpl(this as Computed<R | R2, E | E2, B>, f)

  readonly filterMap: Computed<R | R2, E | E2, B>['filterMap'] = (f) =>
    this.filterMapEffect((a) => Effect.sync(() => f(a)))

  readonly filterEffect: Computed<R | R2, E | E2, B>['filterEffect'] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  readonly filter: Computed<R | R2, E | E2, B>['filter'] = (f) =>
    this.filterEffect((a) => Effect.sync(() => f(a)))

  readonly mapEffect: Computed<R | R2, E | E2, B>['mapEffect'] = <R3, E3, C>(
    f: (b: B) => Effect.Effect<R3, E3, C>,
  ): Computed<R | R2 | R3, E | E2 | E3, C> =>
    this.filterMapEffect((a) => Effect.map(f(a), Option.some))

  readonly map: Computed<R | R2, E | E2, B>['map'] = <C>(f: (b: B) => C) =>
    this.mapEffect((a) => Effect.sync(() => f(a)));

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  traced(trace: Trace): Effect.Effect<R | R2, E | E2 | Cause.NoSuchElementException, B> {
    if (trace) {
      return this.commit().traced(trace)
    }

    return this as any
  }

  commit(): Effect.Effect<R | R2, E | E2 | Cause.NoSuchElementException, B> {
    return this.get.traced(this.trace)
  }
}

//
class TracedComputed<R, E, A> implements Computed<R, E, A> {
  readonly _tag = 'Commit'
  readonly i2: any = undefined
  readonly trace: Trace;

  readonly [Effect.EffectTypeId] = refSubjectVariant;
  readonly [FxTypeId] = refSubjectVariant;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;
  /* I Don't really want this to be here */
  readonly [SinkTypeId] = refSubjectVariant as any;
  readonly [ChannelTypeId] = refSubjectVariant as any;
  readonly [StreamTypeId] = refSubjectVariant

  constructor(readonly i0: Computed<R, E, A>, readonly i1: Trace) {
    this.trace = i1
  }

  run<R2>(sink: Sink<R2, E, A>) {
    return this.i0.run(sink).traced(this.i1)
  }

  addTrace(trace: Trace): Computed<R, E, A> {
    //
    return new TracedComputed<R, E, A>(this, trace)
  }

  readonly get = this.i0.get.traced(this.i1)

  readonly filterMapEffect: Computed<R, E, A>['filterMapEffect'] = <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ): Computed<R | R2, E | E2, B> => new ComputedImpl(this as Computed<R, E, A>, f)

  readonly filterMap: Computed<R, E, A>['filterMap'] = (f) =>
    this.filterMapEffect((a) => Effect.sync(() => f(a)))

  readonly filterEffect: Computed<R, E, A>['filterEffect'] = (f) =>
    this.filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))

  readonly filter: Computed<R, E, A>['filter'] = (f) =>
    this.filterEffect((a) => Effect.sync(() => f(a)))

  readonly mapEffect: Computed<R, E, A>['mapEffect'] = <R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>,
  ): Computed<R | R2, E | E2, B> => this.filterMapEffect((a) => Effect.map(f(a), Option.some))

  readonly map: Computed<R, E, A>['map'] = <B>(f: (a: A) => B) =>
    this.mapEffect((a) => Effect.sync(() => f(a)));

  [Equal.symbol] = this.i0[Equal.symbol];
  [Hash.symbol] = this.i0[Hash.symbol]

  traced(trace: Trace): Effect.Effect<R, E | Cause.NoSuchElementException, A> {
    if (trace) {
      return this.commit().traced(trace)
    }

    return this as any
  }

  commit(): Effect.Effect<R, E | Cause.NoSuchElementException, A> {
    return this.get
  }
}

export function isRefSubject<E, A>(u: unknown): u is RefSubject<E, A> {
  return isFx<never, E, A>(u) && RefSubjectTypeId in u && u[RefSubjectTypeId] === RefSubjectTypeId
}
