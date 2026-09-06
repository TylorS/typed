import type { Effect, RunOptions } from "effect/Effect";
import { forkChild as effectFork, runFork as effectRunFork } from "effect/Effect";
import type { Fiber } from "effect/Fiber";
import type { Fx } from "../Fx.js";
import { drain } from "./observe.js";

/**
 * Forks the execution of an `Fx` into a background fiber.
 * The stream will run until it completes or the fiber is interrupted.
 *
 * @remarks
 * ## Why
 *
 * `fork` keeps background execution inside Effect's supervised fiber tree while
 * returning an explicit handle for coordination.
 *
 * ## Ownership and lifetime
 *
 * The returned Effect acquires the source services and creates a child attached to
 * the calling fiber's scope. Parent termination interrupts the child. By default the
 * child starts immediately and remains interruptible; `options` can change those two
 * Effect fiber policies. Values are discarded and source failure is reported by the
 * child fiber.
 *
 * @example
 * ```ts
 * import { Effect, Fiber } from "effect"
 * import { fork, periodic } from "@typed/fx/Fx"
 *
 * const program = Effect.gen(function* () {
 *   const fiber = yield* fork(periodic("1 second"))
 *   return yield* Fiber.interrupt(fiber)
 * })
 * ```
 *
 * @param fx - The `Fx` stream to fork.
 * @param options - Configuration for the forked fiber.
 * @returns An `Effect` that produces a `Fiber`.
 * @since 1.0.0
 * @category Running effects
 */
export const fork = <A, E, R>(
  fx: Fx<A, E, R>,
  options?: {
    readonly startImmediately?: boolean;
    readonly uninterruptible?: boolean;
  },
): Effect<Fiber<unknown, E>, never, R> =>
  effectFork(drain(fx), {
    startImmediately: options?.startImmediately ?? true,
    uninterruptible: options?.uninterruptible ?? false,
  });

/**
 * Runs an `Fx` in a new fiber, using the standard `Effect.runFork`.
 * This is useful for integrating with the top-level Effect runtime.
 *
 * @remarks
 * ## Why
 *
 * Application and foreign-runtime boundaries sometimes need to start an `Fx` without
 * already being inside an Effect program.
 *
 * ## Ownership and lifetime
 *
 * `runFork` starts immediately on Effect's default runtime, so it only accepts an `Fx`
 * with no unsupplied services. The returned root fiber owns the subscription and must
 * be interrupted by the caller when the source should stop. Values are discarded;
 * failures appear on the fiber and `RunOptions` controls the runtime launch.
 *
 * @example
 * ```ts
 * import { Effect, Fiber } from "effect"
 * import { periodic, runFork } from "@typed/fx/Fx"
 *
 * const fiber = runFork(periodic("1 second"))
 *
 * // `runFork` is already a host-runtime boundary. Execute the returned
 * // interruption Effect when this host no longer needs the subscription.
 * await Effect.runPromise(Fiber.interrupt(fiber))
 * ```
 *
 * @param fx - The `Fx` stream to run.
 * @param options - `RunOptions` for the execution.
 * @returns The created `Fiber`.
 * @since 1.0.0
 * @category Running effects
 */
export const runFork = <A, E>(fx: Fx<A, E>, options?: RunOptions): Fiber<void, E> =>
  effectRunFork(drain(fx), options);
