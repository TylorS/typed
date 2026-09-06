import * as Cause from "effect/Cause";
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import * as AsyncData from "../index.js";

describe("AsyncData correctness contracts", () => {
  const schema = AsyncData.AsyncData(Schema.Finite, Schema.String);

  it.each([
    ["Loading without progress.loaded", { _tag: "Loading", progress: {} }],
    ["Loading with NaN progress", { _tag: "Loading", progress: { loaded: Number.NaN } }],
    ["Success without value", { _tag: "Success" }],
    [
      "Success with infinite total",
      { _tag: "Success", value: 1, progress: { loaded: 0, total: Infinity } },
    ],
    ["Failure without a Cause", { _tag: "Failure", cause: "offline" }],
    ["Optimistic without value", { _tag: "Optimistic", previous: AsyncData.NoData }],
    ["Optimistic without previous", { _tag: "Optimistic", value: 1 }],
    [
      "Optimistic with malformed previous",
      { _tag: "Optimistic", value: 1, previous: { _tag: "Success" } },
    ],
  ])("isAsyncData rejects malformed %s", (_, candidate) => {
    expect(AsyncData.isAsyncData(candidate)).toBe(false);
  });

  it("isAsyncData validates deep optimistic histories without overflowing", () => {
    let candidate: unknown = AsyncData.success(0);
    for (let value = 1; value <= 20_000; value++) {
      candidate = { _tag: "Optimistic", value, previous: candidate };
    }

    expect(AsyncData.isAsyncData(candidate)).toBe(true);
  });

  it("isAsyncData rejects cyclic optimistic histories", () => {
    const candidate: { _tag: "Optimistic"; value: number; previous?: unknown } = {
      _tag: "Optimistic",
      value: 1,
    };
    candidate.previous = candidate;

    expect(AsyncData.isAsyncData(candidate)).toBe(false);
  });

  it("round-trips every Cause reason through the Failure wire representation", () => {
    const data = AsyncData.failure(
      Cause.fromReasons([
        Cause.makeFailReason("typed failure"),
        Cause.makeDieReason(new Error("defect")),
        Cause.makeInterruptReason(7),
      ]),
    );

    const encoded = Schema.encodeSync(schema)(data);

    expect(encoded).toEqual({
      _tag: "Failure",
      cause: [
        { _tag: "Fail", error: "typed failure" },
        { _tag: "Die", defect: { name: "Error", message: "defect" } },
        { _tag: "Interrupt", fiberId: 7 },
      ],
    });

    const decoded = Schema.decodeSync(schema)(encoded);
    expect(AsyncData.isFailure(decoded)).toBe(true);
    if (!AsyncData.isFailure(decoded)) return;
    expect(Cause.isCause(decoded.cause)).toBe(true);
    expect(decoded.cause.reasons.map((reason) => reason._tag)).toEqual([
      "Fail",
      "Die",
      "Interrupt",
    ]);
    expect(decoded.cause.reasons[0]).toMatchObject({ _tag: "Fail", error: "typed failure" });
    expect(decoded.cause.reasons[1]).toMatchObject({
      _tag: "Die",
      defect: expect.objectContaining({ name: "Error", message: "defect" }),
    });
    expect(decoded.cause.reasons[2]).toMatchObject({ _tag: "Interrupt", fiberId: 7 });
  });

  it("round-trips a Failure nested under Optimistic", () => {
    const data = AsyncData.optimistic(AsyncData.failure(Cause.fail("previous")), 2);

    const encoded = Schema.encodeSync(schema)(data);

    expect(encoded).toEqual({
      _tag: "Optimistic",
      value: 2,
      previous: {
        _tag: "Failure",
        cause: [{ _tag: "Fail", error: "previous" }],
      },
    });
    const decoded = Schema.decodeSync(schema)(encoded);
    expect(AsyncData.isOptimistic(decoded)).toBe(true);
    if (!AsyncData.isOptimistic(decoded)) return;
    expect(AsyncData.isFailure(decoded.previous)).toBe(true);
    if (!AsyncData.isFailure(decoded.previous)) return;
    expect(Cause.isCause(decoded.previous.cause)).toBe(true);
  });

  it("rejects a bare error value in the Failure cause field", () => {
    const invalid: unknown = {
      _tag: "Failure",
      cause: "offline",
    };
    expect(() => Schema.decodeUnknownSync(schema)(invalid)).toThrow();
  });

  it("decodes canonical Cause arrays when the error schema also accepts reason-shaped values", () => {
    const overlappingSchema = AsyncData.AsyncData(Schema.Finite, Schema.Array(Schema.Unknown));
    const canonical = {
      _tag: "Failure" as const,
      cause: [{ _tag: "Fail" as const, error: ["payload"] }],
    };

    const decoded = Schema.decodeSync(overlappingSchema)(canonical);

    expect(AsyncData.isFailure(decoded)).toBe(true);
    if (!AsyncData.isFailure(decoded)) return;
    expect(decoded.cause.reasons).toEqual([Cause.makeFailReason(["payload"])]);
    expect(Schema.encodeSync(overlappingSchema)(decoded)).toEqual(canonical);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects non-finite progress value %s",
    (value) => {
      expect(() =>
        Schema.decodeSync(schema)({
          _tag: "Loading",
          progress: { loaded: value },
        }),
      ).toThrow();
      expect(() =>
        Schema.decodeSync(schema)({
          _tag: "Loading",
          progress: { loaded: 1, total: value },
        }),
      ).toThrow();
    },
  );

  it("continues to accept negative and fractional finite progress", () => {
    expect(
      Schema.decodeSync(schema)({
        _tag: "Loading",
        progress: { loaded: -0.5, total: 1.25 },
      }),
    ).toEqual(AsyncData.loading({ loaded: -0.5, total: 1.25 }));
  });

  it("startLoading makes retained Success pending even without explicit progress", () => {
    const started = AsyncData.startLoading(AsyncData.success(42));

    expect(AsyncData.isPending(started)).toBe(true);
    expect(AsyncData.isSuccess(started)).toBe(true);
    if (!AsyncData.isSuccess(started)) return;
    expect(started.value).toBe(42);
    expect(started.progress).toEqual({ loaded: 0 });
  });

  it("startLoading makes retained Failure pending even without explicit progress", () => {
    const started = AsyncData.startLoading(AsyncData.failure(Cause.fail("offline")));

    expect(AsyncData.isPending(started)).toBe(true);
    expect(AsyncData.isFailure(started)).toBe(true);
    if (!AsyncData.isFailure(started)) return;
    expect(started.progress).toEqual({ loaded: 0 });
  });

  it("isPending observes pending state through optimistic wrappers", () => {
    const pending = AsyncData.optimistic(AsyncData.success(10, { loaded: 1, total: 2 }), 20);

    expect(AsyncData.isOptimistic(pending)).toBe(true);
    expect(AsyncData.isPending(pending)).toBe(true);
  });

  it("preserves the known isPending type/runtime discrepancy for optimistic wrappers", () => {
    const pending: AsyncData.AsyncData<number, never> = AsyncData.optimistic(
      AsyncData.loading(),
      20,
    );

    expect(AsyncData.isPending(pending)).toBe(true);
    expect(pending._tag).toBe("Optimistic");

    if (AsyncData.isPending(pending)) {
      // The public predicate currently narrows this branch to Loading | Refreshing,
      // even though the runtime value above remains Optimistic. This assignment
      // deliberately records that compatibility contract without endorsing it.
      const declaredNarrowing: AsyncData.Loading | AsyncData.Refreshing<number, never> = pending;
      expect((declaredNarrowing as AsyncData.AsyncData<number, never>)._tag).toBe("Optimistic");
    }
  });

  it("isPending rejects cyclic optimistic histories", () => {
    const cyclic: { _tag: "Optimistic"; value: number; previous?: unknown } = {
      _tag: "Optimistic",
      value: 1,
    };
    cyclic.previous = cyclic;

    expect(AsyncData.isPending(cyclic as unknown as AsyncData.AsyncData<number, string>)).toBe(
      false,
    );
  });

  const previous: AsyncData.AsyncData<number, string> = AsyncData.success(10);
  const roundTripCases: ReadonlyArray<readonly [string, AsyncData.AsyncData<number, string>]> = [
    ["NoData", AsyncData.NoData],
    ["Loading", AsyncData.loading({ loaded: 1, total: 2 })],
    ["Success", AsyncData.success(42, { loaded: 1, total: 2 })],
    ["Optimistic", AsyncData.optimistic(previous, 20)],
  ];

  it.each(roundTripCases)("round-trips %s through the schema codec", (_, data) => {
    const encoded = Schema.encodeSync(schema)(data);
    const decoded = Schema.decodeSync(schema)(encoded);
    expect(decoded).toEqual(data);
  });
});
