/**
 * A RefSubject is a Subject that can be used to read and write a value.
 * @since 1.20.0
 */

import * as C from "@typed/context"
import * as Array from "effect/Array"
import * as Boolean from "effect/Boolean"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import type * as Equivalence from "effect/Equivalence"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import type * as FiberId from "effect/FiberId"
import { dual, identity } from "effect/Function"
import * as Layer from "effect/Layer"
import * as MutableRef from "effect/MutableRef"
import { sum } from "effect/Number"
import * as Option from "effect/Option"
import type * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import * as Unify from "effect/Unify"
import { type Fx } from "./Fx.js"
import * as core from "./internal/core.js"
import * as DeferredRef from "./internal/DeferredRef.js"
import { getExitEquivalence, matchEffectPrimitive, withScope } from "./internal/helpers.js"
import { FxEffectBase } from "./internal/protos.js"
import { runtimeToLayer } from "./internal/provide.js"
import * as share from "./internal/share.js"
import type { UnionToTuple } from "./internal/UnionToTuple.js"
import * as Sink from "./Sink.js"
import * as Subject from "./Subject.js"
import { ComputedTypeId, FilteredTypeId, RefSubjectTypeId, TypeId } from "./TypeId.js"
import * as Versioned from "./Versioned.js"

const UNBOUNDED = { concurrency: "unbounded" } as const

/**
 * A Computed is essentially a readonly RefSubject.
 * @since 1.20.0
 */
export interface Computed<out A, out E = never, out R = never>
  extends Versioned.Versioned<R, E, A, E, R | Scope.Scope, A, E, R>
{
  readonly [ComputedTypeId]: ComputedTypeId

  /**
   * @since 1.25.0
   */
  readonly unsafeGet: () => Exit.Exit<A, E>
}

/**
 * @since 1.20.0
 */
export namespace Computed {
  /**
   * @since 1.20.0
   */
  export type Any =
    | Computed<any, any, any>
    | Computed<never, any, any>
    | Computed<any, never, any>
    | Computed<never, never, any>
}

/**
 * A Filtered is essentially a readonly RefSubject that may have its values filtered out.
 * @since 1.20.0
 */
export interface Filtered<out A, out E = never, out R = never>
  extends Versioned.Versioned<R, E, A, E, R | Scope.Scope, A, E | Cause.NoSuchElementException, R>
{
  readonly [FilteredTypeId]: FilteredTypeId

  /**
   * @since 1.20.0
   */
  asComputed(): Computed<Option.Option<A>, E, R>

  /**
   * @since 1.25.0
   */
  readonly unsafeGet: () => Exit.Exit<A, E | Cause.NoSuchElementException>
}

/**
 * @since 1.20.0
 */
export namespace Filtered {
  /**
   * @since 1.20.0
   */
  export type Any =
    | Filtered<any, any, any>
    | Filtered<never, any, any>
    | Filtered<any, never, any>
    | Filtered<never, never, any>
}

/**
 * A RefSubject is a Subject that can be used to read and write a value.
 * @since 1.20.0
 */
export interface RefSubject<in out A, in out E = never, out R = never>
  extends Computed<A, E, R>, Subject.Subject<A, E, R>
{
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  /**
   * @since 1.20.0
   */
  readonly runUpdates: <B, E2, R2>(
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>
  ) => Effect.Effect<B, E2, R | R2>

  /**
   * @since 1.25.0
   */
  readonly unsafeGet: () => Exit.Exit<A, E>
}

/**
 * @since 1.20.0
 */
export namespace RefSubject {
  /**
   * @since 1.20.0
   */
  export type Any =
    | RefSubject<any, any, any>
    | RefSubject<any, any>
    | RefSubject<any, never, any>
    | RefSubject<any>

  /**
   * @since 1.20.0
   */
  export interface Tagged<I, E, A> extends RefSubject<A, E, I> {
    /**
     * @since 1.20.0
     */
    readonly tag: C.Tagged<I, RefSubject<A, E>>
    /**
     * @since 1.20.0
     */
    readonly make: <R>(
      fxOrEffect: Fx<A, E, R | Scope.Scope> | Effect.Effect<A, E, R | Scope.Scope>,
      options?: RefSubjectOptions<A> & { readonly drop?: number; readonly take?: number }
    ) => Layer.Layer<I, never, R>

    /**
     * @since 2.0.0
     */
    readonly layer: <E2, R2>(
      make: Effect.Effect<RefSubject<A, E>, E2, R2 | Scope.Scope>
    ) => Layer.Layer<I, E2, R2>
  }

  /**
   * A Contextual wrapper around a RefSubject
   * @since 1.18.0
   * @category models
   */
  export interface Derived<A, E, R> extends RefSubject<A, E, R> {
    readonly persist: Effect.Effect<void, never, R>
  }

  /**
   * @since 1.20.0
   */
  export type Context<T> = T extends RefSubject<infer _A, infer _E, infer R> ? R :
    T extends Computed<infer _A, infer _E, infer R> ? R :
    T extends Filtered<infer _A, infer _E, infer R> ? R :
    never

  /**
   * @since 1.20.0
   */

  export type Error<T> = T extends RefSubject<infer _A, infer E, infer _R> ? E :
    T extends Computed<infer _A, infer E, infer _R> ? E :
    T extends Filtered<infer _A, infer E, infer _R> ? E :
    never

  /**
   * @since 1.20.0
   */
  export type Success<T> = T extends RefSubject<infer A, infer _E, infer _R> ? A :
    T extends Computed<infer A, infer _E, infer _R> ? A :
    T extends Filtered<infer A, infer _E, infer _R> ? A :
    never

  /**
   * @since 1.20.0
   */
  export type Identifier<T> = T extends RefSubject.Tagged<infer R, infer _E, infer _A> ? R : never
}

/**
 * @since 1.20.0
 */
export type Context<T> = RefSubject.Context<T>

/**
 * @since 1.20.0
 */
export type Error<T> = RefSubject.Error<T>

/**
 * @since 1.20.0
 */
export type Success<T> = RefSubject.Success<T>

/**
 * @since 1.20.0
 */
export type Identifier<T> = RefSubject.Identifier<T>

/**
 * @since 1.20.0
 */
export interface RefSubjectOptions<A> {
  readonly eq?: Equivalence.Equivalence<A>
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy
}

/**
 * @since 1.20.0
 */
export function fromEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope> {
  return Effect.map(makeCore(effect, options), (core) => new RefSubjectImpl(core))
}

/**
 * @since 1.20.0
 */
export function fromFx<A, E, R>(
  fx: Fx<A, E, R>,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope> {
  return DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals)).pipe(
    Effect.bindTo("deferredRef"),
    Effect.bind("core", ({ deferredRef }) => makeCore(deferredRef, options)),
    Effect.tap(({ core, deferredRef }) =>
      Effect.forkIn(
        fx.run(Sink.make(
          (cause) =>
            Effect.flatMap(
              Effect.sync(() => deferredRef.done(Exit.failCause(cause))),
              () => core.subject.onFailure(cause)
            ),
          (value) =>
            Effect.flatMap(Effect.sync(() => deferredRef.done(Exit.succeed(value))), () => setCore(core, value))
        )),
        core.scope
      )
    ),
    Effect.map(({ core }) => new RefSubjectImpl(core))
  )
}

/**
 * @since 1.20.0
 */
export function fromRefSubject<A, E, R>(
  ref: RefSubject<A, E, R>,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject.Derived<A, E, R>, never, R | Scope.Scope> {
  return DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals)).pipe(
    Effect.bindTo("deferredRef"),
    Effect.bind("core", ({ deferredRef }) => makeCore<A, E, R>(deferredRef, options)),
    Effect.tap(({ core, deferredRef }) =>
      Effect.forkIn(
        ref.run(Sink.make(
          (cause) => Effect.sync(() => deferredRef.done(Exit.failCause(cause))),
          (value) => Effect.sync(() => deferredRef.done(Exit.succeed(value)))
        )),
        core.scope
      )
    ),
    Effect.map(({ core }) =>
      new DerivedImpl(
        core,
        persistCore(ref, core)
      )
    )
  )
}

function persistCore<A, E, R, R2>(ref: RefSubject<A, E, R>, core: RefSubjectCore<A, E, R, R2>) {
  // Log any errors that fail to persist, but don't fail the consumer
  return Effect.ignoreLogged(
    Effect.provide(Effect.flatMap(core.deferredRef, (value) => set(ref, value)), core.runtime.context)
  )
}

/**
 * @since 1.20.0
 */
export const make: {
  <A, E = never, R = never>(
    ref: RefSubject<A, E, R>,
    options?: RefSubjectOptions<A>
  ): Effect.Effect<RefSubject.Derived<A, E, R>, never, R | Scope.Scope>

  <A, E = never, R = never>(
    fxOrEffect: Fx<A, E, R> | Effect.Effect<A, E, R>,
    options?: RefSubjectOptions<A>
  ): Effect.Effect<RefSubject<A, E>, never, R | Scope.Scope>

  <A, E = never, R = never>(
    fxOrEffect: Fx<A, E, R> | Effect.Effect<A, E, R> | RefSubject<A, E, R>,
    options?: RefSubjectOptions<A>
  ): Effect.Effect<RefSubject<A, E> | RefSubject.Derived<A, E, R>, never, R | Scope.Scope>
} = function make<A, E, R>(
  fxOrEffect: Fx<A, E, R> | Effect.Effect<A, E, R> | RefSubject<A, E, R>,
  options?: RefSubjectOptions<A>
): Effect.Effect<any, never, R | Scope.Scope> {
  if (RefSubjectTypeId in fxOrEffect) return fromRefSubject(fxOrEffect as RefSubject<A, E, R>, options)
  else if (TypeId in fxOrEffect) return fromFx(fxOrEffect, options)
  else return fromEffect(fxOrEffect, options)
}

