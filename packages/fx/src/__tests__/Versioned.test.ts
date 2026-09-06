import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Fx from "../Fx/index.js";
import * as Versioned from "../Versioned.js";

describe("Versioned", () => {
  describe("Service", () => {
    it("should allow defining a Versioned as a Service", () =>
      Effect.gen(function* () {
        class MyVersioned extends Versioned.Service<MyVersioned, never, number, never, number>()(
          "MyVersioned",
        ) {}

        const layer = MyVersioned.make(Effect.succeed(1), Fx.succeed(42), Effect.succeed(42));

        yield* Effect.gen(function* () {
          expect(yield* MyVersioned).toEqual(42);
          expect(yield* Effect.map(MyVersioned, (value) => value + 1)).toEqual(43);
          expect(yield* MyVersioned.version).toEqual(1);
          expect(yield* Fx.collectAll(MyVersioned)).toEqual([42]);
        }).pipe(Effect.provide(layer));
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
