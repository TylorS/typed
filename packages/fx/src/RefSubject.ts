import * as C from "@typed/context"
import type { Equivalence, Fiber, FiberId, Runtime } from "effect"
import * as Boolean from "effect/Boolean"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Equal from "effect/Equal"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import { dual, identity } from "effect/Function"
import * as Layer from "effect/Layer"
import { sum } from "effect/Number"
import * as Option from "effect/Option"
import * as ReadonlyArray from "effect/ReadonlyArray"
import * as Scope from "effect/Scope"
import type { Fx } from "./Fx.js"
import * as core from "./internal/core.js"
import * as DeferredRef from "./internal/DeferredRef.js"
import { getExitEquivalence, makeForkInScope, withScope } from "./internal/helpers.js"
import { FxEffectBase } from "./internal/protos.js"
import { runtimeToLayer } from "./internal/provide.js"
import * as share from "./internal/share.js"
import type { UnionToTuple } from "./internal/UnionToTuple.js"
import * as Sink from "./Sink.js"
import * as Subject from "./Subject.js"
import { ComputedTypeId, FilteredTypeId, RefSubjectTypeId, TypeId } from "./TypeId.js"
import * as Versioned from "./Versioned.js"

const UNBOUNDED = { concurrency: "unbounded" } as const

export interface Computed<out R, out E, out A> extends Versioned.Versioned<R, E, R | Scope.Scope, E, A, R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId
}

export namespace Computed {
  export type Any =
    | Computed<any, any, any>
    | Computed<never, any, any>
    | Computed<any, never, any>
    | Computed<never, never, any>
}

export interface Filtered<out R, out E, out A>
  extends Versioned.Versioned<R, E, R | Scope.Scope, E, A, R, E | Cause.NoSuchElementException, A>
{
  readonly [FilteredTypeId]: FilteredTypeId

  asComputed(): Computed<R, E, Option.Option<A>>
}

export namespace Filtered {
  export type Any =
    | Filtered<any, any, any>
    | Filtered<never, any, any>
    | Filtered<any, never, any>
    | Filtered<never, never, any>
}

export interface RefSubject<out R, in out E, in out A> extends Computed<R, E, A>, Subject.Subject<R, E, A> {
  readonly [RefSubjectTypeId]: RefSubjectTypeId

  readonly runUpdates: <R2, E2, B>(
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>
  ) => Effect.Effect<R | R2, E2, B>
}

export namespace RefSubject {
  export type Any =
    | RefSubject<any, any, any>
    | RefSubject<never, any, any>
    | RefSubject<any, never, any>
    | RefSubject<never, never, any>

  export interface Tagged<I, E, A> extends RefSubject<I, E, A> {
    readonly tag: C.Tagged<I, RefSubject<never, E, A>>
    readonly make: <R>(fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A>) => Layer.Layer<R, never, I>
  }

  /**
   * A Contextual wrapper around a RefSubject
   * @since 1.18.0
   * @category models
   */
  export interface Derived<R, E, A> extends RefSubject<R, E, A> {
    readonly persist: Effect.Effect<R, never, void>
  }
}

export type Context<T> = Fx.Context<T>

export type Error<T> = Fx.Error<T>

export type Success<T> = Fx.Success<T>

export interface RefSubjectOptions<A> {
  readonly eq?: Equivalence.Equivalence<A>
  readonly replay?: number
  readonly executionStrategy?: ExecutionStrategy.ExecutionStrategy
}

export function fromEffect<R, E, A>(
  effect: Effect.Effect<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> {
  return Effect.map(makeCore(effect, options), (core) => new RefSubjectImpl(core))
}

export function fromFx<R, E, A>(
  fx: Fx<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> {
  return DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals)).pipe(
    Effect.bindTo("deferredRef"),
    Effect.bind("core", ({ deferredRef }) => makeCore(deferredRef, options)),
    Effect.tap(({ core, deferredRef }) =>
      Effect.forkIn(
        fx.run(Sink.make(
          (cause) =>
            Effect.flatMap(Effect.sync(() => deferredRef.done(Exit.failCause(cause))), () =>
              core.subject.onFailure(cause)),
          (value) =>
            Effect.flatMap(Effect.sync(() => deferredRef.done(Exit.succeed(value))), () => setCore(core, value))
        )),
        core.scope
      )
    ),
    Effect.map(({ core }) => new RefSubjectImpl(core))
  )
}

