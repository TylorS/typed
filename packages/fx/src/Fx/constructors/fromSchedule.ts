import { catchCause, schedule as schedule_Effect } from "effect/Effect";
import type { Schedule } from "effect/Schedule";
import type { Fx } from "../Fx.js";
import { make } from "./make.js";

/**
 * Creates an Fx that emits values according to a Schedule.
 * The Fx emits `void` each time the schedule fires.
 *
 * @remarks
 * ## Why
 *
 * Effect [Schedule](https://effect.website/docs/v4/api/effect/Schedule) values already
 * encode recurrence, delay, and typed schedule failures. `fromSchedule` exposes
 * those decisions as producer-driven ticks without another timing model. The
 * schedule governs all ticks: `Schedule.recurs(2)` emits twice here. In contrast,
 * `repeat(source, Schedule.recurs(2))` runs an initial source plus two repeats.
 *
 * ## Ownership and lifetime
 *
 * Construction starts no clock. Running the `Fx` repeatedly invokes the sink under
 * the schedule and completes when the schedule completes. Schedule failures are
 * forwarded as causes; interruption cancels waiting and stops further ticks. The
 * returned `Fx` retains the schedule's `Error` and `Env` channels.
 *
 * @example
 * ```ts
 * import { Schedule } from "effect"
 * import { collectAll, fromSchedule } from "@typed/fx/Fx"
 *
 * const twoTicks = fromSchedule(Schedule.recurs(2))
 * const program = collectAll(twoTicks) // [undefined, undefined]
 * ```
 *
 * @param schedule - The schedule to follow.
 * @returns An `Fx` that emits periodically according to the schedule.
 * @since 1.0.0
 * @category Time and rate
 */
export const fromSchedule = <Error, Env>(
  schedule: Schedule<unknown, unknown, Error, Env>,
): Fx<void, Error, Env> =>
  /*#__PURE__*/ make<void, Error, Env>((sink) =>
    catchCause(schedule_Effect(sink.onSuccess(), schedule), sink.onFailure),
  );
