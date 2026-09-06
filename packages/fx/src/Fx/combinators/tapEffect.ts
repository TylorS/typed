import * as Effect from "effect/Effect";
import { dual } from "effect/Function";
import * as sinkCore from "../../Sink/combinators.js";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";

/**
 * Performs an effect for each element of the Fx, without changing the elements.
 *
 * @remarks
 * ## Why
 * `tap` sequences an observation or side effect before forwarding each original value. It emits
 * exactly once per successful callback, in source order; callback failure prevents that value.
 *
 * ## Ownership and lifetime
 * Returned Effects run in the consumer path and are interrupted with it; a `void` callback is
 * treated as `Effect.void`. Callback failures and services remain visible in the result type.
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Fx } from "@typed/fx"
 * const logged = Fx.fromIterable([1, 2]).pipe(Fx.tap((n) => Effect.log(n)))
 * ```
 *
 * @param f - An effectful function to apply to each element.
 * @returns An `Fx` that emits the original elements.
 * @since 1.0.0
 * @category Transforming values
 */
export const tap: {
  <A, E2 = never, R2 = never>(
    f: (a: A) => void | Effect.Effect<unknown, E2, R2>,
  ): <E, R>(self: Fx<A, E | E2, R>) => Fx<A, E | E2, R | R2>;

  <A, E, R, E2 = never, R2 = never>(
    self: Fx<A, E | E2, R>,
    f: (a: A) => void | Effect.Effect<unknown, E2, R2>,
  ): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, E2, R2>(
    self: Fx<A, E, R>,
    f: (a: A) => void | Effect.Effect<unknown, E2, R2>,
  ): Fx<A, E | E2, R | R2> =>
    make<A, E | E2, R | R2>((sink) =>
      self.run(
        sinkCore.tapEffect(sink, (a) => {
          const x = f(a);
          if (Effect.isEffect(x)) return x;
          return Effect.void;
        }),
      ),
    ),
);
