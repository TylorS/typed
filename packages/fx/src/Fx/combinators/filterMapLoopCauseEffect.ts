import type * as Cause from "effect/Cause";
import type * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import type * as Option from "effect/Option";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Effectfully loops over the failure causes of an Fx with an accumulator.
 *
 * @remarks
 * ## Why
 * `filterMapLoopCauseEffect` supports Effectful, stateful cause policy. Each Cause produces `Some`
 * to forward or `None` to suppress, but concurrent failure deliveries are not serialized and can
 * read the same seed or commit next states out of order.
 *
 * ## Ownership and lifetime
 * Cause state and callback Effects belong to the consuming run. Services remain required, callback
 * failure is sent to the Sink, and interruption follows each delivery; no semaphore is introduced.
 *
 * @example
 * ```ts
 * import { Effect, Option } from "effect"
 * import { Fx } from "@typed/fx"
 *
 * const handled = Fx.fail("offline").pipe(
 *   Fx.filterMapLoopCauseEffect(0, (count, cause) => Effect.succeed([Option.some(cause), count + 1])),
 * )
 * ```
 *
 * @param seed - The initial state.
 * @param f - The effectful loop function for causes.
 * @returns An `Fx` with transformed errors.
 * @since 1.0.0
 * @category Stateful transforms
 */
export const filterMapLoopCauseEffect: {
  <B, A, E2, R2, C>(
    seed: B,
    f: (
      acc: B,
      a: Cause.Cause<A>,
    ) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], E2, R2>,
  ): <E, R>(self: Fx<A, E | E2, R>) => Fx<A, C | E2, R | R2>;

  <A, E, R, B, R2, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (
      acc: B,
      a: Cause.Cause<E>,
    ) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], C, R2>,
  ): Fx<A, C, R | R2>;
} = dual(
  3,
  <A, E, R, B, R2, C>(
    self: Fx<A, E, R>,
    seed: B,
    f: (
      acc: B,
      a: Cause.Cause<E>,
    ) => Effect.Effect<readonly [Option.Option<Cause.Cause<C>>, B], C, R2>,
  ): Fx<A, C, R | R2> =>
    make<A, C, R | R2>((sink) => self.run(sinkCore.filterMapLoopCauseEffect(sink, seed, f))),
);
