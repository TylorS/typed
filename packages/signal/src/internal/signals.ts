import * as AsyncData from "@typed/async-data/AsyncData"
import { get, Tagged, unsafeGet } from "@typed/context"
import { Chunk, Effect, Effectable, ExecutionStrategy, Exit, FiberRef, Scope } from "effect"
import * as Fiber from "effect/Fiber"
import { constant } from "effect/Function"
import { type Computed, type Signal } from "../Signal"
import type { SignalTask } from "../SignalQueue"
import { DEFAULT_PRIORITY, SignalQueue } from "../SignalQueue"
import type { Signals } from "../Signals"
import { ComputedTypeId, SignalTypeId } from "./type-id"

export const tag = Tagged<Signals>("@typed/signal/Signals")

const Computing = FiberRef.unsafeMake<Chunk.Chunk<ComputedImpl<any, any, any>>>(Chunk.empty())

type SignalsCtx = {
  queue: SignalQueue
  computeds: WeakMap<Computed.Any, ComputedImpl<any, any, any>>
  options: SignalsOptions
  readers: WeakMap<SignalImpl<any, any> | ComputedImpl<any, any, any>, Set<ComputedImpl<any, any, any>>>
  writers: WeakMap<
    ComputedImpl<any, any, any>,
    Set<ComputedImpl<any, any, any> | SignalImpl<any, any>>
  >
}

type SignalState = {
  fiber: Fiber.Fiber<any, any> | null
  initial: Effect.Effect<any, any>
  lock: <B, E2, R2>(effect: Effect.Effect<B, E2, R2>) => Effect.Effect<B, E2, R2>
  scheduled: boolean
  scope: Scope.Scope
  value: AsyncData.AsyncData<any, any>
  version: number
}

type ComputedState = {
  effect: Effect.Effect<any, any>
  innerScope: Scope.CloseableScope | null
  priority: number
  scheduled: boolean
  scope: Scope.Scope
  value: AsyncData.AsyncData<any, any>
  version: number
  versions: Map<SignalImpl<any, any> | ComputedImpl<any, any, any>, number>
}

export type SignalsOptions = {
  readonly waitForExit: boolean
}

export const layer = (options?: Partial<SignalsOptions>) =>
  tag.layer(SignalQueue.with((queue) => {
    const optionsWithDefaults: SignalsOptions = {
      waitForExit: false,
      ...options
    }
    const signalsCtx: SignalsCtx = {
      computeds: new WeakMap(),
      readers: new WeakMap(),
      writers: new WeakMap(),
      queue,
      options: optionsWithDefaults
    }

    const makeComputedImpl = <A, E, R>(effect: Effect.Effect<A, E, R>, options?: { priority?: number }) =>
      Effect.contextWith((ctx) =>
        makeComputed(signalsCtx, Effect.provide(effect, ctx) as any, unsafeGet(ctx, Scope.Scope), options)
      )

    const signals: Signals = {
      make: <A, E, R>(initial: Effect.Effect<A, E, R>) => makeSignal(signalsCtx, initial),
      getComputed: (computed) => {
        const existing = signalsCtx.computeds.get(computed)
        if (existing === undefined) {
          return makeComputedImpl(computed.effect, { priority: computed.priority }).pipe(
            Effect.tap((c) => signalsCtx.computeds.set(computed, c as any as ComputedImpl<any, any, any>)),
            Effect.flatten
          )
        }
        return existing.commit()
      }
    }

    return signals
  }))

function makeSignal<A, E, R>(
  signalsCtx: SignalsCtx,
  initial: Effect.Effect<A, E, R>
): Effect.Effect<Signal<A, E>, never, R | Scope.Scope> {
  return Effect.gen(function*(_) {
    const context = yield* _(Effect.context<R | Scope.Scope>())
    const signalState: SignalState = {
      fiber: null,
      initial: Effect.provide(initial, context),
      lock: Effect.unsafeMakeSemaphore(1).withPermits(1),
      scheduled: false,
      scope: get(context, Scope.Scope),
      value: initialFromEffect(initial),
      version: -1
    }

    if (!AsyncData.isNoData(signalState.value)) {
      signalState.version = 1
    }

    return new SignalImpl<A, E>(signalsCtx, signalState)
  })
}