export function fromRefSubject<R, E, A>(
  ref: RefSubject<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject.Derived<never, E, A>> {
  return DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals)).pipe(
    Effect.bindTo("deferredRef"),
    Effect.bind("core", ({ deferredRef }) => makeCore<R, E, A>(deferredRef, options)),
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

function persistCore<R, E, A, R2>(ref: RefSubject<R, E, A>, core: RefSubjectCore<R, E, A, R2>) {
  // Log any errors that fail to persist, but don't fail the consumer
  return Effect.ignoreLogged(Effect.provide(Effect.flatMap(core.deferredRef, (value) => set(ref, value)), core.context))
}

export const make: {
  <R, E, A>(
    ref: RefSubject<R, E, A>,
    options?: RefSubjectOptions<A>
  ): Effect.Effect<R | Scope.Scope, never, RefSubject.Derived<never, E, A>>

  <R, E, A>(
    fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A>,
    options?: RefSubjectOptions<A>
  ): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>>

  <R, E, A>(
    fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A> | RefSubject<R, E, A>,
    options?: RefSubjectOptions<A>
  ): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A> | RefSubject.Derived<never, E, A>>
} = function make<R, E, A>(
  fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A> | RefSubject<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, any> {
  if (RefSubjectTypeId in fxOrEffect) return fromRefSubject(fxOrEffect as RefSubject<R, E, A>, options)
  else if (TypeId in fxOrEffect) return fromFx(fxOrEffect, options)
  else return fromEffect(fxOrEffect, options)
}

export function of<A, E = never>(
  a: A,
  options?: RefSubjectOptions<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, E, A>> {
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

const withScopeAndFiberId = <R, E, A>(
  f: (scope: Scope.CloseableScope, id: FiberId.FiberId) => Effect.Effect<R, E, A>,
  strategy: ExecutionStrategy.ExecutionStrategy
) => Effect.fiberIdWith((id) => withScope((scope) => f(scope, id), strategy))

const emptyContext = C.empty()

export function unsafeMake<E, A>(
  params: {
    readonly id: FiberId.FiberId
    readonly initial: Effect.Effect<never, E, A>
    readonly options?: RefSubjectOptions<A> | undefined
    readonly scope: Scope.CloseableScope
    readonly initialValue?: A
  }
): Effect.Effect<never, never, RefSubject<never, E, A>> {
  const { id, initial, options, scope } = params
  const core = unsafeMakeCore(initial, id, emptyContext, scope, options)

  // Sometimes we might be instantiating directly from a known value
  // Here we seed the value and ensure the subject has it as well for re-broadcasting
  if ("initialValue" in params) {
    core.deferredRef.done(Exit.succeed(params.initialValue))
    return Effect.map(core.subject.onSuccess(params.initialValue), () => new RefSubjectImpl(core))
  }

  return Effect.succeed(new RefSubjectImpl(core))
}

class RefSubjectImpl<R, E, A, R2> extends FxEffectBase<Exclude<R, R2> | Scope.Scope, E, A, Exclude<R, R2>, E, A>
  implements RefSubject<Exclude<R, R2>, E, A>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<never, never, number>
  readonly interrupt: Effect.Effect<Exclude<R, R2>, never, void>
  readonly subscriberCount: Effect.Effect<Exclude<R, R2>, never, number>

  private readonly getSetDelete: GetSetDelete<Exclude<R, R2>, E, A>

  constructor(
    private readonly core: RefSubjectCore<R, E, A, R2>
  ) {
    super()

    this.version = Effect.sync(() => core.deferredRef.version)
    this.interrupt = interruptCore(core)
    this.subscriberCount = Effect.provide(core.subject.subscriberCount, core.context)
    this.getSetDelete = getSetDelete(core)

    this.runUpdates = this.runUpdates.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)
  }

  run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<Exclude<R, R2> | R3 | Scope.Scope, never, unknown> {
    return Effect.matchCauseEffect(this.toEffect(), {
      onFailure: (cause) => sink.onFailure(cause),
      onSuccess: () => Effect.provide(this.core.subject.run(sink), this.core.context)
    })
  }

  runUpdates<R3, E3, B>(
    run: (ref: GetSetDelete<Exclude<R, R2>, E, A>) => Effect.Effect<R3, E3, B>,
    lock: boolean = true
  ) {
    return lock ? this.core.semaphore.withPermits(1)(run(this.getSetDelete)) : run(this.getSetDelete)
  }

  onSuccess(value: A): Effect.Effect<Exclude<R, R2>, never, unknown> {
    return setCore(this.core, value)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<Exclude<R, R2>, never, unknown> {
    return onFailureCore(this.core, cause)
  }

  toEffect(): Effect.Effect<Exclude<R, R2>, E, A> {
    return getOrInitializeCore(this.core, true)
  }
}

class DerivedImpl<R, E, A, R2> extends RefSubjectImpl<R, E, A, R2> implements RefSubject.Derived<Exclude<R, R2>, E, A> {
  constructor(
    core: RefSubjectCore<R, E, A, R2>,
    readonly persist: Effect.Effect<Exclude<R, R2>, never, void>
  ) {
    super(core)
  }
}

export const set: {
  <A>(value: A): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, a: A): Effect.Effect<R, E, A>
} = dual(2, function set<R, E, A>(ref: RefSubject<R, E, A>, a: A): Effect.Effect<R, E, A> {
  return ref.runUpdates((ref) => ref.set(a))
})

export function reset<R, E, A>(ref: RefSubject<R, E, A>): Effect.Effect<R, E, Option.Option<A>> {
  return ref.runUpdates((ref) => ref.delete)
}

export { reset as delete }

export interface GetSetDelete<R, E, A> {
  readonly get: Effect.Effect<R, E, A>
  readonly set: (a: A) => Effect.Effect<R, never, A>
  readonly delete: Effect.Effect<R, E, Option.Option<A>>
}

function getSetDelete<R, E, A, R2>(ref: RefSubjectCore<R, E, A, R2>): GetSetDelete<Exclude<R, R2>, E, A> {
  return {
    get: getOrInitializeCore(ref, false),
    set: (a) => setCore(ref, a),
    delete: deleteCore(ref, false)
  }
}

export const updateEffect: {
  <A, R2, E2>(
    f: (value: A) => Effect.Effect<R2, E2, A>
  ): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R | R2, E | E2, A>
  <R, E, A, R2, E2>(
    ref: RefSubject<R, E, A>,
    f: (value: A) => Effect.Effect<R2, E2, A>
  ): Effect.Effect<R | R2, E | E2, A>
} = dual(2, function updateEffect<R, E, A, R2, E2>(
  ref: RefSubject<R, E, A>,
  f: (value: A) => Effect.Effect<R2, E2, A>
) {
  return ref.runUpdates((ref) => Effect.flatMap(Effect.flatMap(ref.get, f), ref.set))
})

export const update: {
  <A>(f: (value: A) => A): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, f: (value: A) => A): Effect.Effect<R, E, A>
} = dual(2, function update<R, E, A>(ref: RefSubject<R, E, A>, f: (value: A) => A) {
  return updateEffect(ref, (value) => Effect.succeed(f(value)))
})

export const modifyEffect: {
  <A, R2, E2, B>(
    f: (value: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R | R2, E | E2, B>
  <R, E, A, R2, E2, B>(
    ref: RefSubject<R, E, A>,
    f: (value: A) => Effect.Effect<R2, E2, readonly [B, A]>
  ): Effect.Effect<R | R2, E | E2, B>
} = dual(2, function modifyEffect<R, E, A, R2, E2, B>(
  ref: RefSubject<R, E, A>,
  f: (value: A) => Effect.Effect<R2, E2, readonly [B, A]>
) {
  return ref.runUpdates(
    (ref) =>
      Effect.flatMap(
        ref.get,
        (value) => Effect.flatMap(f(value), ([b, a]) => Effect.flatMap(ref.set(a), () => Effect.succeed(b)))
      )
  )
})

export const modify: {
  <A, B>(f: (value: A) => readonly [B, A]): <R, E>(ref: RefSubject<R, E, A>) => Effect.Effect<R, E, B>
  <R, E, A, B>(ref: RefSubject<R, E, A>, f: (value: A) => readonly [B, A]): Effect.Effect<R, E, B>
} = dual(2, function modify<R, E, A, B>(ref: RefSubject<R, E, A>, f: (value: A) => readonly [B, A]) {
  return modifyEffect(ref, (value) => Effect.succeed(f(value)))
})

const isRefSubjectDataFirst = (args: IArguments) => isRefSubject(args[0])

export const runUpdates: {
  <R, E, A, R2, E2, B, R3 = never, E3 = never, C = never>(
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<R3, E3, C>; readonly value?: "initial" | "current" }
      | undefined
  ): (ref: RefSubject<R, E, A>) => Effect.Effect<R | R2 | R3, E | E2 | E3, B>

  <R, E, A, R2, E2, B, R3 = never, E3 = never, C = never>(
    ref: RefSubject<R, E, A>,
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>,
    options?:
      | { readonly onInterrupt: (value: A) => Effect.Effect<R3, E3, C>; readonly value?: "initial" | "current" }
      | undefined
  ): Effect.Effect<R | R2 | R3, E | E2 | E3, B>
} = dual(
  isRefSubjectDataFirst,
  function runUpdates<R, E, A, R2, E2, B, R3 = never, E3 = never, C = never>(
    ref: RefSubject<R, E, A>,
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>,
    options?: {
      readonly onInterrupt: (value: A) => Effect.Effect<R3, E3, C>
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
                Effect.tapErrorCause(Effect.unifiedFn((cause) =>
                  Cause.isInterruptedOnly(cause)
                    ? options.onInterrupt(initial)
                    : Effect.unit
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
            Effect.tapErrorCause(Effect.unifiedFn((cause) =>
              Cause.isInterruptedOnly(cause)
                ? Effect.flatMap(ref.get, options.onInterrupt)
                : Effect.unit
            ))
          )
        )
      )
    }
  }
)

class RefSubjectCore<R, E, A, R2> {
  constructor(
    readonly initial: Effect.Effect<R, E, A>,
    readonly subject: Subject.Subject<R, E, A>,
    readonly context: C.Context<R2>,
    readonly scope: Scope.CloseableScope,
    readonly deferredRef: DeferredRef.DeferredRef<E, A>,
    readonly semaphore: Effect.Semaphore
  ) {}

  public _fiber: Fiber.Fiber<E, A> | undefined = undefined
}

function makeCore<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  options?: RefSubjectOptions<A>
) {
  return Effect.context<R | Scope.Scope>().pipe(
    Effect.bindTo("ctx"),
    Effect.let("executionStrategy", () => options?.executionStrategy ?? ExecutionStrategy.parallel),
    Effect.bind(
      "scope",
      ({ ctx, executionStrategy }) => Scope.fork(C.get(ctx, Scope.Scope), executionStrategy)
    ),
    Effect.bind(
      "deferredRef",
      () => DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals))
    ),
    Effect.let("subject", () => Subject.unsafeMake<E, A>(Math.max(1, options?.replay ?? 1))),
    Effect.tap(({ scope, subject }) => Scope.addFinalizer(scope, subject.interrupt)),
    Effect.map(({ ctx, deferredRef, scope, subject }) =>
      new RefSubjectCore(
        initial,
        subject,
        ctx,
        scope,
        deferredRef,
        Effect.unsafeMakeSemaphore(1)
      )
    )
  )
}

