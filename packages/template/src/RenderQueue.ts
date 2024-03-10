/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Idle from "@typed/fx/Idle"
import type { Layer } from "effect"
import * as Effect from "effect/Effect"
import * as Scope from "effect/Scope"

/**
 * @since 1.0.0
 */
export const DEFAULT_PRIORITY = 1000

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
export interface RenderQueue {
  readonly add: (part: unknown, task: () => void, priority?: number) => Effect.Effect<void, never, Scope.Scope>
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
  Effect.scopeWith((scope) => Effect.succeed(unsafeMakeRafRenderQueue(scope)))
)

/**
 * @since 1.0.0
 */
export const sync: Layer.Layer<RenderQueue> = RenderQueue.layer(Effect.sync(unsafeMakeSyncRenderQueue))

/**
 * @since 1.0.0
 */
export type MixedRenderQueueConfig =
  | "idle"
  | "raf"
  | "microtask"
  | "sync"
  | { readonly idle: (priority: number) => IdleRequestOptions }

/**
 * @since 1.0.0
 */
export const mixed = (
  ...options: ReadonlyArray<readonly [number, number, MixedRenderQueueConfig]>
): Layer.Layer<RenderQueue> =>
  RenderQueue.scoped(Effect.gen(function*(_) {
    const scope = yield* _(Effect.scope)
    const queues: Array<readonly [priorityRange: readonly [number, number], RenderQueue]> = []

    for (const [start, end, config] of options) {
      const queue = config === "idle"
        ? unsafeMakeIdleRenderQueue({ scope })
        : config === "raf"
        ? unsafeMakeRafRenderQueue(scope)
        : config === "microtask"
        ? unsafeMakeMicrotaskRenderQueue(scope)
        : config === "sync"
        ? unsafeMakeSyncRenderQueue()
        : unsafeMakeIdleRenderQueue({ scope, ...config })

      queues.push([[start, end], queue])
    }

    return new MixedImpl(queues)
  }))

class PriorityQueue {
  tasks: Map<unknown, () => void> = new Map()
  priorities: Map<number, Set<unknown>> = new Map()

  add(part: unknown, task: () => void, priority: number) {
    this.tasks.set(part, task)

    let set = this.priorities.get(priority)

    if (set === undefined) {
      set = new Set()
      this.priorities.set(priority, set)
    }

    set.add(part)
  }

  get(part: unknown) {
    return this.tasks.get(part)
  }

  get size() {
    return this.tasks.size
  }

  delete(part: unknown) {
    this.tasks.delete(part)

    for (const [priority, set] of this.priorities) {
      set.delete(part)

      if (set.size === 0) {
        this.priorities.delete(priority)
      }
    }
  }

  *entries() {
    for (const priority of Array.from(this.priorities.keys()).sort((a, b) => a - b)) {
      const parts = this.priorities.get(priority)!
      this.priorities.delete(priority)
      yield Array.from(parts).map((part) => [part, this.tasks.get(part)!] as const)
    }
  }
}

abstract class BaseImpl implements RenderQueue {
  queue = new PriorityQueue()
  scheduled = false

  constructor(readonly scope: Scope.Scope) {
    this.add.bind(this)
  }

  add(part: unknown, task: () => void, priority = DEFAULT_PRIORITY) {
    return Effect.suspend(() => {
      this.queue.add(part, task, priority)

      return Effect.zipRight(
        Effect.addFinalizer(() =>
          Effect.sync(() => {
            const currentTask = this.queue.get(part)

            // If the current task is still the same we'll delete it from the queue
            if (currentTask === task) {
              this.queue.delete(part)
            }
          })
        ),
        this.scheduleNextRun
      )
    })
  }

  scheduleNextRun = Effect.suspend(() => {
    if (this.queue.size === 0 || this.scheduled) return Effect.unit

    this.scheduled = true

    return this.run.pipe(
      Scope.extend(this.scope),
      Effect.forkIn(this.scope)
    )
  })

  abstract run: Effect.Effect<void, never, Scope.Scope>

  protected runTasks = (iterator: Iterator<ReadonlyArray<readonly [unknown, () => void]>>) => {
    const result = iterator.next()

    if (result.done) return false
    else {
      for (const [part, task] of result.value) {
        this.queue.delete(part)
        task()
      }

      return true
    }
  }
}

class IdleImpl extends BaseImpl implements RenderQueue {
  constructor(
    scope: Scope.Scope,
    readonly options: IdleRequestOptions
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
          if (this.queue.size > 0) {
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

    this._set = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
    this._clear = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : clearTimeout
  }

  run: Effect.Effect<void, never, Scope.Scope> = Effect.zipRight(
    Effect.async<void>((cb) => {
      const id = this._set(() => cb(Effect.unit))
      return Effect.sync(() => this._clear(id))
    }),
    Effect.sync(() => {
      const iterator = this.queue.entries()

      while (this.runTasks(iterator)) {
        // Continue
      }

      this.scheduled = false
    })
  )
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

    const [set, clear] = typeof queueMicrotask === "function" ? [queueMicrotask, noOp] : [setTimeout, clearTimeout]
    this._set = set
    this._clear = clear
  }

  run: Effect.Effect<void, never, Scope.Scope> = Effect.zipRight(
    Effect.async<void>((cb) => {
      const id = this._set(() => cb(Effect.unit))
      return id ? Effect.sync(() => this._clear(id!)) : void 0
    }),
    Effect.sync(() => {
      const iterator = this.queue.entries()

      while (this.runTasks(iterator)) {
        // Continue
      }

      this.scheduled = false
    })
  )
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
    readonly queues: Array<readonly [priorityRange: readonly [number, number], RenderQueue]>,
    readonly defaultPriority: number = DEFAULT_PRIORITY
  ) {
    this.queues.sort(([a], [b]) => a[0] - b[0])

    this.add.bind(this)
  }

  add(part: unknown, task: () => void, priority = this.defaultPriority) {
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
