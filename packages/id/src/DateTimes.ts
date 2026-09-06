import * as Clock from "effect/Clock";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";

/**
 * Effect service for current epoch milliseconds and Date values.
 * @remarks
 * ## Why
 * Making time a service keeps time-based ID generators deterministic under tests and explicit under server or browser runtimes.
 * ## Ownership and lifetime
 * A DateTimes Layer owns its time source for the Layer lifetime; individual reads acquire no resources.
 * @example
 * ```ts
 * import { DateTimes } from "@typed/id/DateTimes"
 * import { Effect } from "effect"
 * const now = Effect.provide(DateTimes.now, DateTimes.Default)
 * ```
 * See [Effect Clock](https://effect.website/docs/testing/testclock/).
 * @category Time services
 * @since 1.0.0
 */
export class DateTimes extends Context.Service<DateTimes>()("@typed/id/DateTimes", {
  make: Effect.succeed({
    now: Effect.sync(() => Date.now()),
    date: Effect.sync(() => new Date()),
  }),
}) {
  /**
   * Reads epoch milliseconds from the current DateTimes service.
   * @remarks
   * ## Why
   * A service-backed read avoids hard-wiring `Date.now` into generators and tests.
   * ## Ownership and lifetime
   * This Effect acquires no resources and uses the DateTimes service for one invocation.
   * @category Time services
   * @since 1.0.0
   */
  static readonly now = Effect.flatMap(DateTimes, ({ now }) => now);
  /**
   * Reads a Date from the current DateTimes service.
   * @remarks
   * ## Why
   * The Date view stays aligned with the same replaceable time source as epoch-millisecond reads.
   * ## Ownership and lifetime
   * This Effect acquires no resources and uses the DateTimes service for one invocation.
   * @category Time services
   * @since 1.0.0
   */
  static readonly date = Effect.flatMap(DateTimes, ({ date }) => date);

  /**
   * Provides DateTimes using the runtime wall clock.
   * @remarks
   * ## Why
   * The production default is explicit and replaceable rather than hidden in each generator.
   * ## Ownership and lifetime
   * The surrounding Layer Scope owns the service; reads allocate only their returned Date values.
   * @category Time services
   * @since 1.0.0
   */
  static readonly Default = Layer.effect(DateTimes, DateTimes.make);

  /**
   * Provides DateTimes anchored to a base date and advanced by Effect Clock.
   * @remarks
   * ## Why
   * Clock-relative time supports deterministic tests while still allowing controlled advancement; invalid bases fail with `IllegalArgumentError`.
   * ## Ownership and lifetime
   * Layer acquisition captures the base and current Clock reading; the surrounding Layer Scope owns that state.
   * @example
   * ```ts
   * import { DateTimes } from "@typed/id/DateTimes"
   * const fixed = DateTimes.Fixed("2026-01-01T00:00:00Z")
   * ```
   * @category Time services
   * @since 1.0.0
   */
  static readonly Fixed = (baseDate: number | string | Date) =>
    Layer.effect(
      DateTimes,
      Effect.gen(function* () {
        const clock = yield* Clock.Clock;
        const base = new Date(baseDate);
        const baseMillis = base.getTime();
        if (!Number.isFinite(baseMillis)) {
          return yield* new Cause.IllegalArgumentError(`Invalid base date: ${String(baseDate)}`);
        }
        const baseN = BigInt(baseMillis);
        const startMillis = yield* clock.currentTimeMillis;
        const now = clock.currentTimeMillis.pipe(
          Effect.map((millis) =>
            // Use BigInt to avoid floating point precision issues which can break deterministic testing
            Number(baseN + BigInt(millis) - BigInt(startMillis)),
          ),
        );
        const date = now.pipe(Effect.map((millis) => new Date(millis)));

        return DateTimes.of({ now, date });
      }),
    );
}
