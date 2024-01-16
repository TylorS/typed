/**
 * Some Effect-based abstractions for utilizing requestIdleCallback to schedule work to be done when the event
 * loops determines it is not busy with other higher-priority work.
 * @since 1.18.0
 */

import type * as Context from "@typed/context"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import * as Exit from "effect/Exit"
import type * as Fiber from "effect/Fiber"
import { globalValue } from "effect/GlobalValue"
import * as Layer from "effect/Layer"
import type * as Queue from "effect/Queue"
import * as Scheduler from "effect/Scheduler"
import * as Scope from "effect/Scope"
import { dequeueIsActive } from "./Fx.js"
import { withScope } from "./internal/helpers.js"
import { cancelIdleCallback, requestIdleCallback } from "./internal/requestIdleCallback.js"

// TODO: Why is this even in the Fx package?? Where should we put it?

/**
 * The IdleScheduler is an implementation of Effect's Scheduler interface, which utilizes a priority queue
 * to order tasks to be run when the event loop is idle through the usage of requestIdleCallback.
 *
 * In the event requestIdleCallback is not available, setTimeout(task, 1) will be utilized as a fallback
 * @since 1.18.0
 * @category models
 */
export interface IdleScheduler extends Scheduler.Scheduler {
  dispose(): void
}

class IdleSchedulerImpl implements IdleScheduler {
  #id: number | undefined // ID for any requestIdleCallback calls
  #running = false // If we currently have any schedule tasks to run
  #tasks = new Scheduler.PriorityBuckets() // Priority queue of tasks that need to be run

  constructor(readonly options?: IdleRequestOptions) {}

  scheduleTask(task: Scheduler.Task, priority: number): void {
    // Queue the task with the given priority
    this.#tasks.scheduleTask(task, priority)

    // If we're not running yet, schedule the next run
    if (this.#running === false) {
      this.#running = true
      this.scheduleNextRun()
    }
  }

  shouldYield(fiber: Fiber.RuntimeFiber<unknown, unknown>): number | false {
    return Scheduler.defaultShouldYield(fiber)
  }

