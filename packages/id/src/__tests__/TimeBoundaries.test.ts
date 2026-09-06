import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { DateTimes } from "../DateTimes.js";
import { ksuid } from "../Ksuid.js";
import { RandomValues } from "../RandomValues.js";
import { ulid } from "../Ulid.js";
import { expectIllegalArgument } from "./helpers.js";

const fixedServices = (timestamp: number) =>
  Layer.mergeAll(
    Layer.succeed(
      DateTimes,
      DateTimes.of({
        now: Effect.succeed(timestamp),
        date: Effect.succeed(new Date(timestamp)),
      }),
    ),
    Layer.succeed(
      RandomValues,
      RandomValues.of((length) =>
        Effect.succeed(new Uint8Array(length) as Uint8Array & { readonly length: typeof length }),
      ),
    ),
  );

const runGenerator = <A, E>(
  effect: Effect.Effect<A, E, DateTimes | RandomValues>,
  timestamp: number,
) => Effect.runPromiseExit(Effect.provide(effect, fixedServices(timestamp)));

describe("time-based identifier boundaries", () => {
  describe("ulid", () => {
    it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 48, 1.5])(
      "rejects the invalid timestamp %s through its error channel",
      async (timestamp) => {
        expectIllegalArgument(await runGenerator(ulid, timestamp));
      },
    );

    it.each([0, 2 ** 48 - 1])("accepts the timestamp boundary %s", async (timestamp) => {
      const exit = await runGenerator(ulid, timestamp);
      expect(exit._tag).toBe("Success");
    });
  });

  describe("ksuid", () => {
    const epoch = 1_400_000_000_000;
    const maximumTimestamp = epoch + 2 ** 32 * 1_000 - 1;

    it.each([epoch - 1, maximumTimestamp + 1, Number.NaN, Number.POSITIVE_INFINITY, epoch + 0.5])(
      "rejects the invalid timestamp %s through its error channel",
      async (timestamp) => {
        expectIllegalArgument(await runGenerator(ksuid, timestamp));
      },
    );

    it.each([epoch, maximumTimestamp])("accepts the timestamp boundary %s", async (timestamp) => {
      const exit = await runGenerator(ksuid, timestamp);
      expect(exit._tag).toBe("Success");
    });
  });
});

describe("DateTimes.Fixed", () => {
  it.each([Number.NaN, Number.POSITIVE_INFINITY, "not a date", new Date(Number.NaN)] as const)(
    "rejects the invalid base date %s through its layer error channel",
    async (baseDate) => {
      const error = await Effect.runPromise(
        Effect.flip(Effect.provide(DateTimes.now, DateTimes.Fixed(baseDate))),
      );

      expect(Cause.isIllegalArgumentError(error)).toBe(true);
    },
  );
});
