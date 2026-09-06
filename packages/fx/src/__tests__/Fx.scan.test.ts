import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { Fx } from "../index.js";
import { scan, scanEffect } from "../Fx/combinators/scan.js";

describe("Fx scan / scanEffect combinators", () => {
  describe("scan", () => {
    it("emits initial then accumulated state (sum)", () =>
      Effect.gen(function* () {
        const fx = Fx.fromIterable([1, 2, 3, 4]).pipe(scan(0, (s, a) => s + a));
        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [0, 1, 3, 6, 10]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("emits initial only when source is empty", () =>
      Effect.gen(function* () {
        const fx = Fx.fromIterable<number>([]).pipe(scan(42, (s, a) => s + a));
        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [42]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-last form: pipe(fx, scan(initial, f))", () =>
      Effect.gen(function* () {
        const fx = Fx.fromIterable(["a", "b", "c"]).pipe(scan("", (acc, s) => acc + s));
        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, ["", "a", "ab", "abc"]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-first form: scan(fx, initial, f)", () =>
      Effect.gen(function* () {
        const fx = scan(Fx.fromIterable([2, 3, 4]), 1, (s, a) => s * a);
        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [1, 2, 6, 24]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("scanEffect", () => {
    it("emits initial then effectfully accumulated state", () =>
      Effect.gen(function* () {
        const fx = Fx.fromIterable([1, 2, 3]).pipe(scanEffect(0, (s, a) => Effect.succeed(s + a)));
        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [0, 1, 3, 6]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("emits initial only when source is empty", () =>
      Effect.gen(function* () {
        const fx = Fx.fromIterable<number>([]).pipe(
          scanEffect(10, (s, a) => Effect.succeed(s + a)),
        );
        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [10]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("fails when reducer effect fails", () =>
      Effect.gen(function* () {
        const fx = Fx.fromIterable([1, 2, 3]).pipe(
          scanEffect(0, (s, a) => (a === 2 ? Effect.fail("boom") : Effect.succeed(s + a))),
        );
        const exit = yield* Effect.exit(Fx.collectAll(fx));
        assert(Exit.isFailure(exit));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("data-first form: scanEffect(fx, initial, f)", () =>
      Effect.gen(function* () {
        const fx = scanEffect(Fx.fromIterable([1, 2, 3]), [] as number[], (acc, n) =>
          Effect.succeed([...acc, n]),
        );
        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [[], [1], [1, 2], [1, 2, 3]]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