/**
 * @since 1.20.0
 */
export function of<A, E = never>(
  a: A,
  options?: RefSubjectOptions<A>
): Effect.Effect<RefSubject<A, E>, never, Scope.Scope> {
  return Effect.acquireRelease(
    withScopeAndFiberId(
      (scope, id) =>
        unsafeMake<E, A>({
          id,
          initial: Effect.succeed(a),
          initialValue: a,
          options,
          scope
        }),
      options?.executionStrategy ?? ExecutionStrategy.sequential
    ),
    (ref) => ref.interrupt
  )
}

const withScopeAndFiberId = <A, E, R>(
  f: (scope: Scope.CloseableScope, id: FiberId.FiberId) => Effect.Effect<A, E, R>,
  strategy: ExecutionStrategy.ExecutionStrategy
) => Effect.fiberIdWith((id) => withScope((scope) => f(scope, id), strategy))

/**
 * @since 1.20.0
 */
export function unsafeMake<E, A>(
  params: {
    readonly id: FiberId.FiberId
    readonly initial: Effect.Effect<A, E>
    readonly options?: RefSubjectOptions<A> | undefined
    readonly scope: Scope.CloseableScope
    readonly initialValue?: A
  }
): Effect.Effect<RefSubject<A, E>> {
  const { id, initial, options, scope } = params
  return Effect.flatMap(Effect.runtime(), (runtime) => {
    const core = unsafeMakeCore(initial, id, runtime, scope, options)
    const current = MutableRef.get(core.deferredRef.current)

    // Sometimes we might be instantiating directly from a known value
    // Here we seed the value and ensure the subject has it as well for re-broadcasting
    if ("initialValue" in params && Option.isNone(current)) {
      core.deferredRef.done(Exit.succeed(params.initialValue))
      return Effect.map(core.subject.onSuccess(params.initialValue), () => new RefSubjectImpl(core))
    } else if (Option.isSome(current)) {
      return Effect.map(
        Effect.matchCauseEffect(current.value, core.subject),
        () => new RefSubjectImpl(core)
      )
    } else {
      return Effect.succeed(new RefSubjectImpl(core))
    }
  })
}

class RefSubjectImpl<A, E, R, R2> extends FxEffectBase<A, E, Exclude<R, R2> | Scope.Scope, A, E, Exclude<R, R2>>
  implements RefSubject<A, E, Exclude<R, R2>>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<number>
  readonly interrupt: Effect.Effect<void, never, Exclude<R, R2>>
  readonly subscriberCount: Effect.Effect<number, never, Exclude<R, R2>>

  readonly getSetDelete: GetSetDelete<A, E, Exclude<R, R2>>

  constructor(
    readonly core: RefSubjectCore<A, E, R, R2>
  ) {
    super()

    this.version = Effect.sync(() => core.deferredRef.version)
    this.interrupt = Effect.provide(interruptCore(core), core.runtime.context)
    this.subscriberCount = Effect.provide(core.subject.subscriberCount, core.runtime.context)
    this.getSetDelete = getSetDelete(core)

    this.runUpdates = this.runUpdates.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)
  }

  run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<unknown, never, Exclude<R, R2> | R3 | Scope.Scope> {
    return Effect.matchCauseEffect(getOrInitializeCore(this.core, true), {
      onFailure: (cause) => sink.onFailure(cause),
      onSuccess: () => Effect.provide(this.core.subject.run(sink), this.core.runtime.context)
    })
  }

  runUpdates<R3, E3, B>(
    run: (ref: GetSetDelete<A, E, Exclude<R, R2>>) => Effect.Effect<B, E3, R3>
  ) {
    return this.core.semaphore.withPermits(1)(run(this.getSetDelete))
  }

  unsafeGet: () => Exit.Exit<A, E> = () =>
    Option.getOrThrowWith(MutableRef.get(this.core.deferredRef.current), () => new Cause.NoSuchElementException())

  onSuccess(value: A): Effect.Effect<unknown, never, Exclude<R, R2>> {
    return setCore(this.core, value)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, Exclude<R, R2>> {
    return onFailureCore(this.core, cause)
  }

  toEffect(): Effect.Effect<A, E, Exclude<R, R2>> {
    return getOrInitializeCore(this.core, true)
  }
}

class DerivedImpl<A, E, R, R2> extends RefSubjectImpl<A, E, R, R2> implements RefSubject.Derived<A, E, Exclude<R, R2>> {
  constructor(
    core: RefSubjectCore<A, E, R, R2>,
    readonly persist: Effect.Effect<void, never, Exclude<R, R2>>
  ) {
    super(core)
  }
}

/**
 * @since 1.20.0
 */
export const set: {
  <A>(value: A): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, a: A): Effect.Effect<A, E, R>
} = dual(2, function set<A, E, R>(ref: RefSubject<A, E, R>, a: A): Effect.Effect<A, E, R> {
  return ref.runUpdates((ref) => ref.set(a))
})

/**
 * @since 1.20.0
 */
export function reset<A, E, R>(ref: RefSubject<A, E, R>): Effect.Effect<Option.Option<A>, E, R> {
  return ref.runUpdates((ref) => ref.delete)
}

/**
 * @since 1.20.0
 */
export {
  /**
   * @since 1.20.0
   */
  reset as delete
}

/**
 * @since 1.20.0
 */
export interface GetSetDelete<A, E, R> {
  /**
   * @since 1.20.0
   */
  readonly get: Effect.Effect<A, E, R>
  /**
   * @since 1.20.0
   */
  readonly set: (a: A) => Effect.Effect<A, never, R>
  /**
   * @since 1.20.0
   */
  readonly delete: Effect.Effect<Option.Option<A>, E, R>
}

function getSetDelete<A, E, R, R2>(ref: RefSubjectCore<A, E, R, R2>): GetSetDelete<A, E, Exclude<R, R2>> {
  return {
    get: getOrInitializeCore(ref, false),
    set: (a) => setCore(ref, a),
    delete: deleteCore(ref)
  }
}

/**
 * @since 1.20.0
 */
export const updateEffect: {
  <A, E2, R2>(
    f: (value: A) => Effect.Effect<A, E2, R2>
  ): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E | E2, R | R2>
  <A, E, R, E2, R2>(
    ref: RefSubject<A, E, R>,
    f: (value: A) => Effect.Effect<A, E2, R2>
  ): Effect.Effect<A, E | E2, R | R2>
} = dual(2, function updateEffect<A, E, R, E2, R2>(
  ref: RefSubject<A, E, R>,
  f: (value: A) => Effect.Effect<A, E2, R2>
) {
  return ref.runUpdates((ref) => Effect.flatMap(Effect.flatMap(ref.get, f), ref.set))
})

/**
 * @since 1.20.0
 */
export const update: {
  <A>(f: (value: A) => A): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, f: (value: A) => A): Effect.Effect<A, E, R>
} = dual(2, function update<A, E, R>(ref: RefSubject<A, E, R>, f: (value: A) => A) {
  return updateEffect(ref, (value) => Effect.succeed(f(value)))
})

/**
 * @since 1.20.0
 */
export const modifyEffect: {
  <A, B, E2, R2>(
    f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<B, E | E2, R | R2>
  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R>,
    f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2, R | R2>
} = dual(2, function modifyEffect<A, E, R, B, E2, R2>(
  ref: RefSubject<A, E, R>,
  f: (value: A) => Effect.Effect<readonly [B, A], E2, R2>
) {
  return ref.runUpdates(
    (ref) =>
      Effect.flatMap(
        ref.get,
        (value) => Effect.flatMap(f(value), ([b, a]) => Effect.flatMap(ref.set(a), () => Effect.succeed(b)))
      )
  )
})

/**
 * @since 1.20.0
 */
export const modify: {
  <A, B>(f: (value: A) => readonly [B, A]): <E, R>(ref: RefSubject<A, E, R>) => Effect.Effect<B, E, R>
  <A, E, R, B>(ref: RefSubject<A, E, R>, f: (value: A) => readonly [B, A]): Effect.Effect<B, E, R>
} = dual(2, function modify<A, E, R, B>(ref: RefSubject<A, E, R>, f: (value: A) => readonly [B, A]) {
  return modifyEffect(ref, (value) => Effect.succeed(f(value)))
})

const isRefSubjectDataFirst = (args: IArguments) => isRefSubject(args[0])

/**
 * @since 1.20.0
 */
export const runUpdates: {
  <A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>; readonly value?: "initial" | "current" }
      | undefined
  ): (ref: RefSubject<A, E, R>) => Effect.Effect<B, E | E2 | E3, R | R2 | R3>

  <A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    ref: RefSubject<A, E, R>,
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>; readonly value?: "initial" | "current" }
      | undefined
  ): Effect.Effect<B, E | E2 | E3, R | R2 | R3>
} = dual(
  isRefSubjectDataFirst,
  function runUpdates<A, E, R, B, E2, R2, R3 = never, E3 = never, C = never>(
    ref: RefSubject<A, E, R>,
    f: (ref: GetSetDelete<A, E, R>) => Effect.Effect<B, E2, R2>,
    options?: {
      readonly onInterrupt: (value: A) => Effect.Effect<C, E3, R3>
      readonly value?: "initial" | "current"
    }
  ) {
    if (!options) {
      return ref.runUpdates(f)
    } else if (options.value === "initial") {
      return ref.runUpdates((ref) =>
        Effect.uninterruptibleMask((restore) =>
          Effect.flatMap(
            ref.get,
            (initial) =>
              f(ref).pipe(
                restore,
                Effect.tapErrorCause(Unify.unify((cause) =>
                  Cause.isInterruptedOnly(cause)
                    ? options.onInterrupt(initial)
                    : Effect.void
                ))
              )
          )
        )
      )
    } else {
      return ref.runUpdates((ref) =>
        Effect.uninterruptibleMask((restore) =>
          f(ref).pipe(
            restore,
            Effect.tapErrorCause(Unify.unify((cause) =>
              Cause.isInterruptedOnly(cause)
                ? Effect.flatMap(ref.get, options.onInterrupt)
                : Effect.void
            ))
          )
        )
      )
    }
  }
)

