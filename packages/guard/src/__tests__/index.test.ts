import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";
import * as Context from "effect/Context";
import { describe, expect, it } from "vitest";
import {
  type AsGuard,
  addTag,
  any,
  bind,
  bindTo,
  catch as catch_,
  catchAll,
  catchCause,
  catchTag,
  decode,
  encode,
  filter,
  filterMap,
  fromSchemaDecode,
  fromSchemaEncode,
  getGuard,
  Guard,
  liftPredicate,
  let as let_,
  map,
  mapEffect,
  pipe,
  provide,
  provideService,
  provideServiceEffect,
  tap,
} from "../index.js";

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect);

const positiveNumber = liftPredicate((n: number) => n > 0);

describe("@typed/guard", () => {
  describe("getGuard", () => {
    const invalidGuardInput =
      "Expected a Guard function or an object with an own callable asGuard property";

    it("returns the guard when given a Guard function", () => {
      const g: Guard<number, number> = (n) => Effect.succeed(Option.some(n));
      expect(getGuard(g)).toBe(g);
    });

    it("does not inspect an own non-callable asGuard property on a Guard function", () => {
      const guard = Object.assign(
        ((n: number) => Effect.succeed(Option.some(n))) satisfies Guard<number, number>,
        { asGuard: 1 },
      );

      expect(getGuard(guard)).toBe(guard);
    });

    it("does not invoke an own callable asGuard property on a Guard function", () => {
      const replacement: Guard<number, number> = (n) => Effect.succeed(Option.some(n + 1));
      let adapterCalls = 0;
      const guard = Object.assign(
        ((n: number) => Effect.succeed(Option.some(n))) satisfies Guard<number, number>,
        {
          asGuard: () => {
            adapterCalls += 1;
            return replacement;
          },
        },
      );

      expect(getGuard(guard)).toBe(guard);
      expect(adapterCalls).toBe(0);
    });

    it("normalizes an object with an own callable asGuard property", () => {
      const inner: Guard<string, number> = (s) => Effect.succeed(Option.some(Number(s)));
      const asGuard = { asGuard: () => inner };
      expect(getGuard(asGuard)).toBe(inner);
    });

    it("rejects a class prototype adapter without invoking it", () => {
      const inner: Guard<number, number> = (n) => Effect.succeed(Option.some(n));
      let adapterCalls = 0;

      class PrototypeAdapter implements AsGuard<number, number> {
        asGuard(): Guard<number, number> {
          adapterCalls += 1;
          return inner;
        }
      }

      expect(() => getGuard(new PrototypeAdapter())).toThrowError(new TypeError(invalidGuardInput));
      expect(adapterCalls).toBe(0);
    });

    it("does not read an inherited asGuard getter", () => {
      const inner: Guard<number, number> = (n) => Effect.succeed(Option.some(n));
      let getterReads = 0;
      const prototype = Object.defineProperty({}, "asGuard", {
        get: () => {
          getterReads += 1;
          return () => inner;
        },
      });
      const inherited = Object.create(prototype) as AsGuard<number, number>;

      expect(() => getGuard(inherited)).toThrowError(new TypeError(invalidGuardInput));
      expect(getterReads).toBe(0);
    });

    it("ignores an asGuard property added to Object.prototype", () => {
      const inner: Guard<number, number> = (n) => Effect.succeed(Option.some(n));
      const previous = Object.getOwnPropertyDescriptor(Object.prototype, "asGuard");
      let adapterCalls = 0;
      Object.defineProperty(Object.prototype, "asGuard", {
        configurable: true,
        value: () => {
          adapterCalls += 1;
          return inner;
        },
      });

      try {
        expect(() => getGuard({} as AsGuard<number, number>)).toThrowError(
          new TypeError(invalidGuardInput),
        );
        expect(adapterCalls).toBe(0);
      } finally {
        if (previous === undefined) {
          Reflect.deleteProperty(Object.prototype, "asGuard");
        } else {
          Object.defineProperty(Object.prototype, "asGuard", previous);
        }
      }
    });

    it("does not use the Proxy has trap to normalize an adapter", () => {
      const inner: Guard<number, number> = (n) => Effect.succeed(Option.some(n));
      let hasCalls = 0;
      const adapter = new Proxy(
        { asGuard: () => inner },
        {
          has: () => {
            hasCalls += 1;
            throw new Error("has trap invoked");
          },
        },
      );

      expect(getGuard(adapter)).toBe(inner);
      expect(hasCalls).toBe(0);
    });

    it("rejects an own non-callable asGuard property with a stable TypeError", () => {
      const invalid = { asGuard: 1 } as unknown as AsGuard<number, number>;

      expect(() => getGuard(invalid)).toThrowError(new TypeError(invalidGuardInput));
    });

    it("rejects an adapter that returns a non-function with a stable TypeError", () => {
      const invalid = { asGuard: () => 1 } as unknown as AsGuard<number, number>;

      expect(() => getGuard(invalid)).toThrowError(
        new TypeError("Expected asGuard() to return a Guard function"),
      );
    });

    it("preserves an error thrown by an adapter", () => {
      const error = new Error("adapter boom");
      const adapter: AsGuard<number, number> = {
        asGuard: () => {
          throw error;
        },
      };

      expect(() => getGuard(adapter)).toThrow(error);
    });
  });

  describe("liftPredicate", () => {
    it("does not evaluate the predicate until the Effect runs", async () => {
      let calls = 0;
      const g = liftPredicate((n: number) => {
        calls += 1;
        return n > 0;
      });

      const effect = g(1);
      expect(calls).toBe(0);
      await run(effect);
      expect(calls).toBe(1);
    });

    it("captures a throwing predicate as an Effect defect", async () => {
      const error = new Error("predicate boom");
      const g = liftPredicate((_n: number) => {
        throw error;
      });

      const exit = await Effect.runPromiseExit(g(1));
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.hasDies(exit.cause)).toBe(true);
        expect(Cause.squash(exit.cause)).toBe(error);
      }
    });

    it("returns Some when predicate holds", async () => {
      const g = liftPredicate((n: number) => n > 0);
      const result = await run(g(42));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(42);
    });

    it("returns None when predicate fails", async () => {
      const g = liftPredicate((n: number) => n > 0);
      const result = await run(g(-1));
      expect(Option.isNone(result)).toBe(true);
    });

    it("supports refinements (narrowing type)", async () => {
      const g = liftPredicate((s: string): s is `ok_${string}` => s.startsWith("ok_"));
      const result = await run(g("ok_foo"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe("ok_foo");
      const none = await run(g("nope"));
      expect(Option.isNone(none)).toBe(true);
    });
  });

  describe("pipe", () => {
    it("chains two guards: second runs on first output", async () => {
      const g1 = liftPredicate((n: number) => n >= 0);
      const g2 = liftPredicate((n: number) => n < 100);
      const chained = pipe(g1, g2);
      expect(await run(chained(50))).toEqual(Option.some(50));
      expect(await run(chained(150))).toEqual(Option.none());
    });

    it("returns None when first guard returns None", async () => {
      const g1 = liftPredicate((n: number) => n > 0);
      const g2 = liftPredicate((n: number) => n < 10);
      expect(await run(pipe(g1, g2)(-1))).toEqual(Option.none());
    });

    it("propagates failures from the first guard", async () => {
      const failing: Guard<number, number, "first"> = (n) =>
        n > 0 ? Effect.succeed(Option.some(n)) : Effect.fail("first");
      const second = liftPredicate((n: number) => n < 10);
      await expect(run(pipe(failing, second)(-1))).rejects.toBe("first");
    });

    it("propagates failures from the second guard", async () => {
      const first = liftPredicate((n: number) => n > 0);
      const failing: Guard<number, number, "second"> = (n) =>
        n < 10 ? Effect.succeed(Option.some(n)) : Effect.fail("second");
      await expect(run(pipe(first, failing)(20))).rejects.toBe("second");
    });

    it("normalizes AsGuard inputs in both positions", async () => {
      const adapter: AsGuard<number, number> = {
        asGuard: () => liftPredicate((n: number) => n > 0),
      };
      const chained = pipe(
        adapter,
        liftPredicate((n: number) => n < 10),
      );
      expect(await run(chained(5))).toEqual(Option.some(5));
      expect(await run(chained(20))).toEqual(Option.none());
    });

    it("executes a 25,000-stage chain without overflowing the JavaScript stack", async () => {
      const stage = liftPredicate((n: number) => n >= 0);
      let chained: Guard<number, number> = stage;
      for (let index = 0; index < 25_000; index++) {
        chained = pipe(chained, stage);
      }

      expect(await run(chained(1))).toEqual(Option.some(1));
    });
  });

  describe("map", () => {
    it("maps the output of a guard", async () => {
      expect(await run(map(positiveNumber, (n) => n * 2)(3))).toEqual(Option.some(6));
    });

    it("preserves None", async () => {
      expect(await run(map(positiveNumber, (n) => n * 2)(-1))).toEqual(Option.none());
    });

    it("executes a 25,000-stage chain without overflowing the JavaScript stack", async () => {
      let mapped: Guard<number, number> = liftPredicate((n: number) => n >= 0);
      for (let index = 0; index < 25_000; index++) {
        mapped = map(mapped, (n) => n + 1);
      }

      expect(await run(mapped(0))).toEqual(Option.some(25_000));
    });
  });

  describe("mapEffect", () => {
    it("maps output with an Effect", async () => {
      const base = liftPredicate((s: string) => s.length > 0);
      expect(await run(mapEffect(base, (s) => Effect.succeed(s.toUpperCase()))("hello"))).toEqual(
        Option.some("HELLO"),
      );
    });

    it("preserves None", async () => {
      expect(await run(mapEffect(positiveNumber, (n) => Effect.succeed(n * 2))(-1))).toEqual(
        Option.none(),
      );
    });

    it("fails when the effect fails", async () => {
      const g = mapEffect(positiveNumber, (n) =>
        n > 10 ? Effect.fail("too big" as const) : Effect.succeed(n),
      );
      await expect(run(g(20))).rejects.toBe("too big");
    });
  });

  describe("tap", () => {
    it("runs an Effect side effect and returns the original value", async () => {
      let side = 0;
      const g = tap(positiveNumber, (n) =>
        Effect.sync(() => {
          side = n;
        }),
      );
      expect(await run(g(7))).toEqual(Option.some(7));
      expect(side).toBe(7);
    });

    it("accepts a void callback", async () => {
      let side = 0;
      const g = tap(positiveNumber, (n) => {
        side = n;
      });
      expect(await run(g(7))).toEqual(Option.some(7));
      expect(side).toBe(7);
    });

    it("preserves None without running the side effect", async () => {
      let side = 0;
      const g = tap(positiveNumber, (n) => {
        side = n;
      });
      expect(await run(g(-1))).toEqual(Option.none());
      expect(side).toBe(0);
    });
  });

  describe("filter", () => {
    it("narrows the output when given a refinement predicate", async () => {
      type Positive = number & { readonly Positive: unique symbol };
      const base = liftPredicate((n: number) => n >= 0);
      const positive: Guard<number, Positive> = filter(base, (n: number): n is Positive => n > 0);
      const result = await run(positive(50));
      expect(Option.isSome(result)).toBe(true);
    });

    it("keeps output when predicate holds", async () => {
      const base = liftPredicate((n: number) => n >= 0);
      expect(await run(filter(base, (n) => n < 100)(50))).toEqual(Option.some(50));
    });

    it("returns None when predicate fails", async () => {
      const base = liftPredicate((n: number) => n >= 0);
      expect(await run(filter(base, (n) => n < 100)(200))).toEqual(Option.none());
    });

    it("returns None when the base guard returns None", async () => {
      const base = liftPredicate((n: number) => n >= 0);
      expect(await run(filter(base, (n) => n < 100)(-1))).toEqual(Option.none());
    });
  });

  describe("filterMap", () => {
    const evenHalf = filterMap(positiveNumber, (n) =>
      n % 2 === 0 ? Option.some(n / 2) : Option.none(),
    );

    it("transforms to Some when f returns Some", async () => {
      expect(await run(evenHalf(4))).toEqual(Option.some(2));
    });

    it("returns None when f returns None", async () => {
      expect(await run(evenHalf(3))).toEqual(Option.none());
    });

    it("returns None when the base guard returns None", async () => {
      expect(await run(evenHalf(-1))).toEqual(Option.none());
    });
  });

  describe("any", () => {
    const trackedGuard =
      (name: PropertyKey, calls: Array<PropertyKey>, matches: boolean): Guard<number, number> =>
      (input) =>
        Effect.sync(() => {
          calls.push(name);
          return matches ? Option.some(input) : Option.none();
        });

    it("returns None for an empty candidate map", async () => {
      const guards: Readonly<Record<string, Guard<number, number>>> = {};
      expect(await run(any(guards)(1))).toEqual(Option.none());
    });

    it("short-circuits after the first successful candidate", async () => {
      const calls: Array<PropertyKey> = [];
      const g = any({
        first: trackedGuard("first", calls, true),
        second: trackedGuard("second", calls, true),
      });

      expect(await run(g(1))).toEqual(Option.some({ _tag: "first", value: 1 }));
      expect(calls).toEqual(["first"]);
    });

    it("uses ECMAScript integer-like and string key order", async () => {
      const calls: Array<PropertyKey> = [];
      const g = any({
        10: trackedGuard("10", calls, false),
        2: trackedGuard("2", calls, false),
        first: trackedGuard("first", calls, false),
        second: trackedGuard("second", calls, true),
      });

      expect(await run(g(1))).toEqual(Option.some({ _tag: "second", value: 1 }));
      expect(calls).toEqual(["2", "10", "first", "second"]);
    });

    it("ignores inherited and non-enumerable candidates", async () => {
      const calls: Array<PropertyKey> = [];
      const guards = Object.create({ inherited: trackedGuard("inherited", calls, true) }) as Record<
        string,
        Guard<number, number>
      >;
      Object.defineProperty(guards, "hidden", {
        enumerable: false,
        value: trackedGuard("hidden", calls, true),
      });
      guards.visible = trackedGuard("visible", calls, true);

      expect(await run(any(guards)(1))).toEqual(Option.some({ _tag: "visible", value: 1 }));
      expect(calls).toEqual(["visible"]);
    });

    it("runs an own enumerable symbol-only candidate", async () => {
      const symbol = Symbol("symbol-only");
      const calls: Array<PropertyKey> = [];
      const g = any({ [symbol]: trackedGuard(symbol, calls, true) });

      expect(await run(g(1))).toEqual(Option.some({ _tag: symbol, value: 1 }));
      expect(calls).toEqual([symbol]);
    });

    it("runs strings before symbols and preserves order within each group", async () => {
      const firstSymbol = Symbol("first");
      const secondSymbol = Symbol("second");
      const calls: Array<PropertyKey> = [];
      const guards: Record<PropertyKey, Guard<number, number>> = {};
      guards[firstSymbol] = trackedGuard(firstSymbol, calls, false);
      guards.normal = trackedGuard("normal", calls, false);
      guards[secondSymbol] = trackedGuard(secondSymbol, calls, true);
      const g = any(guards);

      expect(await run(g(1))).toEqual(Option.some({ _tag: secondSymbol, value: 1 }));
      expect(calls).toEqual(["normal", firstSymbol, secondSymbol]);
    });

    it("returns first matching guard result with _tag and value", async () => {
      const guards = {
        num: liftPredicate((x: number) => typeof x === "number" && x >= 0),
        str: liftPredicate((x: string) => typeof x === "string" && x.length > 0),
      };
      const g = any(guards);
      const numResult = await run(g(42 as number | string));
      expect(Option.isSome(numResult)).toBe(true);
      if (Option.isSome(numResult)) {
        expect(numResult.value._tag).toBe("num");
        expect(numResult.value.value).toBe(42);
      }
      const strResult = await run(g("hi" as number | string));
      expect(Option.isSome(strResult)).toBe(true);
      if (Option.isSome(strResult)) {
        expect(strResult.value._tag).toBe("str");
        expect(strResult.value.value).toBe("hi");
      }
    });

    it("returns None when no guard matches", async () => {
      const guards = {
        pos: liftPredicate((n: number) => n > 0),
        neg: liftPredicate((n: number) => n < 0),
      };
      const g = any(guards);
      const result = await run(g(0));
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe("catchAll", () => {
    it("recovers from failure with a value", async () => {
      const failing: Guard<number, number, string> = (n) =>
        n > 0 ? Effect.succeed(Option.some(n)) : Effect.fail("negative");
      const g = catchAll(failing, () => Effect.succeed(0));
      expect(await run(g(5))).toEqual(Option.some(5));
      expect(await run(g(-1))).toEqual(Option.some(0));
    });

    it("preserves None without running recovery", async () => {
      const none: Guard<number, number, string> = () => Effect.succeedNone;
      let recoveryCalls = 0;
      const g = catchAll(none, () => {
        recoveryCalls += 1;
        return Effect.succeed(0);
      });

      expect(await run(g(1))).toEqual(Option.none());
      expect(recoveryCalls).toBe(0);
    });

    it("does not recover defects", async () => {
      const defect = new Error("defect");
      const defective: Guard<number, never> = () => Effect.die(defect);
      const exit = await Effect.runPromiseExit(
        catchAll(defective, () => Effect.succeed("ordinary recovery"))(1),
      );

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.hasDies(exit.cause)).toBe(true);
      }
    });
  });

  describe("catch", () => {
    it("is an alias for catchAll", async () => {
      const failing: Guard<number, never, string> = () => Effect.fail("failed");
      expect(await run(catch_(failing, () => Effect.succeed("alias"))(1))).toEqual(
        Option.some("alias"),
      );
    });
  });

  describe("catchCause", () => {
    it("recovers typed failures and defects from the full cause", async () => {
      const failing: Guard<number, never, string> = () => Effect.fail("failed");
      const defect = new Error("defect");
      const defective: Guard<number, never> = () => Effect.die(defect);

      expect(await run(catchCause(failing, () => Effect.succeed("typed"))(1))).toEqual(
        Option.some("typed"),
      );
      expect(
        await run(catchCause(defective, (cause) => Effect.succeed(Cause.squash(cause)))(1)),
      ).toEqual(Option.some(defect));
    });
  });

  describe("catchTag", () => {
    it("catches tagged errors", async () => {
      type E = { _tag: "Bad"; n: number } | { _tag: "Other" };
      const failing: Guard<number, number, E> = (n) =>
        n >= 0 ? Effect.succeed(Option.some(n)) : Effect.fail({ _tag: "Bad" as const, n });
      const g = catchTag(failing, "Bad", (e) => Effect.succeed(-e.n));
      const ok = await run(g(3));
      expect(Option.isSome(ok)).toBe(true);
      if (Option.isSome(ok)) expect(ok.value).toBe(3);
      const recovered = await run(g(-10));
      expect(Option.isSome(recovered)).toBe(true);
      if (Option.isSome(recovered)) expect(recovered.value).toBe(10);
    });

    it("catches any selected tag from a non-empty tag array", async () => {
      type E = { _tag: "Bad" } | { _tag: "Other" } | { _tag: "Remaining" };
      const failing: Guard<"Bad" | "Other", never, E> = (tag) => Effect.fail({ _tag: tag });
      const g = catchTag(failing, ["Bad", "Other"], (error) =>
        Effect.succeed(error._tag.toLowerCase()),
      );

      expect(await run(g("Bad"))).toEqual(Option.some("bad"));
      expect(await run(g("Other"))).toEqual(Option.some("other"));
    });

    it("propagates errors whose tag is not selected", async () => {
      type E = { _tag: "Bad"; n: number } | { _tag: "Other" };
      const failing: Guard<number, number, E> = () => Effect.fail({ _tag: "Other" });
      const g = catchTag(failing, "Bad", (error) => Effect.succeed(-error.n));
      await expect(run(g(1))).rejects.toEqual({ _tag: "Other" });
    });
  });

  describe("fromSchemaDecode / fromSchemaEncode", () => {
    // @effect-diagnostics-next-line schemaNumber:off -- this block characterizes NumberFromString's non-finite behavior
    const NumberFromString = Schema.NumberFromString;

    it("fromSchemaDecode passes decoded value as Some", async () => {
      const g = fromSchemaDecode(NumberFromString);
      const result = await run(g("42"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe(42);
    });

    it("fromSchemaDecode returns Some(NaN) for non-numeric string (NumberFromString behavior)", async () => {
      const g = fromSchemaDecode(NumberFromString);
      const result = await run(g("not a number"));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(Number.isNaN(result.value)).toBe(true);
    });

    it("fromSchemaDecode keeps schema failures in the error channel", async () => {
      const g = fromSchemaDecode(Schema.FiniteFromString);
      const exit = await Effect.runPromiseExit(g("not finite"));
      expect(exit._tag).toBe("Failure");
    });

    it("fromSchemaEncode passes encoded value as Some", async () => {
      const g = fromSchemaEncode(NumberFromString);
      const result = await run(g(42));
      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) expect(result.value).toBe("42");
    });
  });

  describe("decode / encode", () => {
    const NumberFromString = Schema.FiniteFromString;

    it("decode has equivalent data-first and data-last behavior", async () => {
      const base = liftPredicate((s: string) => s.length > 0);
      const dataFirst = decode(base, NumberFromString);
      const dataLast = decode(NumberFromString)(base);
      const [dataFirstResult, dataLastResult] = await Promise.all([
        run(dataFirst("99")),
        run(dataLast("99")),
      ]);
      expect(dataFirstResult).toEqual(Option.some(99));
      expect(dataLastResult).toEqual(Option.some(99));
    });

    it("encode has equivalent data-first and data-last behavior", async () => {
      const base = liftPredicate((n: number) => n >= 0);
      const dataFirst = encode(base, NumberFromString);
      const dataLast = encode(NumberFromString)(base);
      const [dataFirstResult, dataLastResult] = await Promise.all([
        run(dataFirst(17)),
        run(dataLast(17)),
      ]);
      expect(dataFirstResult).toEqual(Option.some("17"));
      expect(dataLastResult).toEqual(Option.some("17"));
    });

    it("keeps schema decode errors as Effect failures", async () => {
      const base = liftPredicate((s: string) => s.length > 0);
      const g = decode(base, Schema.FiniteFromString);
      const exit = await Effect.runPromise(Effect.exit(g("not finite")));
      expect(exit._tag).toBe("Failure");
    });
  });

  describe("let / addTag", () => {
    it("let attaches a property to the output", async () => {
      const base = map(positiveNumber, (n) => ({ n }));
      expect(await run(let_(base, "doubled", 0)(3))).toEqual(Option.some({ n: 3, doubled: 0 }));
    });

    it("let accepts an AsGuard in both dual forms", async () => {
      const adapter: AsGuard<number, { readonly value: number }> = {
        asGuard: () => (input) => Effect.succeed(Option.some({ value: input })),
      };

      expect(await run(let_(adapter, "phase", "first" as const)(1))).toEqual(
        Option.some({ value: 1, phase: "first" }),
      );
      expect(await run(let_("phase", "last" as const)(adapter)(2))).toEqual(
        Option.some({ value: 2, phase: "last" }),
      );
    });

    it("addTag attaches _tag to output", async () => {
      const base = map(positiveNumber, (n) => ({ value: n }));
      expect(await run(addTag(base, "Positive")(3))).toEqual(
        Option.some({ value: 3, _tag: "Positive" }),
      );
    });
  });

  describe("bindTo / bind", () => {
    it("bindTo names the output under a key", async () => {
      expect(await run(bindTo(positiveNumber, "value")(5))).toEqual(Option.some({ value: 5 }));
    });

    it("bindTo preserves None", async () => {
      expect(await run(bindTo(positiveNumber, "value")(-1))).toEqual(Option.none());
    });

    it("bind chains and merges object", async () => {
      const withA = bindTo(positiveNumber, "a");
      const g = bind(withA, "b", (ctx) => liftPredicate((n: number) => n < 10)(ctx.a));
      expect(await run(g(5))).toEqual(Option.some({ a: 5, b: 5 }));
      expect(await run(g(20))).toEqual(Option.none());
    });
  });

  describe("struct helpers", () => {
    it("copies own enumerable symbol properties into a plain object", async () => {
      const symbol = Symbol("phase");
      const base = map(
        liftPredicate((n: number) => n > 0),
        (n) => ({ n, [symbol]: n }),
      );
      const result = await run(let_(base, "phase", "ready" as const)(3));

      expect(result).toEqual(Option.some({ n: 3, [symbol]: 3, phase: "ready" }));
      expect(Object.getPrototypeOf(Option.getOrThrow(result))).toBe(Object.prototype);
    });

    it("does not copy non-enumerable properties", async () => {
      const base = map(
        liftPredicate((n: number) => n > 0),
        (n) => {
          const output = { n };
          Object.defineProperty(output, "hidden", { enumerable: false, value: n * 2 });
          return output;
        },
      );
      const result = await run(let_(base, "phase", "ready" as const)(3));

      expect(result).toEqual(Option.some({ n: 3, phase: "ready" }));
    });

    it("invokes enumerable getters while copying", async () => {
      let getterReads = 0;
      const base = map(
        liftPredicate((n: number) => n > 0),
        (n) => ({
          get derived() {
            getterReads += 1;
            return n * 2;
          },
        }),
      );
      const result = await run(let_(base, "phase", "ready" as const)(3));

      expect(getterReads).toBe(1);
      expect(result).toEqual(Option.some({ derived: 6, phase: "ready" }));
    });

    it("does not preserve class prototypes", async () => {
      class RecordOutput {
        readonly n = 3;
      }
      const base = map(
        liftPredicate((n: number) => n > 0),
        () => new RecordOutput(),
      );
      const result = await run(let_(base, "phase", "ready" as const)(3));

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(result.value).toEqual({ n: 3, phase: "ready" });
        expect(result.value).not.toBeInstanceOf(RecordOutput);
      }
    });

    it("defects when the output is an array", async () => {
      const base = map(
        liftPredicate((n: number) => n > 0),
        (n) => [n],
      );
      const g = let_(
        // @ts-expect-error struct helpers require object-record outputs
        base,
        "phase",
        "ready",
      );
      const exit = await Effect.runPromiseExit(g(3));

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.squash(exit.cause)).toEqual(new TypeError("Expected a guard object output"));
      }
    });

    it("defects when let collides with an existing key at runtime", async () => {
      const base = map(
        liftPredicate((n: number) => n > 0),
        (n) => ({ n }),
      );
      const g = let_(
        base,
        // @ts-expect-error struct helpers reject statically known key collisions
        "n",
        0,
      );
      const exit = await Effect.runPromiseExit(g(3));

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.squash(exit.cause)).toEqual(
          new TypeError("Guard output already contains key: n"),
        );
      }
    });

    it("defects when addTag collides with an existing _tag at runtime", async () => {
      const base = map(
        liftPredicate((n: number) => n > 0),
        (n) => ({ _tag: "Existing", n }),
      );
      const g = addTag(
        // @ts-expect-error struct helpers reject statically known _tag collisions
        base,
        "Again",
      );
      const exit = await Effect.runPromiseExit(g(3));

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.squash(exit.cause)).toEqual(
          new TypeError("Guard output already contains key: _tag"),
        );
      }
    });

    it("defects when bind collides with an existing key at runtime", async () => {
      const withValue = bindTo(
        liftPredicate((n: number) => n > 0),
        "value",
      );
      const always = map(
        liftPredicate(() => true),
        () => 7,
      );
      const g = bind(
        withValue,
        // @ts-expect-error struct helpers reject statically known key collisions
        "value",
        always,
      );
      const exit = await Effect.runPromiseExit(g(5));

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.squash(exit.cause)).toEqual(
          new TypeError("Guard output already contains key: value"),
        );
      }
    });
  });

  describe("provide", () => {
    const Foo = Context.Service<{ readonly n: number }>("Test/Foo");
    const guardNeedsFoo: Guard<number, number, never, Context.Service.Identifier<typeof Foo>> =
      Effect.fn((i) => Effect.map(Effect.service(Foo), (foo) => Option.some(i + foo.n)));

    it("provides services from a Context, Layer, value, or Effect", async () => {
      expect(await run(provide(guardNeedsFoo, Context.make(Foo, { n: 10 }))(1))).toEqual(
        Option.some(11),
      );
      expect(await run(provide(guardNeedsFoo, Layer.succeed(Foo, { n: 20 }))(1))).toEqual(
        Option.some(21),
      );
      expect(await run(provideService(guardNeedsFoo, Foo, { n: 30 })(1))).toEqual(Option.some(31));
      expect(
        await run(provideServiceEffect(guardNeedsFoo, Foo, Effect.succeed({ n: 40 }))(1)),
      ).toEqual(Option.some(41));
    });

    it("supports data-last forms for Context and Layer provision", async () => {
      expect(await run(provide(Context.make(Foo, { n: 10 }))(guardNeedsFoo)(1))).toEqual(
        Option.some(11),
      );
      expect(await run(provide(Layer.succeed(Foo, { n: 20 }))(guardNeedsFoo)(1))).toEqual(
        Option.some(21),
      );
    });
  });
});
