import type { Equivalence } from "effect"
import { Cause, Context, Effect, Equal, ExecutionStrategy, Exit, Fiber, Option, Scope } from "effect"
import type { FilteredTypeId } from "../TypeId.js"
import { ComputedTypeId, RefSubjectTypeId, TypeId } from "../TypeId.js"
import type { Fx } from "./Fx.js"
import * as DeferredRef from "./internal/DeferredRef.js"
import { getExitEquivalence } from "./internal/helpers.js"
import { FxEffectBase } from "./internal/protos.js"
import * as Sink from "./Sink.js"
import * as Subject from "./Subject.js"
import type { Versioned } from "./Versioned.js"

// TODO: Add support for Context-based impelmentations
// TODO: Expanded Computed + Filtered types
// TODO: Support for custom RefSubjects backed by something than in-memory
// TODO: RefTransformer
// TODO: tuple/struct/all

export interface Computed<R, E, A> extends Versioned<R, never, R, E, A, R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId
}

export interface Filtered<R, E, A> extends Versioned<R, never, R, E, A, R, E | Cause.NoSuchElementException, A> {
  readonly [FilteredTypeId]: FilteredTypeId
}

export interface RefSubject<R, E, A> extends Computed<R, E, A>, Subject.Subject<R, E, A> {
  readonly runUpdates: <R2, E2, B>(
    f: (ref: GetSetDelete<R, E, A>) => Effect.Effect<R2, E2, B>
  ) => Effect.Effect<R2, E2, B>
}

export interface RefSubjectOptions<A> {
  readonly eq?: Equivalence.Equivalence<A>
  readonly replay?: number
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
  return Effect.gen(function*(_) {
    const deferredRef = yield* _(DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals)))
    const core = yield* _(makeCore(deferredRef, options))

    yield* _(
      fx.run(Sink.make(
        (cause) => Effect.sync(() => deferredRef.done(Exit.failCause(cause))),
        (value) =>
          Effect.sync(() => {
            deferredRef.done(Exit.succeed(value))
          })
      )),
      Effect.forkIn(core.scope)
    )

    return new RefSubjectImpl(core)
  })
}

export function make<R, E, A>(
  fxOrEffect: Fx<R, E, A> | Effect.Effect<R, E, A>,
  options?: RefSubjectOptions<A>
): Effect.Effect<R | Scope.Scope, never, RefSubject<never, E, A>> {
  if (TypeId in fxOrEffect) return fromFx(fxOrEffect as Fx<R, E, A>, options)
  else return fromEffect(fxOrEffect as Effect.Effect<R, E, A>, options)
}

class RefSubjectImpl<R, E, A, R2> extends FxEffectBase<Exclude<R, R2>, E, A, Exclude<R, R2>, E, A>
  implements RefSubject<Exclude<R, R2>, E, A>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<never, never, number>
  readonly interrupt: Effect.Effect<never, never, void>
  readonly subscriberCount: Effect.Effect<never, never, number>

  private readonly getSetDelete: GetSetDelete<Exclude<R, R2>, E, A>

  constructor(
    private readonly core: RefSubjectCore<R, E, A, R2>
  ) {
    super()

    this.version = Effect.sync(() => core.deferredRef.version)
    this.interrupt = interruptCore(core)
    this.subscriberCount = core.subject.subscriberCount
    this.getSetDelete = getSetDelete(core)

    this.runUpdates = this.runUpdates.bind(this)
    this.onSuccess = this.onSuccess.bind(this)
    this.onFailure = this.onFailure.bind(this)
  }

  run<R3>(sink: Sink.Sink<R3, E, A>): Effect.Effect<Exclude<R, R2> | R3, never, unknown> {
    return Effect.provide(this.core.subject.run(sink), this.core.context)
  }

  runUpdates<R3, E3, B>(
    run: (ref: GetSetDelete<Exclude<R, R2>, E, A>) => Effect.Effect<R3, E3, B>
  ) {
    return this.core.semaphore.withPermits(1)(run(this.getSetDelete))
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

export function set<R, E, A>(ref: RefSubject<R, E, A>, a: A): Effect.Effect<R, never, A> {
  return ref.runUpdates((ref) => ref.set(a))
}

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

export function updateEffect<R, E, A, R2, E2>(
  ref: RefSubject<R, E, A>,
  f: (value: A) => Effect.Effect<R2, E2, A>
) {
  return ref.runUpdates((ref) => Effect.flatMap(Effect.flatMap(ref.get, f), ref.set))
}

export function update<R, E, A>(ref: RefSubject<R, E, A>, f: (value: A) => A) {
  return updateEffect(ref, (value) => Effect.sync(() => f(value)))
}

export function modifyEffect<R, E, A, R2, E2, B>(
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
}

export function modify<R, E, A, B>(ref: RefSubject<R, E, A>, f: (value: A) => readonly [B, A]) {
  return modifyEffect(ref, (value) => Effect.sync(() => f(value)))
}

export function runUpdates<R, E, A, R2, E2, B, R3 = never, E3 = never, C = never>(
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
              Effect.tapErrorCause((cause) =>
                Cause.isInterruptedOnly(cause)
                  ? options.onInterrupt(initial)
                  : Effect.unit
              )
            )
        )
      )
    )
  } else {
    return ref.runUpdates((ref) =>
      Effect.uninterruptibleMask((restore) =>
        f(ref).pipe(
          restore,
          Effect.tapErrorCause((cause) =>
            Cause.isInterruptedOnly(cause)
              ? Effect.flatMap(ref.get, options.onInterrupt)
              : Effect.unit
          )
        )
      )
    )
  }
}

class RefSubjectCore<R, E, A, R2> {
  constructor(
    readonly initial: Effect.Effect<R, E, A>,
    readonly subject: Subject.Subject<R, E, A>,
    readonly context: Context.Context<R2>,
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
    Effect.bind("scope", ({ ctx }) => Scope.fork(Context.get(ctx, Scope.Scope), ExecutionStrategy.parallel)),
    Effect.bind(
      "deferredRef",
      () => DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals))
    ),
    Effect.let("subject", () => Subject.unsafeMake<E, A>(options?.replay ?? 1)),
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
        return core.deferredRef.done(exit)
      })
  )

  return Scope.fork(core.scope, ExecutionStrategy.sequential).pipe(
    Effect.flatMap((scope) =>
      Effect.forkIn(
        lock ? core.semaphore.withPermits(1)(initialize) : initialize,
        scope
      )
    ),
    Effect.tap((fiber) => Effect.sync(() => core._fiber = fiber)),
    Effect.zipRight(tapEventCore(core, core.deferredRef))
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
  return Effect.gen(function*(_) {
    const current = core.deferredRef.current

    if (Option.isNone(current)) {
      return Option.none()
    }

    const count = yield* _(core.subject.subscriberCount)

    // Ensure current subscribers get an updated value
    if (count > 0) {
      // Interrupt the current fiber if it exists
      if (core._fiber) {
        yield* _(Fiber.interrupt(core._fiber))
      }

      yield* _(Effect.forkIn(initializeCore(core, lockInitialize), core.scope))
    }

    // Reset the current state and version
    core.deferredRef.reset()

    return yield* _(Effect.asSome(current.value))
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
