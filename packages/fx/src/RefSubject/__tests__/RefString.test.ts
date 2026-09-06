import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as RefString from "../RefString.js";

describe("RefString", () => {
  it("creates and gets value", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("hello");
      const current = yield* ref;
      expect(current).toBe("hello");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("concatenates strings", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("hello");
      const result = yield* RefString.concat(ref, " world");
      expect(result).toBe("hello world");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("converts to uppercase", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("hello");
      const result = yield* RefString.toUpperCase(ref);
      expect(result).toBe("HELLO");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("converts to lowercase", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("HELLO");
      const result = yield* RefString.toLowerCase(ref);
      expect(result).toBe("hello");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("trims whitespace", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("  hello  ");
      const result = yield* RefString.trim(ref);
      expect(result).toBe("hello");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks if empty", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("");
      const isEmpty = yield* RefString.isEmpty(ref);
      expect(isEmpty).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks length", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("hello");
      const length = yield* RefString.length(ref);
      expect(length).toBe(5);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("checks startsWith", () =>
    Effect.gen(function* () {
      const ref = yield* RefString.make("hello");
      const startsWith = yield* RefString.startsWith(ref, "he");
      expect(startsWith).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));
});
