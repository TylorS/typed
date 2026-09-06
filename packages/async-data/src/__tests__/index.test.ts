import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import * as Option from "effect/Option";
import * as Result from "effect/Result";
import { describe, expect, it } from "vitest";
import * as AsyncData from "../index.js";

function assert<T, U extends T>(value: T, guard: (v: T) => v is U): asserts value is U {
  if (!guard(value)) throw new Error("Assertion failed");
}

describe("AsyncData", () => {
  describe("constructors", () => {
    it("NoData", () => {
      const data = AsyncData.NoData;
      assert(data, AsyncData.isNoData);
      expect(data._tag).toBe("NoData");
    });

    it("loading without progress", () => {
      const data = AsyncData.loading();
      assert(data, AsyncData.isLoading);
      expect(data._tag).toBe("Loading");
      expect(data.progress).toBeUndefined();
    });

    it("loading with progress", () => {
      const progress = { loaded: 50, total: 100 };
      const data = AsyncData.loading(progress);
      assert(data, AsyncData.isLoading);
      expect(data.progress?.loaded).toBe(50);
      expect(data.progress?.total).toBe(100);
    });

    it("success without progress", () => {
      const data = AsyncData.success(42);
      assert(data, AsyncData.isSuccess);
      expect(data._tag).toBe("Success");
      expect(data.value).toBe(42);
      expect(data.progress).toBeUndefined();
    });

    it("success with progress", () => {
      const progress = { loaded: 75, total: 100 };
      const data = AsyncData.success(42, progress);
      assert(data, AsyncData.isSuccess);
      expect(data.value).toBe(42);
      expect(data.progress?.loaded).toBe(75);
      expect(data.progress?.total).toBe(100);
    });

    it("failure without progress", () => {
      const cause = Cause.fail("error");
      const data = AsyncData.failure(cause);
      assert(data, AsyncData.isFailure);
      expect(data._tag).toBe("Failure");
      expect(data.cause).toBe(cause);
      expect(data.progress).toBeUndefined();
    });

    it("failure with progress", () => {
      const cause = Cause.fail("error");
      const progress = { loaded: 25 };
      const data = AsyncData.failure(cause, progress);
      assert(data, AsyncData.isFailure);
      expect(data.progress?.loaded).toBe(25);
      expect(data.progress?.total).toBeUndefined();
    });

    it("optimistic", () => {
      const previous = AsyncData.success(10);
      const data = AsyncData.optimistic(previous, 20);
      assert(data, AsyncData.isOptimistic);
      expect(data._tag).toBe("Optimistic");
      expect(data.value).toBe(20);
      expect(data.previous).toBe(previous);
    });
  });

  describe("type guards", () => {
    it("isNoData", () => {
      const noData = AsyncData.NoData;
      assert(noData, AsyncData.isNoData);
      expect(noData._tag).toBe("NoData");
      expect(AsyncData.isNoData(AsyncData.loading())).toBe(false);
      expect(AsyncData.isNoData(AsyncData.success(1))).toBe(false);
    });

    it("isLoading", () => {
      const loadingData = AsyncData.loading();
      assert(loadingData, AsyncData.isLoading);
      expect(loadingData._tag).toBe("Loading");
      expect(AsyncData.isLoading(AsyncData.NoData)).toBe(false);
      expect(AsyncData.isLoading(AsyncData.success(1))).toBe(false);
    });

    it("isSuccess", () => {
      const successData = AsyncData.success(1);
      assert(successData, AsyncData.isSuccess);
      expect(successData.value).toBe(1);
      expect(AsyncData.isSuccess(AsyncData.NoData)).toBe(false);
      expect(AsyncData.isSuccess(AsyncData.loading())).toBe(false);
    });

    it("isFailure", () => {
      const cause = Cause.fail("error");
      const failureData = AsyncData.failure(cause);
      assert(failureData, AsyncData.isFailure);
      expect(failureData.cause).toBe(cause);
      expect(AsyncData.isFailure(AsyncData.NoData)).toBe(false);
      expect(AsyncData.isFailure(AsyncData.success(1))).toBe(false);
    });

    it("isOptimistic", () => {
      const previous = AsyncData.success(10);
      const data = AsyncData.optimistic(previous, 20);
      assert(data, AsyncData.isOptimistic);
      expect(data.value).toBe(20);
      expect(data.previous).toBe(previous);
      expect(AsyncData.isOptimistic(AsyncData.NoData)).toBe(false);
      expect(AsyncData.isOptimistic(AsyncData.success(1))).toBe(false);
    });

    it("isAsyncData", () => {
      expect(AsyncData.isAsyncData(AsyncData.NoData)).toBe(true);
      expect(AsyncData.isAsyncData(AsyncData.loading())).toBe(true);
      expect(AsyncData.isAsyncData(AsyncData.success(1))).toBe(true);
      expect(AsyncData.isAsyncData(AsyncData.failure(Cause.fail("error")))).toBe(true);
      expect(
        AsyncData.isAsyncData(AsyncData.optimistic(AsyncData.success(1), 2)),
      ).toBe(true);
      expect(AsyncData.isAsyncData(null)).toBe(false);
      expect(AsyncData.isAsyncData({})).toBe(false);
      expect(AsyncData.isAsyncData({ _tag: "Invalid" })).toBe(false);
    });

    it("isRefreshing", () => {
      const progress = { loaded: 50 };
      const successWithProgress = AsyncData.success(1, progress);
      const failureWithProgress = AsyncData.failure(Cause.fail("error"), progress);
      assert(successWithProgress, AsyncData.isSuccess);
      expect(AsyncData.isRefreshing(successWithProgress)).toBe(true);
      expect(successWithProgress.progress?.loaded).toBe(50);
      assert(failureWithProgress, AsyncData.isFailure);
      expect(AsyncData.isRefreshing(failureWithProgress)).toBe(true);
      expect(AsyncData.isRefreshing(AsyncData.success(1))).toBe(false);
      expect(AsyncData.isRefreshing(AsyncData.loading())).toBe(false);
    });

    it("isPending", () => {
      const loadingData = AsyncData.loading();
      assert(loadingData, AsyncData.isLoading);
      expect(AsyncData.isPending(loadingData)).toBe(true);
      const progress = { loaded: 50 };
      const successRefreshing = AsyncData.success(1, progress);
      assert(successRefreshing, AsyncData.isSuccess);
      expect(AsyncData.isPending(successRefreshing)).toBe(true);
      const failureRefreshing = AsyncData.failure(Cause.fail("error"), progress);
      assert(failureRefreshing, AsyncData.isFailure);
      expect(AsyncData.isPending(failureRefreshing)).toBe(true);
      expect(AsyncData.isPending(AsyncData.NoData)).toBe(false);
      expect(AsyncData.isPending(AsyncData.success(1))).toBe(false);
    });
  });

  describe("extractors", () => {
    it("getSuccess", () => {
      const successData = AsyncData.success(42);
      const successOption = AsyncData.getSuccess(successData);
      assert(successOption, Option.isSome);
      expect(successOption.value).toBe(42);
      const none1 = AsyncData.getSuccess(AsyncData.NoData);
      assert(none1, Option.isNone);
      const none2 = AsyncData.getSuccess(AsyncData.loading());
      assert(none2, Option.isNone);
      const previous = AsyncData.success(10);
      const opt = AsyncData.optimistic(previous, 20);
      const optimisticOption = AsyncData.getSuccess(opt);
      assert(optimisticOption, Option.isSome);
      expect(optimisticOption.value).toBe(20);
    });

    it("getCause", () => {
      const cause = Cause.fail("error");
      const failureData = AsyncData.failure(cause);
      const causeOption = AsyncData.getCause(failureData);
      assert(causeOption, Option.isSome);
      expect(causeOption.value).toBe(cause);
      assert(AsyncData.getCause(AsyncData.NoData), Option.isNone);
      assert(AsyncData.getCause(AsyncData.loading()), Option.isNone);
      assert(AsyncData.getCause(AsyncData.success(1)), Option.isNone);
    });

    it("getError", () => {
      const error = "error";
      const cause = Cause.fail(error);
      const failureData = AsyncData.failure(cause);
      const errorOption = AsyncData.getError(failureData);
      assert(errorOption, Option.isSome);
      expect(errorOption.value).toBe(error);
      assert(AsyncData.getError(AsyncData.NoData), Option.isNone);
      assert(AsyncData.getError(AsyncData.loading()), Option.isNone);
      assert(AsyncData.getError(AsyncData.success(1)), Option.isNone);
    });

    it("getCause and getError return none for Optimistic", () => {
      const optimisticData = AsyncData.optimistic(AsyncData.failure(Cause.fail("error")), 10);
      assert(AsyncData.getCause(optimisticData), Option.isNone);
      assert(AsyncData.getError(optimisticData), Option.isNone);
    });
  });

  describe("match", () => {
    it("invokes correct branch for each variant", () => {
      const noDataResult = AsyncData.match(AsyncData.NoData, {
        NoData: () => "no-data",
        Loading: () => "loading",
        Failure: () => "failure",
        Success: () => "success",
        Optimistic: () => "optimistic",
      });
      expect(noDataResult).toBe("no-data");

      const loadingResult = AsyncData.match(AsyncData.loading(), {
        NoData: () => "no-data",
        Loading: () => "loading",
        Failure: () => "failure",
        Success: () => "success",
        Optimistic: () => "optimistic",
      });
      expect(loadingResult).toBe("loading");

      const successResult = AsyncData.match(AsyncData.success(42), {
        NoData: () => "no-data",
        Loading: () => "loading",
        Failure: () => "failure",
        Success: (value) => `success-${value}`,
        Optimistic: () => "optimistic",
      });
      expect(successResult).toBe("success-42");

      const cause = Cause.fail("error");
      const failureResult = AsyncData.match(AsyncData.failure(cause), {
        NoData: () => "no-data",
        Loading: () => "loading",
        Failure: (c) => `failure-${String(Cause.squash(c))}`,
        Success: () => "success",
        Optimistic: () => "optimistic",
      });
      expect(failureResult).toBe("failure-error");

      const previous = AsyncData.success(10);
      const optimisticResult = AsyncData.match(AsyncData.optimistic(previous, 20), {
        NoData: () => "no-data",
        Loading: () => "loading",
        Failure: () => "failure",
        Success: () => "success",
        Optimistic: (value) => `optimistic-${value}`,
      });
      expect(optimisticResult).toBe("optimistic-20");
    });

    it("supports data-first (curried) form", () => {
      const matchers = {
        NoData: () => "n",
        Loading: () => "l",
        Failure: () => "f",
        Success: (v: number) => `s-${v}`,
        Optimistic: (v: number) => `o-${v}`,
      };
      const fn = AsyncData.match(matchers);
      expect(fn(AsyncData.NoData)).toBe("n");
      expect(fn(AsyncData.success(7))).toBe("s-7");
    });
  });

  describe("map", () => {
    it("maps Success value", () => {
      const data = AsyncData.success(5);
      const mapped = AsyncData.map(data, (n) => n * 2);
      assert(mapped, AsyncData.isSuccess);
      expect(mapped.value).toBe(10);
    });

    it("preserves NoData and Loading", () => {
      const mappedNoData = AsyncData.map(AsyncData.NoData, (n: number) => n * 2);
      assert(mappedNoData, AsyncData.isNoData);
      const mappedLoading = AsyncData.map(AsyncData.loading(), (n: number) => n * 2);
      assert(mappedLoading, AsyncData.isLoading);
      const cause = Cause.fail("err");
      const mappedFailure = AsyncData.map(AsyncData.failure(cause), (n: number) => n * 2);
      assert(mappedFailure, AsyncData.isFailure);
    });

    it("maps Optimistic value and previous", () => {
      const optimisticData = AsyncData.optimistic(AsyncData.success(5), 10);
      const mapped = AsyncData.map(optimisticData, (n) => n * 2);
      assert(mapped, AsyncData.isOptimistic);
      expect(mapped.value).toBe(20);
      assert(mapped.previous, AsyncData.isSuccess);
      expect(mapped.previous.value).toBe(10);
    });

    it("preserves progress on Success", () => {
      const progress = { loaded: 50, total: 100 };
      const data = AsyncData.success(5, progress);
      const mapped = AsyncData.map(data, (n) => n * 2);
      assert(mapped, AsyncData.isSuccess);
      expect(mapped.progress?.loaded).toBe(50);
      expect(mapped.progress?.total).toBe(100);
    });

    it("supports data-last (curried) form", () => {
      const double = AsyncData.map((n: number) => n * 2);
      const result = double(AsyncData.success(3));
      assert(result, AsyncData.isSuccess);
      expect(result.value).toBe(6);
    });
  });

  describe("flatMap", () => {
    it("flatMaps Success", () => {
      const data = AsyncData.success(5);
      const flatMapped = AsyncData.flatMap(data, (n) => AsyncData.success(n * 2));
      assert(flatMapped, AsyncData.isSuccess);
      expect(flatMapped.value).toBe(10);
    });

    it("preserves NoData, Loading, Failure", () => {
      const f = (n: number) => AsyncData.success(n * 2);
      const flatNoData = AsyncData.flatMap(AsyncData.NoData, f);
      assert(flatNoData, AsyncData.isNoData);
      const flatLoading = AsyncData.flatMap(AsyncData.loading(), f);
      assert(flatLoading, AsyncData.isLoading);
      const cause = Cause.fail("err");
      const flatFailure = AsyncData.flatMap(AsyncData.failure(cause), f);
      assert(flatFailure, AsyncData.isFailure);
    });

    it("flatMaps Optimistic and can return Optimistic", () => {
      const optimisticData = AsyncData.optimistic(AsyncData.success(5), 10);
      const flatMapped = AsyncData.flatMap(optimisticData, (n) => AsyncData.success(n * 2));
      assert(flatMapped, AsyncData.isSuccess);
      expect(flatMapped.value).toBe(20);
      const flatMappedOpt = AsyncData.flatMap(optimisticData, (n, prev) =>
        AsyncData.optimistic(prev, n * 2),
      );
      assert(flatMappedOpt, AsyncData.isOptimistic);
      expect(flatMappedOpt.value).toBe(20);
    });

    it("supports data-last (curried) form", () => {
      const chain = AsyncData.flatMap((n: number) => AsyncData.success(String(n * 2)));
      const result = chain(AsyncData.success(3));
      assert(result, AsyncData.isSuccess);
      expect(result.value).toBe("6");
    });
  });

  describe("mapError", () => {
    it("maps Failure cause", () => {
      const cause = Cause.fail("error");
      const data = AsyncData.failure(cause);
      const mapped = AsyncData.mapError(data, (e) => `mapped: ${e}`);
      assert(mapped, AsyncData.isFailure);
      const err = AsyncData.getError(mapped);
      assert(err, Option.isSome);
      expect(err.value).toBe("mapped: error");
    });

    it("preserves NoData, Loading, Success", () => {
      const f = (e: string) => `mapped: ${e}`;
      const mappedNoData = AsyncData.mapError(AsyncData.NoData, f);
      assert(mappedNoData, AsyncData.isNoData);
      const mappedLoading = AsyncData.mapError(AsyncData.loading(), f);
      assert(mappedLoading, AsyncData.isLoading);
      const mappedSuccess = AsyncData.mapError(AsyncData.success(1), f);
      assert(mappedSuccess, AsyncData.isSuccess);
    });

    it("maps Optimistic previous failure", () => {
      const cause = Cause.fail("error");
      const optimisticData = AsyncData.optimistic(AsyncData.failure(cause), 10);
      const mapped = AsyncData.mapError(optimisticData, (e) => `mapped: ${e}`);
      assert(mapped, AsyncData.isOptimistic);
      assert(mapped.previous, AsyncData.isFailure);
      const prevErr = AsyncData.getError(mapped.previous);
      assert(prevErr, Option.isSome);
      expect(prevErr.value).toBe("mapped: error");
    });

    it("preserves progress on Failure", () => {
      const progress = { loaded: 50 };
      const cause = Cause.fail("error");
      const data = AsyncData.failure(cause, progress);
      const mapped = AsyncData.mapError(data, (e) => `mapped: ${e}`);
      assert(mapped, AsyncData.isFailure);
      expect(mapped.progress?.loaded).toBe(50);
    });

    it("supports data-last (curried) form", () => {
      const mapErr = AsyncData.mapError((e: string) => `mapped: ${e}`);
      const result = mapErr(AsyncData.failure(Cause.fail("error")));
      assert(result, AsyncData.isFailure);
      const err = AsyncData.getError(result);
      assert(err, Option.isSome);
      expect(err.value).toBe("mapped: error");
    });
  });

  describe("startLoading", () => {
    it("from NoData returns Loading", () => {
      const started = AsyncData.startLoading(AsyncData.NoData);
      assert(started, AsyncData.isLoading);
    });

    it("from Success keeps value and adds progress", () => {
      const data = AsyncData.success(42);
      const progress = { loaded: 50 };
      const started = AsyncData.startLoading(data, progress);
      assert(started, AsyncData.isSuccess);
      expect(started.value).toBe(42);
      expect(started.progress?.loaded).toBe(50);
    });

    it("from Failure keeps cause and adds progress", () => {
      const cause = Cause.fail("error");
      const data = AsyncData.failure(cause);
      const progress = { loaded: 50 };
      const started = AsyncData.startLoading(data, progress);
      assert(started, AsyncData.isFailure);
      expect(started.cause).toBe(cause);
      expect(started.progress?.loaded).toBe(50);
    });

    it("from Optimistic adds progress to previous", () => {
      const previous = AsyncData.success(10);
      const data = AsyncData.optimistic(previous, 20);
      const progress = { loaded: 50 };
      const started = AsyncData.startLoading(data, progress);
      assert(started, AsyncData.isOptimistic);
      expect(started.value).toBe(20);
      assert(started.previous, AsyncData.isSuccess);
      expect(started.previous.progress?.loaded).toBe(50);
    });

    it("from Loading keeps loading and updates progress", () => {
      const data = AsyncData.loading({ loaded: 10, total: 100 });
      const started = AsyncData.startLoading(data, { loaded: 25 });
      assert(started, AsyncData.isLoading);
      expect(started.progress?.loaded).toBe(25);
      expect(started.progress?.total).toBeUndefined();
    });
  });

  describe("stopLoading", () => {
    it("removes progress from Success", () => {
      const progress = { loaded: 50 };
      const data = AsyncData.success(42, progress);
      const stopped = AsyncData.stopLoading(data);
      assert(stopped, AsyncData.isSuccess);
      expect(stopped.value).toBe(42);
      expect(stopped.progress).toBeUndefined();
    });

    it("removes progress from Failure", () => {
      const cause = Cause.fail("error");
      const progress = { loaded: 50 };
      const data = AsyncData.failure(cause, progress);
      const stopped = AsyncData.stopLoading(data);
      assert(stopped, AsyncData.isFailure);
      expect(stopped.cause).toBe(cause);
      expect(stopped.progress).toBeUndefined();
    });

    it("removes progress from Optimistic previous", () => {
      const previous = AsyncData.success(10, { loaded: 50 });
      const data = AsyncData.optimistic(previous, 20);
      const stopped = AsyncData.stopLoading(data);
      assert(stopped, AsyncData.isOptimistic);
      expect(stopped.value).toBe(20);
      assert(stopped.previous, AsyncData.isSuccess);
      expect(stopped.previous.progress).toBeUndefined();
    });

    it("leaves NoData and Loading unchanged", () => {
      const stoppedNoData = AsyncData.stopLoading(AsyncData.NoData);
      assert(stoppedNoData, AsyncData.isNoData);
      const loadingData = AsyncData.loading();
      const stoppedLoading = AsyncData.stopLoading(loadingData);
      assert(stoppedLoading, AsyncData.isLoading);
      expect(stoppedLoading).toBe(loadingData);
    });
  });

  describe("fromExit", () => {
    it("Success exit -> Success", () => {
      const exit = Exit.succeed(42);
      const data = AsyncData.fromExit(exit);
      assert(data, AsyncData.isSuccess);
      expect(data.value).toBe(42);
    });

    it("Failure exit -> Failure", () => {
      const cause = Cause.fail("error");
      const exit = Exit.failCause(cause);
      const data = AsyncData.fromExit(exit);
      assert(data, AsyncData.isFailure);
      expect(data.cause).toBe(cause);
    });
  });

  describe("fromResult", () => {
    it("Success result -> Success", () => {
      const result = Result.succeed(42);
      const data = AsyncData.fromResult(result);
      assert(data, AsyncData.isSuccess);
      expect(data.value).toBe(42);
    });

    it("Failure result -> Failure", () => {
      const result = Result.fail("error");
      const data = AsyncData.fromResult(result);
      assert(data, AsyncData.isFailure);
      const err = AsyncData.getError(data);
      assert(err, Option.isSome);
      expect(err.value).toBe("error");
    });
  });
});