class RefSubjectCore<A, E, R, R2> {
  constructor(
    readonly initial: Effect.Effect<A, E, R>,
    readonly subject: Subject.HoldSubjectImpl<A, E>,
    readonly runtime: Runtime.Runtime<R2>,
    readonly scope: Scope.CloseableScope,
    readonly deferredRef: DeferredRef.DeferredRef<E, A>,
    readonly semaphore: Effect.Semaphore
  ) {
  }

  public _fiber: Fiber.Fiber<A, E> | undefined = undefined
}

function makeCore<A, E, R>(
  initial: Effect.Effect<A, E, R>,
  options?: RefSubjectOptions<A>
) {
  return Effect.runtime<R | Scope.Scope>().pipe(
    Effect.bindTo("runtime"),
    Effect.let("executionStrategy", () => options?.executionStrategy ?? ExecutionStrategy.parallel),
    Effect.bind(
      "scope",
      ({ executionStrategy, runtime }) => Scope.fork(C.get(runtime.context, Scope.Scope), executionStrategy)
    ),
    Effect.bind("id", () => Effect.fiberId),
    Effect.map(({ id, runtime, scope }) => unsafeMakeCore(initial, id, runtime, scope, options)),
    Effect.tap((core) => Scope.addFinalizer(core.scope, Effect.provide(core.subject.interrupt, core.runtime.context)))
  )
}

function unsafeMakeCore<A, E, R>(
  initial: Effect.Effect<A, E, R>,
  id: FiberId.FiberId,
  runtime: Runtime.Runtime<R>,
  scope: Scope.CloseableScope,
  options?: RefSubjectOptions<A>
) {
  const subject = new Subject.HoldSubjectImpl<A, E>()
  const core = new RefSubjectCore(
    initial,
    subject,
    runtime,
    scope,
    DeferredRef.unsafeMake(id, getExitEquivalence(options?.eq ?? Equal.equals), subject.lastValue),
    Effect.unsafeMakeSemaphore(1)
  )

  const onSuccess = (a: A) => {
    core.deferredRef.done(Exit.succeed(a))
  }
  const onCause = (cause: Cause.Cause<E>) => {
    core.deferredRef.done(Exit.failCause(cause))
  }
  const onError = (e: E) => onCause(Cause.fail(e))

  // Initialize the core with the initial value if it is synchronous
  matchEffectPrimitive(initial, {
    Success: onSuccess,
    Failure: onCause,
    Some: onSuccess,
    None: onError,
    Left: onError,
    Right: onSuccess,
    Sync: (f) => onSuccess(f()),
    Otherwise: () => {}
  })

  return core
}

function getOrInitializeCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  lockInitialize: boolean
): Effect.Effect<A, E, Exclude<R, R2>> {
  return Effect.suspend(() => {
    if (core._fiber === undefined && Option.isNone(MutableRef.get(core.deferredRef.current))) {
      return initializeCoreAndTap(core, lockInitialize)
    } else {
      return core.deferredRef
    }
  })
}

function initializeCoreEffect<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  lock: boolean
): Effect.Effect<Fiber.Fiber<A, E>, never, Exclude<R, R2>> {
  const initialize = Effect.onExit(
    Effect.provide(core.initial, core.runtime.context),
    (exit) =>
      Effect.sync(() => {
        core._fiber = undefined
        core.deferredRef.done(exit)
      })
  )

  return Effect.flatMap(
    Effect.forkIn(
      lock ? core.semaphore.withPermits(1)(initialize) : initialize,
      core.scope
    ),
    (fiber) => Effect.sync(() => core._fiber = fiber)
  )
}

function initializeCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  lock: boolean
): Effect.Effect<Fiber.Fiber<A, E>, never, Exclude<R, R2>> {
  type Z = Effect.Effect<Fiber.Fiber<A, E>, never, Exclude<R, R2>>

  const onSuccess = (a: A): Z => {
    core.deferredRef.done(Exit.succeed(a))
    return Effect.succeed(Fiber.succeed(a))
  }

  const onCause = (cause: Cause.Cause<E>): Z => {
    core.deferredRef.done(Exit.failCause(cause))
    return Effect.succeed(Fiber.failCause(cause))
  }

  const onError = (e: E): Z => onCause(Cause.fail(e))

  return matchEffectPrimitive(core.initial, {
    Success: onSuccess,
    Failure: onCause,
    Some: onSuccess,
    None: onError,
    Left: onError,
    Right: onSuccess,
    Sync: (f) => Effect.suspend(() => onSuccess(f())),
    Otherwise: () => initializeCoreEffect(core, lock)
  })
}

function initializeCoreAndTap<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  lock: boolean
): Effect.Effect<A, E, Exclude<R, R2>> {
  return Effect.zipRight(
    initializeCore(core, lock),
    tapEventCore(core, core.deferredRef)
  )
}

function setCore<A, E, R, R2>(core: RefSubjectCore<A, E, R, R2>, a: A): Effect.Effect<A, never, Exclude<R, R2>> {
  const exit = Exit.succeed(a)

  return Effect.suspend(() => {
    if (core.deferredRef.done(exit)) {
      // If the value changed, send an event
      return Effect.as(sendEvent(core, exit), a)
    } else {
      // Otherwise, just return the current value
      return Effect.succeed(a)
    }
  })
}

function onFailureCore<A, E, R, R2>(core: RefSubjectCore<A, E, R, R2>, cause: Cause.Cause<E>) {
  const exit = Exit.failCause(cause)

  return Effect.suspend(() => {
    if (core.deferredRef.done(exit)) {
      return sendEvent(core, exit)
    } else {
      return Effect.void
    }
  })
}

function interruptCore<A, E, R, R2>(core: RefSubjectCore<A, E, R, R2>): Effect.Effect<void, never, R> {
  return Effect.fiberIdWith((id) => {
    core.deferredRef.reset()

    const closeScope = Scope.close(core.scope, Exit.interrupt(id))
    const interruptFiber = core._fiber ? Fiber.interrupt(core._fiber) : Effect.void
    const interruptSubject = core.subject.interrupt

    return Effect.all([closeScope, interruptFiber, interruptSubject], { discard: true })
  })
}

function deleteCore<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>
): Effect.Effect<Option.Option<A>, E, Exclude<R, R2>> {
  return Effect.suspend(() => {
    const current = MutableRef.get(core.deferredRef.current)
    core.deferredRef.reset()

    if (Option.isNone(current)) {
      return Effect.succeed(Option.none())
    }

    return core.subject.subscriberCount.pipe(
      Effect.provide(core.runtime.context),
      Effect.flatMap(
        (count: number) => count > 0 && !core._fiber ? initializeCore(core, false) : Effect.void
      ),
      Effect.zipRight(Effect.asSome(current.value))
    )
  })
}

function tapEventCore<A, E, R, R2, R3>(
  core: RefSubjectCore<A, E, R, R2>,
  effect: Effect.Effect<A, E, R3>
) {
  return effect.pipe(
    Effect.exit,
    Effect.tap((exit) => sendEvent(core, exit)),
    Effect.flatten
  )
}

function sendEvent<A, E, R, R2>(
  core: RefSubjectCore<A, E, R, R2>,
  exit: Exit.Exit<A, E>
): Effect.Effect<unknown, never, Exclude<R, R2>> {
  if (Exit.isSuccess(exit)) {
    return Effect.provide(core.subject.onSuccess(exit.value), core.runtime.context)
  } else {
    return Effect.provide(core.subject.onFailure(exit.cause), core.runtime.context)
  }
}

/**
 * @since 1.20.0
 */
export const mapEffect: {
  <T extends RefSubject.Any | Computed.Any | Filtered.Any, B, E2, R2>(
    f: (a: Success<T>) => Effect.Effect<B, E2, R2>
  ): (
    ref: T
  ) => T extends Filtered.Any ? Filtered<B, Error<T> | E2, Context<T> | R2>
    : Computed<B, Error<T> | E2, Context<T> | R2>

  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): Computed<B, E | E2, R | R2>

  <A, E, R, B, E2, R2>(
    ref: Filtered<A, E, R>,
    f: (a: A) => Effect.Effect<B, E2, R2>
  ): Filtered<B, E | E2, R | R2>

  <R0, E0, A, E, R, E2, R2, C, E3, R3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<C, E3, R3>
  ): Computed<C, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
} = dual(2, function mapEffect<R0, E0, A, E, R, E2, R2, C, E3, R3>(
  versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => Effect.Effect<C, E3, R3>
):
  | Computed<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3>
  | Filtered<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3>
{
  return FilteredTypeId in versioned
    ? FilteredImpl.make(versioned, (a) => Effect.asSome(f(a)))
    : ComputedImpl.make(versioned, f)
})

