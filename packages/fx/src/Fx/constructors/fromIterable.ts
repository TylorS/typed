import { forEach } from "effect/Effect";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * Creates an Fx from an Iterable.
 * Emits each value from the iterable in order and then completes.
 *
 * @remarks
 * ## Why
 *
 * Finite synchronous collections can participate in push composition without
 * changing their iteration order or introducing a separate collection protocol.
 *
 * ## Ownership and lifetime
 *
 * Construction stores the iterable but does not iterate it. Each run obtains a fresh
 * iterator, offers values sequentially to the sink, and completes after iteration.
 * Interruption stops further iteration. No child fiber or buffer is created.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { collectAll, fromIterable } from "@typed/fx/Fx"
 *
 * const program = collectAll(fromIterable(new Set([1, 2, 3]))).pipe(
 *   Effect.map((values) => values.join(","))
 * )
 * ```
 *
 * @param iterable - The iterable to emit values from.
 * @returns An `Fx` that emits the values from the iterable.
 * @since 1.0.0
 * @category Value sources
 */
export const fromIterable = <A>(iterable: Iterable<A>): Fx<A> =>
  make<A>((sink) => forEach(iterable, sink.onSuccess, { discard: true }));
