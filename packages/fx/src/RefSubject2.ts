import * as Context from '@effect/data/Context'
import { Trace, methodWithTrace } from '@effect/data/Debug'
import * as Equal from '@effect/data/Equal'
import { identity, pipe } from '@effect/data/Function'
import * as Hash from '@effect/data/Hash'
import * as MutableRef from '@effect/data/MutableRef'
import * as Option from '@effect/data/Option'
import * as Equivalence from '@effect/data/typeclass/Equivalence'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import { ChannelTypeId } from '@effect/stream/Channel'
import { SinkTypeId } from '@effect/stream/Sink'
import { StreamTypeId } from '@effect/stream/Stream'
import fastDeepEqual from 'fast-deep-equal'

import { Computed, ComputedImpl, ComputedTypeId } from './Computed.js'
import { FilteredImpl } from './Filtered.js'
import { Fx, FxTypeId, Sink, isFx } from './Fx.js'
import { RefSubjectTypeId } from './RefSubject.js'
import { RefTransform, RefTransformImpl } from './RefTransform.js'
import { Subject } from './Subject.js'
import { combineAll } from './combineAll.js'
import { HoldFx } from './hold.js'
import { never } from './never.js'

const refVariance = {
  _R: identity,
  _E: identity,
  _A: identity,
}

export interface RefSubject<in out E, in out A> extends Subject<E, A>, Computed<never, E, A> {
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

  readonly set: (a: A) => Effect.Effect<never, never, A>

  readonly delete: Effect.Effect<never, E, Option.Option<A>>

  readonly addTrace: (trace: Trace) => RefSubject<E, A>
}

type Lock = <R2, E2, B>(effect: Effect.Effect<R2, E2, B>) => Effect.Effect<R2, E2, B>

export function makeRef<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  eq?: Equivalence.Equivalence<A>,
): Effect.Effect<R | Scope.Scope, never, RefSubject<E, A>> {
  return Effect.contextWithEffect((context) =>
    Effect.suspend(() => {
      const ref = RefSubject.unsafeMake(
        Effect.provideContext(effect, context),
        Context.get(context, Scope.Scope),
        eq,
      )

      return Effect.as(
        Effect.addFinalizer(() => ref.end()),
        ref,
      )
    }),
  )
}

export namespace RefSubject {
  export type Any = RefSubject<any, any> | RefSubject<never, any>

  export function unsafeMake<E, A>(
    initial: Effect.Effect<never, E, A>,
    scope: Scope.Scope,
    eq: Equivalence.Equivalence<A> = fastDeepEqual,
  ): RefSubject<E, A> {
    return makeRefFromPrimitive(unsafeMakeRefPrimitive(initial, scope, eq))
  }

  export function tuple<const Refs extends readonly Any[]>(
    ...refs: Refs
  ): RefSubject<
    Fx.ErrorsOf<Refs[number]>,
    {
      readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]>
    }
  > {
    return makeRefFromPrimitive<
      Fx.ErrorsOf<Refs[number]>,
      {
        readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]>
      }
    >(tupleRefPrimitive<Refs>(refs))
  }

  export function struct<const Refs extends Readonly<Record<string, Any>>>(
    refs: Refs,
  ): RefSubject<
    Fx.ErrorsOf<Refs[string]>,
    {
      readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]>
    }
  > {
    return makeRefFromPrimitive(structRefPrimitive<Refs>(refs))
  }

  export function all<S extends ReadonlyArray<Any>>(
    subjects: S,
  ): RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >

  export function all<S extends ReadonlyArray<Any>>(
    ...subjects: S
  ): RefSubject<
    Fx.ErrorsOf<S[number]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >

  export function all<S extends Readonly<Record<string, Any>>>(
    subjects: S,
  ): RefSubject<
    Fx.ErrorsOf<S[string]>,
    {
      readonly [K in keyof S]: Fx.OutputOf<S[K]>
    }
  >

  export function all(...subjects: any): any {
    /// MUST be a tuple if more than one argument
    if (subjects.length > 1) {
      return tuple(...subjects)
    }

    // Otherwise a single param is either a tuple or a struct
    const singleParam = subjects[0]

    if (Array.isArray(singleParam)) {
      return tuple(...singleParam)
    }

    return struct(singleParam)
  }
}

export function isRefSubject<E, A>(u: unknown): u is RefSubject<E, A> {
  return isFx<never, E, A>(u) && RefSubjectTypeId in u && u[RefSubjectTypeId] === RefSubjectTypeId
}

