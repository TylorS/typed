import { equals } from "effect/Equal";
import type { Fx } from "../Fx.js";
import { skipRepeatsWith } from "./skipRepeatsWith.js";

const skipRepeats_ = skipRepeatsWith<any>(equals);

/**
 * Drops elements that are equal to the previous element using standard equality.
 *
 * @remarks
 * ## Why
 * `skipRepeats` removes only consecutive duplicates using Effect's structural equality. The first
 * value always emits; distinct values remain ordered, and a value may emit again after a change.
 *
 * ## Ownership and lifetime
 * One previous value is retained for each run and released when it ends. The operation owns no
 * external resource and preserves source errors, services, and interruption.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const distinctRuns = Fx.fromIterable([1, 1, 2, 1]).pipe(Fx.skipRepeats)
 * ```
 *
 * @param fx - The `Fx` stream.
 * @returns An `Fx` with consecutive duplicates removed.
 * @since 1.0.0
 * @category Selecting values
 */
export const skipRepeats: <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R> = skipRepeats_;
