import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { RandomValues } from "../RandomValues.js";
import { seededRandomValues } from "./helpers.js";

const sample = Effect.all([
  RandomValues.call(0),
  RandomValues.call(1),
  RandomValues.call(16),
  RandomValues.call(32),
]);

describe("RandomValues", () => {
  it("returns exactly the requested number of bytes", async () => {
    const values = await Effect.runPromise(Effect.provide(sample, seededRandomValues("lengths")));

    expect(values.map((value) => value.length)).toEqual([0, 1, 16, 32]);
  });

  it("defects with a clear message when Web Crypto entropy is unavailable", async () => {
    const previousCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: undefined,
    });

    try {
      const exit = await Effect.runPromiseExit(
        Effect.provide(RandomValues.call(16), RandomValues.Default),
      );

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.squash(exit.cause)).toEqual(
          new TypeError(
            "RandomValues.Default requires globalThis.crypto.getRandomValues. Provide RandomValues.Random or a custom RandomValues service for unsupported runtimes.",
          ),
        );
      }
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: previousCrypto,
      });
    }
  });

  it("provides deterministic entropy through independent seeded layers", async () => {
    const program = RandomValues.call(32);
    const first = await Effect.runPromise(
      Effect.provide(program, seededRandomValues("contract-seed")),
    );
    const second = await Effect.runPromise(
      Effect.provide(program, seededRandomValues("contract-seed")),
    );
    const different = await Effect.runPromise(
      Effect.provide(program, seededRandomValues("different-seed")),
    );

    expect(second).toEqual(first);
    expect(different).not.toEqual(first);
  });
});
