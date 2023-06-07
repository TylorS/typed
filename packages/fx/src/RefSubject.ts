import * as Context from '@effect/data/Context'
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
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import { ChannelTypeId } from '@effect/stream/Channel'
import { SinkTypeId } from '@effect/stream/Sink'
import { StreamTypeId } from '@effect/stream/Stream'

import { Computed, ComputedImpl, ComputedTypeId } from './Computed.js'
import { Filtered, FilteredImpl } from './Filtered.js'
import { Fx, Sink, isFx, FxTypeId } from './Fx.js'
import { RefTransform, RefTransformImpl } from './RefTransform.js'
import type { Subject } from './Subject.js'
import { combineAll } from './combineAll.js'
import { HoldFx } from './hold.js'
import { map } from './map.js'
import { never } from './never.js'
import { drain } from './observe.js'
import { switchMatchCauseEffect } from './switchMatch.js'

export const RefSubjectTypeId = Symbol.for('@typed/fx/RefSubject')
export type RefSubjectTypeId = typeof RefSubjectTypeId

export interface RefSubject<in out E, in out A>
  extends Subject<E, A>,
    Effect.Effect<never, E, A>,
    Computed<never, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  readonly eq: Equivalence.Equivalence<A>

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

export function makeRef<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  eq: Equivalence.Equivalence<A> = equals,
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> {
  return Effect.gen(function* (_) {
    const context = yield* _(Effect.context<R | Scope.Scope>())
    const ref = RefSubject.unsafeMake(
      Effect.provideContext(effect, context),
      Context.get(context, Scope.Scope),
      eq,
    )

    // Ensure underlying Fiber is interrupted when scope closes
    yield* _(Effect.addFinalizer(() => ref.end()))

    return ref
  })
}

export function asRef<R, E, A>(
  fx: Fx<R, E, A>,
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> {
  return Effect.gen(function* (_) {
    // Use a Deferred value to capture the initial value of the reference
    const deferred = yield* _(Deferred.make<E, A>())
    const ref = yield* _(makeRef(Deferred.await(deferred)))

    // Listen to the reference and update the reference
    yield* _(
      switchMatchCauseEffect(
        fx,
        (cause) =>
          Effect.flatMap(Deferred.failCause(deferred, cause), (closed) =>
            closed ? Effect.unit() : ref.error(cause),
          ),
        (a) =>
          Effect.flatMap(Deferred.succeed(deferred, a), (closed) =>
            closed ? Effect.unit() : ref.set(a),
          ),
      ),
      drain,
      Effect.forkScoped,
    )

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
    scope: Scope.Scope,
    eq: Equivalence.Equivalence<A> = equals,
  ): RefSubject<E, A> {
    return new RefSubjectImpl(get, eq, scope)
  }
}

const refSubjectVariant = {
  _R: identity,
  _E: identity,
  _A: identity,
}

class RefSubjectImpl<E, A> extends HoldFx<never, E, A> implements RefSubject<E, A> {
  readonly _tag = 'Commit'
  public trace: Trace = undefined;

  readonly [Effect.EffectTypeId] = refSubjectVariant;
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId;
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId;

  /* I Don't really want this to be here */
  readonly [SinkTypeId] = refSubjectVariant as any;
  readonly [ChannelTypeId] = refSubjectVariant as any;
  readonly [StreamTypeId] = refSubjectVariant

  readonly lock = Effect.unsafeMakeSemaphore(1).withPermits(1)
  readonly initializeFiber: MutableRef.MutableRef<Option.Option<Fiber.RuntimeFiber<E, A>>> =
    MutableRef.make(Option.none())

  readonly eq: Equivalence.Equivalence<A>

  constructor(
    readonly i0: Effect.Effect<never, E, A>,
    readonly i1: Equivalence.Equivalence<A>,
    readonly i2: Scope.Scope,
  ) {
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
      return new TracedRefSubjectImpl(this, trace)
    }

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
                      Effect.forkIn(restore(this.i0), this.i2),
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

  filterMapEffect<R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>,
  ): Filtered<R2, E | E2, B> {
    return new FilteredImpl(this, f)
  }

  filterMap<B>(f: (a: A) => Option.Option<B>): Filtered<never, E, B> {
    return this.filterMapEffect((a) => Effect.sync(() => f(a)))
  }

  filterEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): Filtered<R2, E | E2, A> {
    return this.filterMapEffect((a) =>
      Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())),
    )
  }

  filter(f: (a: A) => boolean): Filtered<never, E, A> {
    return this.filterEffect((a) => Effect.sync(() => f(a)))
  }

  filterNotEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>): Filtered<R2, E | E2, A> {
    return this.filterEffect((a) => Effect.map(f(a), (b) => !b))
  }

  filterNot(f: (a: A) => boolean): Filtered<never, E, A> {
    return this.filterNotEffect((a) => Effect.sync(() => f(a)))
  }

  mapEffect<R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): Computed<R2, E | E2, B> {
    return new ComputedImpl(this, f)
  }

  map<B>(f: (a: A) => B): Computed<never, E, B> {
    return this.mapEffect((a) => Effect.sync(() => f(a)))
  }

  transform<R3, E3, C>(
    f: (fx: Fx<never, E, A>) => Fx<R3, E3, C>,
  ): RefTransform<R3, E3, C, never, E, A> {
    return this.transformBoth(f, identity)
  }

  transformGet<R3, E3, C>(
    f: (effect: Effect.Effect<never, E, A>) => Effect.Effect<R3, E3, C>,
  ): RefTransform<never, E, A, R3, E3, C> {
    return this.transformBoth(identity, f)
  }

  transformBoth<R3, E3, C, R4, E4, D>(
    f: (fx: Fx<never, E, A>) => Fx<R3, E3, C>,
    g: (effect: Effect.Effect<never, E, A>) => Effect.Effect<R4, E4, D>,
  ): RefTransform<R3, E3, C, R4, E4, D> {
    return new RefTransformImpl(this, f, g)
  }

  [Equal.symbol](that: unknown) {
    return this === that
  }

  [Hash.symbol]() {
    return Hash.random(this)
  }

  traced(trace: Trace): Effect.Effect<never, E, A> {
    if (trace) {
      return new TracedRefSubjectImpl(this, trace)
    }

    return this as any
  }

  commit(): Effect.Effect<never, E, A> {
    return this.get.traced(this.trace)
  }
}

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

  readonly delete: RefSubject<E, A>['delete'] = this.i0.delete.traced(this.i1);

  [Equal.symbol] = this.i0[Equal.symbol];
  [Hash.symbol] = this.i0[Hash.symbol]

  readonly addTrace: (trace: Trace) => RefSubject<E, A> = (trace) => {
    if (trace) {
      return new TracedRefSubjectImpl(this, trace)
    }

    return this
  }

  traced(trace: Trace): Effect.Effect<never, E, A> {
    if (trace) {
      return new TracedRefSubjectImpl(this, trace) as any
    }

    return this as any
  }

  commit(): Effect.Effect<never, E, A> {
    return this.get
  }
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
  });

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
      return new TracedRefSubjectImpl(this, trace)
    }

    return this
  }

  traced(trace: Trace): Effect.Effect<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    return this.addTrace(trace)
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
  });

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
      return new TracedRefSubjectImpl(this, trace)
    }

    return this
  }

  traced(trace: Trace): Effect.Effect<
    never,
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  > {
    return this.addTrace(trace)
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

export function isRefSubject<E, A>(u: unknown): u is RefSubject<E, A> {
  return isFx<never, E, A>(u) && RefSubjectTypeId in u && u[RefSubjectTypeId] === RefSubjectTypeId
}