  dispose() {
    this.#running = false

    if (this.#id === undefined) return

    cancelIdleCallback(this.#id)
    this.#id = undefined
  }

  private scheduleNextRun() {
    this.#id = requestIdleCallback((deadline) => this.runTasks(deadline), { timeout: 1000, ...this.options })
  }

  private runTasks(deadline: IdleDeadline) {
    const buckets = this.#tasks.buckets.slice(0)
    this.#tasks.buckets = []
    const length = buckets.length

    let i = 0
    for (; shouldContinue(deadline) && i < length; ++i) {
      const tasks = buckets[i][1].slice()
      tasks.forEach((f) => f())
    }

    // Remove all the buckets we were able to complete
    buckets.splice(0, i)

    // If there are leftover tasks, requeue them
    if (buckets.length > 0) {
      buckets.forEach(([priority, tasks]) => tasks.forEach((f) => this.#tasks.scheduleTask(f, priority)))
    }

    // If there are more tasks to run, schedule the next run
    if (this.#tasks.buckets.length > 0) {
      this.scheduleNextRun()
    } else {
      // Otherwise we're done for now
      this.#running = false
      this.#id = undefined
    }
  }
}

/**
 * Default instance of the IdleScheduler
 * @since 1.18.0
 * @category instances
 */
export const defaultIdleScheduler: IdleScheduler = globalValue(
  Symbol("./Scheduler/Idle.js"),
  () => new IdleSchedulerImpl()
)

/**
 * Run an Effect using the IdleScheduler.
 * @since 1.18.0
 * @category combinators
 */
export const withIdleScheduler: <R, E, B>(self: Effect.Effect<R, E, B>) => Effect.Effect<R, E, B> = Effect
  .withScheduler(defaultIdleScheduler)

/**
 * Provide the IdleScheduler using a Layer.
 * @since 1.18.0
 * @category layers
 */
export const setIdleScheduler: Layer.Layer<never, never, never> = Layer.setScheduler(defaultIdleScheduler)

/**
 * Request to run some work with requestIdleCallback returning an IdleDeadline
 * @since 1.18.0
 * @category scoped
 */
export const whenIdle = (options?: IdleRequestOptions): Effect.Effect<Scope.Scope, never, IdleDeadline> =>
  Effect.asyncEffect((resume) => {
    const id = requestIdleCallback((deadline) => resume(Effect.succeed(deadline)), options)

    return Effect.addFinalizer(() => Effect.sync(() => cancelIdleCallback(id)))
  })

/**
 * Check to see if an IdleDeadline timed out or has time remaining.
 * @since 1.18.0
 */
export function shouldContinue(deadline: IdleDeadline): boolean {
  return deadline.didTimeout || deadline.timeRemaining() > 0
}

/**
 * The options provided to `whileIdle`
 * @since 1.18.0
 * @category params
 */
export interface WhileIdleRequestOptions<R, E, R2, E2> extends IdleRequestOptions {
  readonly while: Effect.Effect<R, E, boolean>
  readonly body: Effect.Effect<R2, E2, unknown>
}

/**
 * Schedule a while-loop to run using requestIdleCallback.
 * @since 1.18.0
 */
export const whileIdle = <R, E, R2, E2>(
  options: WhileIdleRequestOptions<R, E, R2, E2>
): Effect.Effect<Scope.Scope | R | R2, E | E2, void> =>
  Effect.gen(function*(_) {
    while (yield* _(options.while)) {
      const deadline = yield* _(whenIdle(options))

      while (shouldContinue(deadline)) {
        yield* _(options.body)
      }
    }
  })

/**
 * Dequeue values and perform an Effect while the event loop is not busy with any other work.
 * @since 1.18.0
 */
export function dequeueWhileIdle<A, R2, E2, B>(
  dequeue: Queue.Dequeue<A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  options?: IdleRequestOptions
): Effect.Effect<R2 | Scope.Scope, E2, void>

export function dequeueWhileIdle<I, A, R2, E2, B>(
  dequeue: Context.Dequeue<I, A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  options?: IdleRequestOptions
): Effect.Effect<I | R2 | Scope.Scope, E2, void>

export function dequeueWhileIdle<I = never, A = unknown, R2 = never, E2 = never, B = unknown>(
  dequeue: Context.Dequeue<I, A> | Queue.Dequeue<A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  options?: IdleRequestOptions
): Effect.Effect<I | R2 | Scope.Scope, E2, void>

export function dequeueWhileIdle<I, A, R2, E2, B>(
  dequeue: Context.Dequeue<I, A> | Queue.Dequeue<A>,
  f: (a: A) => Effect.Effect<R2, E2, B>,
  options?: IdleRequestOptions
): Effect.Effect<I | R2 | Scope.Scope, E2, void> {
  return whileIdle({
    while: dequeueIsActive(dequeue),
    body: Effect.flatMap(dequeue.take, f),
    ...options
  })
}

/**
 * @since 1.18.0
 */
export interface IdleQueue<I> {
  readonly add: <R>(
    part: I,
    task: Effect.Effect<R, never, unknown>
  ) => Effect.Effect<R | Scope.Scope, never, void>

  readonly interrupt: Effect.Effect<never, never, void>
}

/**
 * @since 1.18.0
 */
export const makeIdleQueue = <I>(
  options?: IdleRequestOptions
): Effect.Effect<Scope.Scope, never, IdleQueue<I>> =>
  withScope((scope) => Effect.sync(() => new IdleQueueImpl<I>(scope, options)), ExecutionStrategy.sequential)

class IdleQueueImpl<I> implements IdleQueue<I> {
  queue = new Map<I, Effect.Effect<never, never, unknown>>()
  scheduled = false

  readonly interrupt: Effect.Effect<never, never, void>
  readonly scheduleNextRun: Effect.Effect<never, never, void>

  constructor(readonly scope: Scope.CloseableScope, readonly options?: IdleRequestOptions) {
    this.interrupt = Effect.fiberIdWith((id) => Scope.close(scope, Exit.interrupt(id)))

    const run: Effect.Effect<Scope.Scope, never, void> = Effect.flatMap(
      whenIdle(this.options),
      (deadline) =>
        Effect.gen(this, function*(_) {
          const iterator = this.queue[Symbol.iterator]()

          while (shouldContinue(deadline)) {
            const result = iterator.next()

            if (result.done) break
            else {
              const [part, task] = result.value
              this.queue.delete(part)
              yield* _(task)
            }
          }

          if (this.queue.size > 0) {
            yield* _(run)
          } else {
            this.scheduled = false
          }
        })
    )

    this.scheduleNextRun = Effect.provideService(
      Effect.suspend(() => {
        if (this.queue.size === 0) return Effect.unit

        this.scheduled = true

        return withScope(
          (childScope) => Effect.provideService(run, Scope.Scope, childScope),
          ExecutionStrategy.sequential
        )
      }),
      Scope.Scope,
      scope
    )
  }

  add = <R>(part: I, task: Effect.Effect<R, never, unknown>) =>
    Effect.contextWithEffect((ctx: Context.Context<R>) => {
      const provided = Effect.provide(task, ctx)
      this.queue.set(part, provided)

      return Effect.zipRight(
        Effect.addFinalizer(() =>
          Effect.sync(() => {
            // If the current task is still the same we'll delete it from the queue
            if (this.queue.get(part) === provided) {
              this.queue.delete(part)
            }
          })
        ),
        this.scheduleNextRun
      )
    })
}
