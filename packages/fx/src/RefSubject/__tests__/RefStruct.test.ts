import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as RefStruct from "../RefStruct.js";

describe("RefStruct", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const value = { name: "John", age: 30 };
      const ref = yield* RefStruct.make(value);
      const current = yield* ref;
      expect(current).toEqual(value);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("sets a property", () =>
    Effect.gen(function* () {
      const ref = yield* RefStruct.make({ name: "John", age: 30 });
      yield* RefStruct.set(ref, "age", 31);
      const result = yield* ref;
      expect(result.age).toBe(31);
      expect(result.name).toBe("John");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("updates a property", () =>
    Effect.gen(function* () {
      const ref = yield* RefStruct.make({ name: "John", age: 30 });
      yield* RefStruct.update(ref, "age", (n) => n + 1);
      const result = yield* ref;
      expect(result.age).toBe(31);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("merges structs", () =>
    Effect.gen(function* () {
      const ref = yield* RefStruct.make({ name: "John", age: 30 });
      yield* RefStruct.merge(ref, { age: 31, city: "NYC" });
      const result = yield* ref;
      expect(result.age).toBe(31);
      expect(result.name).toBe("John");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets a property", () =>
    Effect.gen(function* () {
      const ref = yield* RefStruct.make({ name: "John", age: 30 });
      const name = yield* RefStruct.get(ref, "name");
      expect(name).toBe("John");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("gets keys", () =>
    Effect.gen(function* () {
      const ref = yield* RefStruct.make({ name: "John", age: 30 });
      const keys = yield* RefStruct.keys(ref);
      expect(keys.sort()).toEqual(["age", "name"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks size", () =>
    Effect.gen(function* () {
      const ref = yield* RefStruct.make({ name: "John", age: 30 });
      const size = yield* RefStruct.size(ref);
      expect(size).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise));
});
