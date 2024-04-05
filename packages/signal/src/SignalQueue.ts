/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import type { Layer } from "effect"
import { FiberRef } from "effect"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Scope from "effect/Scope"
import { cancelIdleCallback, requestIdleCallback } from "./internal/requestIdleCallback.js"

/**
 * @since 1.0.0
 */
export const DEFAULT_PRIORITY = 10

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export const SignalQueue: Context.Tagged<SignalQueue, SignalQueue> = Context.Tagged<SignalQueue>(
  "@typed/template/SignalQueue"
)

/**
 * @since 1.0.0
 */
export const currentPriority: FiberRef.FiberRef<number> = FiberRef.unsafeMake(DEFAULT_PRIORITY)

/**
 * @since 1.0.0
 */
export interface SignalQueue {
  readonly add: (task: SignalTask, priority: number) => Effect.Effect<void, never, Scope.Scope>
}

/**
 * @since 1.0.0
 */
export interface IdleSignalQueueOptions extends IdleRequestOptions {
  readonly scope: Scope.Scope
}

/**
 * @since 1.0.0
 */
export const unsafeMakeIdleSignalQueue = ({ scope, ...options }: IdleSignalQueueOptions): SignalQueue =>
  new IdleImpl(scope, options)

/**
 * @since 1.0.0
 */
export const unsafeMakeRafSignalQueue = (scope: Scope.Scope): SignalQueue => new RafImpl(scope)

/**
 * @since 1.0.0
 */
export const unsafeMakeMicrotaskSignalQueue = (scope: Scope.Scope): SignalQueue => new MicroTaskImpl(scope)

/**
 * @since 1.0.0
 */
export const unsafeMakeSyncSignalQueue = (): SignalQueue => new SyncImpl()

/**
 * @since 1.0.0
 */
export const idleQueue = (options?: IdleRequestOptions): Layer.Layer<SignalQueue> =>
  SignalQueue.scoped(
    Effect.scopeWith((scope) => Effect.succeed(unsafeMakeIdleSignalQueue({ scope, ...options })))
  )

/**
 * @since 1.0.0
 */
export const rafQueue: Layer.Layer<SignalQueue> = SignalQueue.scoped(
  Effect.scopeWith((scope) => Effect.succeed(unsafeMakeRafSignalQueue(scope)))
)

/**
 * @since 1.0.0
 */
export const microtaskQueue: Layer.Layer<SignalQueue> = SignalQueue.scoped(
  Effect.scopeWith((scope) => Effect.succeed(unsafeMakeMicrotaskSignalQueue(scope)))
)

/**
 * @since 1.0.0
 */
export const syncQueue: Layer.Layer<SignalQueue> = SignalQueue.layer(Effect.sync(unsafeMakeSyncSignalQueue))

const MICRO_TASK_END = DEFAULT_PRIORITY - 1
const RAF_END = DEFAULT_PRIORITY + 9
const IDLE_START = RAF_END + 1

/**
 * @since 1.0.0
 */
export const mixedQueue = (options?: IdleRequestOptions): Layer.Layer<SignalQueue> =>
  SignalQueue.scoped(Effect.scopeWith((scope) => {
    const queues: Array<readonly [priorityRange: readonly [number, number], SignalQueue]> = [
      [[-1, -1], new SyncImpl()],
      [[0, MICRO_TASK_END], new MicroTaskImpl(scope)],
      [[DEFAULT_PRIORITY, RAF_END], new RafImpl(scope)],
      [[IDLE_START, Number.MAX_SAFE_INTEGER], new IdleImpl(scope, options)]
    ]

    return Effect.succeed(new MixedImpl(queues))
  }))

/**
 * @since 1.0.0
 */
export const Priority = {
  Sync: -1,
  /**
   * @example
   * Priority.MicroTask(0-9)
   */
  MicroTask: (priority: number) => Math.min(Math.max(0, priority), MICRO_TASK_END),
  /**
   * @example
   * Priority.Raf(0-9)
   */
  Raf: (priority: number) => Math.min(Math.max(DEFAULT_PRIORITY, DEFAULT_PRIORITY + priority), RAF_END),
  /**
   * @example
   * Priority.Idle(0-9)
   */
  Idle: (priority: number) => Math.max(IDLE_START, IDLE_START + priority)
} as const

class PriorityQueue {
  priorities: Map<number, Map<unknown, SignalTask>> = new Map()

  add(key: unknown, task: SignalTask, priority: number) {
    let set = this.priorities.get(priority)

    if (set === undefined) {
      set = new Map()
      this.priorities.set(priority, set)
    }

    set.set(key, task)
  }

  get(key: unknown, priority: number) {
    return this.priorities.get(priority)?.get(key)
  }

  delete(key: unknown, priority: number) {
    return this.priorities.get(priority)?.delete(key)
  }

  get isEmpty() {
    return this.priorities.size === 0
  }

  *entries() {
    for (const priority of Array.from(this.priorities.keys()).sort((a, b) => a - b)) {
      const parts = this.priorities.get(priority)!
      this.priorities.delete(priority)
      yield parts.values()
    }
  }
}

abstract class BaseImpl implements SignalQueue {
  queue = new PriorityQueue()
  scheduled = false

  constructor(readonly scope: Scope.Scope) {
    this.add.bind(this)
  }

  add(task: SignalTask, priority: number) {
    return Effect.suspend(() => {
      this.queue.add(task.key, task, priority)

      return Effect.zipRight(
        Effect.addFinalizer(() =>
          Effect.sync(() => {
            const currentTask = this.queue.get(task.key, priority)

            // If the current task is still the same we'll delete it from the queue
            if (currentTask === task) {
              this.queue.delete(task.key, priority)
            }
          })
        ),
        this.scheduleNextRun
      )
    })
  }

