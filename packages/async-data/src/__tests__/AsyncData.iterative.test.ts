import * as Cause from "effect/Cause";
import { describe, expect, it } from "vitest";
import * as AsyncData from "../index.js";

const DEPTH = 20_000;

function nest<E>(base: AsyncData.AsyncData<number, E>): AsyncData.AsyncData<number, E> {
  let current = base;
  for (let value = 1; value <= DEPTH; value++) {
    current = AsyncData.optimistic(current, value);
  }
  return current;
}

function unwrap<A, E>(data: AsyncData.AsyncData<A, E>) {
  let current = data;
  let depth = 0;
  while (AsyncData.isOptimistic(current)) {
    current = current.previous;
    depth++;
  }
  return { base: current, depth };
}

describe("AsyncData iterative optimistic traversal", () => {
  it("startLoading handles a 20k history and preserves its values", () => {
    const progress = { loaded: 1, total: 2 };
    const result = AsyncData.startLoading(nest(AsyncData.success(0)), progress);

    expect(AsyncData.isOptimistic(result)).toBe(true);
    if (!AsyncData.isOptimistic(result)) return;
    expect(result.value).toBe(DEPTH);
    expect(AsyncData.isPending(result)).toBe(true);
    const unwrapped = unwrap(result);
    expect(unwrapped.depth).toBe(DEPTH);
    expect(AsyncData.isSuccess(unwrapped.base)).toBe(true);
    if (!AsyncData.isSuccess(unwrapped.base)) return;
    expect(unwrapped.base).toEqual(AsyncData.success(0, progress));
  });

  it("stopLoading handles a 20k history and removes base progress", () => {
    const result = AsyncData.stopLoading(nest(AsyncData.success(0, { loaded: 1, total: 2 })));

    expect(AsyncData.isOptimistic(result)).toBe(true);
    if (!AsyncData.isOptimistic(result)) return;
    expect(result.value).toBe(DEPTH);
    const unwrapped = unwrap(result);
    expect(unwrapped.depth).toBe(DEPTH);
    expect(unwrapped.base).toEqual(AsyncData.success(0));
  });

  it("map handles a 20k history in deepest-to-outer callback order", () => {
    const visited: Array<number> = [];
    const result = AsyncData.map(nest(AsyncData.success(0)), (value) => {
      visited.push(value);
      return value + 1;
    });

    expect(visited.slice(0, 3)).toEqual([0, 1, 2]);
    expect(visited.at(-1)).toBe(DEPTH);
    expect(visited).toHaveLength(DEPTH + 1);
    expect(AsyncData.isOptimistic(result)).toBe(true);
    if (!AsyncData.isOptimistic(result)) return;
    expect(result.value).toBe(DEPTH + 1);
    const unwrapped = unwrap(result);
    expect(unwrapped.depth).toBe(DEPTH);
    expect(unwrapped.base).toEqual(AsyncData.success(1));
  });

  it("mapError handles a 20k history and preserves optimistic values", () => {
    const base: AsyncData.AsyncData<number, string> = AsyncData.failure(Cause.fail("failure"));
    const result = AsyncData.mapError(nest(base), (error) => error.toUpperCase());

    expect(AsyncData.isOptimistic(result)).toBe(true);
    if (!AsyncData.isOptimistic(result)) return;
    expect(result.value).toBe(DEPTH);
    const unwrapped = unwrap(result);
    expect(unwrapped.depth).toBe(DEPTH);
    expect(AsyncData.isFailure(unwrapped.base)).toBe(true);
    if (!AsyncData.isFailure(unwrapped.base)) return;
    expect(unwrapped.base.cause.reasons).toEqual([Cause.makeFailReason("FAILURE")]);
  });

  it("preserves unaffected-variant identity and rebuilds traversed values", () => {
    const noData = AsyncData.NoData;
    const loading = AsyncData.loading();
    const success = AsyncData.success(1);
    const failure = AsyncData.failure(Cause.fail("failure"));
    const optimistic = AsyncData.optimistic(success, 2);

    expect(AsyncData.stopLoading(noData)).toBe(noData);
    expect(AsyncData.stopLoading(loading)).toBe(loading);
    expect(AsyncData.map(noData, String)).toBe(noData);
    expect(AsyncData.map(loading, String)).toBe(loading);
    expect(AsyncData.map(failure, String)).toBe(failure);
    expect(AsyncData.mapError(noData, String)).toBe(noData);
    expect(AsyncData.mapError(loading, String)).toBe(loading);
    expect(AsyncData.mapError(success, String)).toBe(success);

    expect(AsyncData.startLoading(success)).not.toBe(success);
    expect(AsyncData.stopLoading(success)).not.toBe(success);
    expect(AsyncData.map(success, String)).not.toBe(success);
    expect(AsyncData.mapError(failure, String)).not.toBe(failure);
    expect(AsyncData.startLoading(optimistic)).not.toBe(optimistic);
    expect(AsyncData.stopLoading(optimistic)).not.toBe(optimistic);
    expect(AsyncData.map(optimistic, String)).not.toBe(optimistic);
    expect(AsyncData.mapError(optimistic, String)).not.toBe(optimistic);
  });

  it.each([
    ["startLoading", (data: AsyncData.AsyncData<number, string>) => AsyncData.startLoading(data)],
    ["stopLoading", (data: AsyncData.AsyncData<number, string>) => AsyncData.stopLoading(data)],
    ["map", (data: AsyncData.AsyncData<number, string>) => AsyncData.map(data, String)],
    ["mapError", (data: AsyncData.AsyncData<number, string>) => AsyncData.mapError(data, String)],
  ])("%s rejects a cyclic optimistic history", (_, transform) => {
    const cyclic: { _tag: "Optimistic"; value: number; previous?: unknown } = {
      _tag: "Optimistic",
      value: 1,
    };
    cyclic.previous = cyclic;

    expect(() => transform(cyclic as unknown as AsyncData.AsyncData<number, string>)).toThrowError(
      new TypeError("Cyclic Optimistic history"),
    );
  });
});