function unsafeMakeCore<R, E, A>(
  initial: Effect.Effect<R, E, A>,
  id: FiberId.FiberId,
  ctx: C.Context<R>,
  scope: Scope.CloseableScope,
  options?: RefSubjectOptions<A>
) {
  return new RefSubjectCore(
    initial,
    Subject.unsafeMake<E, A>(Math.max(1, options?.replay ?? 1)),
    ctx,
    scope,
    DeferredRef.unsafeMake(id, getExitEquivalence(options?.eq ?? Equal.equals)),
    Effect.unsafeMakeSemaphore(1)
  )
}

function getOrInitializeCore<R, E, A, R2>(
  core: RefSubjectCore<R, E, A, R2>,
  lockInitialize: boolean
): Effect.Effect<Exclude<R, R2>, E, A> {
  return Effect.suspend(() => {
    if (core._fiber === undefined && Option.isNone(core.deferredRef.current)) {
      return initializeCore(core, lockInitialize)
    } else {
      return core.deferredRef
    }
  })
}

function initializeCore<R, E, A, R2>(
  core: RefSubjectCore<R, E, A, R2>,
  lock: boolean
): Effect.Effect<Exclude<R, R2>, E, A> {
  const initialize = Effect.onExit(
    Effect.provide(core.initial, core.context),
    (exit) =>
      Effect.sync(() => {
        core._fiber = undefined
        core.deferredRef.done(exit)
      })
  )

  const fork = makeForkInScope(core.scope)

  return Effect.zipRight(
    Effect.tap(
      fork(
        lock && core.semaphore ? core.semaphore.withPermits(1)(initialize) : initialize
      ),
      (fiber) => Effect.sync(() => core._fiber = fiber)
    ),
    tapEventCore(core, core.deferredRef)
  )
}

function setCore<R, E, A, R2>(core: RefSubjectCore<R, E, A, R2>, a: A): Effect.Effect<Exclude<R, R2>, never, A> {
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

function onFailureCore<R, E, A, R2>(core: RefSubjectCore<R, E, A, R2>, cause: Cause.Cause<E>) {
  const exit = Exit.failCause(cause)

  return Effect.suspend(() => {
    if (core.deferredRef.done(exit)) {
      return sendEvent(core, exit)
    } else {
      return Effect.unit
    }
  })
}

function interruptCore<R, E, A, R2>(core: RefSubjectCore<R, E, A, R2>): Effect.Effect<never, never, void> {
  return Effect.fiberIdWith((id) => {
    core.deferredRef.reset()

    return Scope.close(core.scope, Exit.interrupt(id))
  })
}

function deleteCore<R, E, A, R2>(
  core: RefSubjectCore<R, E, A, R2>,
  lockInitialize: boolean
): Effect.Effect<Exclude<R, R2>, E, Option.Option<A>> {
  return Effect.suspend(() => {
    const current = core.deferredRef.current

    if (Option.isNone(current)) {
      return Effect.succeed(Option.none())
    }

    return core.subject.subscriberCount.pipe(
      Effect.provide(core.context),
      Effect.tap(
        (count: number) =>
          count > 0 && !core._fiber ? Effect.forkIn(initializeCore(core, lockInitialize), core.scope) : Effect.unit
      ),
      Effect.tap(() => Effect.sync(() => core.deferredRef.reset())),
      Effect.zipRight(Effect.asSome(current.value))
    )
  })
}

function tapEventCore<R, E, A, R2, R3>(
  core: RefSubjectCore<R, E, A, R2>,
  effect: Effect.Effect<R3, E, A>,
  onDone?: () => void
) {
  return effect.pipe(
    Effect.exit,
    Effect.tap((exit) =>
      Effect.suspend(() => {
        onDone?.()
        return sendEvent(core, exit)
      })
    ),
    Effect.flatten
  )
}

function sendEvent<R, E, A, R2>(
  core: RefSubjectCore<R, E, A, R2>,
  exit: Exit.Exit<E, A>
): Effect.Effect<Exclude<R, R2>, never, unknown> {
  if (Exit.isSuccess(exit)) {
    return Effect.provide(core.subject.onSuccess(exit.value), core.context)
  } else {
    return Effect.provide(core.subject.onFailure(exit.cause), core.context)
  }
}

export const mapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A>): Computed<R | R2, E | E2, B>
    <R, E>(ref: Filtered<R, E, A>): Filtered<R | R2, E | E2, B>
    <R0, E0, R, E, R2, E2, C>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => Effect.Effect<R2, E2, C>
    ): Computed<R0 | R2, E0 | E | E2, C>
  }

  <R, E, A, R2, E2, B>(
    ref: RefSubject<R, E, A> | Computed<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Computed<R | R2, E | E2, B>

  <R, E, A, R2, E2, B>(
    ref: Filtered<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, B>
  ): Filtered<R | R2, E | E2, B>

  <R0, E0, R, E, A, R2, E2, R3, E3, C>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, C>
  ): Computed<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, C>
} = dual(2, function mapEffect<R0, E0, R, E, A, R2, E2, R3, E3, C>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, C>
):
  | Computed<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C>
  | Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C>
{
  return FilteredTypeId in versioned
    ? FilteredImpl.make(versioned, (a) => Effect.asSome(f(a)))
    : ComputedImpl.make(versioned, f)
})

