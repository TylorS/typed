import { assert, describe, it } from "vitest";
import { Cause, Data, Effect, Exit } from "effect";
import { Fx } from "../index.js";

describe("Fx", () => {
  describe("catch / catchCause / catchTag", () => {
    class ErrorA extends Data.TaggedError("A") {}
    class ErrorB extends Data.TaggedError("B") {}

    it("catch recovers from typed failures", () =>
      Effect.gen(function* () {
        const fx = Fx.fail("boom").pipe(Fx.catch((e) => Fx.succeed(`recovered:${e}`)));

        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, ["recovered:boom"]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("catch does not recover from defects", () =>
      Effect.gen(function* () {
        const fx = Fx.die("boom").pipe(Fx.catch(() => Fx.succeed("nope")));

        const exit = yield* Effect.exit(Fx.collectAll(fx));
        assert(Exit.isFailure(exit));
        assert(Cause.hasDies(exit.cause));
      }).pipe(Effect.scoped, Effect.runPromise));

    it("catchCause recovers from defects", () =>
      Effect.gen(function* () {
        const fx = Fx.die("boom").pipe(Fx.catchCause(() => Fx.succeed("ok")));

        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, ["ok"]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("catchTag recovers from tagged failures", () =>
      Effect.gen(function* () {
        const fx = Fx.fail(new ErrorA()).pipe(Fx.catchTag("A", () => Fx.succeed(1)));

        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [1]);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("catchTag does not catch other tags", () =>
      Effect.gen(function* () {
        const fx = Fx.fail(new ErrorB()).pipe(
          // @ts-expect-error - invalid tag
          Fx.catchTag("A", () => Fx.succeed(1)),
        );

        const exit = yield* Effect.exit(Fx.collectAll(fx));
        assert(Exit.isFailure(exit));
        assert.strictEqual(exit.cause.reasons.length, 1);

        const failure = exit.cause.reasons[0];
        assert(failure._tag === "Fail");
        // @ts-expect-error - unexpected tag
        assert.strictEqual(failure.error._tag, "B");
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