// Internals for RefSubject

function makeGetFromContext<E, A>(ctx: RefSubjectContext<E, A>): RefSubject<E, A>['get'] {
  return Effect.gen(function* ($) {
    const current = MutableRef.get(ctx.currentRef)

    if (Option.isSome(current)) {
      return current.value
    }

    const fiber = MutableRef.get(ctx.initializingFiberRef)

    if (Option.isSome(fiber)) {
      return yield* $(Fiber.join(fiber.value))
    }

    const a = yield* $(ctx.lock(initializeFromContext(ctx)))

    yield* $(ctx.hold.event(a))

    return a
  })
}

function initializeFromContext<E, A>(ctx: RefSubjectContext<E, A>): Effect.Effect<never, E, A> {
  return Effect.uninterruptibleMask((restore) =>
    Effect.gen(function* ($) {
      const fiber = yield* $(ctx.initial, restore, Effect.forkIn(ctx.scope))

      MutableRef.set(ctx.initializingFiberRef, Option.some(fiber))

      const a = yield* $(Fiber.join(fiber))

      MutableRef.set(ctx.currentRef, Option.some(a))
      MutableRef.set(ctx.initializingFiberRef, Option.none())

      return a
    }),
  )
}

function makeRefMethods<E, A>(
  primitive: RefPrimitive<E, A>,
): Pick<RefSubject<E, A>, 'modify' | 'updateEffect' | 'update'> {
  const modify = makeModify<E, A>(primitive.modifyEffect)
  const updateEffect = makeUpdateEffect<E, A>(primitive.modifyEffect)
  const update = makeUpdate<E, A>(updateEffect)

  return {
    modify,
    updateEffect,
    update,
  } as const
}

function makeModifyEffectFromContext<E, A>(
  get: RefSubject<E, A>['get'],
  ctx: RefSubjectContext<E, A>,
): RefSubject<E, A>['modifyEffect'] {
  return (f) =>
    Effect.flatMap(get, (a1) =>
      ctx.lock(
        Effect.flatMap(f(a1), ([b, a2]) =>
          Effect.suspend(() => {
            MutableRef.set(ctx.currentRef, Option.some(a2))

            if (ctx.eq(a1, a2)) {
              return Effect.succeed(b)
            }

            return Effect.as(ctx.hold.event(a2), b)
          }),
        ),
      ),
    )
}

function makeModify<E, A>(
  modifyEffect: RefSubject<E, A>['modifyEffect'],
): RefSubject<E, A>['modify'] {
  return (f) => modifyEffect((a) => Effect.sync(() => f(a)))
}

function makeUpdateEffect<E, A>(
  modifyEffect: RefSubject<E, A>['modifyEffect'],
): RefSubject<E, A>['updateEffect'] {
  return (f) => modifyEffect((a) => Effect.map(f(a), (a) => [a, a]))
}

function makeUpdate<E, A>(
  updateEffect: RefSubject<E, A>['updateEffect'],
): RefSubject<E, A>['update'] {
  return (f) => updateEffect((a) => Effect.sync(() => f(a)))
}

function makeSetFromContext<E, A>(ctx: RefSubjectContext<E, A>): RefSubject<E, A>['set'] {
  return (a) =>
    Effect.gen(function* ($) {
      const fiber = MutableRef.get(ctx.initializingFiberRef)

      // Allow waiting for an initialization to complete to ensure ordering
      if (Option.isSome(fiber)) {
        yield* $(Fiber.await(fiber.value))
      }

      MutableRef.set(ctx.currentRef, Option.some(a))

      yield* $(ctx.hold.event(a))

      return a
    })
}

function makeDeleteFromContext<E, A>(ctx: RefSubjectContext<E, A>): RefSubject<E, A>['delete'] {
  return Effect.sync(() => {
    const current = MutableRef.get(ctx.currentRef)

    if (Option.isSome(current)) {
      MutableRef.set(ctx.currentRef, Option.none())
    }

    return current
  })
}

function makeEndFromContext<E, A>(ctx: RefSubjectContext<E, A>): RefSubject<E, A>['end'] {
  return methodWithTrace(
    (trace) => () =>
      Effect.suspend(() => {
        const fibers = [
          ctx.hold.fiber || Fiber.unit(),
          Option.getOrElse(MutableRef.get(ctx.initializingFiberRef), () => Fiber.unit()),
        ]

        return Fiber.interruptAll(fibers)
      }).traced(trace),
  )
}

