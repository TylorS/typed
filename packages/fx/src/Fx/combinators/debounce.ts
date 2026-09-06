import { Duration, Effect, Scope } from "effect";
import type { Fx } from "../Fx.js";
import { switchMap } from "./switchMap.js";
import { make } from "../constructors/make.js";
import { dual } from "effect/Function";

/**
 * Emits a value only after no newer source value arrives for `duration`.
 *
 * @remarks
 * ## Why
 *
 * Bursty producers such as text input should often trigger work only after
 * they settle. Debouncing represents that quiet-period rule in the Fx graph.
 *
 * ## Ownership and lifetime
 *
 * Each value starts a scoped sleep. A newer value interrupts the previous
 * sleep and replaces its pending value, so at most the latest value is emitted
 * after a quiet period. Source errors terminate the result. Interruption stops
 * both source and pending timer; `Scope` owns those switching lifetimes.
 *
 * @example
 * ```ts
 * import { debounce } from "@typed/fx/Fx"
 * import { fromIterable } from "@typed/fx/Fx"
 *
 * const settled = debounce(fromIterable(["t", "ty", "typed"]), "250 millis")
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const debounce: {
  (duration: Duration.Input): <A, E, R>(fx: Fx<A, E, R>) => Fx<A, E, R | Scope.Scope>;
  <A, E, R>(fx: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope>;
} = dual(2, <A, E, R>(fx: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R | Scope.Scope> =>
  switchMap(fx, (a) =>
    make(
      Effect.fn(function* (sink) {
        yield* Effect.sleep(duration);
        yield* sink.onSuccess(a);
      }),
    ),
  ),
);
