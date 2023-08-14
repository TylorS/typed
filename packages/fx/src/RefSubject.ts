import * as Context from '@effect/data/Context'
import * as Equal from '@effect/data/Equal'
import * as Equivalence from '@effect/data/Equivalence'
import { identity, pipe } from '@effect/data/Function'
import * as Hash from '@effect/data/Hash'
import * as MutableRef from '@effect/data/MutableRef'
import * as Option from '@effect/data/Option'
import { Pipeable, pipeArguments } from '@effect/data/Pipeable'
import * as Deferred from '@effect/io/Deferred'
import * as Effect from '@effect/io/Effect'
import * as Fiber from '@effect/io/Fiber'
import * as Scope from '@effect/io/Scope'
import fastDeepEqual from 'fast-deep-equal'

import { Computed, ComputedImpl, ComputedTypeId } from './Computed.js'
import { FilteredImpl } from './Filtered.js'
import { Fx, FxTypeId, Sink, isFx } from './Fx.js'
import { RefTransform, RefTransformImpl } from './RefTransform.js'
import { Subject } from './Subject.js'
import { combineAll } from './combineAll.js'
import { HoldFx } from './hold.js'
import { never } from './never.js'
import { drain } from './observe.js'
import { struct } from './struct.js'
import { switchMatchCauseEffect } from './switchMatch.js'

const unboundedConcurrency = { concurrency: 'unbounded' } as const

const refVariance = {
  _R: identity,
  _E: identity,
  _A: identity,
}

export const RefSubjectTypeId = Symbol.for('@typed/fx/RefSubject')
export type RefSubjectTypeId = typeof RefSubjectTypeId

export interface RefSubject<in out E, in out A>
  extends Subject<E, A>,
    Computed<never, E, A>,
    Pipeable {
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

  /**
   * The current version of the RefSubject, starting with 0, 1 when initialized,
   * and incremented each time the value is updated.
   */
  readonly version: () => number
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
  return isFx<never, E, A>(u) && RefSubjectTypeId in u
}

// Internals for RefSubject

function makeGetFromContext<E, A>(ctx: RefSubjectContext<E, A>): RefSubject<E, A>['get'] {
  return Effect.suspend(() => {
    const current = MutableRef.get(ctx.currentRef)

    if (Option.isSome(current)) {
      return Effect.succeed(current.value)
    }

    const fiber = MutableRef.get(ctx.initializingFiberRef)

    if (Option.isSome(fiber)) {
      return Fiber.join(fiber.value)
    }

    return Effect.tap(ctx.lock(initializeFromContext(ctx)), (a) => ctx.hold.event(a))
  })
}

