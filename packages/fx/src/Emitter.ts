/**
 * Emitter is a helper for creating Fx from external libraries which are not Effect-native.
 * @since 1.20.0
 */

import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as ExecutionStrategy from "effect/ExecutionStrategy"
import type * as Exit from "effect/Exit"
import * as Runtime from "effect/Runtime"
import type * as Scope from "effect/Scope"
import { withScope } from "./internal/helpers.js"
import * as Sink from "./Sink.js"

/**
 * @since 1.20.0
 */
export interface Emitter<in A, in E> {
  readonly succeed: (value: A) => Promise<Exit.Exit<unknown>>
  readonly failCause: (cause: Cause.Cause<E>) => Promise<Exit.Exit<unknown>>
  readonly fail: (error: E) => Promise<Exit.Exit<unknown>>
  readonly die: (error: unknown) => Promise<Exit.Exit<unknown>>
  readonly end: () => Promise<Exit.Exit<unknown>>
}

/**
 * @since 1.20.0
 */
export function withEmitter<A, E, R, R2, B>(
  sink: Sink.Sink<A, E, R>,
  f: (emitter: Emitter<A, E>) => Effect.Effect<B, E, R2>
): Effect.Effect<void, never, R | R2 | Scope.Scope> {
  return withScope(
    (scope) =>
      Sink.withEarlyExit(
        sink,
        (sink): Effect.Effect<B, E, R | R2> => {
          return Effect.flatMap(Effect.runtime<R>(), (runtime) => {
            const runFork = Runtime.runFork(runtime)
            const run = <E, A>(effect: Effect.Effect<A, E, R>): Promise<Exit.Exit<A, E>> =>
              new Promise((resolve) => {
                const fiber = runFork(effect, { scope })
                fiber.addObserver(resolve)
              })
            const emitter: Emitter<A, E> = {
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
