import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Fx from "../Fx.js";

describe("Fx.callback", () => {
  it("runs cleanup exactly once when a downstream sink exits early", async () => {
    let cleanupCount = 0;
    const source = Fx.callback<number>((emit) => {
      queueMicrotask(() => {
        void emit.succeed(2);
      });
      void emit.succeed(1);
      return Effect.sync(() => {
        cleanupCount += 1;
      });
    });

    const values = await Effect.runPromise(Fx.collectUpTo(source, 2));

    expect(values).toEqual([1, 2]);
    expect(cleanupCount).toBe(1);
  });
});