// Fast Path for synchronous effects
function initialFromEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>
): AsyncData.AsyncData<E, A> {
  const tag = (effect as any)._tag || (effect as any)._op

  switch (tag) {
    case "Success":
      return AsyncData.success((effect as any).effect_instruction_i0)
    case "Failure":
      return AsyncData.failCause((effect as any).effect_instruction_i0)
    case "Left":
      return AsyncData.fail((effect as any).left)
    case "Right":
      return AsyncData.success((effect as any).right)
    case "Some":
      return AsyncData.success((effect as any).value)
    case "Sync":
      return AsyncData.success((effect as any).effect_instruction_i0())
    default:
      return AsyncData.noData()
  }
}

const Variance: Signal.Variance<any, any, never> = {
  _A: (_) => _,
  _E: (_) => _,
  _R: (_) => _
}

class SignalImpl<A, E> extends Effectable.StructuralClass<A, E | AsyncData.Loading> implements Signal<A, E> {
  readonly [SignalTypeId]: Signal.Variance<A, E, never> = Variance

  readonly commit: () => Effect.Effect<A, E | AsyncData.Loading, never>
  readonly data: Effect.Effect<AsyncData.AsyncData<A, E>, never, never>

  private _get: Effect.Effect<A, E | AsyncData.Loading, never>

  constructor(readonly signals: SignalsCtx, readonly state: SignalState) {
    super()

    this._get = Effect.provideService(getSignalValue(this), Scope.Scope, state.scope)
    this.commit = constant(this._get)
    this.data = Effect.matchCause(this._get, {
      onFailure: () => this.state.value,
      onSuccess: () => this.state.value
    })
  }

  modify<B>(f: (a: A) => readonly [B, A]): Effect.Effect<B, E | AsyncData.Loading, never> {
    return this.state.lock(Effect.gen(this, function*(_) {
      const value = yield* _(this._get)
      const [b, a] = f(value)
      yield* _(setValue(this, AsyncData.success(a)))
      return b
    }))
  }

  modifyEffect<B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R2> {
    return this.state.lock(Effect.gen(this, function*(_) {
      const value = yield* _(this._get)
      const [b, a] = yield* _(f(value))
      yield* _(setValue(this, AsyncData.success(a)))
      return b
    }))
  }

  set(a: A): Effect.Effect<A> {
    return this.state.lock(Effect.as(setValue(this, AsyncData.success(a)), a))
  }

