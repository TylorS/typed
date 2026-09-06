import { dual } from "effect/Function";
import type { Fx } from "../Fx.js";
import { Duration, Effect } from "effect";
import { mapEffect } from "./mapEffect.js";

/**
 * Sleeps for `duration` before forwarding each successful source delivery.
 *
 * @remarks
 * ## Why
 *
 * Per-value delay is useful when pacing downstream work without changing the
 * stream's error type or replacing the producer.
 *
 * ## Ownership and lifetime
 *
 * Each delivered value runs an Effect sleep before reaching the sink. This uses
 * `mapEffect` and inherits producer concurrency: a sequential producer waits for
 * each delayed delivery, while concurrent deliveries can overlap their sleeps.
 * No queue or ordering guarantee is added. The source run must await its pending
 * deliveries before normal completion. Source failures propagate; interruption
 * cancels active sleeps. No external resource is retained.
 *
 * @example
 * ```ts
 * import { delay } from "@typed/fx/Fx"
 * import { fromIterable } from "@typed/fx/Fx"
 *
 * const paced = delay(fromIterable([1, 2, 3]), "100 millis")
 * ```
 *
 * @since 1.0.0
 * @category Time and rate
 */
export const delay: {
  (duration: Duration.Input): <A, E, R>(self: Fx<A, E, R>) => Fx<A, E, R>;
  <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input): Fx<A, E, R>;
} = dual(2, <A, E, R>(self: Fx<A, E, R>, duration: Duration.Input) =>
  mapEffect(self, (a) => Effect.as(Effect.sleep(duration), a)),
);