function makeFiltered<E, A>(
  primitive: RefPrimitive<E, A>,
  f: () => RefSubject<E, A>,
): Pick<
  RefSubject<E, A>,
  'filterMapEffect' | 'filterMap' | 'filterEffect' | 'filter' | 'filterNotEffect' | 'filterNot'
> {
  const get = makeMemoizedGet(f)

  function filterMapEffect<R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>) {
    return new FilteredImpl(get(), f).addTrace(primitive.trace)
  }

  function filterMap<B>(f: (a: A) => Option.Option<B>) {
    return filterMapEffect((a) => Effect.sync(() => f(a)))
  }

  function filterEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) {
    return filterMapEffect((a) => Effect.map(f(a), (b) => (b ? Option.some(a) : Option.none())))
  }

  function filter(f: (a: A) => boolean) {
    return filterEffect((a) => Effect.sync(() => f(a)))
  }

  function filterNotEffect<R2, E2>(f: (a: A) => Effect.Effect<R2, E2, boolean>) {
    return filterEffect((a) => Effect.map(f(a), (b) => !b))
  }

  function filterNot(f: (a: A) => boolean) {
    return filterNotEffect((a) => Effect.sync(() => f(a)))
  }

  return {
    filterMapEffect,
    filterMap,
    filterEffect,
    filter,
    filterNotEffect,
    filterNot,
  } as const
}

function makeComputedMethods<E, A>(
  primitive: RefPrimitive<E, A>,
  f: () => RefSubject<E, A>,
): Pick<RefSubject<E, A>, 'mapEffect' | 'map'> {
  const get = makeMemoizedGet(f)

  function mapEffect<R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): Computed<R2, E | E2, B> {
    return new ComputedImpl(get(), f).addTrace(primitive.trace)
  }

  function map<B>(f: (a: A) => B): Computed<never, E, B> {
    return mapEffect((a) => Effect.sync(() => f(a)))
  }

  return {
    mapEffect,
    map,
  } as const
}

function makeTransformMethods<E, A>(
  primitive: RefPrimitive<E, A>,
  f: () => RefSubject<E, A>,
): Pick<RefSubject<E, A>, 'transformBoth' | 'transform' | 'transformGet'> {
  const get = makeMemoizedGet(f)

  function transformBoth<R3, E3, C, R4, E4, D>(
    f: (fx: Fx<never, E, A>) => Fx<R3, E3, C>,
    g: (effect: Effect.Effect<never, E, A>) => Effect.Effect<R4, E4, D>,
  ): RefTransform<R3, E3, C, R4, E4, D> {
    return new RefTransformImpl(get(), f, g).addTrace(primitive.trace)
  }

  function transform<R3, E3, C>(
    f: (fx: Fx<never, E, A>) => Fx<R3, E3, C>,
  ): RefTransform<R3, E3, C, never, E, A> {
    return transformBoth(f, identity)
  }

  function transformGet<R3, E3, C>(
    f: (effect: Effect.Effect<never, E, A>) => Effect.Effect<R3, E3, C>,
  ): RefTransform<never, E, A, R3, E3, C> {
    return transformBoth(identity, f)
  }

  return {
    transformBoth,
    transform,
    transformGet,
  } as const
}

const placeholders = {
  i0: undefined,
  i1: undefined,
  i2: undefined,
  [Equal.symbol](that: unknown) {
    return this === that
  },
  [Hash.symbol]() {
    return Hash.random(this)
  },
}

function makeEffectMethods<E, A>(
  get: RefSubject<E, A>['get'],
): Pick<
  RefSubject<E, A>,
  | Effect.EffectTypeId
  | SinkTypeId
  | ChannelTypeId
  | StreamTypeId
  | typeof Equal.symbol
  | typeof Hash.symbol
  | 'traced'
> {
  function traced(trace: Trace): Effect.Effect<never, E, A> {
    return get.traced(trace)
  }

  return Object.assign(
    {
      _tag: 'Commmit',
      [Effect.EffectTypeId]: refVariance,
      traced,
      commit() {
        return get
      },
      /* I Don't really want these Stream IDs to be here, but
           @effect/stream uses module augmentation on Effect */
      [SinkTypeId]: refVariance as any,
      [ChannelTypeId]: refVariance as any,
      [StreamTypeId]: refVariance,
    } as const,
    placeholders,
  )
}

function makeMemoizedGet<A>(f: () => A) {
  let memoized: Option.Option<A> = Option.none()

  return () => {
    if (Option.isNone(memoized)) {
      memoized = Option.some(f())
    }

    return (memoized as Option.Some<A>).value
  }
}

