import type { Equivalence, Fiber } from "effect"
import { Cause, Context, Effect, Equal, ExecutionStrategy, Exit, identity, Option, Scope } from "effect"
import { ComputedTypeId, FilteredTypeId, RefSubjectTypeId, TypeId } from "../TypeId.js"
import type { Fx } from "./Fx.js"
import * as core from "./internal/core.js"
import * as DeferredRef from "./internal/DeferredRef.js"
import { getExitEquivalence } from "./internal/helpers.js"
import { FxEffectBase } from "./internal/protos.js"
import { hold } from "./internal/share.js"
import * as Sink from "./Sink.js"
import * as Subject from "./Subject.js"
import * as Versioned from "./Versioned.js"

// TODO: Add support for Context-based impelmentations
// TODO: Support for custom RefSubjects backed by something than in-memory
// TODO: tuple/struct/all

export interface Computed<R, E, A> extends Versioned.Versioned<R, never, R | Scope.Scope, E, A, R, E, A> {
  readonly [ComputedTypeId]: ComputedTypeId
}

export interface Filtered<R, E, A>
  extends Versioned.Versioned<R, never, R | Scope.Scope, E, A, R, E | Cause.NoSuchElementException, A>
{
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
  return Effect.gen(function*(_) {
    const deferredRef = yield* _(DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals)))
    const core = yield* _(makeCore(deferredRef, options))

    yield* _(
      fx.run(Sink.make(
        (cause) => Effect.sync(() => deferredRef.done(Exit.failCause(cause))),
        (value) => Effect.sync(() => deferredRef.done(Exit.succeed(value)))
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
  if (TypeId in fxOrEffect) return fromFx(fxOrEffect, options)
  else return fromEffect(fxOrEffect, options)
}

export function of<A>(
  a: A,
  options?: RefSubjectOptions<A>
): Effect.Effect<Scope.Scope, never, RefSubject<never, never, A>> {
  return make(Effect.succeed(a), options)
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
  return updateEffect(ref, (value) => Effect.succeed(f(value)))
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
  return modifyEffect(ref, (value) => Effect.succeed(f(value)))
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
    Effect.let("executionStrategy", () => options?.executionStrategy ?? ExecutionStrategy.parallel),
    Effect.bind(
      "scope",
      ({ ctx, executionStrategy }) => Scope.fork(Context.get(ctx, Scope.Scope), executionStrategy)
    ),
    Effect.bind(
      "deferredRef",
      () => DeferredRef.make<E, A>(getExitEquivalence(options?.eq ?? Equal.equals))
    ),
    Effect.let("subject", () => Subject.make<E, A>(Math.max(1, options?.replay ?? 1))),
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
        core.deferredRef.done(exit)
      })
  )

  return Effect.zipRight(
    Effect.tap(
      Effect.forkIn(
        lock ? core.semaphore.withPermits(1)(initialize) : initialize,
        core.scope
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
  return Effect.gen(function*(_) {
    const current = core.deferredRef.current

    if (Option.isNone(current)) {
      return Option.none()
    }

    const count = yield* _(core.subject.subscriberCount, Effect.provide(core.context))

    // Ensure current subscribers get an updated value
    if (count > 0 && !core._fiber) {
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

export function mapEffect<R, E, A, R2, E2, B>(
  ref: RefSubject<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B>

export function mapEffect<R, E, A, R2, E2, B>(
  ref: Computed<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Computed<R | R2, E | E2, B>

export function mapEffect<R, E, A, R2, E2, B>(
  ref: Filtered<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>
): Filtered<R | R2, E | E2, B>

export function mapEffect<R0, E0, R, E, A, R2, E2, R3, E3, C>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, C>
): Computed<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C>

export function mapEffect<R0, E0, R, E, A, R2, E2, R3, E3, C>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, C>
):
  | Computed<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C>
  | Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C>
{
  return FilteredTypeId in versioned
    ? FilteredImpl.make(versioned, (a) => Effect.asSome(f(a)))
    : ComputedImpl.make(versioned, f)
}

export function map<R, E, A, B>(ref: RefSubject<R, E, A>, f: (a: A) => B): Computed<R, E, B>

export function map<R, E, A, B>(ref: Computed<R, E, A>, f: (a: A) => B): Computed<R, E, B>

export function map<R, E, A, B>(ref: Filtered<R, E, A>, f: (a: A) => B): Filtered<R, E, B>

export function map<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => B
): Computed<R0 | Exclude<R, Scope.Scope> | R2, E0 | E | E2, B>

export function map<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => B
):
  | Computed<R0 | Exclude<R, Scope.Scope> | R2, E0 | E | E2, B>
  | Filtered<R0 | Exclude<R, Scope.Scope> | R2, E0 | E | E2, B>
{
  return mapEffect(versioned, (a) => Effect.succeed(f(a)))
}

export function filterMapEffect<R, E, A, R2, E2, B>(
  ref: RefSubject<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B>

export function filterMapEffect<R, E, A, R2, E2, B>(
  ref: Computed<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B>

export function filterMapEffect<R, E, A, R2, E2, B>(
  ref: Filtered<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, Option.Option<B>>
): Filtered<R | R2, E | E2, B>

export function filterMapEffect<R0, E0, R, E, A, R2, E2, B, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, Option.Option<B>>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, B>

export function filterMapEffect<R0, E0, R, E, A, R2, E2, B, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, Option.Option<B>>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, B> {
  return FilteredImpl.make(versioned, f)
}

export function filterMap<R, E, A, B>(ref: RefSubject<R, E, A>, f: (a: A) => Option.Option<B>): Filtered<R, E, B>

export function filterMap<R, E, A, B>(ref: Computed<R, E, A>, f: (a: A) => Option.Option<B>): Filtered<R, E, B>

export function filterMap<R, E, A, B>(ref: Filtered<R, E, A>, f: (a: A) => Option.Option<B>): Filtered<R, E, B>

export function filterMap<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Option.Option<B>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R2, E0 | E | E2, B>

export function filterMap<R0, E0, R, E, A, R2, E2, B>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Option.Option<B>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R2, E0 | E | E2, B> {
  return FilteredImpl.make(versioned, (a) => Effect.succeed(f(a)))
}

export function filterEffect<R, E, A, R2, E2>(
  ref: RefSubject<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Filtered<R | R2, E | E2, A>

export function filterEffect<R, E, A, R2, E2>(
  ref: Computed<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Filtered<R | R2, E | E2, A>

export function filterEffect<R, E, A, R2, E2>(
  ref: Filtered<R, E, A>,
  f: (a: A) => Effect.Effect<R2, E2, boolean>
): Filtered<R | R2, E | E2, A>

export function filterEffect<R0, E0, R, E, A, R2, E2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, boolean>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, A>

export function filterEffect<R0, E0, R, E, A, R2, E2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => Effect.Effect<R3, E3, boolean>
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, A> {
  return FilteredImpl.make(versioned, (a) => Effect.map(f(a), (b) => b ? Option.some(a) : Option.none()))
}

export function filter<R, E, A>(ref: RefSubject<R, E, A>, f: (a: A) => boolean): Filtered<R, E, A>

export function filter<R, E, A>(ref: Computed<R, E, A>, f: (a: A) => boolean): Filtered<R, E, A>

export function filter<R, E, A>(ref: Filtered<R, E, A>, f: (a: A) => boolean): Filtered<R, E, A>

export function filter<R0, E0, R, E, A, R2, E2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => boolean
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, A>

export function filter<R0, E0, R, E, A, R2, E2, R3, E3>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
  f: (a: A) => boolean
): Filtered<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, A> {
  return FilteredImpl.make(versioned, (a) => Effect.succeed(f(a) ? Option.some(a) : Option.none()))
}

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
      (fx) => hold(core.mapEffect(fx, f)) as any,
      Effect.flatMap(f)
    )
  }

  static make<R0, E0, R, E, A, R2, E2, R3, E3, C>(
    input: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>,
    f: (a: A) => Effect.Effect<R3, E3, C>
  ): Computed<R0 | Exclude<R, Scope.Scope> | R2 | R3 | R2 | R3, E0 | E | E2 | E3, C> {
    if (isComputedImpl(input)) {
      return new ComputedImpl(input.input, (a) => Effect.flatMap(input.f(a), f))
    } else {
      return new ComputedImpl(input, f)
    }
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
      (fx) => hold(core.filterMapEffect(fx, f) as any),
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
    if (isFilteredImpl(input)) {
      return new FilteredImpl(
        (input as any).input,
        (a) => Effect.flatMap(Effect.flatten(input.f(a)), f)
      ) as any
    } else {
      return new FilteredImpl(input, f) as any
    }
  }
}

function isComputedImpl<R0, E0, R, E, A, R2, E2>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>
): versioned is ComputedImpl<any, any, any, any, any, any, any, any, any, any> {
  return versioned instanceof ComputedImpl
}

function isFilteredImpl<R0, E0, R, E, A, R2, E2>(
  versioned: Versioned.Versioned<R0, E0, R, E, A, R2, E2, A>
): versioned is FilteredImpl<any, any, any, any, any, any, any, any, any, any> {
  return versioned instanceof FilteredImpl
}

export function skipRepeatsWith<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A>,
  eq: Equivalence.Equivalence<A>
): Computed<R, E, A>

export function skipRepeatsWith<R, E, A>(
  ref: Filtered<R, E, A>,
  eq: Equivalence.Equivalence<A>
): Filtered<R, E, A>

export function skipRepeatsWith<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
  eq: Equivalence.Equivalence<A>
): Computed<R, E, A> | Filtered<R, E, A>

export function skipRepeatsWith<R, E, A>(
  ref: RefSubject<R, E, A> | Computed<R, E, A> | Filtered<R, E, A>,
  eq: Equivalence.Equivalence<A>
): Computed<R, E, A> | Filtered<R, E, A> {
  const versioned = Versioned.transform(ref, (fx) => core.skipRepeatsWith(fx, eq), identity)

  if (isFilteredImpl(ref)) {
    return FilteredImpl.make(versioned, Effect.succeedSome)
  } else {
    return ComputedImpl.make(versioned, Effect.succeed) as any
  }
}

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

class RefSubjectTransform<R, E, A, B> extends FxEffectBase<R | Scope.Scope, E, B, R, E, B>
  implements RefSubject<R, E, B>
{
  readonly [ComputedTypeId]: ComputedTypeId = ComputedTypeId
  readonly [RefSubjectTypeId]: RefSubjectTypeId = RefSubjectTypeId

  readonly version: Effect.Effect<R, never, number>
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