/**
 * @since 1.20.0
 */
export const map: {
  <T extends RefSubject.Any | Computed.Any | Filtered.Any, B>(f: (a: Success<T>) => B): (
    ref: T
  ) => T extends Filtered.Any ? Filtered<B, Error<T>, Context<T>>
    : Computed<B, Error<T>, Context<T>>

  <A, E, R, B>(ref: RefSubject<A, E, R> | Computed<A, E, R>, f: (a: A) => B): Computed<B, E, R>
  <A, E, R, B>(filtered: Filtered<A, E, R>, f: (a: A) => B): Filtered<B, E, R>

  <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => B
  ):
    | Computed<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>
    | Filtered<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>
} = dual(2, function map<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => B
):
  | Computed<B, E0 | E | E2, R0 | Exclude<R, Scope.Scope> | R2>
  | Filtered<B, E0 | E | E2, R0 | Exclude<R, Scope.Scope> | R2>
{
  return mapEffect(versioned, (a) => Effect.succeed(f(a)))
})

/**
 * @since 1.20.0
 */
export const filterMapEffect: {
  <A, B, E2, R2>(
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
  ): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>): Filtered<B, E | E2, R | R2>
    <E, R>(ref: Filtered<A, E, R>): Filtered<B, E | E2, R | R2>
    <R0, E0, B, E, R, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
    ): Filtered<B, E0 | E | E2, R0 | R2>
  }

  <A, E, R, B, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E2, R2>
  ): Filtered<B, E | E2, R | R2>
  <R0, E0, A, E, R, B, E2, R2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<Option.Option<B>, E3, R3>
  ): Filtered<B, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
} = dual(2, function filterMapEffect<R0, E0, A, E, R, B, E2, R2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => Effect.Effect<Option.Option<B>, E3, R3>
): Filtered<B, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3> {
  return FilteredImpl.make(versioned, f)
})

/**
 * @since 1.20.0
 */
export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>): Filtered<B, E, R>
    <R0, E0, B, E, R, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => Option.Option<B>
    ): Filtered<B, E0 | E | E2, R0 | R2>
  }

  <R0, E0, A, E, R, B, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Option.Option<B>
  ): Filtered<B, E0 | E | E2, R0 | R2 | Exclude<R, Scope.Scope>>

  <A, E, R, B>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Option.Option<B>
  ): Filtered<B, E, R>
} = dual(2, function filterMap<R0, E0, A, E, R, B, E2, R2>(
  versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => Option.Option<B>
): Filtered<B, E0 | E | E2, R0 | Exclude<R, Scope.Scope> | R2 | R2> {
  return FilteredImpl.make(versioned, (a) => Effect.succeed(f(a)))
})

/**
 * @since 1.20.0
 */
export const compact: {
  <A, E, R>(ref: Computed<Option.Option<A>, E, R>): Filtered<A>
  <A, E, R>(ref: Filtered<Option.Option<A>, E, R>): Filtered<A>

  <R0, E0, A, E, R, E2, R2>(
    versioned: Versioned.Versioned<R0, E0, Option.Option<A>, E, R, Option.Option<A>, E2, R2>
  ): Filtered<
    A,
    E0 | E | Exclude<E, Cause.NoSuchElementException> | Exclude<E2, Cause.NoSuchElementException>,
    R0 | R2 | Exclude<R, Scope.Scope>
  >
} = function compact<R0, E0, A, E, R, E2, R2>(
  versioned: Versioned.Versioned<R0, E0, Option.Option<A>, E, R, Option.Option<A>, E2, R2>
): Filtered<
  A,
  E0 | E | Exclude<E, Cause.NoSuchElementException> | Exclude<E2, Cause.NoSuchElementException>,
  R0 | R2 | Exclude<R, Scope.Scope>
> {
  return FilteredImpl.make(versioned, Effect.succeed)
} as any

/**
 * @since 1.20.0
 */
export const filterEffect: {
  <A, E, R, E2, R2>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    f: (a: A) => Effect.Effect<boolean, E2, R2>
  ): Filtered<A, E | E2, R | R2>
  <R0, E0, A, E, R, E2, R2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<boolean, E3, R3>
  ): Filtered<A, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
} = dual(2, function filterEffect<R0, E0, A, E, R, E2, R2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => Effect.Effect<boolean, E3, R3>
): Filtered<A, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3> {
  return FilteredImpl.make(versioned, (a) => Effect.map(f(a), (b) => b ? Option.some(a) : Option.none()))
})

/**
 * @since 1.20.0
 */
export const filter: {
  <A>(f: (a: A) => boolean): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>): Filtered<A, E, R>
    <R0, E0, R, E, E2, R2>(
      versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
      f: (a: A) => boolean
    ): Filtered<A, E0 | E | E2, R0 | R2>
  }

  <A, E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>, f: (a: A) => boolean): Filtered<A, E, R>
  <R0, E0, A, E, R, E2, R2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => boolean
  ): Filtered<A, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>>
} = dual(2, function filter<R0, E0, A, E, R, E2, R2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
  f: (a: A) => boolean
): Filtered<A, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3> {
  return FilteredImpl.make(versioned, (a) => Effect.succeed(f(a) ? Option.some(a) : Option.none()))
})

class ComputedImpl<R0, E0, A, E, R, E2, R2, C, E3, R3> extends Versioned.VersionedTransform<
  R0,
  E0,
  A,
  E,
  R,
  A,
  E2,
  R2,
  C,
  E0 | E | E2 | E3,
  R0 | Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
  C,
  E0 | E | E2 | E3,
  R0 | Exclude<R, Scope.Scope> | R2 | R3
> implements Computed<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  constructor(
    readonly input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    readonly f: (a: A) => Effect.Effect<C, E3, R3>
  ) {
    super(
      input,
      (fx) => share.hold(core.mapEffect(fx, f)) as any,
      Effect.flatMap(f)
    )
  }

  unsafeGet: () => Exit.Exit<C, E0 | E | E2 | E3> = () =>
    Option.getOrThrowWith(this._currentValue, () => new Cause.NoSuchElementException())

  static make<R0, E0, A, E, R, E2, R2, C, E3, R3>(
    input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<C, E3, R3>
  ): Computed<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3> {
    return new ComputedImpl(input, f)
  }
}

class FilteredImpl<R0, E0, A, E, R, E2, R2, C, E3, R3> extends Versioned.VersionedTransform<
  R0,
  E0,
  A,
  E,
  R,
  A,
  E2,
  R2,
  C,
  E0 | E | E2 | E3,
  Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
  C,
  E0 | E | E2 | E3 | Cause.NoSuchElementException,
  R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3
> implements Filtered<C, E0 | E | E2 | E3, R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3> {
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  constructor(
    readonly input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    readonly f: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>
  ) {
    super(
      input,
      (fx) => share.hold(core.filterMapEffect(fx, f)) as any,
      (effect) => Effect.flatten(Effect.flatMap(effect, f))
    )
  }

  static make<R0, E0, A, E, R, E2, R2, C, E3, R3>(
    input: Versioned.Versioned<R0, E0, A, E, R, A, E2, R2>,
    f: (a: A) => Effect.Effect<Option.Option<C>, E3, R3>
  ): Filtered<
    C,
    E0 | E | Exclude<E2, Cause.NoSuchElementException> | E3,
    R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3
  > {
    return new FilteredImpl(input, f) as any
  }

  asComputed(): Computed<Option.Option<C>, E0 | E | E2 | E3, R0 | R2 | R3 | Exclude<R, Scope.Scope>> {
    return ComputedImpl.make(this.input, this.f)
  }

  unsafeGet: () => Exit.Exit<C, Cause.NoSuchElementException | E0 | E | E2 | E3> = () =>
    Option.getOrThrowWith(this._currentValue, () => new Cause.NoSuchElementException())
}

/**
 * @since 1.20.0
 */
export const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): {
    <E, R>(ref: RefSubject<A, E, R> | Computed<A, E, R>): Computed<A, E, R>
    <E, R>(ref: Filtered<A, E, R>): Filtered<A, E, R>
  }

  <A, E, R>(
    ref: RefSubject<A, E, R> | Computed<A, E, R>,
    eq: Equivalence.Equivalence<A>
  ): Computed<A, E, R>
  <A, E, R>(
    ref: Filtered<A, E, R>,
    eq: Equivalence.Equivalence<A>
  ): Filtered<A, E, R>

  <A, E, R>(
    ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
    eq: Equivalence.Equivalence<A>
  ): Computed<A, E, R> | Filtered<A, E, R>
} = dual(2, function skipRepeatsWith<A, E, R>(
  ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
  eq: Equivalence.Equivalence<A>
): Computed<A, E, R> | Filtered<A, E, R> {
  const versioned = Versioned.transform(ref, (fx) => core.skipRepeatsWith(fx, eq), identity)

  if (FilteredTypeId in ref) {
    return FilteredImpl.make(versioned, Effect.succeedSome)
  } else {
    return ComputedImpl.make(versioned, Effect.succeed) as any
  }
})

/**
 * @since 1.20.0
 */
export function skipRepeats<A, E, R>(
  ref: RefSubject<A, E, R> | Computed<A, E, R>
): Computed<A, E, R>

export function skipRepeats<A, E, R>(
  ref: Filtered<A, E, R>
): Filtered<A, E, R>

export function skipRepeats<A, E, R>(
  ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>
): Computed<A, E, R> | Filtered<A, E, R>

