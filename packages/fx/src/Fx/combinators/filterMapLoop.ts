import { dual } from "effect/Function";
import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Loops over an Fx with an accumulator, producing an optional new value for each element.
 * If the function returns `None`, the element is filtered out.
 *
 * @remarks
 * ## Why
 * `filterMapLoop` combines per-run state, mapping, and filtering in one ordered step. Every input
 * updates the accumulator and may emit one `Some`; `None` still commits the returned next state.
 *
 * ## Ownership and lifetime
 * The seed is copied into each run and retained only until that run ends. The callback is pure, and
 * source failure, services, completion, and interruption are preserved.
 *
 * @example
 * ```ts
 * import { Option } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const everyOther = Fx.fromIterable([1, 2, 3]).pipe(
 *   Fx.filterMapLoop(0, (index, value) => [index % 2 === 0 ? Option.some(value) : Option.none(), index + 1]),
 * )
 * ```
 *
 * @param seed - The initial state.
 * @param f - The loop function returning `Option<C>` and the new state.
 * @returns An `Fx` emitting the transformed values.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const filterMapLoop: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: A) => readonly [Option.Option<C>, B],
  ): <E, R>(self: Fx<A, E, R>) => Fx<C, E, R>;

  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => readonly [Option.Option<C>, B],
  ): Fx<C, E, R>;
} = dual(
  3,
  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: A) => readonly [Option.Option<C>, B],
  ): Fx<C, E, R> => make<C, E, R>((sink) => self.run(sinkCore.filterMapLoop(sink, seed, f))),
);
