import { describe, expect, it } from "vitest";
import { Effect, Fiber, Layer } from "effect";
import { Fx, Push, Sink, Subject } from "../index.js";

describe("Push", () => {
  describe("Service", () => {
    it("should allow defining a Push as a Service", () =>
      Effect.gen(function* () {
        class MyPush extends Push.Service<MyPush, number, never, string, never>()("MyPush") {}

        const layer = Layer.unwrap(
          Effect.gen(function* () {
            const subject = yield* Subject.make<string>();
            const sink = Sink.map(subject, String.fromCharCode);
            return MyPush.make(sink, subject);
          }),
        );

        yield* Effect.gen(function* () {
          const fiber = yield* Fx.collectUpToFork(MyPush, 3);
          yield* Effect.forEach(["f", "o", "o"], (char) => MyPush.onSuccess(char.charCodeAt(0)));
          expect(yield* Fiber.join(fiber)).toEqual(["f", "o", "o"]);
        }).pipe(Effect.provide(layer));
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
