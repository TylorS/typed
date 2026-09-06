import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import { Fx } from "../index.js";

const invalidConcurrency = [
  0,
  -1,
  1.5,
  Number.NaN,
  Number.NEGATIVE_INFINITY,
  Number.POSITIVE_INFINITY,
  Number.MAX_SAFE_INTEGER + 1,
] as const;

const assertInvalidConcurrency = (exit: Exit.Exit<ReadonlyArray<number>, unknown>) => {
  assert(Exit.isFailure(exit));
  assert(!Cause.hasDies(exit.cause));
  const error = Option.getOrThrow(Cause.findErrorOption(exit.cause));
  assert(Cause.isIllegalArgumentError(error));
  assert.match(error.message, /concurrency.*positive safe integer/i);
};

describe("Fx concurrency limits", () => {
  describe.each([
    [
      "flatMapConcurrently direct",
      (concurrency: number) =>
        Fx.flatMapConcurrently(Fx.fromIterable([1]), (value) => Fx.succeed(value), concurrency),
    ],
    [
      "flatMapConcurrently curried",
      (concurrency: number) =>
        Fx.fromIterable([1]).pipe(
          Fx.flatMapConcurrently((value) => Fx.succeed(value), concurrency),
        ),
    ],
    [
      "flatMapConcurrentlyEffect direct",
      (concurrency: number) =>
        Fx.flatMapConcurrentlyEffect(Fx.fromIterable([1]), Effect.succeed, concurrency),
    ],
    [
      "flatMapConcurrentlyEffect curried",
      (concurrency: number) =>
        Fx.fromIterable([1]).pipe(Fx.flatMapConcurrentlyEffect(Effect.succeed, concurrency)),
    ],
  ] as const)("%s", (_, makeFx) => {
    it.each(invalidConcurrency)("rejects %s through the typed error channel", (concurrency) =>
      Effect.gen(function* () {
        const exit = yield* makeFx(concurrency).pipe(
          Fx.collectAll,
          Effect.timeout(100),
          Effect.exit,
        );

        assertInvalidConcurrency(exit);
      }).pipe(Effect.scoped, Effect.runPromise),
    );
  });
});
