import { describe, expect, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Option from "effect/Option";
import * as Fx from "../Fx.js";

describe("Fx.sync", () => {
  it("is lazy and evaluates once for each run", async () => {
    let evaluations = 0;
    const source = Fx.sync(() => ++evaluations);

    expect(evaluations).toBe(0);
    await expect(
      Effect.runPromise(Fx.first(source).pipe(Effect.map(Option.getOrThrow))),
    ).resolves.toBe(1);
    await expect(
      Effect.runPromise(Fx.first(source).pipe(Effect.map(Option.getOrThrow))),
    ).resolves.toBe(2);
  });

  it("keeps thrown exceptions in Effect's defect channel", async () => {
    const defect = new Error("broken synchronous producer");
    const source = Fx.sync(() => {
      throw defect;
    });

    const exit = await Effect.runPromiseExit(Fx.first(source));

    expect(exit._tag).toBe("Failure");
    if (exit._tag === "Failure") {
      expect(Cause.hasDies(exit.cause)).toBe(true);
      expect(Cause.squash(exit.cause)).toBe(defect);
    }
  });
});
