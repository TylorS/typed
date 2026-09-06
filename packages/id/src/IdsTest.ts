import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Random from "effect/Random";
import * as TestClock from "effect/testing/TestClock";
import { DateTimes } from "./DateTimes.js";
import { Ids } from "./Ids.js";
import { makeLazyIds } from "./internal/Ids.js";
import { RandomValues } from "./RandomValues.js";
import { Uuid7State } from "./Uuid7.js";

const testRandomValues = (): Layer.Layer<RandomValues> =>
  Layer.effect(
    RandomValues,
    RandomValues.pipe(Effect.provide(RandomValues.Random), Random.withSeed("@typed/id/IdsTest")),
  );

const fixedDateTimes = (
  baseDate: number | string | Date,
): Layer.Layer<DateTimes, Cause.IllegalArgumentError> =>
  Layer.effect(
    DateTimes,
    Effect.gen(function* () {
      const millis = new Date(baseDate).getTime();
      if (!Number.isFinite(millis)) {
        return yield* new Cause.IllegalArgumentError(`Invalid base date: ${String(baseDate)}`);
      }
      return DateTimes.of({
        now: Effect.succeed(millis),
        date: Effect.sync(() => new Date(millis)),
      });
    }),
  );

/**
 * Provides deterministic IDs, time, entropy, and TestClock services.
 *
 * @remarks
 * This test-only entry point keeps Effect's testing runtime out of production imports of `Ids`.
 * Each invocation owns an independent clock, random sequence, and lazy CUID/UUIDv7 state.
 *
 * @example
 * ```ts
 * import { Ids } from "@typed/id/Ids"
 * import { IdsTest } from "@typed/id/IdsTest"
 * import { Effect } from "effect"
 * const deterministic = Ids.uuid7.pipe(Effect.provide(IdsTest({ currentTime: 0 })))
 * ```
 *
 * @category Deterministic testing
 * @since 1.0.0
 */
export const IdsTest = (
  options: IdsTestOptions = {},
): Layer.Layer<
  Ids | DateTimes | RandomValues | Uuid7State | TestClock.TestClock,
  Cause.IllegalArgumentError
> => {
  const services = Layer.mergeAll(
    fixedDateTimes(options.currentTime ?? 1_400_000_000_000),
    testRandomValues(),
  );

  const uuid7State = Layer.effect(Uuid7State, Uuid7State.make).pipe(Layer.provide(services));

  return Layer.effect(Ids, makeLazyIds(options.envData ?? "node")).pipe(
    Layer.provide(services),
    Layer.provideMerge(services),
    Layer.provideMerge(TestClock.layer({})),
    Layer.provideMerge(uuid7State),
  );
};

/** Configuration for the deterministic ID test layer. @since 1.0.0 */
export type IdsTestOptions = {
  /** Fixed generator time; invalid dates fail Layer acquisition. @since 1.0.0 */
  readonly currentTime?: number | string | Date;
  /** CUID caller discriminator used when the test CuidState is created. @since 1.0.0 */
  readonly envData?: string;
};
