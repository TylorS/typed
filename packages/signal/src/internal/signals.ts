import * as AsyncData from "@typed/async-data/AsyncData"
import type { Context } from "@typed/context"
import { get, Tagged } from "@typed/context"
import type { Clock } from "effect"
import { Chunk, Effect, Effectable, Exit, FiberRef, Scope } from "effect"
import * as Fiber from "effect/Fiber"
import { constant } from "effect/Function"
import type { Computed, Signal, SignalOptions } from "../Signal.js"
import type { SignalTask } from "../SignalQueue.js"
import { DEFAULT_PRIORITY, SignalQueue } from "../SignalQueue.js"
import type { Signals } from "../Signals.js"
import { ComputedTypeId, SignalTypeId } from "./type-id.js"

export const tag = Tagged<Signals>("@typed/signal/Signals")

const Computing = FiberRef.unsafeMake<Chunk.Chunk<ComputedImpl<any, any>>>(Chunk.empty())

type SignalsCtx = {
  clock: Clock.Clock
  queue: SignalQueue
  computeds: WeakMap<Computed.Any, ComputedImpl<any, any>>
  options: SignalsOptions
  readers: WeakMap<SignalImpl<any, any> | ComputedImpl<any, any>, Set<ComputedImpl<any, any>>>
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
  context: Context<any>
  effect: Effect.Effect<any, any, any>
  needsUpdate: boolean
  value: AsyncData.AsyncData<any, any>
}

export type SignalsOptions = {
  readonly waitForExit: boolean
}

export const layer = (options?: Partial<SignalsOptions>) =>
  tag.layer(Effect.clockWith((clock) =>
    SignalQueue.with((queue) => {
      const optionsWithDefaults: SignalsOptions = {
        waitForExit: false,
        ...options
      }
      const signalsCtx: SignalsCtx = {
        clock,
        computeds: new WeakMap(),
        readers: new WeakMap(),
        queue,
        options: optionsWithDefaults
      }

      const makeComputedImpl = <A, E, R>(effect: Effect.Effect<A, E, R>, ctx: Context<R>) =>
        makeComputed(signalsCtx, effect, ctx, clock.unsafeCurrentTimeMillis())

      const signals: Signals = {
        make: <A, E, R>(initial: Effect.Effect<A, E, R>) => makeSignal(signalsCtx, initial),

        getComputed: (computed) =>
          Effect.contextWithEffect((ctx) => {
            let impl = signalsCtx.computeds.get(computed)
            if (impl === undefined) {
              impl = makeComputedImpl(computed.effect, ctx)
              signalsCtx.computeds.set(computed, impl)

              return impl.commit()
            } else {
              impl.state.context = ctx
            }
            return impl.commit()
          })
      }

      return signals
    })
  ))

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
      value: initialFromEffect(initial, signalsCtx.clock.unsafeCurrentTimeMillis())
    }

    return new SignalImpl<A, E>(signalsCtx, signalState)
  })
}

