import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { DateTimes } from "../DateTimes.js";
import { isKsuid, ksuid } from "../Ksuid.js";
import { zeroRandomValues } from "./helpers.js";

const fixedTime = (timestamp: number) =>
  Layer.succeed(
    DateTimes,
    DateTimes.of({
      now: Effect.succeed(timestamp),
      date: Effect.succeed(new Date(timestamp)),
    }),
  );

describe("ksuid", () => {
  it("encodes the timestamp and payload with zero entropy", async () => {
    const id = await Effect.runPromise(
      Effect.provide(ksuid, Layer.mergeAll(zeroRandomValues, fixedTime(1_700_000_000_123))),
    );

    expect(id).toBe("2YBXZHqCHEdmhp5sdLmoTEW73NQ");
    expect(id).toHaveLength(27);
    expect(isKsuid(id)).toBe(true);
  });
});
