import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import { TestClock } from "effect/testing";
import { append, delimit, prepend } from "../Fx/combinators/continueWith.js";
import { compact } from "../Fx/combinators/compact.js";
import { exit as exitCombinator } from "../Fx/combinators/exit.js";
import { filter } from "../Fx/combinators/filter.js";
import { filterMap } from "../Fx/combinators/filterMap.js";
import { filterMapEffect } from "../Fx/combinators/filterMapEffect.js";
import { flip } from "../Fx/combinators/flip.js";
import { if as fxIf, when } from "../Fx/combinators/when.js";
import { struct } from "../Fx/combinators/tuple.js";
import { failCause } from "../Fx/constructors/failCause.js";
import { fromFailures } from "../Fx/constructors/fromFailures.js";
import {
  succeedNull,
  succeedUndefined,
  succeedVoid,
} from "../Fx/constructors/succeed.js";
import { Fx } from "../index.js";

const testClock = TestClock.layer();
const Foo = Context.Service<{ readonly n: number }>("Test/Foo");

describe("Fx flatMap family", () => {
  it("flatMap merges inner streams concurrently", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2]).pipe(
        Fx.flatMap((n) => Fx.fromIterable([n, n * 10])),
        Fx.collectAll,
      );
      assert.strictEqual(result.length, 4);
      assert.deepStrictEqual([...result].sort((a, b) => a - b), [1, 2, 10, 20]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("flatMapEffect maps each value effectfully", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
        Fx.flatMapEffect((n) => Effect.succeed(n * 2)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [2, 4, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("exhaustMap ignores source emissions while an inner stream is active", () =>
    Effect.gen(function* () {
      const seen = yield* Ref.make<Array<number>>([]);
      const fiber = yield* Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 60), Fx.at(3, 120)).pipe(
        Fx.exhaustMap((n) => Fx.concat(Fx.succeed(n), Fx.at(n * 10, 50))),
        Fx.tap((n) => Ref.update(seen, (xs) => [...xs, n])),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(25);
      assert.deepStrictEqual(yield* Ref.get(seen), [1]);
      yield* TestClock.adjust(200);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 10, 2, 20, 3, 30]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("exhaustMapEffect runs one effect at a time", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2]).pipe(
        Fx.exhaustMapEffect((n) => Effect.succeed(n * 2)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [2, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("exhaustLatestMap switches to the latest inner when the current one completes", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 10), Fx.at(3, 20)).pipe(
        Fx.exhaustLatestMap((n) => Fx.concat(Fx.succeed(n), Fx.at(n * 10, 50))),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(100);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 10, 3, 30]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("exhaustLatestMapEffect keeps only the latest buffered effect", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
        Fx.exhaustLatestMapEffect((n) => Effect.succeed(n * 2)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [2, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("switchMapEffect keeps only the latest effectful inner stream", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(
        Fx.switchMapEffect((n) => Effect.succeed(n * 2)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [6]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx filter / map variants", () => {
  it("filter keeps elements matching a synchronous predicate", () =>
    Effect.gen(function* () {
      const result = yield* filter(Fx.fromIterable([1, 2, 3, 4]), (n) => n % 2 === 0).pipe(
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [2, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filterMap maps and filters in one step", () =>
    Effect.gen(function* () {
      const result = yield* filterMap(Fx.fromIterable([1, 2, 3, 4]), (n) =>
        n % 2 === 0 ? Option.some(n * 10) : Option.none(),
      ).pipe(Fx.collectAll);
      assert.deepStrictEqual(result, [20, 40]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filterMapEffect maps and filters effectfully", () =>
    Effect.gen(function* () {
      const result = yield* filterMapEffect(Fx.fromIterable([1, 2, 3]), (n) =>
        Effect.succeed(n > 1 ? Option.some(String(n)) : Option.none()),
      ).pipe(Fx.collectAll);
      assert.deepStrictEqual(result, ["2", "3"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("compact unwraps Some values and drops None", () =>
    Effect.gen(function* () {
      const result = yield* compact(
        Fx.fromIterable([Option.some(1), Option.none(), Option.some(2)]),
      ).pipe(Fx.collectAll);
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("as replaces every emission with a constant", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3]).pipe(Fx.as("x"), Fx.collectAll);
      assert.deepStrictEqual(result, ["x", "x", "x"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("mapEffect transforms values effectfully", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2]).pipe(
        Fx.mapEffect((n) => Effect.succeed(n * 3)),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [3, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx exit / flip", () => {
  it("exit materializes successes and failures as Exit values", () =>
    Effect.gen(function* () {
      const collected = yield* Fx.concat(Fx.succeed(1), Fx.fail("err")).pipe(
        exitCombinator,
        Fx.collectAll,
      );
      assert.strictEqual(collected.length, 2);
      assert(Exit.isSuccess(collected[0]!));
      assert(Exit.isFailure(collected[1]!));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("flip swaps success and typed failure channels", () =>
    Effect.gen(function* () {
      const collected = yield* flip(Fx.fail("err")).pipe(Fx.collectAll);
      assert.deepStrictEqual(collected, ["err"]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx continueWith helpers", () => {
  it("append emits a trailing value", () =>
    Effect.gen(function* () {
      const result = yield* append(Fx.fromIterable([1, 2]), 3).pipe(Fx.collectAll);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("prepend emits a leading value", () =>
    Effect.gen(function* () {
      const result = yield* prepend(Fx.fromIterable([2, 3]), 1).pipe(Fx.collectAll);
      assert.deepStrictEqual(result, [1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("delimit wraps a stream with before and after values", () =>
    Effect.gen(function* () {
      const result = yield* delimit(Fx.fromIterable([2]), "start", "end").pipe(Fx.collectAll);
      assert.deepStrictEqual(result, ["start", 2, "end"]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx conditional combinators", () => {
  it("when selects constant values from a boolean condition", () =>
    Effect.gen(function* () {
      const result = yield* when(Fx.succeed(true), { onTrue: "yes", onFalse: "no" }).pipe(
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, ["yes"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("if selects Fx branches from a boolean condition", () =>
    Effect.gen(function* () {
      const result = yield* fxIf(Fx.succeed(false), {
        onTrue: Fx.fromIterable([1]),
        onFalse: Fx.fromIterable([2]),
      }).pipe(Fx.collectAll);
      assert.deepStrictEqual(result, [2]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx provide / provideContext", () => {
  it("provideContext supplies services from a Context", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1]).pipe(
        Fx.mapEffect((x) =>
          Effect.gen(function* () {
            const foo = yield* Foo;
            return x + foo.n;
          }),
        ),
        Fx.provideContext(Context.make(Foo, { n: 4 })),
      );
      assert.deepStrictEqual(yield* Fx.collectAll(fx), [5]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("provide supplies services from a Layer", () =>
    Effect.gen(function* () {
      const layer = Layer.succeed(Foo, { n: 9 });
      const fx = Fx.fromIterable([2]).pipe(
        Fx.mapEffect((x) =>
          Effect.gen(function* () {
            const foo = yield* Foo;
            return x * foo.n;
          }),
        ),
        Fx.provide(layer),
      );
      assert.deepStrictEqual(yield* Fx.collectAll(fx), [18]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx constructors", () => {
  it("fromSchedule emits according to a schedule", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.fromSchedule(Schedule.spaced(10)).pipe(
        Fx.take(1),
        Fx.collectAll,
        Effect.forkScoped,
      );
      yield* TestClock.adjust(10);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [undefined]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("periodic emits void on a fixed interval", () =>
    Effect.gen(function* () {
      const fiber = yield* Fx.periodic(25).pipe(Fx.take(1), Fx.collectAll, Effect.forkScoped);
      yield* TestClock.adjust(25);
      assert.strictEqual((yield* Fiber.join(fiber)).length, 1);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("fromFailures fails with a combined cause", () =>
    Effect.gen(function* () {
      const exit = yield* fromFailures(["a", "b"]).pipe(Fx.collectAll, Effect.exit);
      assert(Exit.isFailure(exit));
      assert.strictEqual(exit.cause.reasons.filter((reason) => reason._tag === "Fail").length, 2);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("failCause fails with the provided cause", () =>
    Effect.gen(function* () {
      const exit = yield* failCause(Cause.fail("boom")).pipe(Fx.collectAll, Effect.exit);
      assert(Exit.isFailure(exit));
      assert.strictEqual(Option.getOrThrow(Cause.findErrorOption(exit.cause)), "boom");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("succeedNull / succeedUndefined / succeedVoid emit their constants", () =>
    Effect.gen(function* () {
      assert.deepStrictEqual(yield* Fx.collectAll(succeedNull), [null]);
      assert.deepStrictEqual(yield* Fx.collectAll(succeedUndefined), [undefined]);
      assert.deepStrictEqual(yield* Fx.collectAll(succeedVoid), [undefined]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx sync slice combinators", () => {
  it("skip drops the first n values", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3, 4]).pipe(Fx.skip(2), Fx.collectAll);
      assert.deepStrictEqual(result, [3, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("slice selects a bounded window", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3, 4, 5]).pipe(
        Fx.slice({ skip: 1, take: 2 }),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("takeUntil stops before the matching element", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.takeUntil((n) => n > 2),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dropAfter includes the matching element then stops", () =>
    Effect.gen(function* () {
      const result = yield* Fx.fromIterable([1, 2, 3, 4]).pipe(
        Fx.dropAfter((n) => n === 2),
        Fx.collectAll,
      );
      assert.deepStrictEqual(result, [1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx.struct", () => {
  it("combines named streams into object emissions", () =>
    Effect.gen(function* () {
      const result = yield* struct({
        n: Fx.fromIterable([1, 2]),
        s: Fx.fromIterable(["a", "b"]),
      }).pipe(Fx.collectAll);

      assert.ok(result.length >= 2);
      assert.deepStrictEqual(result.at(-1), { n: 2, s: "b" });
    }).pipe(Effect.scoped, Effect.runPromise));
});