// Fast Path for synchronous effects
function initialFromEffect<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  timestamp: number
): AsyncData.AsyncData<E, A> {
  const tag = (effect as any)._op

  switch (tag) {
    case "Success":
      return AsyncData.success((effect as any).effect_instruction_i0, { timestamp })
    case "Failure":
      return AsyncData.failCause((effect as any).effect_instruction_i0, { timestamp })
    case "Left":
      return AsyncData.fail((effect as any).left, { timestamp })
    case "Right":
      return AsyncData.success((effect as any).right, { timestamp })
    case "Some":
      return AsyncData.success((effect as any).value, { timestamp })
    case "Sync":
      return AsyncData.success((effect as any).effect_instruction_i0(), { timestamp })
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
  ): Effect.Effect<B, E2, R2> {
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

function makeComputed<A, E, R>(
  signalsCtx: SignalsCtx,
  effect: Effect.Effect<A, E, R>,
  ctx: Context<R>,
  timestamp: number
): ComputedImpl<A, E> {
  const computedState: ComputedState = {
    effect,
    needsUpdate: true,
    context: ctx,
    value: initialFromEffect(effect, timestamp)
  }

  return new ComputedImpl<A, E>(signalsCtx, computedState)
}

function getSignalValue(
  signal: SignalImpl<any, any>
): Effect.Effect<any, any, Scope.Scope> {
  return Effect.flatMap(updateReaders(signal), () => {
    if (AsyncData.isNoData(signal.state.value)) return initSignalValue(signal)
    if (AsyncData.isLoading(signal.state.value) && signal.signals.options.waitForExit) {
      return Fiber.join(signal.state.fiber!)
    }
    return signal.state.value
  })
}

function initSignalValue(signal: SignalImpl<any, any>) {
  const clock = signal.signals.clock
  const loading = AsyncData.loading({ timestamp: clock.unsafeCurrentTimeMillis() })
  return Effect.flatMap(setValue(signal, loading), () => {
    signal.state.fiber = signal.state.initial.pipe(
      Effect.onExit((exit) => {
        signal.state.fiber = null
        return setValue(
          signal,
          Exit.match(exit, {
            onFailure: (cause) => AsyncData.failCause(cause, { timestamp: clock.unsafeCurrentTimeMillis() }),
            onSuccess: (value) => AsyncData.success(value, { timestamp: clock.unsafeCurrentTimeMillis() })
          })
        )
      }),
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

class ComputedImpl<A, E> extends Effectable.StructuralClass<A, E> {
  readonly [ComputedTypeId]: Computed.Variance<A, E, never> = ComputedVariance

  readonly commit: () => Effect.Effect<A, E>
  readonly data: Effect.Effect<AsyncData.AsyncData<A, E>, never, never>

  private _get: Effect.Effect<A, E>

  constructor(readonly signals: SignalsCtx, readonly state: ComputedState) {
    super()

    this._get = getComputedValue(this)
    this.commit = constant(this._get)
    this.data = Effect.matchCause(this._get, {
      onFailure: () => this.state.value,
      onSuccess: () => this.state.value
    })
  }
}

function getComputedValue(
  computed: ComputedImpl<any, any>
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
            })) as any as Effect.Effect<any, any>
        } else {
          return computed.state.value as Effect.Effect<any, any>
        }
      }),
      Computing,
      Chunk.append(computed)
    )
  )
}

function initComputedValue(
  computed: ComputedImpl<any, any>
): Effect.Effect<AsyncData.AsyncData<any, any>> {
  computed.state.needsUpdate = false
  const clock = computed.signals.clock
  const loading = AsyncData.startLoading(computed.state.value, { timestamp: clock.unsafeCurrentTimeMillis() })

  return setValue(computed, loading).pipe(
    Effect.zipRight(Effect.exit(computed.state.effect)),
    Effect.map((exit) =>
      Exit.match(exit, {
        onFailure: (cause): AsyncData.AsyncData<any, any> =>
          AsyncData.failCause(cause, { timestamp: clock.unsafeCurrentTimeMillis() }),
        onSuccess: (value): AsyncData.AsyncData<any, any> =>
          AsyncData.success(value, { timestamp: clock.unsafeCurrentTimeMillis() })
      })
    ),
    Effect.onInterrupt(() => {
      computed.state.needsUpdate = true
      return setValue(computed, AsyncData.stopLoading(computed.state.value))
    }),
    Effect.tap((data) => setValue(computed, data)),
    Effect.provide(computed.state.context)
  )
}

function updateReaders(current: ComputedImpl<any, any> | SignalImpl<any, any>) {
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
  current: ComputedImpl<any, any> | SignalImpl<any, any>,
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
            current.signals.queue.add(updateComputedTask(reader), current.state.priority),
            Scope.Scope,
            current.state.scope
          )
      )
    )
  }
  return Effect.unit
}

function depthFirstReaders(
  current: ComputedImpl<any, any> | SignalImpl<any, any>
): Set<ComputedImpl<any, any>> {
  const visited = new Set<ComputedImpl<any, any>>()
  const index = current.signals.readers
  const roots = index.get(current)
  if (roots === undefined) return visited

  // Sort by priority for synchronous updates
  const toProcess = [...roots]

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
      toProcess.push(...readers)
    }
  }

  return visited
}

function updateComputedTask(
  computed: ComputedImpl<any, any>
): SignalTask {
  return {
    key: computed,
    task: updateComputedValue(computed)
  }
}

function updateComputedValue(
  computed: ComputedImpl<any, any>
): Effect.Effect<any> {
  return Effect.suspend(() => {
    if (computed.state.needsUpdate) {
      return initComputedValue(computed)
    }
    return Effect.unit
  })
}
