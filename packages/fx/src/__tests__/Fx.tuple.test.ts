import * as Effect from "effect/Effect";
import { assert, describe, it } from "vitest";
import { Fx } from "../index.js";

describe("Fx.tuple", () => {
  it("wraps the value from a single input in a tuple", () =>
    Effect.gen(function* () {
      const emissions = yield* Fx.tuple(Fx.succeed(1)).pipe(Fx.collectAll);

      assert.deepStrictEqual(emissions, [[1]]);
    }).pipe(Effect.runPromise));

  it("keeps previously delivered tuples unchanged when later values arrive", () =>
    Effect.gen(function* () {
      const emissions = yield* Fx.tuple(Fx.fromIterable([1, 2]), Fx.fromIterable(["a", "b"])).pipe(
        Fx.map((value) => ({ value, snapshot: [...value] as const })),
        Fx.collectAll,
      );

      assert.ok(emissions.length >= 2);
      assert.deepStrictEqual(emissions.at(-1)?.snapshot, [2, "b"]);
      assert.ok(emissions[0]?.snapshot[0] !== 2 || emissions[0]?.snapshot[1] !== "b");

      for (const emission of emissions) {
        assert.deepStrictEqual(emission.value, emission.snapshot);
      }

      assert.strictEqual(new Set(emissions.map(({ value }) => value)).size, emissions.length);
    }).pipe(Effect.runPromise));
});