  runUpdates<B, E2, R2>(
    f: (params: {
      get: Effect.Effect<AsyncData.AsyncData<A, E>>
      set: (a: AsyncData.AsyncData<A, E>) => Effect.Effect<AsyncData.AsyncData<A, E>>
    }) => Effect.Effect<B, E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R2> {
    return Effect.flatMap(
      this.data,
      () =>
        this.state.lock(
          f({
            get: this.data,
            set: (a) => Effect.as(setValue(this, AsyncData.success(a)), a)
          })
        )
    )
  }
}

function makeComputed<A, E>(
  signalsCtx: SignalsCtx,
  effect: Effect.Effect<A, E>,
  scope: Scope.Scope,
  options: { priority?: number } | undefined
): ComputedImpl<A, E, never> {
  const computedState: ComputedState = {
    effect,
    innerScope: null,
    priority: options?.priority ?? DEFAULT_PRIORITY,
    scheduled: false,
    scope,
    value: initialFromEffect(effect),
    version: 0,
    versions: new Map()
  }

  if (!AsyncData.isNoData(computedState.value)) {
    computedState.version = 1
  }

  return new ComputedImpl<A, E, never>(signalsCtx, computedState)
}

function getSignalValue(
  signal: SignalImpl<any, any>
): Effect.Effect<any, any, Scope.Scope> {
  return Effect.gen(function*(_) {
    yield* _(updateReadersAndWriters(signal))

    const current = signal.state.value

    if (AsyncData.isSuccess(current) || AsyncData.isOptimistic(current)) {
      return current.value
    } else if (AsyncData.isNoData(current)) {
      const loading = AsyncData.loading()
      yield* _(setValue(signal, loading))

      signal.state.fiber = signal.state.initial.pipe(
        Effect.onExit((exit) => {
          signal.state.fiber = null
          return setValue(signal, AsyncData.fromExit(exit))
        }),
        Effect.interruptible,
        (_) => Effect.runFork(_, { scope: signal.state.scope })
      )

      if (signal.signals.options.waitForExit) {
        return yield* _(Fiber.join(signal.state.fiber))
      } else {
        return yield* _(loading)
      }
    } else if (signal.signals.options.waitForExit && AsyncData.isLoading(current)) {
      return yield* _(Fiber.join(signal.state.fiber!))
    } else {
      return yield* _(current)
    }
  })
}

const ComputedVariance: Computed.Variance<any, any, never> = {
  _A: (_) => _,
  _E: (_) => _,
  _R: (_) => _
}

class ComputedImpl<A, E, R> extends Effectable.StructuralClass<A, E, R> {
  readonly [ComputedTypeId]: Computed.Variance<A, E, never> = ComputedVariance

  readonly commit: () => Effect.Effect<A, E, R>
  readonly data: Effect.Effect<AsyncData.AsyncData<A, E>, never, never>
  readonly priority: number

  private _get: Effect.Effect<A, E, R>

