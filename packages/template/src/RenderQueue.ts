/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Idle from "@typed/fx/Idle"
import { FiberRef, type Layer } from "effect"
import * as Effect from "effect/Effect"
import { dual } from "effect/Function"
import * as Scope from "effect/Scope"

/**
 * @since 1.0.0
 */
export const DEFAULT_PRIORITY = 10

/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */
export const RenderQueue: Context.Tagged<RenderQueue, RenderQueue> = Context.Tagged<RenderQueue>(
  "@typed/template/RenderQueue"
)

/**
 * @since 1.0.0
 */
export const currentPriority: FiberRef.FiberRef<number> = FiberRef.unsafeMake(DEFAULT_PRIORITY)

/**
 * @since 1.0.0
 */
export interface RenderQueue {
  readonly add: (part: unknown, task: () => void, priority: number) => Effect.Effect<void, never, Scope.Scope>
}

/**
 * @since 1.0.0
 */
export interface IdleRenderQueueOptions extends IdleRequestOptions {
  readonly scope: Scope.Scope
}

/**
 * @since 1.0.0
 */
export const unsafeMakeIdleRenderQueue = ({ scope, ...options }: IdleRenderQueueOptions): RenderQueue =>
  new IdleImpl(scope, options)

/**
 * @since 1.0.0
 */
export const unsafeMakeRafRenderQueue = (scope: Scope.Scope): RenderQueue => new RafImpl(scope)

/**
 * @since 1.0.0
 */
export const unsafeMakeMicrotaskRenderQueue = (scope: Scope.Scope): RenderQueue => new MicroTaskImpl(scope)

/**
 * @since 1.0.0
 */
export const unsafeMakeSyncRenderQueue = (): RenderQueue => new SyncImpl()

/**
 * @since 1.0.0
 */
export const idle = (options?: IdleRequestOptions): Layer.Layer<RenderQueue> =>
  RenderQueue.scoped(
    Effect.scopeWith((scope) => Effect.succeed(unsafeMakeIdleRenderQueue({ scope, ...options })))
  )

/**
 * @since 1.0.0
 */
export const raf: Layer.Layer<RenderQueue> = RenderQueue.scoped(
  Effect.scopeWith((scope) => Effect.succeed(unsafeMakeRafRenderQueue(scope)))
)

/**
 * @since 1.0.0
 */
export const microtask: Layer.Layer<RenderQueue> = RenderQueue.scoped(
  Effect.scopeWith((scope) => Effect.succeed(unsafeMakeMicrotaskRenderQueue(scope)))
)

/**
 * @since 1.0.0
 */
export const sync: Layer.Layer<RenderQueue> = RenderQueue.layer(Effect.sync(unsafeMakeSyncRenderQueue))

const MICRO_TASK_END = DEFAULT_PRIORITY - 1
const RAF_END = DEFAULT_PRIORITY + 9
const IDLE_START = RAF_END + 1

/**
 * @since 1.0.0
 */
export const mixed = (options?: IdleRequestOptions): Layer.Layer<RenderQueue> =>
  RenderQueue.scoped(Effect.gen(function*(_) {
    const scope = yield* _(Effect.scope)
    const queues: Array<readonly [priorityRange: readonly [number, number], RenderQueue]> = [
      [[-1, -1], new SyncImpl()],
      [[0, MICRO_TASK_END], new MicroTaskImpl(scope)],
      [[DEFAULT_PRIORITY, RAF_END], new RafImpl(scope)],
      [[IDLE_START, Number.MAX_SAFE_INTEGER], new IdleImpl(scope, options)]
    ]

    return new MixedImpl(queues)
  }))

/**
 * @since 1.0.0
 */
export const RenderPriority = {
  Sync: -1,
  /**
   * @example
   * RenderPriority.MicroTask(0-9)
   */
  MicroTask: (priority: number) => Math.min(Math.max(0, priority), MICRO_TASK_END),
  /**
   * @example
   * RenderPriority.Raf(0-9)
   */
  Raf: (priority: number) => Math.min(Math.max(DEFAULT_PRIORITY, DEFAULT_PRIORITY + priority), RAF_END),
  /**
   * @example
   * RenderPriority.Idle(0-9)
   */
  Idle: (priority: number) => Math.max(IDLE_START, IDLE_START + priority)
} as const

