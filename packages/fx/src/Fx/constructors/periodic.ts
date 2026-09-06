import type * as Duration from "effect/Duration";
import { spaced } from "effect/Schedule";
import type { Fx } from "../Fx.js";
import { fromSchedule } from "./fromSchedule.js";

/**
 * Creates an Fx that emits a `void` value periodically.
 *
 * @remarks
 * ## Why
 *
 * Common interval work can use Effect's
 * [Schedule](https://effect.website/docs/v4/api/effect/Schedule) clock and
 * interruption semantics rather than an unmanaged platform timer.
 *
 * ## Ownership and lifetime
 *
 * Construction starts no clock. A run waits `period` before the first emission and
 * again between every subsequent emission. The run fiber owns the schedule; no ticks
 * continue after interruption.
 *
 * @example
 * ```ts
 * import { Effect, Fiber } from "effect"
 * import * as TestClock from "effect/testing/TestClock"
 * import { collectUpTo, periodic } from "@typed/fx/Fx"
 *
 * const program = Effect.gen(function* () {
 *   const fiber = yield* Effect.forkChild(collectUpTo(periodic("1 second"), 1))
 *   yield* TestClock.adjust("999 millis")
 *   const beforeFirstPeriod = fiber.pollUnsafe()
 *   yield* TestClock.adjust("1 millis")
 *   const firstTick = yield* Fiber.join(fiber)
 *   return { beforeFirstPeriod, firstTick }
 * })
 * ```
 *
 * @param period - The duration between emissions.
 * @returns An `Fx` that emits repeatedly.
 * @since 1.0.0
 * @category Time and rate
 */
export const periodic = (period: Duration.Input): Fx<void> =>
  /*#__PURE__*/ fromSchedule(spaced(period));
