import * as AsyncData from "@typed/async-data/AsyncData"
import { get, Tagged, unsafeGet } from "@typed/context"
import type { Exit } from "effect"
import { Chunk, Effect, Effectable, FiberRef, Scope } from "effect"
import * as Fiber from "effect/Fiber"
import { constant } from "effect/Function"
import type { Computed, Signal, SignalOptions } from "../Signal.js"
import type { SignalTask } from "../SignalQueue.js"
import { DEFAULT_PRIORITY, SignalQueue } from "../SignalQueue.js"
import type { Signals } from "../Signals.js"
import { ComputedTypeId, SignalTypeId } from "./type-id.js"

export const tag = Tagged<Signals>("@typed/signal/Signals")

const Computing = FiberRef.unsafeMake<Chunk.Chunk<ComputedImpl<any, any, any>>>(Chunk.empty())

type SignalsCtx = {
  queue: SignalQueue
  computeds: WeakMap<Computed.Any, ComputedImpl<any, any, any>>
  options: SignalsOptions
  readers: WeakMap<SignalImpl<any, any> | ComputedImpl<any, any, any>, Set<ComputedImpl<any, any, any>>>
}

type SignalState = {
  fiber: Fiber.Fiber<any, any> | null
  priority: number
  initial: Effect.Effect<any, any>
  lock: <B, E2, R2>(effect: Effect.Effect<B, E2, R2>) => Effect.Effect<B, E2, R2>
  scope: Scope.Scope
  value: AsyncData.AsyncData<any, any>
}