function initializeFromContext<E, A>(ctx: RefSubjectContext<E, A>): Effect.Effect<never, E, A> {
  return Effect.uninterruptibleMask((restore) =>
    Effect.flatMap(Effect.forkIn(restore(ctx.initial), ctx.scope), (fiber) => {
      MutableRef.set(ctx.initializingFiberRef, Option.some(fiber))

      return Fiber.join(fiber).pipe(
        Effect.tap((a) =>
          Effect.sync(() => {
            MutableRef.increment(ctx.version)
            MutableRef.set(ctx.currentRef, Option.some(a))
          }),
        ),
        Effect.ensuring(Effect.sync(() => MutableRef.set(ctx.initializingFiberRef, Option.none()))),
      )
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

            MutableRef.increment(ctx.version)

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
  return (a: A) =>
    Effect.suspend(() => {
      const fiber = MutableRef.get(ctx.initializingFiberRef)

      return pipe(
        fiber,
        Option.match({ onNone: () => Effect.unit, onSome: Fiber.await }),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Effect.flatMap((_: unknown) => {
          const current = MutableRef.get(ctx.currentRef)

          MutableRef.set(ctx.currentRef, Option.some(a))

          // Only emit if the value has changed
          if (Option.isNone(current) || (Option.isSome(current) && !ctx.eq(current.value, a))) {
            // Increment the version
            MutableRef.increment(ctx.version)
            return Effect.as(ctx.hold.event(a), a)
          }

          return Effect.succeed(a)
        }),
      )
    })
}

function makeDeleteFromContext<E, A>(ctx: RefSubjectContext<E, A>): RefSubject<E, A>['delete'] {
  return Effect.sync(() => {
    const current = MutableRef.get(ctx.currentRef)

    if (Option.isSome(current)) {
      MutableRef.set(ctx.version, 0)
      MutableRef.set(ctx.currentRef, Option.none())
    }

    return current
  })
}

function makeEndFromContext<E, A>(ctx: RefSubjectContext<E, A>): RefSubject<E, A>['end'] {
  return () =>
    Effect.suspend(() => {
      MutableRef.set(ctx.version, 0)

      const fibers = [
        ctx.hold.fiber || Fiber.unit,
        Option.getOrElse(MutableRef.get(ctx.initializingFiberRef), () => Fiber.unit),
      ]

      return Fiber.interruptAll(fibers)
    })
}

function makeFiltered<E, A>(
  f: () => RefSubject<E, A>,
): Pick<
  RefSubject<E, A>,
  'filterMapEffect' | 'filterMap' | 'filterEffect' | 'filter' | 'filterNotEffect' | 'filterNot'
> {
  const get = makeMemoizedGet(f)

  function filterMapEffect<R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>) {
    return new FilteredImpl(get(), f)
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
  f: () => RefSubject<E, A>,
): Pick<RefSubject<E, A>, 'mapEffect' | 'map'> {
  const get = makeMemoizedGet(f)

  function mapEffect<R2, E2, B>(f: (a: A) => Effect.Effect<R2, E2, B>): Computed<R2, E | E2, B> {
    return new ComputedImpl(get(), f)
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
  f: () => RefSubject<E, A>,
): Pick<RefSubject<E, A>, 'transformBoth' | 'transform' | 'transformGet'> {
  const get = makeMemoizedGet(f)

  function transformBoth<R3, E3, C, R4, E4, D>(
    f: (fx: Fx<never, E, A>) => Fx<R3, E3, C>,
    g: (effect: Effect.Effect<never, E, A>) => Effect.Effect<R4, E4, D>,
  ): RefTransform<R3, E3, C, R4, E4, D> {
    return new RefTransformImpl(get(), f, g)
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
  _tag: 'Commit',
  [Effect.EffectTypeId]: refVariance,
  i0: undefined,
  i1: undefined,
  i2: undefined,
  [Equal.symbol](that: unknown) {
    return this === that
  },
  [Hash.symbol]() {
    return Hash.random(this)
  },
  pipe() {
    // eslint-disable-next-line prefer-rest-params
    return pipeArguments(this, arguments)
  },
}

function makeEffectMethods<E, A>(
  get: RefSubject<E, A>['get'],
): Pick<RefSubject<E, A>, Extract<keyof Effect.Effect<never, E, A>, keyof RefSubject<E, A>>> {
  return Object.assign(
    {
      commit() {
        return get
      },
    } as const,
    placeholders,
  ) as any
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
  version: MutableRef.MutableRef<number>
}

function makeRefSubjectContext<E, A>(
  initial: Effect.Effect<never, E, A>,
  scope: Scope.Scope,
  eq: Equivalence.Equivalence<A> = fastDeepEqual,
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
    version: MutableRef.make(0),
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
    delete: makeDeleteFromContext(ctx),
    end: makeEndFromContext(ctx),
    eq,
    error: (cause) => ctx.hold.error(cause),
    event: set,
    get,
    modifyEffect: makeModifyEffectFromContext(get, ctx),
    run,
    set,
    version: ctx.version,
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
    ...makeFiltered(() => ref),
    ...makeComputedMethods(() => ref),
    ...makeTransformMethods(() => ref),
    version() {
      return MutableRef.get(primitive.version)
    },
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
  version: MutableRef.MutableRef<number>
}

// Internals for RefSubject.tuple

function tupleRefPrimitive<const Refs extends ReadonlyArray<RefSubject.Any>>(
  refs: Refs,
): RefPrimitive<Fx.ErrorsOf<Refs[number]>, { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }> {
  type _E = Fx.ErrorsOf<Refs[number]>
  type _A = { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }

  const hold = new HoldFx(combineAll(...refs) as any as Fx<never, _E, _A>)
  const eq = Equivalence.tuple(...refs.map((ref) => ref.eq))
  const get = Effect.all(
    refs.map((ref) => ref.get),
    unboundedConcurrency,
  ) as Effect.Effect<never, _E, _A>

  const primitive: RefPrimitive<_E, _A> = {
    delete: Effect.map(
      Effect.all(
        refs.map((ref) => ref.delete),
        unboundedConcurrency,
      ),
      (values) => Option.all(values),
    ) as Effect.Effect<never, _E, Option.Option<_A>>,
    end: () =>
      Effect.all(
        refs.map((ref) => ref.end()),
        unboundedConcurrency,
      ),
    eq,
    error: (error) => hold.error(error),
    event: (value) =>
      Effect.all(
        value.map((v, i) => refs[i].event(v)),
        unboundedConcurrency,
      ),
    get,
    modifyEffect: makeModifyEffectTuple(refs, get, eq),
    run: (sink) => hold.run(sink),
    set: (value) =>
      Effect.all(
        value.map((v, i) => refs[i].set(v)),
        unboundedConcurrency,
      ) as Effect.Effect<never, never, _A>,
    version: MutableRef.make(0),
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

      yield* $(
        Effect.all(
          refs.map((ref, i) => ref.set(a[i])),
          unboundedConcurrency,
        ),
      )

      return b
    })
  }
}

function structRefPrimitive<const Refs extends Readonly<Record<string, RefSubject.Any>>>(
  refs: Refs,
): RefPrimitive<Fx.ErrorsOf<Refs[string]>, { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }> {
  type _E = Fx.ErrorsOf<Refs[string]>
  type _A = { readonly [K in keyof Refs]: Fx.OutputOf<Refs[K]> }

  const hold = new HoldFx(struct(refs)) as HoldFx<never, _E, _A>
  const eq = Equivalence.struct(mapRecord(refs, (ref) => ref.eq))
  const get = Effect.all(
    mapRecord(refs, (ref) => ref.get),
    unboundedConcurrency,
  ) as Effect.Effect<never, _E, _A>

  const primitive: RefPrimitive<_E, _A> = {
    delete: Effect.map(
      Effect.all(
        mapRecord(refs, (ref) => ref.delete),
        unboundedConcurrency,
      ),
      (values) => Option.all(values),
    ) as Effect.Effect<never, _E, Option.Option<_A>>,
    end: () =>
      Effect.all(
        mapRecord(refs, (ref) => ref.end()),
        unboundedConcurrency,
      ),
    eq,
    error: (error) => hold.error(error),
    event: (value) =>
      Effect.all(
        mapRecord(value, (v, i) => refs[i].event(v)),
        unboundedConcurrency,
      ),
    get,
    modifyEffect: makeModifyEffectStruct(refs, get, eq),
    run: (sink) => hold.run(sink),
    set: (value) =>
      Effect.all(
        mapRecord(value, (v, i) => refs[i].set(v)),
        unboundedConcurrency,
      ) as Effect.Effect<never, never, _A>,
    version: MutableRef.make(0),
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

      yield* $(
        Effect.all(
          mapRecord(refs, (ref, i) => ref.set(a[i])),
          unboundedConcurrency,
        ),
      )

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

export function asRef<R, E, A>(fx: Fx<R, E, A>) {
  return Effect.flatMap(Deferred.make<E, A>(), (deferred) =>
    Effect.flatMap(makeRef(Deferred.await(deferred)), (ref) => {
      const onValue = (value: A) =>
        Effect.flatMap(Deferred.succeed(deferred, value), (closed) =>
          closed ? Effect.unit : ref.set(value),
        )

      return Effect.as(
        Effect.forkScoped(
          Effect.catchAllCause(drain(switchMatchCauseEffect(fx, ref.error, onValue)), ref.error),
        ),
        ref,
      )
    }),
  )
}