export function skipRepeats<A, E, R>(
  ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>
): Computed<A, E, R> | Filtered<A, E, R> {
  return skipRepeatsWith(ref, Equal.equals)
}

/**
 * @since 1.20.0
 */
export function transform<A, E, R, B>(
  ref: RefSubject<A, E, R>,
  from: (a: A) => B,
  to: (b: B) => A
): RefSubject<B, E, R> {
  return new RefSubjectTransform(ref, from, to)
}

/**
 * @since 1.20.0
 */
export function transformOrFail<R, E, A, E2, R2, R3, E3, B>(
  ref: RefSubject<A, E, R>,
  from: (a: A) => Effect.Effect<B, E2, R2>,
  to: (b: B) => Effect.Effect<A, E3, R3>
): RefSubject<B, E | E2 | E3, R | R2 | R3> {
  return new RefSubjectTransformEffect(ref, from, to)
}

class RefSubjectTransform<A, E, R, B> extends FxEffectBase<B, E, R | Scope.Scope, B, E, R>
  implements RefSubject<B, E, R>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<number, E, R>
  readonly interrupt: Effect.Effect<void, never, R>
  readonly subscriberCount: Effect.Effect<number, never, R>

  constructor(
    readonly ref: RefSubject<A, E, R>,
    readonly from: (a: A) => B,
    readonly to: (b: B) => A
  ) {
    super()

    this.version = ref.version
    this.interrupt = ref.interrupt
    this.subscriberCount = ref.subscriberCount
  }

  run<R2 = never>(sink: Sink.Sink<B, E, R2>): Effect.Effect<unknown, never, R | Scope.Scope | R2> {
    return this.ref.run(Sink.map(sink, this.from))
  }

  runUpdates<E2, R2, C>(
    run: (ref: GetSetDelete<B, E, R>) => Effect.Effect<C, E2, R2>
  ) {
    return this.ref.runUpdates((ref) =>
      run({
        get: Effect.map(ref.get, this.from),
        set: (b) => Effect.map(ref.set(this.to(b)), this.from),
        delete: Effect.map(ref.delete, Option.map(this.from))
      })
    )
  }

  unsafeGet: () => Exit.Exit<B, E> = () => {
    const exit = this.ref.unsafeGet()
    return Exit.map(exit, this.from)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.ref.onFailure(cause)
  }

  onSuccess(value: B): Effect.Effect<unknown, never, R> {
    return this.ref.onSuccess(this.to(value))
  }

  toEffect(): Effect.Effect<B, E, R> {
    return Effect.map(this.ref, this.from)
  }
}

class RefSubjectTransformEffect<A, E, R, B, E2, R2, R3, E3>
  extends FxEffectBase<B, E | E2 | E3, R | R2 | R3 | Scope.Scope, B, E | E2, R | R2 | R3>
  implements RefSubject<B, E | E2 | E3, R | R2 | R3>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<number, E, R>
  readonly interrupt: Effect.Effect<void, never, R>
  readonly subscriberCount: Effect.Effect<number, never, R>
  readonly subject: Subject.HoldSubjectImpl<B, E | E2 | E3>

  constructor(
    readonly ref: RefSubject<A, E, R>,
    readonly from: (a: A) => Effect.Effect<B, E2, R2>,
    readonly to: (b: B) => Effect.Effect<A, E3, R3>
  ) {
    super()

    this.version = ref.version
    this.interrupt = ref.interrupt
    this.subscriberCount = ref.subscriberCount
    this.subject = new Subject.HoldSubjectImpl()
  }

  run<R4 = never>(sink: Sink.Sink<B, E | E2 | E3, R4>): Effect.Effect<unknown, never, R | R2 | R3 | Scope.Scope | R4> {
    return core.skipRepeats(
      core.merge(core.tapEffect(core.mapEffect(this.ref, this.from), this.subject.onSuccess), this.subject)
    ).run(
      sink
    )
  }

  runUpdates<R4, E4, C>(
    run: (ref: GetSetDelete<B, E | E2 | E3, R | R2 | R3>) => Effect.Effect<C, E4, R4>
  ) {
    return this.ref.runUpdates((ref) =>
      run({
        get: Effect.flatMap(ref.get, this.from),
        set: (b: B) =>
          Effect.matchCauseEffect(Effect.flatMap(this.to(b), ref.set), {
            onFailure: (cause) => Effect.as(this.subject.onFailure(cause), b),
            onSuccess: () => Effect.as(this.subject.onSuccess(b), b)
          }),
        delete: Effect.flatMap(
          ref.delete,
          Option.match({
            onNone: () => Effect.succeedNone,
            onSome: (b) => Effect.asSome(this.from(b))
          })
        )
      })
    )
  }

  unsafeGet: () => Exit.Exit<B, E | E2 | E3> = () => {
    return Option.getOrThrowWith(MutableRef.get(this.subject.lastValue), () => new Cause.NoSuchElementException())
  }

  onFailure(cause: Cause.Cause<E | E2 | E3>): Effect.Effect<unknown, never, R> {
    return this.subject.onFailure(cause)
  }

  onSuccess(value: B): Effect.Effect<unknown, never, R | R3> {
    return Effect.matchCauseEffect(this.to(value), {
      onFailure: (cause) => this.subject.onFailure(cause),
      onSuccess: (a) => this.ref.onSuccess(a)
    })
  }

  toEffect(): Effect.Effect<B, E | E2, R | R2> {
    return Effect.flatMap(this.ref, this.from)
  }
}

/**
 * @since 1.20.0
 */
export function tuple<
  const Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
>(refs: Refs): TupleFrom<Refs> {
  const kind = getRefKind(refs)
  switch (kind) {
    case "r":
      return makeTupleRef(refs as any) as TupleFrom<Refs>
    case "c":
      return makeTupleComputed(refs as any) as TupleFrom<Refs>
    case "f":
      return makeTupleFiltered(refs as any) as any as TupleFrom<Refs>
  }
}

type RefKind = "r" | "c" | "f"

const join = (a: RefKind, b: RefKind) => {
  if (a === "r") return b
  if (b === "r") return a
  if (a === "f") return a
  if (b === "f") return b
  return "c"
}

function getRefKind<
  const Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
>(refs: Refs): RefKind {
  let kind: RefKind = "r"

  for (const ref of refs) {
    if (FilteredTypeId in ref) {
      kind = "f"
      break
    } else if (!(RefSubjectTypeId in ref)) {
      kind = join(kind, "c")
    }
  }

  return kind
}

/**
 * @since 1.20.0
 */
export type TupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = {
  "c": [ComputedTupleFrom<Refs>] extends [Computed<infer A, infer E, infer R>] ? Computed<A, E, R> : never
  "f": [FilteredTupleFrom<Refs>] extends [Filtered<infer A, infer E, infer R>] ? Filtered<A, E, R> : never
  "r": [RefSubjectTupleFrom<Refs>] extends [RefSubject<infer A, infer E, infer R>] ? RefSubject<A, E, R> : never
}[GetTupleKind<Refs>]

type Ref = RefSubject.Any | Computed.Any | Filtered.Any

/**
 * @since 1.20.0
 */
export type GetTupleKind<Refs extends ReadonlyArray<Ref>, Kind extends RefKind = "r"> = Refs extends
  readonly [infer Head extends Ref, ...infer Tail extends ReadonlyArray<Ref>] ?
  GetTupleKind<Tail, MergeKind<Kind, MatchKind<Head>>>
  : Kind

/**
 * @since 1.20.0
 */
export type MatchKind<T extends Ref> = [T] extends [Filtered.Any] ? "f"
  : [T] extends [RefSubject.Any] ? "r"
  : "c"

type MergeKind<A extends RefKind, B extends RefKind> = A extends "f" ? A
  : B extends "f" ? B
  : A extends "r" ? B
  : B extends "r" ? A
  : "c"

type FilteredTupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = Filtered<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Fx.Error<Refs[number]>,
  Effect.Effect.Context<Refs[number]>
>

type ComputedTupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = Computed<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[number]>,
  Effect.Effect.Context<Refs[number]>
>

type RefSubjectTupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = RefSubject<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[number]>,
  Effect.Effect.Context<Refs[number]>
>

function makeTupleRef<
  const Refs extends ReadonlyArray<RefSubject<any, any, any>>
>(refs: Refs): RefSubjectTupleFrom<Refs> {
  return new RefSubjectTuple(refs)
}

class RefSubjectTuple<
  const Refs extends ReadonlyArray<RefSubject<any, any, any>>
> extends FxEffectBase<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[number]>,
  Effect.Effect.Context<Refs[number]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[number]>,
  Effect.Effect.Context<Refs[number]>
