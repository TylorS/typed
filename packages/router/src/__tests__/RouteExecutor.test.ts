import { assert, describe, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";
import { Fx } from "@typed/fx";
import * as Matcher from "../Matcher.js";
import * as Route from "../Route.js";
import { makeRouteExecutor, RouteDecodeError } from "../RouteExecutor.js";

/** Runs a fully-scoped Effect in tests; widens R so `Effect.runPromise` accepts Router-backed Fx collectors. */
const runTest = <A, E>(effect: Effect.Effect<A, E, unknown>): Promise<A> =>
  Effect.runPromise(effect as Effect.Effect<A, E, never>);

describe("RouteExecutor", () => {
  it("falls through guarded candidates in declaration order", () =>
    Effect.gen(function* () {
      const route = Route.Parse("users");
      const matcher = Matcher.empty
        .match(route, () => Effect.succeed(Option.none()), "first")
        .match(
          route,
          () => Effect.succeed(Option.some("allowed")),
          (params) => params,
        );
      const executor = yield* makeRouteExecutor<string, never, never>();

      const fx = yield* executor.transition({
        path: "/users",
        input: {},
        candidates: Matcher.compile(matcher.cases),
      });

      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(fx, 1)), ["allowed"]);
    }).pipe(Effect.scoped, runTest));

  it("falls through candidates whose parameter decoder does not match", () =>
    Effect.gen(function* () {
      const matcher = Matcher.empty
        .match(Route.Parse("/search?view=all"), "all")
        .match(Route.Parse("/search?view=recent"), "recent");
      const executor = yield* makeRouteExecutor<string, never, never>();
      const fx = yield* executor.transition({
        path: "/search?view=recent",
        input: { view: "recent" },
        candidates: Matcher.compile(matcher.cases),
      });

      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(fx, 1)), ["recent"]);
    }).pipe(Effect.scoped, runTest));

  it("retains a decode error when no candidate decoder matches", () =>
    Effect.gen(function* () {
      const matcher = Matcher.empty
        .match(Route.Parse("/search?view=all"), "all")
        .match(Route.Parse("/search?view=recent"), "recent");
      const executor = yield* makeRouteExecutor<string, never, never>();
      const result = yield* Effect.exit(
        executor.transition({
          path: "/search?view=other",
          input: { view: "other" },
          candidates: Matcher.compile(matcher.cases),
        }),
      );

      assert.isTrue(Exit.isFailure(result));
      if (Exit.isFailure(result)) {
        const error = Option.getOrThrow(Cause.findErrorOption(result.cause));
        assert.isTrue(error instanceof RouteDecodeError);
      }
    }).pipe(Effect.scoped, runTest));

  it("updates params without recreating the selected handler", () =>
    Effect.gen(function* () {
      let mounts = 0;
      const route = Route.Param("id");
      const matcher = Matcher.empty.match(route, (params) => {
        mounts += 1;
        return Fx.map(params, ({ id }) => id);
      });
      const candidates = Matcher.compile(matcher.cases);
      const executor = yield* makeRouteExecutor<string, never, never>();
      const first = yield* executor.transition({ path: "/1", input: { id: "1" }, candidates });
      const second = yield* executor.transition({ path: "/2", input: { id: "2" }, candidates });

      assert.strictEqual(first, second);
      assert.strictEqual(mounts, 1);
      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(second, 1)), ["2"]);
    }).pipe(Effect.scoped, runTest));

  it("reuses a handler across the present and omitted forms of an optional route", () =>
    Effect.gen(function* () {
      let mounts = 0;
      const route = Route.Parse("/users/:id?");
      const matcher = Matcher.empty.match(route, (params) => {
        mounts += 1;
        return Fx.map(params, ({ id }) => id ?? "missing");
      });
      const candidates = Matcher.compile(matcher.cases);
      assert.lengthOf(candidates, 1);
      assert.strictEqual(candidates[0].route.path, "/users/:id?");
      const [candidate] = candidates;
      const executor = yield* makeRouteExecutor<string, never, never>();

      const first = yield* executor.transition({
        path: "/users",
        input: {},
        candidates: [candidate],
      });
      const second = yield* executor.transition({
        path: "/users/42",
        input: { id: "42" },
        candidates: [candidate],
      });

      assert.strictEqual(first, second);
      assert.strictEqual(mounts, 1);
      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(second, 1)), ["42"]);
    }).pipe(Effect.scoped, runTest));

  it("makes ambient services available to guards and handlers", () => {
    class Ambient extends Context.Service<Ambient, { readonly value: string }>()("Ambient") {}

    return Effect.gen(function* () {
      const route = Route.Parse("ambient");
      const matcher = Matcher.empty.match(
        route,
        () => Effect.map(Ambient, ({ value }) => Option.some(value)),
        {
          handler: () => Fx.fromEffect(Effect.map(Ambient, ({ value }) => value)),
          dependencies: [Layer.effectDiscard(Effect.asVoid(Ambient))],
        },
      );
      const executor = yield* makeRouteExecutor<string, never, Ambient>();
      const fx = yield* executor.transition({
        path: "/ambient",
        input: {},
        candidates: Matcher.compile(matcher.cases),
      });

      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(fx, 1)), ["available"]);
    }).pipe(
      Effect.provideService(Ambient, { value: "available" }),
      Effect.scoped,
      runTest,
    );
  });

  it("rolls back Layers belonging to rejected candidates", () =>
    Effect.gen(function* () {
      const acquired = yield* Ref.make(0);
      const released = yield* Ref.make(0);
      const candidateLayer = Layer.effectDiscard(
        Effect.acquireRelease(
          Ref.update(acquired, (value) => value + 1),
          () => Ref.update(released, (value) => value + 1),
        ),
      );
      const route = Route.Parse("layered");
      const matcher = Matcher.empty
        .match(route, () => Effect.succeedNone, {
          handler: "first",
          dependencies: [candidateLayer],
        })
        .match(route, () => Effect.succeedSome({}), "second");
      const executor = yield* makeRouteExecutor<string, never, never>();
      const fx = yield* executor.transition({
        path: "/layered",
        input: {},
        candidates: Matcher.compile(matcher.cases),
      });

      assert.deepStrictEqual(yield* Fx.collectAll(Fx.take(fx, 1)), ["second"]);
      assert.strictEqual(yield* Ref.get(acquired), 1);
      assert.strictEqual(yield* Ref.get(released), 1);
    }).pipe(Effect.scoped, runTest));

  it("closes the previous route scope when the selected entry changes", () =>
    Effect.gen(function* () {
      const closed = yield* Ref.make(0);
      const firstMatcher = Matcher.empty.match(Route.Parse("first"), () =>
        Fx.unwrap(
          Effect.addFinalizer(() => Ref.update(closed, (value) => value + 1)).pipe(
            Effect.as(Fx.succeed("first")),
          ),
        ),
      );
      const secondMatcher = Matcher.empty.match(Route.Parse("second"), "second");
      const executor = yield* makeRouteExecutor<string, never, never>();
      const first = yield* executor.transition({
        path: "/first",
        input: {},
        candidates: Matcher.compile(firstMatcher.cases),
      });
      yield* Fx.collectAll(Fx.take(first, 1));

      yield* executor.transition({
        path: "/second",
        input: {},
        candidates: Matcher.compile(secondMatcher.cases),
      });

      assert.strictEqual(yield* Ref.get(closed), 1);
    }).pipe(Effect.scoped, runTest));

  it("serializes overlapping transitions in invocation order", () =>
    Effect.gen(function* () {
      const firstEntered = yield* Deferred.make<void>();
      const releaseFirst = yield* Deferred.make<void>();
      const secondEntered = yield* Deferred.make<void>();
      let secondMounts = 0;
      const firstMatcher = Matcher.empty.match(
        Route.Parse("first"),
        () =>
          Effect.gen(function* () {
            Deferred.doneUnsafe(firstEntered, Effect.void);
            yield* Deferred.await(releaseFirst);
            return Option.some({});
          }),
        "first",
      );
      const secondMatcher = Matcher.empty.match(
        Route.Parse("second"),
        () =>
          Effect.sync(() => {
            Deferred.doneUnsafe(secondEntered, Effect.void);
            return Option.some({});
          }),
        () => {
          secondMounts += 1;
          return "second";
        },
      );
      const firstCandidates = Matcher.compile(firstMatcher.cases);
      const secondCandidates = Matcher.compile(secondMatcher.cases);
      const executor = yield* makeRouteExecutor<string, never, never>();

      const first = yield* Effect.forkScoped(
        executor.transition({ path: "/first", input: {}, candidates: firstCandidates }),
        { startImmediately: true },
      );
      yield* Deferred.await(firstEntered);

      const second = yield* Effect.forkScoped(
        executor.transition({ path: "/second", input: {}, candidates: secondCandidates }),
        { startImmediately: true },
      );

      assert.isFalse(yield* Deferred.isDone(secondEntered));
      Deferred.doneUnsafe(releaseFirst, Effect.void);
      yield* Fiber.join(first);
      const secondFx = yield* Fiber.join(second);
      const repeated = yield* executor.transition({
        path: "/second",
        input: {},
        candidates: secondCandidates,
      });

      assert.strictEqual(repeated, secondFx);
      assert.strictEqual(secondMounts, 1);
    }).pipe(Effect.scoped, runTest));
});
