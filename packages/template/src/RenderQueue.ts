/**
 * The context in which templates are rendered within
 * @since 1.0.0
 */

import * as Context from "@typed/context"
import * as Idle from "@typed/fx/Idle"
import * as Effect from "effect/Effect"
import * as Scope from "effect/Scope"

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
  // TODO: We should look into prioritizing tasks
  readonly add: (part: unknown, task: () => void) => Effect.Effect<void, never, Scope.Scope>
}

/**
 * @since 1.0.0
 */
export interface IdleQueueOptions extends IdleRequestOptions {
  readonly scope: Scope.Scope
}

/**
 * @since 1.0.0
 */
export const unsafeMakeIdleRenderQueue = ({ scope, ...options }: IdleQueueOptions): RenderQueue =>
  new IdleImpl(scope, options)

/**
 * @since 1.0.0
 */
export const unsafeMakeRafRenderQueue = (scope: Scope.Scope): RenderQueue => new RafImpl(scope)

/**
 * @since 1.0.0
 */
export const unsafeMakeSyncRenderQueue = (): RenderQueue => new SyncImpl()

/**
 * @since 1.0.0
 */
export const idle = (options?: IdleRequestOptions) =>
  RenderQueue.scoped(
    Effect.scopeWith((scope) => Effect.succeed(unsafeMakeIdleRenderQueue({ scope, ...options })))
  )

/**
 * @since 1.0.0
 */
export const raf = RenderQueue.scoped(
  Effect.scopeWith((scope) => Effect.succeed(unsafeMakeRafRenderQueue(scope)))
)

/**
 * @since 1.0.0
 */
export const sync = RenderQueue.layer(Effect.sync(unsafeMakeSyncRenderQueue))

class IdleImpl implements RenderQueue {
  queue = new Map<unknown, () => void>()
  scheduled = false

  constructor(
    readonly scope: Scope.Scope,
    readonly options: IdleRequestOptions
  ) {
    this.add.bind(this)
  }

  add(part: unknown, task: () => void) {
    return Effect.suspend(() => {
      this.queue.set(part, task)

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

  run: Effect.Effect<void, never, Scope.Scope> = Effect.suspend(() => {
    return Effect.flatMap(
      Idle.whenIdle(this.options),
      (deadline) =>
        Effect.suspend(() => {
          const iterator = this.queue.entries()

          while (Idle.shouldContinue(deadline) && this.runTask(iterator)) {
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

  private runTask = (iterator: Iterator<[unknown, () => void]>) => {
    const result = iterator.next()

    if (result.done) return false
    else {
      const [part, task] = result.value
      this.queue.delete(part)
      task()
      return true
    }
  }
}

class RafImpl implements RenderQueue {
  queue = new Map<unknown, () => void>()
  scheduled = false

  constructor(
    readonly scope: Scope.Scope
  ) {
    this.add.bind(this)
  }

  add(part: unknown, task: () => void) {
    return Effect.suspend(() => {
      this.queue.set(part, task)

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

  run: Effect.Effect<void, never, Scope.Scope> = Effect.zipRight(
    Effect.async<void>((cb) => {
      const id = requestAnimationFrame(() => cb(Effect.unit))
      return Effect.sync(() => cancelAnimationFrame(id))
    }),
    Effect.sync(() => {
      const iterator = this.queue.entries()

      while (this.runTask(iterator)) {
        // Continue
      }

      this.scheduled = false
    })
  )

  private runTask = (iterator: Iterator<[unknown, () => void]>) => {
    const result = iterator.next()

    if (result.done) return false
    else {
      const [part, task] = result.value
      this.queue.delete(part)
      task()
      return true
    }
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
