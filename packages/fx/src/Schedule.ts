import { constant, constVoid } from "@effect/data/Function"
import * as Effect from "@effect/io/Effect"
import type * as Queue from "@effect/io/Queue"
import type * as Scope from "@effect/io/Scope"
import type * as Context from "@typed/context"
import { dequeueIsActive, takeDequeue } from "@typed/fx/internal/fx"
import { cancelIdleCallback, requestIdleCallback, shouldContinue } from "@typed/fx/internal/requestIdleCallback"

export const whenIdle = (options?: IdleRequestOptions): Effect.Effect<Scope.Scope, never, IdleDeadline> =>
  Effect.asyncEffect((resume) => {
    const id = requestIdleCallback((deadline) => resume(Effect.succeed(deadline)), options)

    return Effect.addFinalizer(() => Effect.sync(() => cancelIdleCallback(id)))
  })

export interface WhileIdleRequestOptions<R, E, R2, E2> extends IdleRequestOptions {
  readonly while: Effect.Effect<R, E, boolean>
  readonly body: Effect.Effect<R2, E2, unknown>
}

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
    body: Effect.flatMap(takeDequeue(dequeue), f),
    ...options
  })
}