> implements RefSubjectTupleFrom<Refs> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<number, Effect.Effect.Error<Refs[number]>, Effect.Effect.Context<Refs[number]>>
  readonly interrupt: Effect.Effect<void, never, Effect.Effect.Context<Refs[number]>>
  readonly subscriberCount: Effect.Effect<number, never, Effect.Effect.Context<Refs[number]>>

  private versioned: Versioned.Versioned<
    Effect.Effect.Context<Refs[number]>,
    Effect.Effect.Error<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[number]>,
    Effect.Effect.Context<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[number]>,
    Effect.Effect.Context<Refs[number]>
  >

  private getSetDelete: GetSetDelete<
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[number]>,
    Effect.Effect.Context<Refs[number]>
  >

  constructor(
    readonly refs: Refs
  ) {
    super()

    this.versioned = Versioned.hold(Versioned.tuple(refs)) as any
    this.version = this.versioned.version
    this.interrupt = Effect.all(refs.map((r) => r.interrupt), UNBOUNDED)
    this.subscriberCount = Effect.map(
      Effect.all(refs.map((r) => r.subscriberCount), UNBOUNDED),
      Array.reduce(0, sum)
    )

    this.getSetDelete = {
      get: this.versioned,
      set: (a) => Effect.all(refs.map((r, i) => set(r, a[i])), UNBOUNDED) as any,
      delete: Effect.map(Effect.all(refs.map((r) => reset(r)), UNBOUNDED), Option.all) as any
    }

    this.runUpdates = this.runUpdates.bind(this)
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  run<R2 = never>(
    sink: Sink.Sink<
      {
        readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
      },
      Effect.Effect.Error<Refs[number]>,
      R2
    >
  ): Effect.Effect<unknown, never, Effect.Effect.Context<Refs[number]> | R2> {
    return this.versioned.run(sink)
  }

  toEffect(): Effect.Effect<
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[number]>,
    Effect.Effect.Context<Refs[number]>
  > {
    return this.versioned
  }

  runUpdates<E2, R2, C>(
    run: (
      ref: GetSetDelete<
        {
          readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
        },
        Effect.Effect.Error<Refs[number]>,
        Effect.Effect.Context<Refs[number]>
      >
    ) => Effect.Effect<C, E2, R2>
  ) {
    return run(this.getSetDelete)
  }

  unsafeGet: () => Exit.Exit<
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[number]>
  > = () => {
    return Option.getOrThrowWith(
      Exit.all(this.refs.map((r) => r.unsafeGet())) as Option.Option<
        Exit.Exit<
          { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
          Effect.Effect.Error<Refs[number]>
        >
      >,
      () => new Cause.NoSuchElementException()
    )
  }

  onFailure(
    cause: Cause.Cause<Effect.Effect.Error<Refs[number]>>
  ): Effect.Effect<unknown, never, Effect.Effect.Context<Refs[number]>> {
    return Effect.all(this.refs.map((ref) => ref.onFailure(cause)))
  }

  onSuccess(
    value: { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  ): Effect.Effect<unknown, never, Effect.Effect.Context<Refs[number]>> {
    return Effect.catchAllCause(this.getSetDelete.set(value), (c) => this.onFailure(c))
  }
}

function makeTupleComputed<
  const Refs extends ReadonlyArray<Computed<any, any, any>>
>(refs: Refs): ComputedTupleFrom<Refs> {
  return new ComputedImpl(Versioned.tuple(refs) as any, Effect.succeed) as any
}

function makeTupleFiltered<
  const Refs extends ReadonlyArray<Computed<any, any, any> | Filtered<any, any, any>>
>(refs: Refs): FilteredTupleFrom<Refs> {
  return new FilteredImpl(Versioned.tuple(refs) as any, Effect.succeedSome) as any
}

/**
 * @since 1.20.0
 */
export function struct<
  const Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
>(refs: Refs): StructFrom<Refs> {
  const kind = getRefKind(Object.values(refs))
  switch (kind) {
    case "r":
      return makeStructRef(refs as any) as StructFrom<Refs>
    case "c":
      return makeStructComputed(refs as any) as StructFrom<Refs>
    case "f":
      return makeStructFiltered(refs as any) as any as StructFrom<Refs>
  }
}

function makeStructRef<
  const Refs extends Readonly<Record<string, RefSubject.Any>>
>(refs: Refs): RefSubjectStructFrom<Refs> {
  return new RefSubjectStruct(refs)
}

class RefSubjectStruct<
  const Refs extends Readonly<Record<string, RefSubject.Any>>
> extends FxEffectBase<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[keyof Refs]>,
  Effect.Effect.Context<Refs[keyof Refs]> | Scope.Scope,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[keyof Refs]>,
  Effect.Effect.Context<Refs[keyof Refs]>
> implements
  RefSubject<
    {
      readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
    },
    Effect.Effect.Error<Refs[keyof Refs]>,
    Effect.Effect.Context<Refs[keyof Refs]>
  >
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<
    number,
    Effect.Effect.Error<Refs[keyof Refs]>,
    Effect.Effect.Context<Refs[keyof Refs]>
  >
  readonly interrupt: Effect.Effect<void, never, Effect.Effect.Context<Refs[keyof Refs]>>
  readonly subscriberCount: Effect.Effect<number, never, Effect.Effect.Context<Refs[keyof Refs]>>

  private versioned: Versioned.Versioned<
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[keyof Refs]>,
    Effect.Effect.Context<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[keyof Refs]>,
    Effect.Effect.Context<Refs[keyof Refs]>
  >

  private getSetDelete: GetSetDelete<
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[keyof Refs]>,
    Effect.Effect.Context<Refs[keyof Refs]>
  >

  constructor(
    readonly refs: Refs
  ) {
    super()

    this.versioned = Versioned.hold(Versioned.struct(refs)) as any
    this.version = this.versioned.version
    this.interrupt = Effect.all(Object.values(refs).map((r) => r.interrupt), UNBOUNDED)
    this.subscriberCount = Effect.map(
      Effect.all(Object.values(refs).map((r) => r.subscriberCount), UNBOUNDED),
      Array.reduce(0, sum)
    )

    this.getSetDelete = {
      get: this.versioned,
      set: (a) => Effect.all(Object.keys(refs).map((k) => set(refs[k] as any, a[k])), UNBOUNDED) as any,
      delete: Effect.map(Effect.all(Object.values(refs).map((r) => reset(r as any)), UNBOUNDED), Option.all) as any
    }

    this.runUpdates = this.runUpdates.bind(this)
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  run<R3 = never>(
    sink: Sink.Sink<
      { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
      Effect.Effect.Error<Refs[keyof Refs]>,
      R3
    >
  ): Effect.Effect<unknown, never, Effect.Effect.Context<Refs[keyof Refs]> | R3> {
    return this.versioned.run(sink)
  }

  toEffect(): Effect.Effect<
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[keyof Refs]>,
    Effect.Effect.Context<Refs[keyof Refs]>
  > {
    return this.versioned
  }

  runUpdates<E2, R2, C>(
    run: (
      ref: GetSetDelete<
        {
          readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
        },
        Effect.Effect.Error<Refs[keyof Refs]>,
        Effect.Effect.Context<Refs[keyof Refs]>
      >
    ) => Effect.Effect<C, E2, R2>
  ) {
    return run(this.getSetDelete)
  }

  unsafeGet: () => Exit.Exit<
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Error<Refs[keyof Refs]>
  > = () => {
    const entries = Object.entries(this.refs).map(([k, r]) => Exit.map(r.unsafeGet(), (a) => [k, a] as const))
    const exit = Option.getOrThrowWith(
      Exit.all(entries) as Option.Option<
        Exit.Exit<
          ReadonlyArray<readonly [string, Effect.Effect.Success<Refs[keyof Refs]>]>,
          Effect.Effect.Error<Refs[keyof Refs]>
        >
      >,
      () => new Cause.NoSuchElementException()
    )

    return Exit.map(exit, (entries) => Object.fromEntries(entries)) as any
  }

  onFailure(
    cause: Cause.Cause<Effect.Effect.Error<Refs[keyof Refs]>>
  ): Effect.Effect<unknown, never, Effect.Effect.Context<Refs[keyof Refs]>> {
    return Effect.all(Object.values(this.refs).map((ref) => ref.onFailure(cause as any)))
  }

  onSuccess(
    value: { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  ): Effect.Effect<unknown, never, Effect.Effect.Context<Refs[keyof Refs]>> {
    return Effect.catchAllCause(this.getSetDelete.set(value), (c) => this.onFailure(c))
  }
}

function makeStructComputed<
  const Refs extends Readonly<Record<string, Computed<any, any, any>>>
>(refs: Refs): ComputedStructFrom<Refs> {
  return new ComputedImpl(Versioned.struct(refs) as any, Effect.succeed) as any
}

function makeStructFiltered<
  const Refs extends Readonly<Record<string, Computed<any, any, any> | Filtered<any, any, any>>>
>(refs: Refs): FilteredStructFrom<Refs> {
  return new FilteredImpl(Versioned.struct(refs) as any, Effect.succeedSome) as any
}

type StructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
> = {
  "c": [ComputedStructFrom<Refs>] extends [Computed<infer A, infer E, infer R>] ? Computed<A, E, R> : never
  "f": [FilteredStructFrom<Refs>] extends [Filtered<infer A, infer E, infer R>] ? Filtered<A, E, R> : never
  "r": [RefSubjectStructFrom<Refs>] extends [RefSubject<infer A, infer E, infer R>] ? RefSubject<A, E, R> : never
}[GetStructKind<Refs>]

/**
 * @since 1.20.0
 */
export type GetStructKind<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
> = MergeKinds<
  UnionToTuple<
    {
      [K in keyof Refs]: MatchKind<Refs[K]>
    }[keyof Refs]
  >
>

type MergeKinds<Kinds extends ReadonlyArray<any>> = Kinds extends
  readonly [infer Head extends RefKind, ...infer Tail extends ReadonlyArray<RefKind>] ?
  MergeKind<Head, MergeKinds<Tail>>
  : "r"

type FilteredStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
> = Filtered<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Fx.Error<Refs[keyof Refs]>,
  Effect.Effect.Context<Refs[keyof Refs]>
>

type ComputedStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
> = Computed<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[keyof Refs]>,
  Effect.Effect.Context<Refs[keyof Refs]>
>

type RefSubjectStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
> = RefSubject<
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Error<Refs[keyof Refs]>,
  Effect.Effect.Context<Refs[keyof Refs]>
>

/**
 * @since 1.20.0
 */
export function tagged<A, E = never>(replay?: number): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
} {
  return <const I>(identifier: I) => new RefSubjectTagged(C.Tagged<I, RefSubject<A, E>>(identifier), replay)
}

class RefSubjectTagged<I, E, A> extends FxEffectBase<
  A,
  E,
  I | Scope.Scope,
  A,
  E,
  I
> implements RefSubject.Tagged<I, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<number, E, I>
  readonly interrupt: Effect.Effect<void, never, I>
  readonly subscriberCount: Effect.Effect<number, never, I>

  constructor(
    readonly tag: C.Tagged<I, RefSubject<A, E>>,
    readonly replay: number = 0
  ) {
    super()

    this.version = tag.withEffect((ref) => ref.version)
    this.interrupt = tag.withEffect((ref) => ref.interrupt)
    this.subscriberCount = tag.withEffect((ref) => ref.subscriberCount)

    this.runUpdates = this.runUpdates.bind(this)
    this.onFailure = this.onFailure.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
  }

  run<R2 = never>(
    sink: Sink.Sink<A, E, R2>
  ): Effect.Effect<unknown, never, I | R2 | Scope.Scope> {
    return this.tag.withEffect((ref) => ref.run(sink))
  }

  toEffect(): Effect.Effect<A, E, I> {
    return this.tag.withEffect((ref) => ref)
  }

  runUpdates<E2, R2, C>(
    run: (ref: GetSetDelete<A, E, I>) => Effect.Effect<C, E2, R2>
  ): Effect.Effect<C, E2, I | R2> {
    return this.tag.withEffect((ref) => ref.runUpdates(run))
  }

  unsafeGet: () => Exit.Exit<A, E> = () => {
    throw new Error(`Unable to unsafely get a tagged RefSubject because it requires the Effect context by defnition.`)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, I> {
    return this.tag.withEffect((ref) => ref.onFailure(cause))
  }

  onSuccess(value: A): Effect.Effect<unknown, never, I> {
    return this.tag.withEffect((ref) => ref.onSuccess(value))
  }

  layer = <E2, R2>(make: Effect.Effect<RefSubject<A, E>, E2, R2 | Scope.Scope>): Layer.Layer<I, E2, R2> =>
    this.tag.scoped(make)

  make = <R>(
    fxOrEffect: Fx<A, E, R | Scope.Scope> | Effect.Effect<A, E, R | Scope.Scope>,
    options?: RefSubjectOptions<A> & { readonly drop?: number; readonly take?: number }
  ): Layer.Layer<I, never, R> => {
    return this.tag.scoped(Effect.gen(function*(_) {
      let ref = yield* make(fxOrEffect, options)

      if (options?.drop || options?.take) {
        ref = slice(ref, options.drop ?? 0, options.take ?? Infinity)
      }

      return ref
    }))
  }
}

/**
 * @since 1.20.0
 */
export function fromTag<I, S, A, E, R>(
  tag: C.Tag<I, S>,
  f: (s: S) => RefSubject<A, E, R>
): RefSubject<A, E, I | R> {
  return new RefSubjectFromTag(tag, f)
}

class RefSubjectFromTag<I, S, A, E, R> extends FxEffectBase<
  A,
  E,
  I | R | Scope.Scope,
  A,
  E,
  I | R
> implements RefSubject<A, E, R | I> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<number, E, I | R>
  readonly interrupt: Effect.Effect<void, never, I | R>
  readonly subscriberCount: Effect.Effect<number, never, I | R>

  private _get: Effect.Effect<RefSubject<A, E, R>, never, I>
  private _fx: Fx<A, E, I | R | Scope.Scope>

  constructor(
    readonly tag: C.Tag<I, S>,
    readonly f: (s: S) => RefSubject<A, E, R>
  ) {
    super()

    this._get = Effect.map(tag, f)
    this._fx = core.fromFxEffect(this._get)

    this.version = Effect.flatMap(this._get, (ref) => ref.version)
    this.interrupt = Effect.flatMap(this._get, (ref) => ref.interrupt)
    this.subscriberCount = Effect.flatMap(this._get, (ref) => ref.subscriberCount)
  }

  run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<unknown, never, I | R | R3 | Scope.Scope> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<A, E, I | R> {
    return Effect.flatten(this._get)
  }

  runUpdates<E2, R2, C>(
    run: (ref: GetSetDelete<A, E, R | I>) => Effect.Effect<C, E2, R2>
  ): Effect.Effect<C, E2, I | R | R2> {
    return Effect.flatMap(this._get, (ref) => ref.runUpdates(run))
  }

  unsafeGet: () => Exit.Exit<A, E> = () => {
    throw new Error(`Unable to unsafely get a tagged RefSubject because it requires the Effect context by defnition.`)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, I | R> {
    return Effect.flatMap(this._get, (ref) => ref.onFailure(cause))
  }

  onSuccess(value: A): Effect.Effect<unknown, never, I | R> {
    return Effect.flatMap(this._get, (ref) => ref.onSuccess(value))
  }
}

/**
 * @since 1.20.0
 */
export function isRefSubject<A, E, R>(u: unknown): u is RefSubject<A, E, R>
export function isRefSubject(u: unknown): u is RefSubject.Any
export function isRefSubject(u: unknown): u is RefSubject.Any {
  return isObjectLike(u) && RefSubjectTypeId in u
}

/**
 * @since 1.20.0
 */
export function isComputed<A, E, R>(u: unknown): u is Computed<A, E, R>
export function isComputed(u: unknown): u is Computed.Any
export function isComputed(u: unknown): u is Computed.Any {
  return isObjectLike(u) && ComputedTypeId in u
}

/**
 * @since 1.20.0
 */
export function isFiltered<A, E, R>(u: unknown): u is Filtered<A, E, R>
export function isFiltered(u: unknown): u is Filtered.Any
export function isFiltered(u: unknown): u is Filtered.Any {
  return isObjectLike(u) && FilteredTypeId in u
}

/**
 * @since 1.20.0
 */
export function isDerived<A, E, R>(u: unknown): u is RefSubject.Derived<A, E, R>
export function isDerived(u: unknown): u is RefSubject.Derived<unknown, unknown, unknown>
export function isDerived(u: unknown): u is RefSubject.Derived<unknown, unknown, unknown> {
  return isRefSubject(u) && "persist" in u
}

function isObjectLike(u: unknown): u is object {
  if (u == null) return false

  const type = typeof u

  return (type === "object" && !Array.isArray(u)) || type === "function"
}

/**
 * @since 1.20.0
 */
export function computedFromTag<I, S, A, E, R>(
  tag: C.Tag<I, S>,
  f: (s: S) => Computed<A, E, R>
): Computed<A, E, I | R> {
  return new ComputedFromTag(tag, f)
}

class ComputedFromTag<I, S, A, E, R> extends FxEffectBase<
  A,
  E,
  I | R | Scope.Scope,
  A,
  E,
  I | R
> implements Computed<A, E, R | I> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  readonly version: Effect.Effect<number, E, I | R>

  private _get: Effect.Effect<Computed<A, E, R>, never, I>

  constructor(
    readonly tag: C.Tag<I, S>,
    readonly f: (s: S) => Computed<A, E, R>
  ) {
    super()

    this._get = Effect.map(tag, f)
    this.version = Effect.flatMap(this._get, (ref) => ref.version)
  }

  run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<unknown, never, I | R | Scope.Scope | R3> {
    return Effect.flatMap(this._get, (ref) => ref.run(sink))
  }

  toEffect(): Effect.Effect<A, E, I | R> {
    return Effect.flatten(this._get)
  }

  unsafeGet: () => Exit.Exit<A, E> = () => {
    throw new Error(`Unable to unsafely get a tagged Computed because it requires the Effect context by defnition.`)
  }
}

/**
 * @since 1.20.0
 */
export function filteredFromTag<I, S, A, E, R>(
  tag: C.Tag<I, S>,
  f: (s: S) => Filtered<A, E, R>
): Filtered<A, E, R | I> {
  return new FilteredFromTag(tag, f)
}

class FilteredFromTag<I, S, A, E, R> extends FxEffectBase<
  A,
  E,
  I | R | Scope.Scope,
  A,
  E | Cause.NoSuchElementException,
  I | R
> implements Filtered<A, E, R | I> {
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  readonly version: Effect.Effect<number, E, I | R>

  private _get: Effect.Effect<Filtered<A, E, R>, never, I>

  constructor(
    readonly tag: C.Tag<I, S>,
    readonly f: (s: S) => Filtered<A, E, R>
  ) {
    super()

    this._get = Effect.map(tag, f)
    this.version = Effect.flatMap(this._get, (ref) => ref.version)
  }

  run<R3>(sink: Sink.Sink<A, E, R3>): Effect.Effect<unknown, never, I | R | Scope.Scope | R3> {
    return Effect.flatMap(this._get, (ref) => ref.run(sink))
  }

  toEffect(): Effect.Effect<A, E | Cause.NoSuchElementException, I | R> {
    return Effect.flatten(this._get)
  }

  asComputed(): Computed<Option.Option<A>, E, R | I> {
    return new ComputedFromTag(this.tag, (s) => this.f(s).asComputed())
  }

  unsafeGet: () => Exit.Exit<A, E> = () => {
    throw new Error(`Unable to unsafely get a tagged Filtered because it requires the Effect context by defnition.`)
  }
}

/**
 * @since 1.20.0
 */
export const provide: {
  <S>(context: C.Context<S> | Runtime.Runtime<S>): {
    <A, E, R>(filtered: Filtered<A, E, R>): Filtered<A, E, Exclude<R, S>>
    <A, E, R>(computed: Computed<A, E, R>): Computed<A, E, Exclude<R, S>>
    <A, E, R>(ref: RefSubject<A, E, R>): RefSubject<A, E, Exclude<R, S>>
  }

  <R2, S>(layer: Layer.Layer<S, never, R2>): {
    <A, E, R>(filtered: Filtered<A, E, R>): Filtered<A, E, Exclude<R, S> | R2>
    <A, E, R>(computed: Computed<A, E, R>): Computed<A, E, Exclude<R, S> | R2>
    <A, E, R>(ref: RefSubject<A, E, R>): RefSubject<A, E, Exclude<R, S> | R2>
  }

  <A, E, R, S>(
    filtered: Filtered<A, E, R>,
    context: C.Context<S> | Runtime.Runtime<S>
  ): Filtered<A, E, Exclude<R, S>>
  <A, E, R, S>(
    computed: Computed<A, E, R>,
    context: C.Context<S> | Runtime.Runtime<S>
  ): Computed<A, E, Exclude<R, S>>
  <A, E, R, S>(
    ref: RefSubject<A, E, R>,
    context: C.Context<S> | Runtime.Runtime<S>
  ): RefSubject<A, E, Exclude<R, S>>

  <A, E, R, R2, S>(filtered: Filtered<A, E, R>, layer: Layer.Layer<S, never, R2>): Filtered<A, E, Exclude<R, S> | R2>
  <A, E, R, R2, S>(computed: Computed<A, E, R>, layer: Layer.Layer<S, never, R2>): Computed<A, E, Exclude<R, S> | R2>
  <A, E, R, R2, S>(ref: RefSubject<A, E, R>, layer: Layer.Layer<S, never, R2>): RefSubject<A, E, Exclude<R, S> | R2>
} = dual(2, function provide<A, E, R, R2 = never, S = never>(
  ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>,
  providing: Layer.Layer<S, never, R2> | C.Context<S> | Runtime.Runtime<S>
) {
  const layer = Layer.isLayer(providing)
    ? providing as Layer.Layer<S, never, R2>
    : C.isContext(providing)
    ? Layer.succeedContext(providing)
    : runtimeToLayer(providing as Runtime.Runtime<S>)

  if (isComputed(ref)) {
    return ComputedImpl.make(Versioned.provide(ref, layer), Effect.succeed) as any
  } else if (isFiltered(ref)) {
    return FilteredImpl.make(Versioned.provide(ref, layer), Effect.succeedSome) as any
  } else {
    return new RefSubjectProvide(ref, layer)
  }
})

class RefSubjectProvide<A, E, R, R2, S> extends FxEffectBase<
  A,
  E,
  Exclude<R, S> | R2 | Scope.Scope,
  A,
  E,
  Exclude<R, S> | R2
> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly interrupt: Effect.Effect<void, never, Exclude<R, S> | R2>
  readonly subscriberCount: Effect.Effect<number, never, Exclude<R, S> | R2>

  constructor(
    readonly ref: RefSubject<A, E, R>,
    readonly layer: Layer.Layer<S, never, R2>
  ) {
    super()

    this.interrupt = Effect.provide(ref.interrupt, layer)
    this.subscriberCount = Effect.provide(ref.subscriberCount, layer)
  }

  run<R3>(
    sink: Sink.Sink<A, E, R3>
  ): Effect.Effect<unknown, never, R2 | Scope.Scope | Exclude<Scope.Scope, S> | Exclude<R, S> | Exclude<R3, S>> {
    return Effect.provide(this.ref.run(sink), this.layer)
  }

  toEffect(): Effect.Effect<A, E, Exclude<R, S> | R2> {
    return Effect.provide(this.ref, this.layer)
  }
}

/**
 * Set the value to true
 * @since 1.18.0
 */
export const asTrue: <E, R>(ref: RefSubject<boolean, E, R>) => Effect.Effect<boolean, E, R> = <E, R>(
  ref: RefSubject<boolean, E, R>
) => set(ref, true)

/**
 * Set the value to false
 * @since 1.18.0
 */
export const asFalse: <E, R>(ref: RefSubject<boolean, E, R>) => Effect.Effect<boolean, E, R> = <E, R>(
  ref: RefSubject<boolean, E, R>
) => set(ref, false)

/**
 * Toggle the boolean value between true and false
 * @since 1.18.0
 */
export const toggle: <E, R>(ref: RefSubject<boolean, E, R>) => Effect.Effect<boolean, E, R> = <E, R>(
  ref: RefSubject<boolean, E, R>
) => update(ref, Boolean.not)

const add = (x: number): number => x + 1

/**
 * Set the value to true
 * @since 1.18.0
 */
export const increment: <E, R>(ref: RefSubject<number, E, R>) => Effect.Effect<number, E, R> = <E, R>(
  ref: RefSubject<number, E, R>
) => update(ref, add)

const sub = (x: number): number => x - 1

/**
 * Set the value to false
 * @since 1.18.0
 */
export const decrement: <E, R>(ref: RefSubject<number, E, R>) => Effect.Effect<number, E, R> = <E, R>(
  ref: RefSubject<number, E, R>
) => update(ref, sub)

/**
 * @since 1.20.0
 */
export const slice: {
  (drop: number, take: number): <A, E, R>(ref: RefSubject<A, E, R>) => RefSubject<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, drop: number, take: number): RefSubject<A, E, R>
} = dual(
  3,
  function slice<A, E, R>(ref: RefSubject<A, E, R>, drop: number, take: number): RefSubject<A, E, R> {
    return new RefSubjectSlice(ref, drop, take)
  }
)

