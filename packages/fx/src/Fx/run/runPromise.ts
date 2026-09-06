import type { RunOptions } from "effect/Effect";
import * as Effect from "effect/Effect";
import type * as Exit from "effect/Exit";
import type { Fx } from "../Fx.js";
import { drain } from "./observe.js";

/**
 * Runs an `Fx` stream to completion and returns a Promise of the Exit.
 *
 * @remarks
 * ## Why
 *
 * Promise-based hosts can inspect success or the complete typed failure `Cause`
 * without Promise rejection erasing Effect's `Exit` structure.
 *
 * ## Ownership and lifetime
 *
 * Calling `runPromiseExit` starts the source immediately on Effect's default runtime,
 * so all services must already be eliminated. The root fiber owns the source until it
 * completes; `RunOptions` can supply cancellation. Values are discarded. The Promise
 * always resolves with an `Exit`, including failure and interruption.
 *
 * @example
 * ```ts
 * import { Exit } from "effect"
 * import { fail, runPromiseExit } from "@typed/fx/Fx"
 *
 * const outcome = runPromiseExit(fail("offline"))
 * const failed = outcome.then(Exit.isFailure)
 * ```
 *
 * @param fx - The `Fx` stream to run.
 * @param options - `RunOptions` for execution.
 * @returns A Promise resolving to the `Exit` of the execution.
 * @since 1.0.0
 * @category Running effects
 */
export const runPromiseExit = <A, E>(
  fx: Fx<A, E>,
  options?: RunOptions,
): Promise<Exit.Exit<void, E>> => Effect.runPromiseExit(drain(fx), options);

/**
 * Runs an `Fx` stream to completion and returns a Promise.
 * Rejects if the stream fails.
 *
 * @remarks
 * ## Why
 *
 * `runPromise` is the direct boundary for Promise-oriented hosts that treat stream
 * completion as resolution and typed failure as rejection.
 *
 * ## Ownership and lifetime
 *
 * Calling it starts the source immediately on Effect's default runtime, so the `Fx`
 * cannot require services. The root fiber owns the subscription until completion;
 * `RunOptions` controls launch and cancellation. Values are discarded. Typed failures,
 * defects, and interruption reject according to Effect's `runPromise` semantics.
 *
 * @example
 * ```ts
 * import { fromIterable, runPromise } from "@typed/fx/Fx"
 *
 * const completion = runPromise(fromIterable([1, 2, 3]))
 * const settled = completion.then(() => "done")
 * ```
 *
 * @param fx - The `Fx` stream to run.
 * @param options - `RunOptions` for execution.
 * @returns A Promise that resolves when the stream completes.
 * @since 1.0.0
 * @category Running effects
 */
export const runPromise = <A, E>(fx: Fx<A, E>, options?: RunOptions): Promise<unknown> =>
  Effect.runPromise(drain(fx), options);