export const map: {
  <A, B>(f: (a: A) => B): {
    <R, E>(ref: RefSubject<R, E, A>): Computed<R, E, B>
    <R, E>(ref: Computed<R, E, A>): Computed<R, E, B>

    <R, E>(ref: Filtered<R, E, A>): Filtered<R, E, B>

    <R0, E0, R, E, R2, E2>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => B
    ): Computed<R0 | R2, E0 | E | E2, B>
  }

  <R, E, A, B>(ref: RefSubject<R, E, A> | Computed<R, E, A>, f: (a: A) => B): Computed<R, E, B>
  <R, E, A, B>(filtered: Filtered<R, E, A>, f: (a: A) => B): Filtered<R, E, B>

  <R0, E0, R, E, A, R2, E2, B>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => B
  ):
    | Computed<R0 | R2 | Exclude<R, Scope.Scope>, E0 | E | E2, B>
    | Filtered<R0 | R2 | Exclude<R, Scope.Scope>, E0 | E | E2, B>
} = dual(2, function map<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => B
):
  | Computed<R0 | Exclude<R, Scope.Scope> | R2, E0 | E | E2, B>
  | Filtered<R0 | Exclude<R, Scope.Scope> | R2, E0 | E | E2, B>
{
  return mapEffect(versioned, (a) => Effect.succeed(f(a)))
})

export const filterMapEffect: {
  <A, R2, E2, B>(
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A>): Filtered<R | R2, E | E2, B>
    <R, E>(ref: Filtered<R, E, A>): Filtered<R | R2, E | E2, B>
    <R0, E0, R, E, R2, E2, B>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
    ): Filtered<R0 | R2, E0 | E | E2, B>
  }

  <R, E, A, R2, E2, B>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
  ): Filtered<R | R2, E | E2, B>
  <R0, E0, R, E, A, R2, E2, B, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, Option.Option<B>>
  ): Filtered<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, B>
} = dual(2, function filterMapEffect<R0, E0, R, E, A, R2, E2, B, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, Option.Option<B>>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, B> {
  return FilteredImpl.make(versioned, f)
})

export const filterMap: {
  <A, B>(f: (a: A) => Option.Option<B>): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>): Filtered<R, E, B>
    <R0, E0, R, E, R2, E2, B>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => Option.Option<B>
    ): Filtered<R0 | R2, E0 | E | E2, B>
  }

  <R0, E0, R, E, A, R2, E2, B>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Option.Option<B>
  ): Filtered<R0 | R2 | Exclude<R, Scope.Scope>, E0 | E | E2, B>

  <R, E, A, B>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    f: (a: A) => Option.Option<B>
  ): Filtered<R, E, B>
} = dual(2, function filterMap<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Option.Option<B>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R2, E0 | E | E2, B> {
  return FilteredImpl.make(versioned, (a) => Effect.succeed(f(a)))
})

export const compact: {
  <R, E, A>(ref: RefSubject<R, E, Option.Option<A>> | Computed<R, E, Option.Option<A>>): Filtered<R, E, A>
  <R, E, A>(ref: Filtered<R, E, Option.Option<A>>): Filtered<R, E, A>

  <R0, E0, R, E, A, R2, E2>(
    versioned: Versioned.Versioned<R0, E0, R, E, Option.Option<A>, R2, E2, Option.Option<A>>
  ): Filtered<
    R0 | R2 | Exclude<R, Scope.Scope>,
    E0 | E | Exclude<E, Cause.NoSuchElementException> | Exclude<E2, Cause.NoSuchElementException>,
    A
  >
} = <R0, E0, R, E, A, R2, E2>(
  versioned: Versioned.Versioned<R0, E0, R, E, Option.Option<A>, R2, E2, Option.Option<A>>
): Filtered<R0 | R2 | Exclude<R, Scope.Scope>, E0 | E | Exclude<E | E2, Cause.NoSuchElementException>, A> =>
  filterMap(versioned, identity) as any

export const filterEffect: {
  <R, E, A, R2, E2>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    f: (a: A) => Effect.Effect<R2, E2, boolean>
  ): Filtered<R | R2, E | E2, A>
  <R0, E0, R, E, A, R2, E2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, boolean>
  ): Filtered<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, A>
} = dual(2, function filterEffect<R0, E0, R, E, A, R2, E2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, boolean>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, A> {
  return FilteredImpl.make(versioned, (a) => Effect.map(f(a), (b) => b ? Option.some(a) : Option.none()))
})

export const filter: {
  <A>(f: (a: A) => boolean): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>): Filtered<R, E, A>
    <R0, E0, R, E, R2, E2>(
      versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
      f: (a: A) => boolean
    ): Filtered<R0 | R2, E0 | E | E2, A>
  }

  <R, E, A>(ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>, f: (a: A) => boolean): Filtered<R, E, A>
  <R0, E0, R, E, A, R2, E2, R3, E3>(
    versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => boolean
  ): Filtered<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, A>
} = dual(2, function filter<R0, E0, R, E, A, R2, E2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => boolean
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, A> {
  return FilteredImpl.make(versioned, (a) => Effect.succeed(f(a) ? Option.some(a) : Option.none()))
})

class ComputedImpl<R0, E0, R, E, A, R2, E2, R3, E3, C> extends Versioned.VersionedTransform<
  R0,
  E0,
  R,
  E,
  A,
  R2,
  E2,
  A,
  R0 | Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
  E0 | E | E2 | E3,
  C,
  R0 | Exclude<R, Scope.Scope> | R2 | R3,
  E0 | E | E2 | E3,
  C
> implements Computed<R0 | Exclude<R, Scope.Scope> | R2 | R3, E0 | E | E2 | E3, C> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  constructor(
    readonly input: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    readonly f: (a: A) => Effect.Effect<R3, E3, C>
  ) {
    super(
      input,
      (fx) =>
        share.hold(core.mapEffect(fx, f)) as Fx<
          R0 | Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
          E0 | E | E2 | E3,
          C
        >,
      Effect.flatMap(f)
    )
  }

  static make<R0, E0, R, E, A, R2, E2, R3, E3, C>(
    input: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, C>
  ): Computed<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C> {
    return new ComputedImpl(input, f)
  }
}

class FilteredImpl<R0, E0, R, E, A, R2, E2, R3, E3, C> extends Versioned.VersionedTransform<
  R0,
  E0,
  R,
  E,
  A,
  R2,
  E2,
  A,
  Exclude<R, Scope.Scope> | R2 | R3 | Scope.Scope,
  E0 | E | E2 | E3,
  C,
  R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3,
  E0 | E | E2 | E3 | Cause.NoSuchElementException,
  C
> implements Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C> {
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  constructor(
    readonly input: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    readonly f: (a: A) => Effect.Effect<R3, E3, Option.Option<C>>
  ) {
    super(
      input,
      (fx) => share.hold(core.filterMapEffect(fx, f) as any),
      (effect) => Effect.flatten(Effect.flatMap(effect, f))
    )
  }

  static make<R0, E0, R, E, A, R2, E2, R3, E3, C>(
    input: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, Option.Option<C>>
  ): Filtered<
    R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3,
    E0 | E | Exclude<E2, Cause.NoSuchElementException> | E3,
    C
  > {
    return new FilteredImpl(input, f) as any
  }

  asComputed(): Computed<R0 | R2 | R3 | Exclude<R, Scope.Scope>, E0 | E | E2 | E3, Option.Option<C>> {
    return ComputedImpl.make(this.input, this.f)
  }
}

