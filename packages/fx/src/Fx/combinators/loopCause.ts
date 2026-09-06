import type * as Cause from "effect/Cause";
import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Loops over the failure causes of an Fx with an accumulator.
 *
 * @remarks
 * ## Why
 * `loopCause` is the stateful counterpart of error mapping over full Effect causes. Successful
 * values pass unchanged; each cause is synchronously transformed and advances the error state.
 *
 * ## Ownership and lifetime
 * A fresh state begins for each run and is discarded afterward. The callback owns no resources and
 * sees typed failures, defects, and interruption represented by `Cause`.
 *
 * @example
 * ```ts
 * import { Cause } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const numbered = Fx.fail("offline").pipe(Fx.loopCause(0, (n, cause) => [Cause.map(cause, (e) => `${n}:${e}`), n + 1]))
 * ```
 *
 * @param seed - The initial state.
 * @param f - The loop function for causes.
 * @returns An `Fx` with transformed errors.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const loopCause: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => readonly [Cause.Cause<C>, B],
  ): <E, R>(self: Fx<A, E, R>) => Fx<A, C, R>;

  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B],
  ): Fx<A, C, R>;
} = dual(
  3,
  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Cause.Cause<C>, B],
  ): Fx<A, C, R> => make<A, C, R>((sink) => self.run(sinkCore.loopCause(sink, seed, f))),
);