  scheduleNextRun = Effect.suspend(() => {
    if (this.queue.isEmpty || this.scheduled) return Effect.unit

    this.scheduled = true

    return this.run.pipe(
      Scope.extend(this.scope),
      Effect.forkIn(this.scope)
    )
  })

  abstract run: Effect.Effect<void, never, Scope.Scope>

  protected runTasks = (iterator: Iterator<Iterable<SignalTask>>) =>
    Effect.gen(function*(_) {
      const result = iterator.next()

      if (result.done) return false
      else {
        for (const task of result.value) {
          yield* _(task.task)
        }

        return true
      }
    })
}

class IdleImpl extends BaseImpl implements SignalQueue {
  constructor(
    scope: Scope.Scope,
    readonly options?: IdleRequestOptions
  ) {
    super(scope)
  }

  run: Effect.Effect<void, never, Scope.Scope> = Effect.suspend(() => {
    return Effect.flatMap(
      whenIdle(this.options),
      (deadline) =>
        Effect.gen(this, function*(_) {
          const iterator = this.queue.entries()

          while (shouldContinue(deadline) && (yield* _(this.runTasks(iterator)))) {
            // Continue
          }

          // If we have more work to do, schedule another run
          if (!this.queue.isEmpty) {
            return this.run
          }

          this.scheduled = false

          return Effect.unit
        })
    )
  })
}

class RafImpl extends BaseImpl implements SignalQueue {
  private _set: ((callback: FrameRequestCallback) => number) | typeof setTimeout
  private _clear: (handle: number) => void

  constructor(
    readonly scope: Scope.Scope
  ) {
    super(scope)

    const [set, clear] = typeof globalThis.requestAnimationFrame === "function"
      ? [requestAnimationFrame.bind(globalThis), cancelAnimationFrame.bind(globalThis)]
      : [setTimeout, clearTimeout]
    this._set = set
    this._clear = clear
  }

  run: Effect.Effect<void> = Effect.async((cb) => {
    const id = this._set(() => cb(this.runAllTasks))
    return Effect.sync(() => {
      this.scheduled = false
      this._clear(id)
    })
  })

  private runAllTasks = Effect.gen(this, function*(_) {
    const iterator = this.queue.entries()
    while (yield* _(this.runTasks(iterator))) {
      // Continue
    }

    this.scheduled = false
  })
}

const noOp = () => undefined

class MicroTaskImpl extends BaseImpl implements SignalQueue {
  private _set: { (callback: VoidFunction): void; (callback: () => void): void } | typeof setTimeout
  private _clear:
    | { (id: number | undefined): void; (timeoutId: string | number | NodeJS.Timeout | undefined): void }
    | (() => undefined)

  constructor(
    readonly scope: Scope.Scope
  ) {
    super(scope)

    const [set, clear] = typeof globalThis.queueMicrotask === "function"
      ? [globalThis.queueMicrotask.bind(globalThis), noOp]
      : [setTimeout, clearTimeout]
    this._set = set
    this._clear = clear
  }

  run: Effect.Effect<void> = Effect.async((cb) => {
    const id = this._set(() => cb(this.runAllTasks))
    return Effect.sync(() => {
      this.scheduled = false
      id && this._clear(id)
    })
  })

  private runAllTasks = Effect.gen(this, function*(_) {
    const iterator = this.queue.entries()
    while (yield* _(this.runTasks(iterator))) {
      // Continue
    }

    this.scheduled = false
  })
}

class SyncImpl implements SignalQueue {
  constructor() {
    this.add.bind(this)
  }

  add({ task }: SignalTask) {
    return task
  }
}

class MixedImpl implements SignalQueue {
  private _priorityCache = new Map<number, SignalQueue>()

  constructor(
    readonly queues: Array<readonly [priorityRange: readonly [number, number], SignalQueue]>
  ) {
    this.queues.sort(([a], [b]) => a[0] - b[0])

    this.add.bind(this)
  }

  add(task: SignalTask, priority: number) {
    let queue = this.getQueueForPriority(priority)

    if (queue === undefined) {
      queue = this.queues[this.queues.length - 1][1]
    }

    return queue.add(task, priority)
  }

  private getQueueForPriority(priority: number) {
    if (this._priorityCache.has(priority)) {
      return this._priorityCache.get(priority)!
    }

    const q = this.queues.find(([range]) => priority >= range[0] && priority <= range[1])

    if (q) {
      this._priorityCache.set(priority, q[1])
      return q[1]
    }

    return q
  }
}

/**
 * @since 1.0.0
 */
export const currentPriorityWith = <A, E, R>(f: (priority: number) => Effect.Effect<A, E, R>) =>
  Effect.flatMap(FiberRef.get(currentPriority), f)

/**
 * @since 1.0.0
 */
export const withCurrentPriority: {
  (priority: number): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R>(effect: Effect.Effect<A, E, R>, priority: number): Effect.Effect<A, E, R>
} = dual(
  2,
  <A, E, R>(effect: Effect.Effect<A, E, R>, priority: number) => Effect.locally(effect, currentPriority, priority)
)

const whenIdle = (options?: IdleRequestOptions): Effect.Effect<IdleDeadline, never, Scope.Scope> =>
  Effect.asyncEffect((resume) => {
    const id = requestIdleCallback((deadline) => resume(Effect.succeed(deadline)), options)

    return Effect.addFinalizer(() => Effect.sync(() => cancelIdleCallback(id)))
  })

function shouldContinue(deadline: IdleDeadline): boolean {
  return deadline.didTimeout || deadline.timeRemaining() > 0
}

export interface SignalTask {
  readonly key: unknown
  readonly task: Effect.Effect<unknown>
}
