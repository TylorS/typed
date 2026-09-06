import { Effect, Fiber, Scope } from "effect";
import { dual } from "effect/Function";
import { make } from "../constructors/make.js";
import type { Fx } from "../Fx.js";
import { observe } from "../run/observe.js";
import { filter } from "./filter.js";

/**
 * Drops `events` until `signal` emits, then forwards the rest.
 *
 * @remarks
 * ## Why
 * `since` uses one Fx as a start boundary for another. Events before the first signal are dropped;
 * after it arrives, remaining events emit in their original order. Signal values are not emitted.
 *
 * ## Ownership and lifetime
 * Event and signal runs share a child Scope. The signal observer fiber is forked but never joined:
 * a signal failure ends that fiber and is discarded rather than delivered to the event Sink, so it
 * does not stop events. Event completion closes the Scope; consumer interruption stops both runs.
 *
 * @example
 * ```ts
 * import { Fx } from "@typed/fx"
 *
 * // This Effect succeeds with []; the failed signal neither opens the gate nor fails collection.
 * const program = Fx.collectAll(Fx.since(Fx.fromIterable([1, 2]), Fx.fail("signal failed")))
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const since: {
  <B, E2, R2>(signal: Fx<B, E2, R2>): <A, E, R>(events: Fx<A, E, R>) => Fx<A, E | E2, R | R2>;
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2>;
} = dual(
  2,
  <A, E, R, B, E2, R2>(events: Fx<A, E, R>, signal: Fx<B, E2, R2>): Fx<A, E | E2, R | R2> =>
    make(
      Effect.fn(function* (sink) {
        let ready = false;

        const scope = yield* Scope.make();
        const eventsFiber = yield* Effect.forkIn(events.pipe(filter(() => ready)).run(sink), scope);

        yield* signal.pipe(
          observe(() => {
            ready = true;
            return Effect.interrupt;
          }),
          Effect.forkIn(scope),
        );

        yield* Fiber.join(eventsFiber).pipe(Effect.onExit((exit) => Scope.close(scope, exit)));
      }),
    ),
);
