import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx, Sink } from "../index.js";

describe("Fx", () => {
  describe("Service", () => {
    it("should allow defining an Fx as a Service", () =>
      Effect.gen(function* () {
        class MyFx extends Fx.Service<MyFx, number>()("MyFx") {}

        const layer = MyFx.make(Fx.succeed(42));

        const result = yield* Fx.collectAll(MyFx).pipe(Effect.provide(layer));
        expect(result).toEqual([42]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});

describe("Sink", () => {
  describe("Service", () => {
    it("should allow defining a Sink as a Service", () =>
      Effect.gen(function* () {
        class MySink extends Sink.Service<MySink, number>()("MySink") {}

        let value = 0;
        const layer = MySink.make(Effect.failCause, (n) => Effect.sync(() => (value += n)));

        yield* MySink.onSuccess(1).pipe(Effect.provide(layer));
        expect(value).toEqual(1);

        yield* MySink.onSuccess(2).pipe(Effect.provide(layer));
        expect(value).toEqual(3);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