export const skipRepeatsWith: {
  <A>(eq: Equivalence.Equivalence<A>): {
    <R, E>(ref: RefSubject<R, E, A> | Computed<R, E, A>): Computed<R, E, A>
    <R, E>(ref: Filtered<R, E, A>): Filtered<R, E, A>
  }

  <R, E, A>(
    ref: RefSubject<R, E, A> | Computed<R, E, A>,
    eq: Equivalence.Equivalence<A>
  ): Computed<R, E, A>
  <R, E, A>(
    ref: Filtered<R, E, A>,
    eq: Equivalence.Equivalence<A>
  ): Filtered<R, E, A>

  <R, E, A>(
    ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
    eq: Equivalence.Equivalence<A>
  ): Computed<R, E, A> | Filtered<R, E, A>
} = dual(2, function skipRepeatsWith<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
  eq: Equivalence.Equivalence<A>
): Computed<R, E, A> | Filtered<R, E, A> {
  const versioned = Versioned.transform(ref, (fx) => core.skipRepeatsWith(fx, eq), identity)

  if (FilteredTypeId in ref) {
    return FilteredImpl.make(versioned, Effect.succeedSome)
  } else {
    return ComputedImpl.make(versioned, Effect.succeed) as any
  }
})

export function skipRepeats<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A>
): Computed<R, E, A>

export function skipRepeats<R, E, A>(
  ref: Filtered<R, E, A>
): Filtered<R, E, A>

export function skipRepeats<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>
): Computed<R, E, A> | Filtered<R, E, A>

export function skipRepeats<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>
): Computed<R, E, A> | Filtered<R, E, A> {
  return skipRepeatsWith(ref, Equal.equals)
}

export function transform<R, E, A, B>(
  ref: RefSubject<R, E, A>,
  from: (a: A) => B,
  to: (b: B) => A
): RefSubject<R, E, B> {
  return new RefSubjectTransform(ref, from, to)
}

export function transformOrFail<R, E, R2, E2, A, R3, E3, B>(
  ref: RefSubject<R, E, A>,
  from: (a: A) => Effect.Effect<R2, E2, B>,
  to: (b: B) => Effect.Effect<R3, E3, A>
): RefSubject<R | R2 | R3, E | E2 | E3, B> {
  return new RefSubjectTransformEffect(ref, from, to)
}

class RefSubjectTransform<R, E, A, B> extends FxEffectBase<R | Scope.Scope, E, B, R, E, B>
  implements RefSubject<R, E, B>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<R, E, number>
  readonly interrupt: Effect.Effect<R, never, void>
  readonly subscriberCount: Effect.Effect<R, never, number>

  constructor(
    readonly ref: RefSubject<R, E, A>,
    readonly from: (a: A) => B,
    readonly to: (b: B) => A
  ) {
    super()

    this.version = ref.version
    this.interrupt = ref.interrupt
    this.subscriberCount = ref.subscriberCount
  }

  run<R2 = never>(sink: Sink.Sink<R2, E, B>): Effect.Effect<R | Scope.Scope | R2, never, unknown> {
    return this.ref.run(Sink.map(sink, this.from))
  }

  runUpdates<R2, E2, C>(
    run: (ref: GetSetDelete<R, E, B>) => Effect.Effect<R2, E2, C>
  ) {
    return this.ref.runUpdates((ref) =>
      run({
        get: Effect.map(ref.get, this.from),
        set: (b) => Effect.map(ref.set(this.to(b)), this.from),
        delete: Effect.map(ref.delete, Option.map(this.from))
      })
    )
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.ref.onFailure(cause)
  }

  onSuccess(value: B): Effect.Effect<R, never, unknown> {
    return this.ref.onSuccess(this.to(value))
  }

  toEffect(): Effect.Effect<R, E, B> {
    return Effect.map(this.ref, this.from)
  }
}

class RefSubjectTransformEffect<R, E, A, R2, E2, B, R3, E3>
  extends FxEffectBase<R | R2 | R3 | Scope.Scope, E | E2 | E3, B, R | R2 | R3, E | E2, B>
  implements RefSubject<R | R2 | R3, E | E2 | E3, B>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<R, E, number>
  readonly interrupt: Effect.Effect<R, never, void>
  readonly subscriberCount: Effect.Effect<R, never, number>
  readonly subject: Subject.Subject<never, E | E2 | E3, B>

  constructor(
    readonly ref: RefSubject<R, E, A>,
    readonly from: (a: A) => Effect.Effect<R2, E2, B>,
    readonly to: (b: B) => Effect.Effect<R3, E3, A>
  ) {
    super()

    this.version = ref.version
    this.interrupt = ref.interrupt
    this.subscriberCount = ref.subscriberCount
    this.subject = Subject.unsafeMake()
  }

  run<R4 = never>(sink: Sink.Sink<R4, E | E2 | E3, B>): Effect.Effect<R | R2 | R3 | Scope.Scope | R4, never, unknown> {
    return core.merge(core.mapEffect(this.ref, this.from), this.subject).run(sink)
  }

  runUpdates<R4, E4, C>(
    run: (ref: GetSetDelete<R | R2 | R3, E | E2 | E3, B>) => Effect.Effect<R4, E4, C>
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

  onFailure(cause: Cause.Cause<E | E2 | E3>): Effect.Effect<R, never, unknown> {
    return this.subject.onFailure(cause)
  }

  onSuccess(value: B): Effect.Effect<R | R3, never, unknown> {
    return Effect.matchCauseEffect(this.to(value), {
      onFailure: (cause) => this.subject.onFailure(cause),
      onSuccess: (a) => this.ref.onSuccess(a)
    })
  }

  toEffect(): Effect.Effect<R | R2, E | E2, B> {
    return Effect.flatMap(this.ref, this.from)
  }
}

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

export type TupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = {
  "c": [ComputedTupleFrom<Refs>] extends [Computed<infer R, infer E, infer A>] ? Computed<R, E, A> : never
  "f": [FilteredTupleFrom<Refs>] extends [Filtered<infer R, infer E, infer A>] ? Filtered<R, E, A> : never
  "r": [RefSubjectTupleFrom<Refs>] extends [RefSubject<infer R, infer E, infer A>] ? RefSubject<R, E, A> : never
}[GetTupleKind<Refs>]

type Ref = RefSubject.Any | Computed.Any | Filtered.Any

export type GetTupleKind<Refs extends ReadonlyArray<Ref>, Kind extends RefKind = "r"> = Refs extends
  readonly [infer Head extends Ref, ...infer Tail extends ReadonlyArray<Ref>] ?
  GetTupleKind<Tail, MergeKind<Kind, MatchKind<Head>>>
  : Kind

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
  Effect.Effect.Context<Refs[number]>,
  Fx.Error<Refs[number]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
>

type ComputedTupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = Computed<
  Effect.Effect.Context<Refs[number]>,
  Effect.Effect.Error<Refs[number]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
>

type RefSubjectTupleFrom<
  Refs extends ReadonlyArray<RefSubject<any, any, any> | Computed<any, any, any> | Filtered<any, any, any>>
