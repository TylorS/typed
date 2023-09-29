/**
 * An Emitter is a a Sink-like type which is can be utilized to adapt external
 * APIs into an Fx.
 * @since 1.18.0
 */

import type * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import type * as Fiber from "effect/Fiber"
import type * as Scope from "effect/Scope"
import type { ScopedRuntime } from "@typed/fx/internal/helpers"
import { scopedRuntime } from "@typed/fx/internal/helpers"
import type * as Sink from "@typed/fx/Sink"

/**
 * An Emitter is a a Sink-like type which is can be utilized to adapt external
 * APIs into an Fx.
 * @since 1.18.0
 */
export interface Emitter<E, A> {
  (exit: Exit.Exit<E, A>): Fiber.Fiber<never, unknown>

  readonly succeed: (a: A) => Fiber.Fiber<never, unknown>
  readonly failCause: (e: Cause.Cause<E>) => Fiber.Fiber<never, unknown>
  readonly fail: (e: E) => Fiber.Fiber<never, unknown>
  readonly die: (e: unknown) => Fiber.Fiber<never, unknown>
  readonly end: () => Fiber.Fiber<never, unknown>
}

/**
 * Create an Emitter from a Sink
 * @since 1.18.0
 * @category constructors
 */
export function make<E, A>(sink: Sink.WithEarlyExit<E, A>): Effect.Effect<Scope.Scope, never, Emitter<E, A>> {
  return Effect.map(scopedRuntime<never>(), (runtime) => makeWithRuntime(runtime, sink))
}
function makeWithRuntime<E, A>(
  runtime: ScopedRuntime<never>,
  sink: Sink.WithEarlyExit<E, A>
): Emitter<E, A> {
  function emit(exit: Exit.Exit<E, A>): Fiber.Fiber<never, unknown> {
    return runtime.run(Exit.match(exit, sink))
  }

  emit.succeed = (a: A) => emit(Exit.succeed(a))
  emit.failCause = (e: Cause.Cause<E>) => emit(Exit.failCause(e))
  emit.fail = (e: E) => emit(Exit.fail(e))
  emit.die = (e: unknown) => emit(Exit.die(e))
  emit.end = () => runtime.run(sink.earlyExit)

  return emit
}
