import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import type * as Exit from "effect/Exit"
import * as Fiber from "effect/Fiber"
import * as Runtime from "effect/Runtime"
import * as Scope from "effect/Scope"
import { withScope } from "./internal/helpers.js"
import * as Sink from "./Sink.js"

export interface Emitter<E, A> {
  readonly succeed: (value: A) => Promise<Exit.Exit<never, unknown>>
  readonly failCause: (cause: Cause.Cause<E>) => Promise<Exit.Exit<never, unknown>>
  readonly fail: (error: E) => Promise<Exit.Exit<never, unknown>>
  readonly die: (error: unknown) => Promise<Exit.Exit<never, unknown>>
  readonly end: () => Promise<Exit.Exit<never, unknown>>
}

export function withEmitter<R, E, A, R2, B>(
  sink: Sink.Sink<R, E, A>,
  f: (emitter: Emitter<E, A>) => Effect.Effect<R2, E, B>
): Effect.Effect<R | R2 | Scope.Scope, never, void> {
  return withScope(
    (scope) =>
      Sink.withEarlyExit(
        sink,
        (sink): Effect.Effect<R | R2, E, B> => {
          return Effect.flatMap(Effect.runtime<R>(), (runtime): Effect.Effect<R2, E, B> => {
            const runPromiseExit = Runtime.runPromiseExit(runtime)
            const run = (effect: Effect.Effect<R, never, unknown>) =>
              runPromiseExit(
                Effect.flatMap(
                  Effect.flatMap(
                    Scope.fork(scope, ExecutionStrategy.sequential),
                    (childScope) => Effect.forkIn(effect, childScope)
                  ),
                  Fiber.join
                )
              )

            const emitter: Emitter<E, A> = {
              succeed: (value) => run(sink.onSuccess(value)),
              failCause: (cause) => run(sink.onFailure(cause)),
              fail: (error) => run(sink.onFailure(Cause.fail(error))),
              die: (error) => run(sink.onFailure(Cause.die(error))),
              end: () => run(sink.earlyExit)
            }

            return f(emitter)
          })
        }
      ),
    ExecutionStrategy.sequential
  )
}
