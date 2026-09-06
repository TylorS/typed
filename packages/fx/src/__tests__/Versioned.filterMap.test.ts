import { describe, expect, it } from "vitest";
import { Effect, Option } from "effect";
import * as Fx from "../Fx/index.js";
import * as Versioned from "../Versioned.js";

describe("Versioned filterMap / filterMapEffect", () => {
  const evenOption = (n: number) => (n % 2 === 0 ? Option.some(n) : Option.none<number>());

  describe("filterMap", () => {
    it("filters Fx and maps Effect to Option (Some when matched)", () =>
      Effect.gen(function* () {
        const v = Versioned.of(8);
        const filtered = Versioned.filterMap(v, {
          onFx: evenOption,
          onEffect: evenOption,
        });
        expect(yield* filtered).toEqual(Option.some(8));
        expect(yield* Fx.collectAll(filtered)).toEqual([8]);
      }).pipe(Effect.runPromise));

    it("filters Fx and maps Effect to Option (None when not matched)", () =>
      Effect.gen(function* () {
        const v = Versioned.of(7);
        const filtered = Versioned.filterMap(v, {
          onFx: evenOption,
          onEffect: evenOption,
        });
        expect(yield* filtered).toEqual(Option.none());
        expect(yield* Fx.collectAll(filtered)).toEqual([]);
      }).pipe(Effect.runPromise));

    it("supports curried form", () =>
      Effect.gen(function* () {
        const filtered = Versioned.of(10).pipe(
          Versioned.filterMap({
            onFx: evenOption,
            onEffect: evenOption,
          })
        );
        expect(yield* filtered).toEqual(Option.some(10));
        expect(yield* Fx.collectAll(filtered)).toEqual([10]);
      }).pipe(Effect.runPromise));

    it("can map to different types on Fx vs Effect", () =>
      Effect.gen(function* () {
        const v = Versioned.of(3);
        const filtered = Versioned.filterMap(v, {
          onFx: (n) => (n > 0 ? Option.some(String(n)) : Option.none()),
          onEffect: (n) => (n > 0 ? Option.some(n + 1) : Option.none()),
        });
        expect(yield* filtered).toEqual(Option.some(4));
        expect(yield* Fx.collectAll(filtered)).toEqual(["3"]);
      }).pipe(Effect.runPromise));
  });

  describe("filterMapEffect", () => {
    it("effectful filterMap on Fx and Effect (Some when matched)", () =>
      Effect.gen(function* () {
        const v = Versioned.of(4);
        const filtered = Versioned.filterMapEffect(v, {
          onFx: (n) => Effect.succeed(evenOption(n)),
          onEffect: (n) => Effect.succeed(evenOption(n)),
        });
        expect(yield* filtered).toEqual(Option.some(4));
        expect(yield* Fx.collectAll(filtered)).toEqual([4]);
      }).pipe(Effect.runPromise));

    it("effectful filterMap (None when not matched)", () =>
      Effect.gen(function* () {
        const v = Versioned.of(5);
        const filtered = Versioned.filterMapEffect(v, {
          onFx: (n) => Effect.succeed(evenOption(n)),
          onEffect: (n) => Effect.succeed(evenOption(n)),
        });
        expect(yield* filtered).toEqual(Option.none());
        expect(yield* Fx.collectAll(filtered)).toEqual([]);
      }).pipe(Effect.runPromise));

    it("supports curried form", () =>
      Effect.gen(function* () {
        const filterEven = Versioned.filterMapEffect({
          onFx: (n: number) => Effect.succeed(evenOption(n)),
          onEffect: (n: number) => Effect.succeed(evenOption(n)),
        });
        const v = Versioned.of(6);
        const filtered = filterEven(v);
        expect(yield* filtered).toEqual(Option.some(6));
        expect(yield* Fx.collectAll(filtered)).toEqual([6]);
      }).pipe(Effect.runPromise));
  });
});
