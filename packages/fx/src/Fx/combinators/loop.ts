import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Loops over an Fx with an accumulator, producing a new value for each element
 * and updating the accumulator.
 *
 * @remarks
 * ## Why
 * `loop` is the primitive for a synchronous state machine over pushed values. Every input emits
 * exactly one output and installs exactly one next state, preserving source order.
 *
 * ## Ownership and lifetime
 * A fresh accumulator starts from `seed` for each run and is discarded when that run ends. The
 * pure callback adds no failures, services, fibers, or resources.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * const indexed = Fx.fromIterable(["a", "b"]).pipe(Fx.loop(0, (index, value) => [[index, value] as const, index + 1]))
 * ```
 *
 * @param seed - The initial value of the accumulator.
 * @param f - A function that takes the accumulator and an element, returning a tuple of the emitted value and the new accumulator.
 * @returns An `Fx` that emits the transformed values.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const loop: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: A) => readonly [C, B],
  ): <E, R>(self: Fx<A, E, R>) => Fx<C, E, R>;

  <A, E, R, B, C>(self: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<C, E, R>;
} = dual(
  3,
  <A, E, R, B, C>(self: Fx<A, E, R>, seed: B, f: (acc: B, a: A) => readonly [C, B]): Fx<C, E, R> =>
    make<C, E, R>((sink) => self.run(sinkCore.loop(sink, seed, f))),
);
