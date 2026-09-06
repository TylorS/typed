import { describe, expect, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Fx from "../Fx/index.js";
import { RingBuffer } from "../Fx/internal/ring-buffer.js";
import * as Subject from "../Subject.js";

const expectIllegalArgumentError = (error: Cause.IllegalArgumentError, message: string) => {
  expect(Cause.isIllegalArgumentError(error)).toBe(true);
  expect(error.message).toBe(message);
};

describe("replay capacity validation", () => {
  const invalidCapacities = [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 0x1_0000_0000];
  const message = "Replay capacity must be an integer from 0 through 4294967295";

  it.each(invalidCapacities)("rejects invalid unsafeMake capacity %s", (capacity) => {
    expect(() => Subject.unsafeMake(capacity)).toThrow(new Cause.IllegalArgumentError(message));
  });

  it.each(invalidCapacities)("rejects invalid make capacity %s as a typed error", (capacity) =>
    Subject.make(capacity).pipe(
      Effect.flip,
      Effect.map((error) => expectIllegalArgumentError(error, message)),
      Effect.scoped,
      Effect.runPromise,
    ),
  );

  it.each(invalidCapacities)("rejects invalid replay capacity %s through the Fx", (capacity) =>
    Subject.replay(Fx.succeed(1), capacity).pipe(
      Fx.collectAll,
      Effect.flip,
      Effect.map((error) => expectIllegalArgumentError(error, message)),
      Effect.scoped,
      Effect.runPromise,
    ),
  );

  it.each([0, ...invalidCapacities])(
    "validates RingBuffer capacity defensively for %s",
    (capacity) => {
      expect(() => new RingBuffer(capacity)).toThrow(
        new Cause.IllegalArgumentError(
          "Ring buffer capacity must be an integer from 1 through 4294967295",
        ),
      );
    },
  );

  it("retains zero-capacity subject behavior", () => {
    expect(() => Subject.unsafeMake(0)).not.toThrow();
  });
});

describe("group size validation", () => {
  const invalidSizes = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 0x20_0000_0000_0000];
  const message = "Group size must be a positive safe integer";

  it.each(invalidSizes)("rejects invalid grouped size %s through the Fx", (size) =>
    Fx.fromIterable([1, 2, 3]).pipe(
      Fx.grouped(size),
      Fx.collectAll,
      Effect.flip,
      Effect.map((error) => expectIllegalArgumentError(error, message)),
      Effect.runPromise,
    ),
  );

  it.each(invalidSizes)("rejects invalid groupedWithin size %s through the Fx", (size) =>
    Fx.fromIterable([1, 2, 3]).pipe(
      Fx.groupedWithin(size, "1 second"),
      Fx.collectAll,
      Effect.flip,
      Effect.map((error) => expectIllegalArgumentError(error, message)),
      Effect.scoped,
      Effect.runPromise,
    ),
  );
});