type RefSubjectContext<E, A> = {
  initial: Effect.Effect<never, E, A>
  currentRef: MutableRef.MutableRef<Option.Option<A>>
  initializingFiberRef: MutableRef.MutableRef<Option.Option<Fiber.RuntimeFiber<E, A>>>
  lock: Lock
  scope: Scope.Scope
  eq: Equivalence.Equivalence<A>
  hold: HoldFx<never, E, A>
}

function makeRefSubjectContext<E, A>(
  initial: Effect.Effect<never, E, A>,
  scope: Scope.Scope,
  eq: Equivalence.Equivalence<A>,
) {
  const hold = new HoldFx(never<E, A>())
  const ctx: RefSubjectContext<E, A> = {
    initial,
    currentRef: hold.current,
    initializingFiberRef: MutableRef.make(Option.none()),
    lock: Effect.unsafeMakeSemaphore(1).withPermits(1),
    scope,
    eq,
    hold,
  }

  return ctx
}

function unsafeMakeRefPrimitive<E, A>(
  initial: Effect.Effect<never, E, A>,
  scope: Scope.Scope,
  eq: Equivalence.Equivalence<A>,
): RefPrimitive<E, A> {
  const ctx = makeRefSubjectContext(initial, scope, eq)
  const get = makeGetFromContext(ctx)
  const set = makeSetFromContext(ctx)

  function run<R2>(sink: Sink<R2, E, A>) {
    return Effect.suspend(() => {
      const current = MutableRef.get(ctx.hold.current)

      if (Option.isNone(current)) {
        return pipe(
          primitive.get,
          Effect.catchAllCause(sink.error),
          Effect.flatMap(() => ctx.hold.run(sink)),
        )
      }

      return ctx.hold.run(sink)
    })
  }

  const primitive: RefPrimitive<E, A> = {
    addTrace: (trace) => traceRefPrimitive(primitive, trace),
    delete: makeDeleteFromContext(ctx),
    end: makeEndFromContext(ctx),
    eq,
    error: (cause) => ctx.hold.error(cause),
    event: set,
    get,
    modifyEffect: makeModifyEffectFromContext(get, ctx),
    run,
    set,
  }

  return primitive
}

function traceRefPrimitive<E, A>(input: RefPrimitive<E, A>, trace: Trace): RefPrimitive<E, A> {
  const primitive: RefPrimitive<E, A> = {
    addTrace: (trace) => traceRefPrimitive(primitive, trace),
    delete: input.delete.traced(trace),
    end: () => input.end().traced(trace),
    eq: input.eq,
    error: (error) => input.error(error).traced(trace),
    event: (event) => input.event(event).traced(trace),
    get: input.get.traced(trace),
    modifyEffect: <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) =>
      input.modifyEffect(f).traced(trace),
    run: (sink) => input.run(sink).traced(trace),
    set: (a) => input.set(a).traced(trace),
  }

  return primitive
}

function makeRefFromPrimitive<E, A>(primitive: RefPrimitive<E, A>): RefSubject<E, A> {
  const ref: RefSubject<E, A> = {
    [FxTypeId]: refVariance,
    [RefSubjectTypeId]: RefSubjectTypeId,
    [ComputedTypeId]: ComputedTypeId,
    ...primitive,
    ...makeRefMethods(primitive),
    ...makeEffectMethods(primitive.get),
    ...makeFiltered(primitive, () => ref),
    ...makeComputedMethods(primitive, () => ref),
    ...makeTransformMethods(primitive, () => ref),
    addTrace: (trace) => makeRefFromPrimitive(traceRefPrimitive(primitive, trace)),
  }

  return ref
}

// Base Ref which provides all functionality that can otherwise be derived
// using makeRefFromPrimitive
interface RefPrimitive<E, A> {
  // Fx
  run: RefSubject<E, A>['run']

  // Subject
  event: RefSubject<E, A>['event']
  error: RefSubject<E, A>['error']
  end: RefSubject<E, A>['end']

  // Ref
  eq: RefSubject<E, A>['eq']
  get: RefSubject<E, A>['get']
  modifyEffect: RefSubject<E, A>['modifyEffect']
  set: RefSubject<E, A>['set']
  delete: RefSubject<E, A>['delete']

  // Primitive
  addTrace: (trace: Trace) => RefPrimitive<E, A>
  trace?: Trace
}

// Internals for RefSubject.tuple