  constructor(readonly signals: SignalsCtx, readonly state: ComputedState) {
    super()

    this._get = getComputedValue(this)
    this.commit = constant(this._get)
    this.data = Effect.sync(() => this.state.value)
    this.priority = state.priority
  }
}

function getComputedValue(
  computed: ComputedImpl<any, any, any>
): Effect.Effect<any, any> {
  return Effect.zipRight(
    updateReadersAndWriters(computed),
    Effect.locallyWith(
      Effect.suspend(() => {
        if (shouldInitComputedValue(computed)) {
          return Effect.flatten(initComputedValue(computed)) as any as Exit.Exit<any, any>
        } else {
          return computed.state.value as any as Exit.Exit<any, any>
        }
      }),
      Computing,
      Chunk.append(computed)
    )
  )
}

function shouldInitComputedValue(
  computed: ComputedImpl<any, any, any>
): boolean {
  if (computed.state.value._tag === "NoData") return true
  else if (computed.state.value._tag === "Loading") return false
  else {
    let shouldRecompute = false
    for (const dep of depthFirstWriters(computed)) {
      if (computed.state.versions.has(dep)) {
        const version = computed.state.versions.get(dep)!
        const depVersion = dep.state.version
        if (version !== depVersion) {
          shouldRecompute = true
          computed.state.versions.set(dep, depVersion)
        }
      } else {
        computed.state.versions.set(dep, dep.state.version)
        shouldRecompute = true
      }
    }

    return shouldRecompute
  }
}

function initComputedValue(
  computed: ComputedImpl<any, any, any>
): Effect.Effect<AsyncData.AsyncData<any, any>> {
  return Effect.gen(function*(_) {
    const loading = AsyncData.startLoading(computed.state.value)

    yield* _(setValue(computed, loading, false))

    // If there's a previously existing inner scope, we need to close it
    // This enables Computed values to be of Fibers and other resources which use Scope
    // to manage their resources
    if (computed.state.innerScope) {
      const fiberId = yield* _(Effect.fiberId)
      yield* _(Scope.close(computed.state.innerScope, Exit.interrupt(fiberId)))
    }
    const innerScope = computed.state.innerScope = yield* _(
      Scope.fork(computed.state.scope, ExecutionStrategy.sequential)
    )
    const exit = yield* _(computed.state.effect, Effect.provideService(Scope.Scope, innerScope), Effect.exit)
    const data = AsyncData.fromExit(exit)

    yield* _(setValue(computed, data, false))

    return data
  }).pipe(Effect.onInterrupt(() => setValue(computed, AsyncData.stopLoading(computed.state.value), false)))
}

function updateReadersAndWriters(current: ComputedImpl<any, any, any> | SignalImpl<any, any>) {
  return Effect.gen(function*(_) {
    const stack = yield* _(FiberRef.get(Computing))
    if (Chunk.isNonEmpty(stack)) {
      const computing = Chunk.unsafeLast(stack)
      let readers = current.signals.readers.get(current)
      if (readers === undefined) {
        readers = new Set()
        current.signals.readers.set(current, readers)
      }
      readers.add(computing)

      let writers = current.signals.writers.get(computing)
      if (writers === undefined) {
        writers = new Set()
        current.signals.writers.set(computing, writers)
      }
      writers.add(current)
      computing.state.versions.set(current, current.state.version)
    }
  })
}

function setValue(
  current: ComputedImpl<any, any, any> | SignalImpl<any, any>,
  value: AsyncData.AsyncData<any, any>,
  updateVersion = true
): Effect.Effect<void> {
  return Effect.gen(function*(_) {
    if (AsyncData.dataEqual(current.state.value, value)) return

    current.state.value = value

    if (!updateVersion) return

    current.state.version++
    if (current.signals.readers.has(current)) {
      yield* _(
        Effect.forEach(
          depthFirstReaders(current),
          (reader) =>
            Effect.provideService(
              current.signals.queue.add(updateComputedTask(reader), reader.priority),
              Scope.Scope,
              reader.state.scope
            )
        )
      )
    }
  })
}

function depthFirstReaders(
  current: ComputedImpl<any, any, any> | SignalImpl<any, any>
): Set<ComputedImpl<any, any, any>> {
  const visited = new Set<ComputedImpl<any, any, any>>()

  const roots = current.signals.readers.get(current)
  if (roots === undefined) return visited

  // Sort by priority for synchronous updates
  const toProcess = [...roots].sort((a, b) => a.priority - b.priority)

  while (toProcess.length > 0) {
    const reader = toProcess.shift()!
    if (
      // Already visited
      visited.has(reader) ||
      // Already scheduled
      reader.state.scheduled
    ) continue

    visited.add(reader)
    const readers = current.signals.readers.get(reader)
    if (readers !== undefined) {
      toProcess.push(...[...readers].sort((a, b) => a.priority - b.priority))
    }
  }

  return visited
}

function* depthFirstWriters(
  current: ComputedImpl<any, any, any>
): Generator<ComputedImpl<any, any, any> | SignalImpl<any, any>> {
  const visited = new Set<ComputedImpl<any, any, any> | SignalImpl<any, any>>()

  const roots = current.signals.writers.get(current)
  if (roots === undefined) return visited

  const toProcess = [...roots]
  while (toProcess.length > 0) {
    const writer = toProcess.shift()!
    if (
      // Already visited
      visited.has(writer)
    ) continue

    yield writer

    if (writer.constructor === ComputedImpl) {
      const readers = current.signals.writers.get(writer)
      if (readers !== undefined) {
        toProcess.push(...readers)
      }
    }
  }

  return visited
}

function updateComputedTask(
  computed: ComputedImpl<any, any, any>
): SignalTask {
  return {
    key: computed,
    task: Effect.provideService(updateComputedValue(computed), Scope.Scope, computed.state.scope)
  }
}

function updateComputedValue(
  computed: ComputedImpl<any, any, any>
): Effect.Effect<any, never, Scope.Scope> {
  computed.state.scheduled = true
  return Effect.gen(function*(_) {
    if (shouldInitComputedValue(computed)) {
      yield* _(initComputedValue(computed))
    }

    computed.state.scheduled = false
  })
}
