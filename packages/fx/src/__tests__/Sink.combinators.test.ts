import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import { Fx, Sink } from "../index.js";

describe("Sink.mapError", () => {
  it("maps failure cause before passing to inner sink", () =>
    Effect.gen(function* () {
      const failures = yield* Ref.make<Array<number>>([]);
      const sink = Sink.make<unknown, number, never>(
        (cause) =>
          Ref.update(failures, (list) => {
            const f = Cause.findFail(cause);
            if (f._tag === "Success") list.push(f.success.error as number);
            return list;
          }),
        () => Effect.void,
      );
      const mapped = Sink.mapError(sink, (s: string) => s.length);
      yield* Fx.fail("err").run(mapped);
      const list = yield* Ref.get(failures);
      assert.deepStrictEqual(list, [3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves success path", () =>
    Effect.gen(function* () {
      const out = yield* Ref.make<number[]>([]);
      const sink = Sink.make<number, string, never>(
        (_cause) => Effect.void,
        (n: number) => Ref.update(out, (arr) => [...arr, n]),
      );
      const mapped = Sink.mapError(sink, (e: string) => e);
      yield* Fx.fromIterable([1, 2, 3]).run(mapped);
      const list = yield* Ref.get(out);
      assert.deepStrictEqual(list, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Sink.mapInput", () => {
  it("transforms input before sink (same as map)", () =>
    Effect.gen(function* () {
      const out = yield* Ref.make<number[]>([]);
      const sink = Sink.make(
        () => Effect.void,
        (n: number) => Ref.update(out, (arr) => [...arr, n]),
      );
      const mapped = Sink.mapInput(sink, (s: string) => parseInt(s, 10));
      yield* Fx.fromIterable(["1", "2", "3"]).run(mapped);
      const list = yield* Ref.get(out);
      assert.deepStrictEqual(list, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Sink.mapInputEffect", () => {
  it("transforms input with effect before sink (same as mapEffect)", () =>
    Effect.gen(function* () {
      const out = yield* Ref.make<number[]>([]);
      const sink = Sink.make(
        () => Effect.void,
        (n: number) => Ref.update(out, (arr) => [...arr, n]),
      );
      const mapped = Sink.mapInputEffect(sink, (s: string) => Effect.succeed(parseInt(s, 10)));
      yield* Fx.fromIterable(["1", "2", "3"]).run(mapped);
      const list = yield* Ref.get(out);
      assert.deepStrictEqual(list, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("propagates effect failure to sink onFailure", () =>
    Effect.gen(function* () {
      const failures = yield* Ref.make<Array<string>>([]);
      const sink = Sink.make<number, string, never>(
        (cause) =>
          Ref.update(failures, (list) => {
            const f = Cause.findFail(cause);
            if (f._tag === "Success") list.push(f.success.error as string);
            return list;
          }),
        (_n: number) => Effect.void,
      );
      const mapped = Sink.mapInputEffect(sink, (s: string) =>
        s === "bad" ? Effect.fail("parse failed") : Effect.succeed(parseInt(s, 10)),
      );
      yield* Fx.fromIterable(["1", "bad", "3"]).run(mapped);
      const list = yield* Ref.get(failures);
      assert.deepStrictEqual(list, ["parse failed"]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