function tupleRefPrimitive<const Refs extends ReadonlyArray<RefSubject.Any>>(
  refs: Refs,
): RefPrimitive<Fx.ErrorsOf<Refs[number]>, { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }> {
  type _E = Fx.ErrorsOf<Refs[number]>
  type _A = { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }

  const hold = new HoldFx(combineAll(...refs) as any as Fx<never, _E, _A>)
  const eq = Equivalence.tuple(...refs.map((ref) => ref.eq))
  const get = Effect.allPar(refs.map((ref) => ref.get)) as Effect.Effect<never, _E, _A>

  const primitive: RefPrimitive<_E, _A> = {
    addTrace: (trace) => traceRefPrimitive(primitive, trace),
    delete: Effect.map(Effect.allPar(refs.map((ref) => ref.delete)), (values) =>
      Option.tuple(...values),
    ) as Effect.Effect<never, _E, Option.Option<_A>>,
    end: () => Effect.allPar(refs.map((ref) => ref.end())),
    eq,
    error: (error) => hold.error(error),
    event: (value) => Effect.allPar(value.map((v, i) => refs[i].event(v))),
    get,
    modifyEffect: makeModifyEffectTuple(refs, get, eq),
    run: (sink) => hold.run(sink),
    set: (value) =>
      Effect.allPar(value.map((v, i) => refs[i].set(v))) as Effect.Effect<never, never, _A>,
  }

  return primitive
}

function makeModifyEffectTuple<
  const Refs extends ReadonlyArray<RefSubject.Any>,
  E,
  A extends readonly any[],
>(
  refs: Refs,
  get: Effect.Effect<never, E, A>,
  eq: Equivalence.Equivalence<A>,
): RefSubject<E, A>['modifyEffect'] {
  return <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) => {
    return Effect.gen(function* ($) {
      const current = yield* $(get)
      const [b, a] = yield* $(f(current))

      if (eq(a, current)) {
        return b
      }

      yield* $(Effect.allPar(refs.map((ref, i) => ref.set(a[i]))))

      return b
    })
  }
}

function structRefPrimitive<const Refs extends Readonly<Record<string, RefSubject.Any>>>(
  refs: Refs,
): RefPrimitive<Fx.ErrorsOf<Refs[string]>, { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }> {
  type _E = Fx.ErrorsOf<Refs[string]>
  type _A = { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }

  const hold = new HoldFx(combineAll(...refs) as any as Fx<never, _E, _A>)
  const eq = Equivalence.struct(mapRecord(refs, (ref) => ref.eq))
  const get = Effect.allPar(mapRecord(refs, (ref) => ref.get)) as Effect.Effect<never, _E, _A>

  const primitive: RefPrimitive<_E, _A> = {
    addTrace: (trace) => traceRefPrimitive(primitive, trace),
    delete: Effect.map(Effect.allPar(mapRecord(refs, (ref) => ref.delete)), (values) =>
      Option.struct(values),
    ) as Effect.Effect<never, _E, Option.Option<_A>>,
    end: () => Effect.allPar(mapRecord(refs, (ref) => ref.end())),
    eq,
    error: (error) => hold.error(error),
    event: (value) => Effect.allPar(mapRecord(value, (v, i) => refs[i].event(v))),
    get,
    modifyEffect: makeModifyEffectStruct(refs, get, eq),
    run: (sink) => hold.run(sink),
    set: (value) =>
      Effect.allPar(mapRecord(value, (v, i) => refs[i].set(v))) as Effect.Effect<never, never, _A>,
  }

  return primitive
}

function makeModifyEffectStruct<
  const Refs extends Readonly<Record<string, RefSubject.Any>>,
  E,
  A extends Readonly<Record<string, any>>,
>(
  refs: Refs,
  get: Effect.Effect<never, E, A>,
  eq: Equivalence.Equivalence<A>,
): RefSubject<E, A>['modifyEffect'] {
  return <R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, readonly [B, A]>) => {
    return Effect.gen(function* ($) {
      const current = yield* $(get)
      const [b, a] = yield* $(f(current))

      if (eq(a, current)) {
        return b
      }

      yield* $(Effect.allPar(mapRecord(refs, (ref, i) => ref.set(a[i]))))

      return b
    })
  }
}

function mapRecord<K extends string, A, B>(
  record: Readonly<Record<K, A>>,
  f: (a: A, k: K) => B,
): { readonly [_ in K]: B } {
  const result: Record<K, B> = {} as any

  for (const k in record) {
    result[k] = f(record[k], k)
  }

  return result
}