type ComputedState = {
  effect: Effect.Effect<any, any>
  priority: number
  needsUpdate: boolean
  scope: Scope.Scope
  value: AsyncData.AsyncData<any, any>
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
            Effect.tap((c) => signalsCtx.computeds.set(computed, c)),
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
  initial: Effect.Effect<A, E, R>,
  options?: Partial<SignalOptions>
): Effect.Effect<Signal<A, E>, never, R | Scope.Scope> {
  return Effect.contextWith((context) => {
    const signalState: SignalState = {
      fiber: null,
      initial: Effect.provide(initial, context),
      lock: Effect.unsafeMakeSemaphore(1).withPermits(1),
      priority: options?.priority ?? DEFAULT_PRIORITY,
      scope: get(context, Scope.Scope),
      value: initialFromEffect(initial)
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
    return this.state.lock(Effect.flatMap(this._get, (value) => {
      const [b, a] = f(value)
      return Effect.as(setValue(this, AsyncData.success(a)), b)
    }))
  }

  modifyEffect<B, E2, R2>(
    f: (a: A) => Effect.Effect<readonly [B, A], E2, R2>
  ): Effect.Effect<B, E | E2 | AsyncData.Loading, R2> {
    return this.state.lock(
      Effect.flatMap(Effect.flatMap(this._get, f), ([b, a]) => Effect.as(setValue(this, AsyncData.success(a)), b))
    )
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
  options?: { priority?: number }
): ComputedImpl<A, E, never> {
  const computedState: ComputedState = {
    effect,
    needsUpdate: true,
    priority: options?.priority ?? DEFAULT_PRIORITY,
    scope,
    value: initialFromEffect(effect)
  }

  return new ComputedImpl<A, E, never>(signalsCtx, computedState)
}

function getSignalValue(
  signal: SignalImpl<any, any>
): Effect.Effect<any, any, Scope.Scope> {
  return Effect.flatMap(updateReaders(signal), () =>
    AsyncData.match(signal.state.value, {
      NoData: () => initSignalValue(signal),
      Loading: (_) => signal.signals.options.waitForExit ? Fiber.join(signal.state.fiber!) : _,
      Failure: Effect.failCause,
      Success: Effect.succeed,
      Optimistic: Effect.succeed
    }))
}

function initSignalValue(signal: SignalImpl<any, any>) {
  const loading = AsyncData.loading()

  return Effect.flatMap(setValue(signal, loading), () => {
    signal.state.fiber = signal.state.initial.pipe(
      Effect.onExit((exit) => {
        signal.state.fiber = null
        return setValue(signal, AsyncData.fromExit(exit))
      }),
      Effect.interruptible,
      (_) => Effect.runFork(_, { scope: signal.state.scope })
    )
    return Effect.if(signal.signals.options.waitForExit, {
      onFalse: loading,
      onTrue: Fiber.join(signal.state.fiber)
    })
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
    this.priority = this.state.priority
  }
}

function getComputedValue(
  computed: ComputedImpl<any, any, any>
): Effect.Effect<any, any> {
  return Effect.zipRight(
    updateReaders(computed),
    Effect.locallyWith(
      Effect.suspend(() => {
        if (computed.state.needsUpdate) {
          computed.state.needsUpdate = false
          return Effect.tapErrorCause(Effect.flatten(initComputedValue(computed)), () =>
            Effect.sync(() => {
              computed.state.needsUpdate = true
            })) as any as Exit.Exit<any, any>
        } else {
          return computed.state.value as any as Exit.Exit<any, any>
        }
      }),
      Computing,
      Chunk.append(computed)
    )
  )
}

function initComputedValue(
  computed: ComputedImpl<any, any, any>
): Effect.Effect<AsyncData.AsyncData<any, any>> {
  return Effect.suspend(() => {
    computed.state.needsUpdate = false
    const loading = AsyncData.startLoading(computed.state.value)

    return setValue(computed, loading).pipe(
      Effect.zipRight(Effect.exit(computed.state.effect)),
      Effect.map(AsyncData.fromExit),
      Effect.tap((data) => setValue(computed, data)),
      Effect.onInterrupt(() => {
        computed.state.needsUpdate = true
        return setValue(computed, AsyncData.stopLoading(computed.state.value))
      })
    )
  })
}

function updateReaders(current: ComputedImpl<any, any, any> | SignalImpl<any, any>) {
  return Effect.map(FiberRef.get(Computing), (stack) => {
    if (Chunk.isNonEmpty(stack)) {
      const computing = Chunk.unsafeLast(stack)
      let readers = current.signals.readers.get(current)
      if (readers === undefined) {
        readers = new Set()
        current.signals.readers.set(current, readers)
      }
      readers.add(computing)
    }
  })
}

function setValue(
  current: ComputedImpl<any, any, any> | SignalImpl<any, any>,
  value: AsyncData.AsyncData<any, any>
): Effect.Effect<AsyncData.AsyncData<any, any>> {
  if (AsyncData.dataEqual(current.state.value, value)) return Effect.succeed(value)
  current.state.value = value
  if (current.constructor === SignalImpl) {
    return Effect.as(notify(current), value)
  }
  return Effect.succeed(value)
}

function notify(current: SignalImpl<any, any>) {
  if (current.signals.readers.has(current)) {
    return (
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
  return Effect.unit
}

function depthFirstReaders(
  current: ComputedImpl<any, any, any> | SignalImpl<any, any>
): Set<ComputedImpl<any, any, any>> {
  const visited = new Set<ComputedImpl<any, any, any>>()
  const index = current.signals.readers
  const roots = index.get(current)
  if (roots === undefined) return visited

  // Sort by priority for synchronous updates
  const toProcess = [...roots].sort((a, b) => a.priority - b.priority)

  while (toProcess.length > 0) {
    const reader = toProcess.shift()!
    if (
      // Already visited
      visited.has(reader)
    ) continue

    // Mark as needing update
    reader.state.needsUpdate = true

    visited.add(reader)
    const readers = index.get(reader)
    if (readers !== undefined) {
      toProcess.push(...[...readers].sort((a, b) => a.priority - b.priority))
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
  return Effect.suspend(() => {
    if (computed.state.needsUpdate) {
      return initComputedValue(computed)
    }
    return Effect.unit
  })
}
