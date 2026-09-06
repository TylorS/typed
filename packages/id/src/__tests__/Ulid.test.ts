import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { DateTimes } from "../DateTimes.js";
import { isUlid, ulid } from "../Ulid.js";
import { zeroRandomValues } from "./helpers.js";

const fixedTime = (timestamp: number) =>
  Layer.succeed(
    DateTimes,
    DateTimes.of({
      now: Effect.succeed(timestamp),
      date: Effect.succeed(new Date(timestamp)),
    }),
  );

describe("ulid", () => {
  it("encodes the timestamp and random suffix with zero entropy", async () => {
    const id = await Effect.runPromise(
      Effect.provide(ulid, Layer.mergeAll(zeroRandomValues, fixedTime(1_700_000_000_123))),
    );

    expect(id).toBe("01HF7YAT3V0000000000000000");
    expect(id).toHaveLength(26);
    expect(isUlid(id)).toBe(true);
  });
});
