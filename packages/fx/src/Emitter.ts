/**
 * Emitter is a helper for creating Fx from external libraries which are not Effect-native.
 * @since 1.20.0
 */

import { ExecutionStrategy, type Scope } from "effect"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import type * as Exit from "effect/Exit"
import * as Runtime from "effect/Runtime"
import { withScope } from "./internal/helpers.js"
import * as Sink from "./Sink.js"

/**
 * @since 1.20.0
 */
export interface Emitter<in E, in A> {
  readonly succeed: (value: A) => Promise<Exit.Exit<unknown>>
  readonly failCause: (cause: Cause.Cause<E>) => Promise<Exit.Exit<unknown>>
  readonly fail: (error: E) => Promise<Exit.Exit<unknown>>
  readonly die: (error: unknown) => Promise<Exit.Exit<unknown>>
  readonly end: () => Promise<Exit.Exit<unknown>>
}

/**
 * @since 1.20.0
 */
export function withEmitter<R, E, A, R2, B>(
  sink: Sink.Sink<R, E, A>,
  f: (emitter: Emitter<E, A>) => Effect.Effect<B, E, R2>
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
            const emitter: Emitter<E, A> = {
              succeed: (value) => run(sink.onSuccess(value)),
              failCause: (cause) => run(sink.onFailure(cause)),
              fail: (error) => run(sink.onFailure(Cause.fail(error))),
              die: (error) => run(sink.onFailure(Cause.die(error))),
              end: () => run(sink.earlyExit)
            }

            return f(emitter)
          });
        }
      ),
    ExecutionStrategy.sequential
  );
}