/**
 * @since 1.20.0
 */
export const drop: {
  (drop: number): <A, E, R>(ref: RefSubject<A, E, R>) => RefSubject<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, drop: number): RefSubject<A, E, R>
} = dual(2, function drop<A, E, R>(ref: RefSubject<A, E, R>, drop: number): RefSubject<A, E, R> {
  return slice(ref, drop, Infinity)
})

/**
 * @since 1.20.0
 */
export const take: {
  (take: number): <A, E, R>(ref: RefSubject<A, E, R>) => RefSubject<A, E, R>
  <A, E, R>(ref: RefSubject<A, E, R>, take: number): RefSubject<A, E, R>
} = dual(2, function take<A, E, R>(ref: RefSubject<A, E, R>, take: number): RefSubject<A, E, R> {
  return slice(ref, 0, take)
})

class RefSubjectSlice<A, E, R> extends FxEffectBase<A, E, R | Scope.Scope, A, E, R> implements RefSubject<A, E, R> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<number, E, R>
  readonly interrupt: Effect.Effect<void, never, R>
  readonly subscriberCount: Effect.Effect<number, never, R>
  private _fx: Fx<A, E, Scope.Scope | R>

  constructor(
    readonly ref: RefSubject<A, E, R>,
    readonly drop: number,
    readonly take: number
  ) {
    super()

    this.version = ref.version
    this.interrupt = ref.interrupt
    this.subscriberCount = ref.subscriberCount
    this._fx = share.hold(core.slice(ref, drop, take))
    this._effect = ref
  }

  run<R2>(sink: Sink.Sink<A, E, R2>): Effect.Effect<unknown, never, R | R2 | Scope.Scope> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<A, E, R> {
    return this.ref
  }

  runUpdates<E2, R2, C>(
    run: (ref: GetSetDelete<A, E, R>) => Effect.Effect<C, E2, R2>
  ): Effect.Effect<C, E2, R | R2> {
    return this.ref.runUpdates(run)
  }

  unsafeGet: () => Exit.Exit<A, E> = () => this.ref.unsafeGet()

  onFailure(cause: Cause.Cause<E>): Effect.Effect<unknown, never, R> {
    return this.ref.onFailure(cause)
  }

  onSuccess(value: A): Effect.Effect<unknown, never, R> {
    return this.ref.onSuccess(value)
  }
}

