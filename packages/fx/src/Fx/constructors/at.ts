import type * as Duration from "effect/Duration";
import { flatMap, sleep } from "effect/Effect";
import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * Creates an Fx that emits a single value after a specified delay.
 *
 * @remarks
 * ## Why
 *
 * `at` models a one-shot producer while keeping the delay inside Effect's
 * interruptible scheduling rather than an unmanaged timer callback.
 *
 * ## Ownership and lifetime
 *
 * Construction starts no timer. Running the `Fx` sleeps, emits exactly once, and
 * completes after the sink handles the value. Interrupting the run cancels the sleep.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { at, first } from "@typed/fx/Fx"
 *
 * const delayed = at("ready", "10 millis")
 * const program = Effect.map(first(delayed), (value) => value)
 * ```
 *
 * @param value - The value to emit.
 * @param delay - The duration to wait before emitting.
 * @returns An `Fx` that emits the value after the delay.
 * @since 1.0.0
 * @category Time and rate
 */
export const at: {
  (delay: Duration.Input): <A>(value: A) => Fx<A>;
  <A>(value: A, delay: Duration.Input): Fx<A>;
} = dual(
  2,
  <A>(value: A, delay: Duration.Input): Fx<A> =>
    make<A, never, never>((sink) => flatMap(sleep(delay), () => sink.onSuccess(value))),
);
