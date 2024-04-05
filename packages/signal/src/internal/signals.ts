import * as AsyncData from "@typed/async-data/AsyncData"
import { get, Tagged } from "@typed/context"
import { Effect, Effectable, ExecutionStrategy, Exit, Scope } from "effect"
import * as Fiber from "effect/Fiber"
import { constant } from "effect/Function"
import { type Computed, type Signal } from "../Signal"
import type { SignalTask } from "../SignalQueue"
import { DEFAULT_PRIORITY, SignalQueue } from "../SignalQueue"
import type { Signals } from "../Signals"
import { ComputedTypeId, SignalTypeId } from "./type-id"

export const tag = Tagged<Signals>("@typed/signal/Signals")

type SignalsCtx = {
  computing: ComputedImpl<any, any, any> | null
  queue: SignalQueue
  options: SignalsOptions
  readers: Map<SignalImpl<any, any> | ComputedImpl<any, any, any>, Set<ComputedImpl<any, any, any>>>
  writers: Map<
    ComputedImpl<any, any, any>,
    Set<ComputedImpl<any, any, any> | SignalImpl<any, any>>
  >
}

type SignalState = {
  initial: Effect.Effect<any, any>
  lock: <B, E2, R2>(effect: Effect.Effect<B, E2, R2>) => Effect.Effect<B, E2, R2>
  value: AsyncData.AsyncData<any, any>
  scope: Scope.Scope
  fiber: Fiber.Fiber<any, any> | null
  version: number
  scheduled: boolean
}

type ComputedState = {
  effect: Effect.Effect<any, any>
  priority: number
  scope: Scope.Scope
  value: AsyncData.AsyncData<any, any>
  version: number
  versions: Map<SignalImpl<any, any> | ComputedImpl<any, any, any>, number>
  scheduled: boolean
  innerScope: Scope.CloseableScope | null
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
      computing: null,
      readers: new Map(),
      writers: new Map(),
      queue,
      options: optionsWithDefaults
    }

    const signals: Signals = {
      make: <A, E, R>(initial: Effect.Effect<A, E, R>) => makeSignal(signalsCtx, initial),
      compute: <A, E, R>(effect: Effect.Effect<A, E, R>, options?: { priority?: number }) =>
        Effect.contextWith((ctx) =>
          makeComputed(signalsCtx, Effect.provide(effect, ctx) as any, get(ctx, Scope.Scope), options)
        )
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
      initial: Effect.provide(initial, context),
      value: initialFromEffect(initial),
      lock: Effect.unsafeMakeSemaphore(1).withPermits(1),
      fiber: null,
      scope: get(context, Scope.Scope),
      version: -1,
      scheduled: false
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

    this._get = Effect.provideService(getSignalValue(signals, this), Scope.Scope, state.scope)
    this.commit = constant(this._get)
    this.data = Effect.sync(() => this.state.value)
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
): Computed<A, E> {
  const computedState: ComputedState = {
    effect,
    priority: options?.priority ?? DEFAULT_PRIORITY,
    value: AsyncData.noData(),
    version: -1,
    versions: new Map(),
    scope,
    scheduled: false,
    innerScope: null
  }

  return new ComputedImpl<A, E, never>(signalsCtx, computedState)
}

