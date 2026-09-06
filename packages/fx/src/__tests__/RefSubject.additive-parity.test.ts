import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import * as Option from "effect/Option";
import { RefSubject } from "../index.js";

const fromNullableOption = <A>(v: A | null | undefined): Option.Option<NonNullable<A>> =>
  v === null || v === undefined ? Option.none() : Option.some(v as NonNullable<A>);

describe("RefSubject additive parity (fromOption, fromNullable, getOrElse)", () => {
  describe("fromOption", () => {
    it("creates RefSubject from Option.some", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromOption(Option.some(42));
        const value = yield* ref;
        expect(Option.isSome(value)).toBe(true);
        if (Option.isSome(value)) {
          expect(value.value).toBe(42);
        }
      }).pipe(Effect.scoped, Effect.runPromise));

    it("creates RefSubject from Option.none", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromOption(Option.none<number>());
        const value = yield* ref;
        expect(Option.isNone(value)).toBe(true);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("is writable (set/update)", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromOption(Option.some(1));
        yield* RefSubject.set(ref, Option.some(2));
        const value = yield* ref;
        expect(Option.isSome(value)).toBe(true);
        if (Option.isSome(value)) {
          expect(value.value).toBe(2);
        }
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("fromNullable", () => {
    it("creates RefSubject from non-null value", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromNullable("hello");
        const value = yield* ref;
        expect(Option.isSome(value)).toBe(true);
        if (Option.isSome(value)) {
          expect(value.value).toBe("hello");
        }
      }).pipe(Effect.scoped, Effect.runPromise));

    it("creates RefSubject from null", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromNullable<string>(null);
        const value = yield* ref;
        expect(Option.isNone(value)).toBe(true);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("creates RefSubject from undefined", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromNullable<number>(undefined);
        const value = yield* ref;
        expect(Option.isNone(value)).toBe(true);
      }).pipe(Effect.scoped, Effect.runPromise));
  });

  describe("getOrElse", () => {
    it("returns value for Computed<Option<A>> when Some", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromOption(Option.some(42));
        const withDefault = RefSubject.getOrElse(ref, () => 0);
        expect(yield* withDefault).toBe(42);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("returns fallback for Computed<Option<A>> when None", () =>
      Effect.gen(function* () {
        const ref = yield* RefSubject.fromNullable<number>(null);
        const withDefault = RefSubject.getOrElse(ref, () => 99);
        expect(yield* withDefault).toBe(99);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("getOrElse on Filtered uses fallback when no value", () =>
      Effect.gen(function* () {
        const numbers = yield* RefSubject.make([1, 3, 5]);
        const firstEven = RefSubject.filterMap(numbers, (arr) =>
          fromNullableOption(arr.find((n) => n % 2 === 0)),
        );
        const withDefault = RefSubject.getOrElse(firstEven, () => -1);
        expect(yield* withDefault).toBe(-1);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("getOrElse on Filtered returns value when present", () =>
      Effect.gen(function* () {
        const numbers = yield* RefSubject.make([1, 2, 3]);
        const firstEven = RefSubject.filterMap(numbers, (arr) =>
          fromNullableOption(arr.find((n) => n % 2 === 0)),
        );
        const withDefault = RefSubject.getOrElse(firstEven, () => -1);
        expect(yield* withDefault).toBe(2);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