/**
 * Get the current value of the RefSubject. If it has not been set yet, a Fiber will be used to wait for the value to be set.
 *
 * @since 1.25.0
 */
export const get: {
  <A, E = never, R = never>(ref: RefSubject<A, E, R>): Effect.Effect<A, E, R>
  <A, E = never, R = never>(ref: Computed<A, E, R>): Effect.Effect<A, E, R>
  <A, E = never, R = never>(ref: Filtered<A, E, R>): Effect.Effect<A, E | Cause.NoSuchElementException, R>
} = <A, E, R>(
  ref: RefSubject<A, E, R> | Computed<A, E, R> | Filtered<A, E, R>
): Effect.Effect<A, E | Cause.NoSuchElementException, R> => ref

/**
 * Synchronously get the current Exit value of the RefSubject. If it has not been set yet, a Cause.NoSuchElementException will be thrown.
 *
 * Note: This is unimplemented for RefSubject.tagged and RefSubject.fromTag because they require the Effect context by definition.
 * It will throw immediately.
 *
 * @since 1.25.0
 */
export const unsafeGetExit = <A, E = never, R = never>(ref: RefSubject<A, E, R>): Exit.Exit<A, E> => ref.unsafeGet()

/**
 * Synchronously get the current value of the RefSubject.
 *
 * @since 1.25.0
 */
export const unsafeGet = <A, E = never, R = never>(ref: RefSubject<A, E, R>): A => Effect.runSync(unsafeGetExit(ref))
