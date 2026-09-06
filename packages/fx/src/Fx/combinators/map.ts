import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Transforms the elements of an Fx using a provided function.
 *
 * @remarks
 * ## Why
 * `map` changes each pushed value without changing when values arrive. It emits exactly once for
 * every upstream success, in upstream order; the callback is synchronous and cannot add failures
 * or services.
 *
 * ## Ownership and lifetime
 * This operation acquires no resources and retains no state. Running the result runs the source in
 * the same Scope, and interruption or failure is forwarded unchanged.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const labels = Fx.fromIterable([1, 2, 3]).pipe(Fx.map((n) => `item-${n}`))
 * ```
 *
 * @param f - A function that transforms values of type `A` to `B`.
 * @returns An `Fx` that emits values of type `B`.
 * @since 1.0.0
 * @category Transforming values
 */
export const map: {
  <A, B>(f: (a: A) => B): <E, R>(self: Fx<A, E, R>) => Fx<B, E, R>;

  <A, E, R, B>(self: Fx<A, E, R>, f: (a: A) => B): Fx<B, E, R>;
} = dual(2, <A, E, R, B>(self: Fx<A, E, R>, f: (a: A) => B): Fx<B, E, R> =>
  make<B, E, R>((sink) => self.run(sinkCore.map(sink, f))),
);

/**
 * Replaces all emitted values from the Fx with the provided value `b`.
 *
 * @remarks
 * ## Why
 * `as` preserves upstream timing and cardinality while intentionally discarding each value. It is
 * useful when occurrence matters but payload does not.
 *
 * ## Ownership and lifetime
 * This operation is a pure `map`; it acquires no resources, retains no state, and forwards source
 * failure, completion, services, and interruption unchanged.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const refreshes = Fx.fromIterable(["click", "retry"]).pipe(Fx.as("refresh" as const))
 * ```
 *
 * @param b - The value to emit instead.
 * @returns An Fx that emits `b` for every element.
 * @since 1.0.0
 * @category Transforming values
 */
export const as: {
  <B>(b: B): <A, E, R>(self: Fx<A, E, R>) => Fx<B, E, R>;
  <A, E, R, B>(self: Fx<A, E, R>, b: B): Fx<B, E, R>;
} = dual(2, <A, E, R, B>(self: Fx<A, E, R>, b: B): Fx<B, E, R> => map(self, () => b));
