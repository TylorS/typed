import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "../index.js";
import * as Context from "effect/Context";

const Foo = Context.Service<{ readonly n: number }>("Test/Foo");

describe("Fx provideService", () => {
  it("provides a single service and Fx can use it", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]).pipe(
        Fx.mapEffect((x) =>
          Effect.gen(function* () {
            const foo = yield* Foo;
            return x + foo.n;
          }),
        ),
        Fx.provideService(Foo, { n: 10 }),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [11, 12, 13]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("provideService(tag, service) curried form", () =>
    Effect.gen(function* () {
      const withFoo = Fx.provideService(Foo, { n: 1 });
      const fx = Fx.fromIterable([0]).pipe(
        Fx.mapEffect((x) =>
          Effect.gen(function* () {
            const f = yield* Foo;
            return x + f.n;
          }),
        ),
        withFoo,
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [1]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

describe("Fx provideServiceEffect", () => {
  it("provides a service from an effect and Fx can use it", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2]).pipe(
        Fx.mapEffect((x) =>
          Effect.gen(function* () {
            const foo = yield* Foo;
            return x + foo.n;
          }),
        ),
        Fx.provideServiceEffect(Foo, Effect.succeed({ n: 100 })),
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [101, 102]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("provideServiceEffect runs the effect when the stream runs (service effect can have requirements)", () =>
    Effect.gen(function* () {
      let built = false;
      const makeFoo = Effect.sync(() => {
        built = true;
        return { n: 7 };
      });
      const fx = Fx.fromIterable([0]).pipe(
        Fx.mapEffect((x) =>
          Effect.gen(function* () {
            const f = yield* Foo;
            return x + f.n;
          }),
        ),
        Fx.provideServiceEffect(Foo, makeFoo),
      );
      assert.strictEqual(built, false);
      const result = yield* Fx.collectAll(fx);
      assert.strictEqual(built, true);
      assert.deepStrictEqual(result, [7]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("provideServiceEffect(tag, effect) curried form", () =>
    Effect.gen(function* () {
      const withFooFromEffect = Fx.provideServiceEffect(Foo, Effect.succeed({ n: 5 }));
      const fx = Fx.fromIterable([0]).pipe(
        Fx.mapEffect((x) =>
          Effect.gen(function* () {
            const f = yield* Foo;
            return x + f.n;
          }),
        ),
        withFooFromEffect,
      );
      const result = yield* Fx.collectAll(fx);
      assert.deepStrictEqual(result, [5]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
