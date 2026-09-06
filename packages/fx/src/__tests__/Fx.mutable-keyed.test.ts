import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { Fx } from "../index.js";

describe("Fx.keyed mutable source arrays", () => {
  it("releases the old keyed entry when an emitted array is mutated in place", () =>
    Effect.gen(function* () {
      const active = new Set<string>();
      const values = [{ id: "a" }];
      const source = Fx.make<ReadonlyArray<{ readonly id: string }>>((sink) =>
        Effect.gen(function* () {
          yield* sink.onSuccess(values);
          yield* Effect.sleep(10);
          values[0] = { id: "b" };
          yield* sink.onSuccess(values);
        }),
      );
      const keyed = Fx.keyed(source, {
        getKey: (value) => value.id,
        onValue: (_ref, key) =>
          Fx.fromEffect(
            Effect.acquireRelease(
              Effect.sync(() => {
                active.add(key);
                return [...active].sort();
              }),
              () => Effect.sync(() => active.delete(key)),
            ),
          ),
      });

      const emissions = yield* keyed.pipe(Fx.take(2), Fx.collectAll);

      expect(emissions).toEqual([[["a"]], [["b"]]]);
    }).pipe(Effect.scoped, Effect.runPromise));
});
