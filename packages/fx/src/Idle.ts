/**
 * Some Effect-based abstractions for utilizing requestIdleCallback to schedule work to be done when the event
 * loops determines it is not busy with other higher-priority work.
 * @since 1.18.0
 */

import type * as Context from "@typed/context"
import { dequeueIsActive, takeDequeue } from "@typed/fx/internal/fx"
import { cancelIdleCallback, requestIdleCallback } from "@typed/fx/internal/requestIdleCallback"
import { MutableHashMap, Option } from "effect/dist/declarations/src"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import { constant, constVoid } from "effect/Function"
import { globalValue } from "effect/GlobalValue"
import type { Hash } from "effect/Hash"
import * as Layer from "effect/Layer"
import type * as Queue from "effect/Queue"
import * as Scheduler from "effect/Scheduler"
import * as Scope from "effect/Scope"

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
    if (!this.#running) {
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
    this.#id = requestIdleCallback((deadline) => this.runTasks(deadline), this.options)
  }

  private runTasks(deadline: IdleDeadline) {
    const buckets = this.#tasks.buckets
    const length = buckets.length

    let i = 0
    for (; shouldContinue(deadline) && i < length; ++i) {
      buckets[i][1].forEach((f) => f())
    }

    // Remove all the buckets we were able to complete
    buckets.splice(0, i)

    // If there are more tasks to run, schedule the next run
    if (buckets.length > 0) {
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
  Symbol("@typed/fx/Scheduler/Idle"),
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
  return deadline.didTimeout === false && deadline.timeRemaining() > 0
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
  Effect.repeatWhileEffect(
    Effect.flatMap(
      whenIdle(options),
      (deadline) =>
        Effect.whileLoop({
          while: () => shouldContinue(deadline),
          body: constant(options.body),
          step: constVoid
        })
    ),
    constant(options.while)
  )

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
    body: Effect.flatMap(takeDequeue<I, A>(dequeue), f),
    ...options
  })
}

export interface IdleQueue<I extends Hash> {
  readonly add: <R>(
    part: I,
    task: Effect.Effect<R, never, unknown>
  ) => Effect.Effect<R | Scope.Scope, never, void>
}

export const makeIdleQueue = <I extends Hash>(
  options?: IdleRequestOptions
): Effect.Effect<Scope.Scope, never, IdleQueue<I>> =>
  Effect.scopeWith((scope) => Effect.sync(() => new IdleQueueImpl<I>(scope, options)))

class IdleQueueImpl<I extends Hash> implements IdleQueue<I> {
  queue = MutableHashMap.empty<I, Effect.Effect<never, never, unknown>>()
  scheduled = false

  constructor(readonly scope: Scope.Scope, readonly options?: IdleRequestOptions) {}

  add = <R>(part: I, task: Effect.Effect<R, never, unknown>) =>
    Effect.contextWithEffect((ctx: Context.Context<R>) => {
      const provided = Effect.provide(task, ctx)
      MutableHashMap.set(this.queue, part, provided)

      return Effect.zipRight(
        Effect.addFinalizer(() =>
          Effect.sync(() => {
            const currentTask = MutableHashMap.get(this.queue, part)

            // If the current task is still the same we'll delete it from the queue
            if (Option.isSome(currentTask) && currentTask.value === provided) {
              MutableHashMap.remove(this.queue, part)
            }
          })
        ),
        this.scheduleNextRun
      )
    })

  scheduleNextRun = Effect.suspend(() => {
    if (MutableHashMap.size(this.queue) === 0 || this.scheduled) return Effect.unit

    this.scheduled = true

    return Scope.addFinalizer(this.scope, Fiber.interrupt(Effect.runFork(this.run)))
  })

  run: Effect.Effect<never, never, void> = Effect.provideService(
    Effect.flatMap(
      whenIdle(this.options),
      (deadline) =>
        Effect.gen(this, function*(_) {
          const iterator = this.queue[Symbol.iterator]()

          while (shouldContinue(deadline)) {
            const result = iterator.next()

            if (result.done) break
            else {
              const [part, task] = result.value
              MutableHashMap.remove(this.queue, part)
              yield* _(task)
            }
          }

          if (MutableHashMap.size(this.queue) > 0) {
            return this.run
          }

          this.scheduled = false

          return Effect.unit
        })
    ),
    Scope.Scope,
    this.scope
  )
}