> = RefSubject<
  Effect.Effect.Context<Refs[number]>,
  Effect.Effect.Error<Refs[number]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
>

function makeTupleRef<
  const Refs extends ReadonlyArray<RefSubject<any, any, any>>
>(refs: Refs): RefSubjectTupleFrom<Refs> {
  return new RefSubjectTuple(refs)
}

class RefSubjectTuple<
  const Refs extends ReadonlyArray<RefSubject<any, any, any>>
> extends FxEffectBase<
  Effect.Effect.Context<Refs[number]>,
  Effect.Effect.Error<Refs[number]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Context<Refs[number]>,
  Effect.Effect.Error<Refs[number]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
> implements RefSubjectTupleFrom<Refs> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<Effect.Effect.Context<Refs[number]>, Effect.Effect.Error<Refs[number]>, number>
  readonly interrupt: Effect.Effect<Effect.Effect.Context<Refs[number]>, never, void>
  readonly subscriberCount: Effect.Effect<Effect.Effect.Context<Refs[number]>, never, number>

  private versioned: Versioned.Versioned<
    Effect.Effect.Context<Refs[number]>,
    Effect.Effect.Error<Refs[number]>,
    Effect.Effect.Context<Refs[number]>,
    Effect.Effect.Error<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Context<Refs[number]>,
    Effect.Effect.Error<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  >

  private getSetDelete: GetSetDelete<
    Effect.Effect.Context<Refs[number]>,
    Effect.Effect.Error<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  >

  constructor(
    readonly refs: Refs
  ) {
    super()

    this.versioned = Versioned.tuple(refs) as any
    this.version = this.versioned.version
    this.interrupt = Effect.all(refs.map((r) => r.interrupt), UNBOUNDED)
    this.subscriberCount = Effect.map(
      Effect.all(refs.map((r) => r.subscriberCount), UNBOUNDED),
      ReadonlyArray.reduce(0, sum)
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
      R2,
      Effect.Effect.Error<Refs[number]>,
      {
        readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
      }
    >
  ): Effect.Effect<Effect.Effect.Context<Refs[number]> | R2, never, unknown> {
    return this.versioned.run(sink)
  }

  toEffect(): Effect.Effect<
    Effect.Effect.Context<Refs[number]>,
    Effect.Effect.Error<Refs[number]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  > {
    return this.versioned
  }

  runUpdates<R2, E2, C>(
    run: (
      ref: GetSetDelete<
        Effect.Effect.Context<Refs[number]>,
        Effect.Effect.Error<Refs[number]>,
        {
          readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
        }
      >
    ) => Effect.Effect<R2, E2, C>
  ) {
    return run(this.getSetDelete)
  }

  onFailure(
    cause: Cause.Cause<Effect.Effect.Error<Refs[number]>>
  ): Effect.Effect<Effect.Effect.Context<Refs[number]>, never, unknown> {
    return Effect.all(this.refs.map((ref) => ref.onFailure(cause)))
  }

  onSuccess(
    value: { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  ): Effect.Effect<Effect.Effect.Context<Refs[number]>, never, unknown> {
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
  Effect.Effect.Context<Refs[keyof Refs]> | Scope.Scope,
  Effect.Effect.Error<Refs[keyof Refs]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  },
  Effect.Effect.Context<Refs[keyof Refs]>,
  Effect.Effect.Error<Refs[keyof Refs]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
> implements
  RefSubject<
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    {
      readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
    }
  >
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    number
  >
  readonly interrupt: Effect.Effect<Effect.Effect.Context<Refs[keyof Refs]>, never, void>
  readonly subscriberCount: Effect.Effect<Effect.Effect.Context<Refs[keyof Refs]>, never, number>

  private versioned: Versioned.Versioned<
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> },
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  >

  private getSetDelete: GetSetDelete<
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  >

  constructor(
    readonly refs: Refs
  ) {
    super()

    this.versioned = Versioned.struct(refs) as any
    this.version = this.versioned.version
    this.interrupt = Effect.all(Object.values(refs).map((r) => r.interrupt), UNBOUNDED)
    this.subscriberCount = Effect.map(
      Effect.all(Object.values(refs).map((r) => r.subscriberCount), UNBOUNDED),
      ReadonlyArray.reduce(0, sum)
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
      R3,
      Effect.Effect.Error<Refs[keyof Refs]>,
      { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
    >
  ): Effect.Effect<Effect.Effect.Context<Refs[keyof Refs]> | R3, never, unknown> {
    return this.versioned.run(sink)
  }

  toEffect(): Effect.Effect<
    Effect.Effect.Context<Refs[keyof Refs]>,
    Effect.Effect.Error<Refs[keyof Refs]>,
    { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  > {
    return this.versioned
  }

  runUpdates<R2, E2, C>(
    run: (
      ref: GetSetDelete<
        Effect.Effect.Context<Refs[keyof Refs]>,
        Effect.Effect.Error<Refs[keyof Refs]>,
        {
          readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
        }
      >
    ) => Effect.Effect<R2, E2, C>
  ) {
    return run(this.getSetDelete)
  }

  onFailure(
    cause: Cause.Cause<Effect.Effect.Error<Refs[keyof Refs]>>
  ): Effect.Effect<Effect.Effect.Context<Refs[keyof Refs]>, never, unknown> {
    return Effect.all(Object.values(this.refs).map((ref) => ref.onFailure(cause as any)))
  }

  onSuccess(
    value: { readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]> }
  ): Effect.Effect<Effect.Effect.Context<Refs[keyof Refs]>, never, unknown> {
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
  "c": [ComputedStructFrom<Refs>] extends [Computed<infer R, infer E, infer A>] ? Computed<R, E, A> : never
  "f": [FilteredStructFrom<Refs>] extends [Filtered<infer R, infer E, infer A>] ? Filtered<R, E, A> : never
  "r": [RefSubjectStructFrom<Refs>] extends [RefSubject<infer R, infer E, infer A>] ? RefSubject<R, E, A> : never
}[GetStructKind<Refs>]

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
  Effect.Effect.Context<Refs[keyof Refs]>,
  Fx.Error<Refs[keyof Refs]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
>

type ComputedStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
> = Computed<
  Effect.Effect.Context<Refs[keyof Refs]>,
  Effect.Effect.Error<Refs[keyof Refs]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
>

type RefSubjectStructFrom<
  Refs extends Readonly<Record<string, RefSubject.Any | Computed.Any | Filtered.Any>>
> = RefSubject<
  Effect.Effect.Context<Refs[keyof Refs]>,
  Effect.Effect.Error<Refs[keyof Refs]>,
  {
    readonly [K in keyof Refs]: Effect.Effect.Success<Refs[K]>
  }
>

export function tagged<E, A>(replay?: number): {
  <const I extends C.IdentifierFactory<any>>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
  <const I>(identifier: I): RefSubject.Tagged<C.IdentifierOf<I>, E, A>
} {
  return <const I>(identifier: I) => new RefSubjectTagged(C.Tagged<I, RefSubject<never, E, A>>(identifier), replay)
}

class RefSubjectTagged<I, E, A> extends FxEffectBase<
  I | Scope.Scope,
  E,
  A,
  I,
  E,
  A
> implements RefSubject.Tagged<I, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<I, E, number>
  readonly interrupt: Effect.Effect<I, never, void>
  readonly subscriberCount: Effect.Effect<I, never, number>

  constructor(
    readonly tag: C.Tagged<I, RefSubject<never, E, A>>,
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
    sink: Sink.Sink<R2, E, A>
  ): Effect.Effect<I | R2 | Scope.Scope, never, unknown> {
    return this.tag.withEffect((ref) => ref.run(sink))
  }

  toEffect(): Effect.Effect<I, E, A> {
    return this.tag.withEffect((ref) => ref)
  }

  runUpdates<R2, E2, C>(
    run: (ref: GetSetDelete<I, E, A>) => Effect.Effect<R2, E2, C>
  ): Effect.Effect<I | R2, E2, C> {
    return this.tag.withEffect((ref) => ref.runUpdates(run))
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<I, never, unknown> {
    return this.tag.withEffect((ref) => ref.onFailure(cause))
  }

  onSuccess(value: A): Effect.Effect<I, never, unknown> {
    return this.tag.withEffect((ref) => ref.onSuccess(value))
  }

  make = <R>(fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A>): Layer.Layer<R, never, I> =>
    this.tag.scoped(make(fxOrEffect))
}

export function fromTag<I, S, R, E, A>(
  tag: C.Tag<I, S>,
  f: (s: S) => RefSubject<R, E, A>
): RefSubject<I | R, E, A> {
  return new RefSubjectFromTag(tag, f)
}

class RefSubjectFromTag<I, S, R, E, A> extends FxEffectBase<
  I | R | Scope.Scope,
  E,
  A,
  I | R,
  E,
  A
> implements RefSubject<I | R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<I | R, E, number>
  readonly interrupt: Effect.Effect<I | R, never, void>
  readonly subscriberCount: Effect.Effect<I | R, never, number>

  private _get: Effect.Effect<I, never, RefSubject<R, E, A>>
  private _fx: Fx<I | R | Scope.Scope, E, A>

  constructor(
    readonly tag: C.Tag<I, S>,
    readonly f: (s: S) => RefSubject<R, E, A>
  ) {
    super()

    this._get = Effect.map(tag, f)
    this._fx = core.fromFxEffect(this._get)

    this.version = Effect.flatMap(this._get, (ref) => ref.version)
    this.interrupt = Effect.flatMap(this._get, (ref) => ref.interrupt)
    this.subscriberCount = Effect.flatMap(this._get, (ref) => ref.subscriberCount)
  }

  run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<I | R | R3 | Scope.Scope, never, unknown> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<I | R, E, A> {
    return Effect.flatten(this._get)
  }

  runUpdates<R2, E2, C>(
    run: (ref: GetSetDelete<I | R, E, A>) => Effect.Effect<R2, E2, C>
  ): Effect.Effect<I | R | R2, E2, C> {
    return Effect.flatMap(this._get, (ref) => ref.runUpdates(run))
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<I | R, never, unknown> {
    return Effect.flatMap(this._get, (ref) => ref.onFailure(cause))
  }

  onSuccess(value: A): Effect.Effect<I | R, never, unknown> {
    return Effect.flatMap(this._get, (ref) => ref.onSuccess(value))
  }
}

export function isRefSubject<R, E, A>(u: unknown): u is RefSubject<R, E, A>
export function isRefSubject(u: unknown): u is RefSubject.Any
export function isRefSubject(u: unknown): u is RefSubject.Any {
  return isObjectLike(u) && RefSubjectTypeId in u
}

export function isComputed<R, E, A>(u: unknown): u is Computed<R, E, A>
export function isComputed(u: unknown): u is Computed.Any
export function isComputed(u: unknown): u is Computed.Any {
  return isObjectLike(u) && ComputedTypeId in u
}

export function isFiltered<R, E, A>(u: unknown): u is Filtered<R, E, A>
export function isFiltered(u: unknown): u is Filtered.Any
export function isFiltered(u: unknown): u is Filtered.Any {
  return isObjectLike(u) && FilteredTypeId in u
}

export function isDerived<R, E, A>(u: unknown): u is RefSubject.Derived<R, E, A>
export function isDerived(u: unknown): u is RefSubject.Derived<unknown, unknown, unknown>
export function isDerived(u: unknown): u is RefSubject.Derived<unknown, unknown, unknown> {
  return isRefSubject(u) && "persist" in u
}

function isObjectLike(u: unknown): u is object {
  if (u == null) return false

  const type = typeof u

  return (type === "object" && !Array.isArray(u)) || type === "function"
}

export function computedFromTag<I, S, R, E, A>(
  tag: C.Tag<I, S>,
  f: (s: S) => Computed<R, E, A>
): Computed<I | R, E, A> {
  return new ComputedFromTag(tag, f)
}

class ComputedFromTag<I, S, R, E, A> extends FxEffectBase<
  I | R | Scope.Scope,
  E,
  A,
  I | R,
  E,
  A
> implements Computed<I | R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId

  readonly version: Effect.Effect<I | R, E, number>

  private _get: Effect.Effect<I, never, Computed<R, E, A>>

  constructor(
    readonly tag: C.Tag<I, S>,
    readonly f: (s: S) => Computed<R, E, A>
  ) {
    super()

    this._get = Effect.map(tag, f)
    this.version = Effect.flatMap(this._get, (ref) => ref.version)
  }

  run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<I | R | Scope.Scope | R3, never, unknown> {
    return Effect.flatMap(this._get, (ref) => ref.run(sink))
  }

  toEffect(): Effect.Effect<I | R, E, A> {
    return Effect.flatten(this._get)
  }
}

export function filteredFromTag<I, S, R, E, A>(
  tag: C.Tag<I, S>,
  f: (s: S) => Filtered<R, E, A>
): Filtered<I | R, E, A> {
  return new FilteredFromTag(tag, f)
}

class FilteredFromTag<I, S, R, E, A> extends FxEffectBase<
  I | R | Scope.Scope,
  E,
  A,
  I | R,
  E | Cause.NoSuchElementException,
  A
> implements Filtered<I | R, E, A> {
  readonly [FilteredTypeId]: FilteredTypeId = FilteredTypeId

  readonly version: Effect.Effect<I | R, E, number>

  private _get: Effect.Effect<I, never, Filtered<R, E, A>>

  constructor(
    readonly tag: C.Tag<I, S>,
    readonly f: (s: S) => Filtered<R, E, A>
  ) {
    super()

    this._get = Effect.map(tag, f)
    this.version = Effect.flatMap(this._get, (ref) => ref.version)
  }

  run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<I | R | Scope.Scope | R3, never, unknown> {
    return Effect.flatMap(this._get, (ref) => ref.run(sink))
  }

  toEffect(): Effect.Effect<I | R, E | Cause.NoSuchElementException, A> {
    return Effect.flatten(this._get)
  }

  asComputed(): Computed<I | R, E, Option.Option<A>> {
    return new ComputedFromTag(this.tag, (s) => this.f(s).asComputed())
  }
}

export const provide: {
  <S>(context: C.Context<S> | Runtime.Runtime<S>): {
    <R, E, A>(filtered: Filtered<R, E, A>): Filtered<Exclude<R, S>, E, A>
    <R, E, A>(computed: Computed<R, E, A>): Computed<Exclude<R, S>, E, A>
    <R, E, A>(ref: RefSubject<R, E, A>): RefSubject<Exclude<R, S>, E, A>
  }

  <R2, S>(layer: Layer.Layer<R2, never, S>): {
    <R, E, A>(filtered: Filtered<R, E, A>): Filtered<Exclude<R, S> | R2, E, A>
    <R, E, A>(computed: Computed<R, E, A>): Computed<Exclude<R, S> | R2, E, A>
    <R, E, A>(ref: RefSubject<R, E, A>): RefSubject<Exclude<R, S> | R2, E, A>
  }

  <R, E, A, S>(
    filtered: Filtered<R, E, A>,
    context: C.Context<S> | Runtime.Runtime<S>
  ): Filtered<Exclude<R, S>, E, A>
  <R, E, A, S>(
    computed: Computed<R, E, A>,
    context: C.Context<S> | Runtime.Runtime<S>
  ): Computed<Exclude<R, S>, E, A>
  <R, E, A, S>(
    ref: RefSubject<R, E, A>,
    context: C.Context<S> | Runtime.Runtime<S>
  ): RefSubject<Exclude<R, S>, E, A>

  <R, E, A, R2, S>(filtered: Filtered<R, E, A>, layer: Layer.Layer<R2, never, S>): Filtered<Exclude<R, S> | R2, E, A>
  <R, E, A, R2, S>(computed: Computed<R, E, A>, layer: Layer.Layer<R2, never, S>): Computed<Exclude<R, S> | R2, E, A>
  <R, E, A, R2, S>(ref: RefSubject<R, E, A>, layer: Layer.Layer<R2, never, S>): RefSubject<Exclude<R, S> | R2, E, A>
} = dual(2, function provide<R, E, A, R2 = never, S = never>(
  ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
  providing: Layer.Layer<R2, never, S> | C.Context<S> | Runtime.Runtime<S>
) {
  const layer = Layer.isLayer(providing)
    ? providing as Layer.Layer<R2, never, S>
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

class RefSubjectProvide<R, E, A, R2, S> extends FxEffectBase<
  Exclude<R, S> | R2 | Scope.Scope,
  E,
  A,
  Exclude<R, S> | R2,
  E,
  A
> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly interrupt: Effect.Effect<Exclude<R, S> | R2, never, void>
  readonly subscriberCount: Effect.Effect<Exclude<R, S> | R2, never, number>

  constructor(
    readonly ref: RefSubject<R, E, A>,
    readonly layer: Layer.Layer<R2, never, S>
  ) {
    super()

    this.interrupt = Effect.provide(ref.interrupt, layer)
    this.subscriberCount = Effect.provide(ref.subscriberCount, layer)
  }

  run<R3>(
    sink: Sink.Sink<R3, E, A>
  ): Effect.Effect<R2 | Scope.Scope | Exclude<Scope.Scope, S> | Exclude<R, S> | Exclude<R3, S>, never, unknown> {
    return Effect.provide(this.ref.run(sink), this.layer)
  }

  toEffect(): Effect.Effect<Exclude<R, S> | R2, E, A> {
    return Effect.provide(this.ref, this.layer)
  }
}

/**
 * Set the value to true
 * @since 1.18.0
 */
export const asTrue: <R, E>(ref: RefSubject<R, E, boolean>) => Effect.Effect<R, E, boolean> = <R, E>(
  ref: RefSubject<R, E, boolean>
) => set(ref, true)

/**
 * Set the value to false
 * @since 1.18.0
 */
export const asFalse: <R, E>(ref: RefSubject<R, E, boolean>) => Effect.Effect<R, E, boolean> = <R, E>(
  ref: RefSubject<R, E, boolean>
) => set(ref, false)

/**
 * Toggle the boolean value between true and false
 * @since 1.18.0
 */
export const toggle: <R, E>(ref: RefSubject<R, E, boolean>) => Effect.Effect<R, E, boolean> = <R, E>(
  ref: RefSubject<R, E, boolean>
) => update(ref, Boolean.not)

const add = (x: number): number => x + 1

/**
 * Set the value to true
 * @since 1.18.0
 */
export const increment: <R, E>(ref: RefSubject<R, E, number>) => Effect.Effect<R, E, number> = <R, E>(
  ref: RefSubject<R, E, number>
) => update(ref, add)

const sub = (x: number): number => x - 1

/**
 * Set the value to false
 * @since 1.18.0
 */
export const decrement: <R, E>(ref: RefSubject<R, E, number>) => Effect.Effect<R, E, number> = <R, E>(
  ref: RefSubject<R, E, number>
) => update(ref, sub)

export const slice: {
  (drop: number, take: number): <R, E, A>(ref: RefSubject<R, E, A>) => RefSubject<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, drop: number, take: number): RefSubject<R, E, A>
} = dual(
  3,
  function slice<R, E, A>(ref: RefSubject<R, E, A>, drop: number, take: number): RefSubject<R, E, A> {
    return new RefSubjectSlice(ref, drop, take)
  }
)

export const drop: {
  (drop: number): <R, E, A>(ref: RefSubject<R, E, A>) => RefSubject<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, drop: number): RefSubject<R, E, A>
} = dual(2, function drop<R, E, A>(ref: RefSubject<R, E, A>, drop: number): RefSubject<R, E, A> {
  return slice(ref, drop, Infinity)
})

export const take: {
  (take: number): <R, E, A>(ref: RefSubject<R, E, A>) => RefSubject<R, E, A>
  <R, E, A>(ref: RefSubject<R, E, A>, take: number): RefSubject<R, E, A>
} = dual(2, function take<R, E, A>(ref: RefSubject<R, E, A>, take: number): RefSubject<R, E, A> {
  return slice(ref, 0, take)
})

class RefSubjectSlice<R, E, A> extends FxEffectBase<R | Scope.Scope, E, A, R, E, A> implements RefSubject<R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<R, E, number>
  readonly interrupt: Effect.Effect<R, never, void>
  readonly subscriberCount: Effect.Effect<R, never, number>
  private _fx: Fx<Scope.Scope | R, E, A>

  constructor(
    readonly ref: RefSubject<R, E, A>,
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

  run<R2>(sink: Sink.Sink<R2, E, A>): Effect.Effect<R | R2 | Scope.Scope, never, unknown> {
    return this._fx.run(sink)
  }

  toEffect(): Effect.Effect<R, E, A> {
    return this.ref
  }

  runUpdates<R2, E2, C>(
    run: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, C>
  ): Effect.Effect<R | R2, E2, C> {
    return this.ref.runUpdates(run)
  }

  onFailure(cause: Cause.Cause<E>): Effect.Effect<R, never, unknown> {
    return this.ref.onFailure(cause)
  }

  onSuccess(value: A): Effect.Effect<R, never, unknown> {
    return this.ref.onSuccess(value)
  }
}
