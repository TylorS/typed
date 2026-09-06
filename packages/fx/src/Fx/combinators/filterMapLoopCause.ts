import type * as Cause from "effect/Cause";
import { dual } from "effect/Function";
import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Loops over the failure causes of an Fx with an accumulator, potentially transforming or filtering them.
 * This allows for complex error handling logic that maintains state across failures.
 *
 * @remarks
 * ## Why
 * `filterMapLoopCause` transforms, suppresses, or reclassifies successive failure causes with
 * explicit state. Successful values pass through; each observed cause advances the accumulator and
 * `None` suppresses forwarding that cause.
 *
 * ## Ownership and lifetime
 * Failure state is isolated to one run and discarded afterward. The pure callback acquires no
 * resources; defects and interrupts are visible inside the full `Cause` supplied to it.
 *
 * @example
 * ```ts
 * import { Cause, Option } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const firstFailureOnly = Fx.fail("offline").pipe(
 *   Fx.filterMapLoopCause(false, (seen, cause) => [seen ? Option.none() : Option.some(Cause.map(cause, String)), true]),
 * )
 * ```
 *
 * @param seed - The initial state.
 * @param f - The loop function for causes.
 * @returns An `Fx` with transformed errors.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const filterMapLoopCause: {
  <B, A, C>(
    seed: B,
    f: (acc: B, a: Cause.Cause<A>) => readonly [Option.Option<Cause.Cause<C>>, B],
  ): <E, R>(self: Fx<A, E, R>) => Fx<A, C, R>;

  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B],
  ): Fx<A, C, R>;
} = dual(
  3,
  <A, E, R, B, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (acc: B, a: Cause.Cause<E>) => readonly [Option.Option<Cause.Cause<C>>, B],
  ): Fx<A, C, R> => make<A, C, R>((sink) => self.run(sinkCore.filterMapLoopCause(sink, seed, f))),
);
