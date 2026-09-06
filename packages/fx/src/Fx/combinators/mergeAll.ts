import * as Effect from "effect/Effect";
import { skipInterrupt } from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Merges multiple Fx streams into a single Fx that emits values from all input streams concurrently.
 *
 * @remarks
 * ## Why
 *
 * `mergeAll` combines a known set of independent push producers without adding
 * a source-of-sources or choosing a winner.
 *
 * ## Concurrency, ordering, and cardinality
 *
 * All inputs start concurrently. Every non-interruption value from every input
 * is forwarded once. Each input preserves its own order, while values across
 * inputs interleave by arrival; there is no buffering to restore argument order.
 * An empty argument list completes without emitting.
 *
 * ## Ownership and lifetime
 *
 * Typed failures from any input are forwarded and every input environment is
 * required. Interrupt-only causes from sibling cancellation are suppressed at
 * the Sink boundary. The observing fiber owns all concurrent runs: completion
 * waits for all inputs, and interruption cancels the remaining runs and their
 * resource lifetimes.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 * import { Effect } from "effect"
 *
 * const events = Fx.mergeAll(
 *   Fx.at("slow", "20 millis"),
 *   Fx.at("fast", "1 millis")
 * )
 * Effect.runPromise(Fx.collectAll(events)).then(console.log)
 * // ["fast", "slow"]
 * ```
 *
 * @param fx - The Fx streams to merge.
 * @returns An `Fx` that emits values from all input streams.
 * @since 1.0.0
 * @category Combining sources
 */
export const mergeAll = <FX extends ReadonlyArray<Fx<any, any, any>>>(
  ...fx: FX
): Fx<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Services<FX[number]>> =>
  make<Fx.Success<FX[number]>, Fx.Error<FX[number]>, Fx.Services<FX[number]>>((sink) =>
    Effect.forEach(fx, (fx) => fx.run(skipInterrupt(sink)), {
      concurrency: fx.length,
      discard: true,
    }),
  );