function getSignalValue(
  signalsCtx: SignalsCtx,
  signal: SignalImpl<any, any>
): Effect.Effect<any, any, Scope.Scope> {
  return Effect.gen(function*(_) {
    updateReadersAndWriters(signalsCtx, signal)

    const current = signal.state.value

    if (AsyncData.isSuccess(current) || AsyncData.isOptimistic(current)) {
      return current.value
    } else if (AsyncData.isNoData(current)) {
      const loading = AsyncData.loading()
      yield* _(setValue(signal, loading))

      signal.state.fiber = yield* _(
        signal.state.initial,
        Effect.onExit((exit) => {
          signal.state.fiber = null
          return setValue(signal, AsyncData.fromExit(exit))
        }),
        Effect.forkIn(signal.state.scope),
        Effect.interruptible
      )

      if (signalsCtx.options.waitForExit) {
        return yield* _(Fiber.join(signal.state.fiber))
      } else {
        return yield* _(loading)
      }
    } else if (signalsCtx.options.waitForExit && AsyncData.isLoading(current)) {
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

class ComputedImpl<A, E, R> extends Effectable.StructuralClass<A, E, R> implements Computed<A, E, R> {
  readonly [ComputedTypeId]: Computed.Variance<A, E, never> = ComputedVariance

  readonly commit: () => Effect.Effect<A, E, R>
  readonly data: Effect.Effect<AsyncData.AsyncData<A, E>, never, never>
  readonly priority: number

  private _get: Effect.Effect<A, E, R>

  constructor(readonly signals: SignalsCtx, readonly state: ComputedState) {
    super()

    this._get = getComputedValue(signals, this)
    this.commit = constant(this._get)
    this.data = Effect.sync(() => this.state.value)
    this.priority = state.priority
  }
}

function getComputedValue(
  signalsCtx: SignalsCtx,
  computed: ComputedImpl<any, any, any>
): Effect.Effect<any, any> {
  return Effect.gen(function*(_) {
    updateReadersAndWriters(signalsCtx, computed)

    const prev = signalsCtx.computing
    signalsCtx.computing = computed

    const reset = Effect.sync(() => {
      signalsCtx.computing = prev
    })

    if (shouldInitComputedValue(signalsCtx, computed)) {
      return yield* _(
        initComputedValue(computed).pipe(
          (_) => Effect.flatten(_ as any as Effect.Effect<Exit.Exit<any, any>, any>),
          Effect.ensuring(reset)
        )
      )
    } else {
      return yield* _(Effect.ensuring(computed.state.value as any as Exit.Exit<any, any>, reset))
    }
  })
}

function shouldInitComputedValue(
  signalsCtx: SignalsCtx,
  computed: ComputedImpl<any, any, any>
): boolean {
  if (computed.state.value._tag === "NoData") return true

  let shouldRecompute = false

  // If any of the dependencies have changed, we need to recompute
  const dependencies = signalsCtx.writers.get(computed)
  if (dependencies) {
    for (const dep of dependencies) {
      if (computed.state.versions.has(dep)) {
        const version = computed.state.versions.get(dep)!
        const depVersion = dep.state.version
        if (version !== depVersion) {
          shouldRecompute = true
        }
        computed.state.versions.set(dep, depVersion)
      } else {
        shouldRecompute = true
      }
    }
  }

  return shouldRecompute
}

function initComputedValue(
  computed: ComputedImpl<any, any, any>
): Effect.Effect<AsyncData.AsyncData<any, any>> {
  return Effect.gen(function*(_) {
    const loading = AsyncData.loading()

    yield* _(setValue(computed, loading))

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

    yield* _(setValue(computed, data))

    return data
  })
}

function updateReadersAndWriters(signalsCtx: SignalsCtx, current: ComputedImpl<any, any, any> | SignalImpl<any, any>) {
  if (signalsCtx.computing !== null) {
    let readers = signalsCtx.readers.get(current)
    if (readers === undefined) {
      readers = new Set()
      signalsCtx.readers.set(current, readers)
    }
    readers.add(signalsCtx.computing)

    let writers = signalsCtx.writers.get(signalsCtx.computing)
    if (writers === undefined) {
      writers = new Set()
      signalsCtx.writers.set(signalsCtx.computing, writers)
    }
    writers.add(current)
    signalsCtx.computing.state.versions.set(current, current.state.version)
  }
}

function setValue(
  current: ComputedImpl<any, any, any> | SignalImpl<any, any>,
  value: AsyncData.AsyncData<any, any>
): Effect.Effect<void> {
  return Effect.gen(function*(_) {
    if (AsyncData.dataEqual(current.state.value, value)) return

    current.state.value = value
    current.state.version++

    if (current.signals.readers.has(current)) {
      yield* _(
        Effect.forEach(
          depthFirstReaders(current),
          (reader) =>
            reader.state.scheduled ? Effect.unit : Effect.provideService(
              current.signals.queue.add(updateComputedTask(current.signals, reader), reader.priority),
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

  const toProcess = [...current.signals.readers.get(current) ?? []]
  while (toProcess.length > 0) {
    const reader = toProcess.shift()!
    if (visited.has(reader) || reader.state.scheduled) continue
    visited.add(reader)

    const readers = current.signals.readers.get(reader)
    if (readers !== undefined) {
      toProcess.push(...readers)
    }
  }

  return visited
}

function updateComputedTask(
  signalsCtx: SignalsCtx,
  computed: ComputedImpl<any, any, any>
): SignalTask {
  return {
    key: computed,
    task: Effect.provideService(updateComputedValue(signalsCtx, computed), Scope.Scope, computed.state.scope)
  }
}

function updateComputedValue(
  signalsCtx: SignalsCtx,
  computed: ComputedImpl<any, any, any>
): Effect.Effect<any, never, Scope.Scope> {
  computed.state.scheduled = true
  return Effect.gen(function*(_) {
    if (shouldInitComputedValue(signalsCtx, computed)) {
      yield* _(initComputedValue(computed))
    }

    computed.state.scheduled = false
  })
}
