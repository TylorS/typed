import { assert, describe, expectTypeOf, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Context from "effect/Context";
import { Data } from "effect";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Ref from "effect/Ref";
import * as Schedule from "effect/Schedule";
import type * as Scope from "effect/Scope";
import { Fx } from "../index.js";

class TaggedFailure extends Data.TaggedError("TaggedFailure") {}

const composite = <E>(error: E) => Cause.combine(Cause.fail(error), Cause.die("defect"));

describe("Fx control combinator documentation semantics", () => {
  it("typed recovery combinators match a Fail inside a composite Cause and replace the whole Cause", () =>
    Effect.gen(function* () {
      const caught = yield* Fx.failCause(composite("typed")).pipe(
        Fx.catch(() => Fx.succeed("catch")),
        Fx.collectAll,
      );
      const tagged = yield* Fx.failCause(composite(new TaggedFailure())).pipe(
        Fx.catchTag("TaggedFailure", () => Fx.succeed("tag")),
        Fx.collectAll,
      );
      const conditional = yield* Fx.failCause(composite(42)).pipe(
        Fx.catchIf(
          (value) => value === 42,
          () => Fx.succeed("if"),
        ),
        Fx.collectAll,
      );
      const tags = yield* Fx.failCause(composite(new TaggedFailure())).pipe(
        Fx.catchTags({ TaggedFailure: () => Fx.succeed("tags") }),
        Fx.collectAll,
      );

      assert.deepStrictEqual(caught, ["catch"]);
      assert.deepStrictEqual(tagged, ["tag"]);
      assert.deepStrictEqual(conditional, ["if"]);
      assert.deepStrictEqual(tags, ["tags"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("retry retries and flip materializes the first Fail from a composite Cause", () =>
    Effect.gen(function* () {
      const attempts = yield* Ref.make(0);
      const retried = yield* Effect.gen(function* () {
        const attempt = yield* Ref.updateAndGet(attempts, (n) => n + 1);
        return attempt === 1 ? Fx.failCause(composite("retry")) : Fx.succeed("ready");
      }).pipe(Fx.unwrap, Fx.retry(Schedule.recurs(1)), Fx.collectAll);
      const flipped = yield* Fx.failCause(composite("flipped")).pipe(Fx.flip, Fx.collectAll);

      assert.deepStrictEqual(retried, ["ready"]);
      assert.deepStrictEqual(flipped, ["flipped"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("onInterrupt can run for both a reported interrupt Cause and external interruption", () =>
    Effect.gen(function* () {
      const calls = yield* Ref.make(0);
      const firstStarted = yield* Deferred.make<void>();
      const finalizer = Effect.gen(function* () {
        const call = yield* Ref.updateAndGet(calls, (n) => n + 1);
        if (call === 1) {
          yield* Deferred.succeed(firstStarted, undefined);
          return yield* Effect.never;
        }
      });
      const fiber = yield* Fx.interrupt(1).pipe(
        Fx.onInterrupt(finalizer),
        Fx.collectAll,
        Effect.forkChild,
      );

      yield* Deferred.await(firstStarted);
      yield* Fiber.interrupt(fiber);
      assert.strictEqual(yield* Ref.get(calls), 2);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("creates idempotent onInterrupt cleanup state separately for each subscription", () =>
    Effect.gen(function* () {
      const controllers: Array<AbortController> = [];
      const observed = Fx.gen(function* () {
        const controller = yield* Effect.sync(() => new AbortController());
        controllers.push(controller);
        return Fx.onInterrupt(
          Fx.interrupt(1),
          Effect.sync(() => controller.abort()),
        );
      });

      yield* Effect.exit(Fx.collectAll(observed));
      yield* Effect.exit(Fx.collectAll(observed));

      assert.strictEqual(controllers.length, 2);
      assert.notStrictEqual(controllers[0], controllers[1]);
      assert(controllers.every(({ signal }) => signal.aborted));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("ensuring and onError finalizer defects remain observable", () =>
    Effect.gen(function* () {
      const ensuringExit = yield* Fx.succeed("value").pipe(
        Fx.ensuring(Effect.die("ensuring defect")),
        Fx.collectAll,
        Effect.exit,
      );
      const onErrorExit = yield* Fx.fail("source")
        .pipe(Fx.onError(() => Effect.die("cleanup defect")))
        .run({
          onFailure: () => Effect.void,
          onSuccess: () => Effect.void,
        })
        .pipe(Effect.exit);

      assert(Exit.isFailure(ensuringExit));
      assert(Cause.hasDies(ensuringExit.cause));
      assert(Exit.isFailure(onErrorExit));
      assert(Cause.hasDies(onErrorExit.cause));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("provideServiceEffect preserves a Scope requirement from acquireRelease", () => {
    const Service = Context.Service<{ readonly value: number }>("DocSemantics/Service");
    const source = Fx.fromEffect(Effect.map(Service, ({ value }) => value));
    const provided = Fx.provideServiceEffect(
      source,
      Service,
      Effect.acquireRelease(Effect.succeed({ value: 1 }), () => Effect.void),
    );

    expectTypeOf<Fx.Services<typeof provided>>().toEqualTypeOf<Scope.Scope>();
  });
});