class PriorityQueue {
  priorities: Map<number, Map<unknown, () => void>> = new Map()

  add(part: unknown, task: () => void, priority: number) {
    let set = this.priorities.get(priority)

    if (set === undefined) {
      set = new Map()
      this.priorities.set(priority, set)
    }

    set.set(part, task)
  }

  get(part: unknown, priority: number) {
    return this.priorities.get(priority)?.get(part)
  }

  delete(part: unknown, priority: number) {
    return this.priorities.get(priority)?.delete(part)
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

abstract class BaseImpl implements RenderQueue {
  queue = new PriorityQueue()
  scheduled = false

  constructor(readonly scope: Scope.Scope) {
    this.add.bind(this)
  }

  add(part: unknown, task: () => void, priority: number) {
    return Effect.suspend(() => {
      this.queue.add(part, task, priority)

      return Effect.zipRight(
        Effect.addFinalizer(() =>
          Effect.sync(() => {
            const currentTask = this.queue.get(part, priority)

            // If the current task is still the same we'll delete it from the queue
            if (currentTask === task) {
              this.queue.delete(part, priority)
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

  protected runTasks = (iterator: Iterator<Iterable<() => void>>) => {
    const result = iterator.next()

    if (result.done) return false
    else {
      for (const task of result.value) {
        this.tryRunTask(task)
      }

      return true
    }
  }

  protected tryRunTask = (task: () => void) => {
    try {
      task()
    } catch (error) {
      // TODO: We should probably be able to report this back to a template
      console.error(error)
    }
  }
}

class IdleImpl extends BaseImpl implements RenderQueue {
  constructor(
    scope: Scope.Scope,
    readonly options?: IdleRequestOptions
  ) {
    super(scope)
  }

  run: Effect.Effect<void, never, Scope.Scope> = Effect.suspend(() => {
    return Effect.flatMap(
      Idle.whenIdle(this.options),
      (deadline) =>
        Effect.suspend(() => {
          const iterator = this.queue.entries()

          while (Idle.shouldContinue(deadline) && this.runTasks(iterator)) {
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

class RafImpl extends BaseImpl implements RenderQueue {
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
    const id = this._set(() => {
      this.runAllTasks()
      return cb(Effect.unit)
    })
    return Effect.sync(() => {
      this.scheduled = false
      this._clear(id)
    })
  })

  private runAllTasks = () => {
    const iterator = this.queue.entries()
    while (this.runTasks(iterator)) {
      // Continue
    }

    this.scheduled = false
  }
}

const noOp = () => void 0

class MicroTaskImpl extends BaseImpl implements RenderQueue {
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
    const id = this._set(() => {
      this.runAllTasks()
      return cb(Effect.unit)
    })
    return Effect.sync(() => {
      this.scheduled = false
      id && this._clear(id)
    })
  })

  private runAllTasks = () => {
    const iterator = this.queue.entries()
    while (this.runTasks(iterator)) {
      // Continue
    }

    this.scheduled = false
  }
}

class SyncImpl implements RenderQueue {
  constructor() {
    this.add.bind(this)
  }

  add(_: unknown, task: () => void) {
    return Effect.sync(task)
  }
}

class MixedImpl implements RenderQueue {
  private _priorityCache = new Map<number, RenderQueue>()

  constructor(
    readonly queues: Array<readonly [priorityRange: readonly [number, number], RenderQueue]>
  ) {
    this.queues.sort(([a], [b]) => a[0] - b[0])

    this.add.bind(this)
  }

  add(part: unknown, task: () => void, priority: number) {
    let queue = this.getQueueForPriority(priority)

    if (queue === undefined) {
      queue = this.queues[this.queues.length - 1][1]
    }

    return queue.add(part, task, priority)
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
export const withCurrentPriority = <A, E, R>(f: (priority: number) => Effect.Effect<A, E, R>) =>
  Effect.flatMap(FiberRef.get(currentPriority), f)

/**
 * @since 1.0.0
 */
export const usingCurrentPriority: {
  (priority: number): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>
  <A, E, R>(effect: Effect.Effect<A, E, R>, priority: number): Effect.Effect<A, E, R>
} = dual(
  2,
  <A, E, R>(effect: Effect.Effect<A, E, R>, priority: number) => Effect.locally(effect, currentPriority, priority)
)
