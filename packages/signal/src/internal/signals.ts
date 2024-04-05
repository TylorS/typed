import * as AsyncData from "@typed/async-data/AsyncData"
import { get, Tagged } from "@typed/context"
import { Effect, Effectable, Scope } from "effect"
import * as Fiber from "effect/Fiber"
import { constant } from "effect/Function"
import { type Computed, type Signal } from "../Signal"
import type { SignalTask } from "../SignalQueue"
import { SignalQueue } from "../SignalQueue"
import type { Signals } from "../Signals"
import { ComputedTypeId, SignalTypeId } from "./type-id"

export const tag = Tagged<Signals>("@typed/signal/Signals")

type SignalsCtx = {
  computing: ComputedImpl<any, any, any> | null
  queue: SignalQueue
  options: SignalsOptions
  readers: Map<SignalImpl<any, any> | ComputedImpl<any, any, any>, Set<ComputedImpl<any, any, any>>>
  writers: Map<
    SignalImpl<any, any> | ComputedImpl<any, any, any>,
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

    return new SignalImpl<A, E>(signalsCtx, signalState)
  })
}

// Fast Path for synchronous effects
function initialFromEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>
): AsyncData.AsyncData<E, A> {
  const tag = (effect as any)._tag

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
      yield* _(setValue(this.signals, this, AsyncData.success(a)))
      return b
    }))
  }

  modifyEffect<B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R2> {
    return this.state.lock(Effect.gen(this, function*(_) {
      const value = yield* _(this._get)
      const [b, a] = yield* _(f(value))
      yield* _(setValue(this.signals, this, AsyncData.success(a)))
      return b
    }))
  }

  set(a: A): Effect.Effect<A> {
    return this.state.lock(Effect.as(setValue(this.signals, this, AsyncData.success(a)), a))
  }

  runUpdates<B, E2, R2>(
    f: (params: {
      get: Effect.Effect<AsyncData.AsyncData<A, E>>
      set: (a: AsyncData.AsyncData<A, E>) => Effect.Effect<AsyncData.AsyncData<A, E>>
    }) => Effect.Effect<B, E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R2> {
    return this.state.lock(f({
      get: this.data,
      set: (a) => Effect.as(setValue(this.signals, this, AsyncData.success(a)), a)
    }))
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
    priority: options?.priority ?? 0,
    value: AsyncData.noData(),
    version: -1,
    versions: new Map(),
    scope,
    scheduled: false
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
      yield* _(setValue(signalsCtx, signal, loading))

      signal.state.fiber = yield* _(
        signal.state.initial,
        Effect.onExit((exit) => {
          signal.state.fiber = null
          return setValue(signalsCtx, signal, AsyncData.fromExit(exit))
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
  return Effect.suspend(() => {
    updateReadersAndWriters(signalsCtx, computed)

    const prev = signalsCtx.computing
    signalsCtx.computing = computed

    const reset = Effect.sync(() => {
      signalsCtx.computing = prev
    })

    if (shouldInitComputedValue(signalsCtx, computed)) {
      return initComputedValue(signalsCtx, computed).pipe(
        (_) => Effect.flatten<any, any, never, any, never>(_ as Effect.Effect<any, any>),
        Effect.ensuring(reset)
      )
    } else {
      return Effect.ensuring(computed.state.value as Effect.Effect<any, any>, reset)
    }
  }) // Seems like bad inference of the context because of all the any types :-(
}

function shouldInitComputedValue(
  signalsCtx: SignalsCtx,
  computed: ComputedImpl<any, any, any>
): boolean {
  if (computed.state.value._tag === "NoData") return true

  // If any of the dependencies have changed, we need to recompute
  const dependencies = signalsCtx.writers.get(computed)
  if (dependencies) {
    for (const dep of dependencies) {
      if (!computed.state.versions.has(dep)) return true
      const version = computed.state.versions.get(dep)!
      const depVersion = dep.state.version
      if (version !== depVersion) return true
    }
  }

  return false
}

function initComputedValue(
  signalsCtx: SignalsCtx,
  computed: ComputedImpl<any, any, any>
): Effect.Effect<AsyncData.AsyncData<any, any>> {
  return Effect.gen(function*(_) {
    const loading = AsyncData.loading()

    yield* _(setValue(signalsCtx, computed, loading))

    const exit = yield* _(computed.state.effect, Effect.exit)
    const data = AsyncData.fromExit(exit)

    yield* _(setValue(signalsCtx, computed, data))

    // Keep track of the current version that computed is written from
    const writers = signalsCtx.writers.get(computed)
    if (writers !== undefined) {
      for (const dep of writers) {
        computed.state.versions.set(dep, dep.state.version)
      }
    }

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
  }
}

function updateComputedValue(
  signalsCtx: SignalsCtx,
  computed: ComputedImpl<any, any, any>
): Effect.Effect<any, never, Scope.Scope> {
  return Effect.gen(function*(_) {
    updateReadersAndWriters(signalsCtx, computed)

    const prev = signalsCtx.computing
    signalsCtx.computing = computed

    const value = shouldInitComputedValue(signalsCtx, computed)
      ? yield* _(initComputedValue(signalsCtx, computed))
      : computed.state.value

    signalsCtx.computing = prev

    return value
  })
}

function setValue(
  signalsCtx: SignalsCtx,
  current: ComputedImpl<any, any, any> | SignalImpl<any, any>,
  value: AsyncData.AsyncData<any, any>
): Effect.Effect<void> {
  return Effect.gen(function*(_) {
    if (AsyncData.dataEqual(current.state.value, value)) return

    current.state.value = value
    current.state.version++

    // Ensure only one update is scheduled at a time
    if (current.state.scheduled) return

    const readers = signalsCtx.readers.get(current)

    if (readers !== undefined) {
      current.state.scheduled = true

      yield* _(
        Effect.forEach(
          readers,
          (reader) =>
            signalsCtx.queue.add(updateComputedTask(signalsCtx, reader), reader.priority).pipe(
              Effect.provideService(Scope.Scope, reader.state.scope)
            )
        ),
        Effect.ensuring(Effect.sync(() => {
          current.state.scheduled = false
        }))
      )
    }
  })
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
