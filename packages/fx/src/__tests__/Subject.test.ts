import { describe, expect, it } from "vitest";
import * as Cause from "effect/Cause";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Option from "effect/Option";
import * as Scheduler from "effect/Scheduler";
import * as Fx from "../Fx/index.js";
import * as RefSubject from "../RefSubject.js";
import * as Sink from "../Sink.js";
import * as Subject from "../Subject.js";

function awaitSubscriberCount<A, E>(subject: Subject.Subject<A, E>, expected: number) {
  return Effect.race(
    Effect.gen(function* () {
      while ((yield* subject.subscriberCount) !== expected) {
        yield* Effect.yieldNow;
      }

      return true as const;
    }),
    Effect.sleep("250 millis").pipe(Effect.as(false as const)),
  ).pipe(
    Effect.flatMap((ready) =>
      ready
        ? Effect.void
        : Effect.die(new Error(`Timed out waiting for ${expected} Subject subscribers`)),
    ),
  );
}

describe("Subject", () => {
  it("allows multicasting values", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>();
      const fiber = yield* Fx.collectAllFork(subject);
      yield* Effect.yieldNow;

      yield* subject.onSuccess(1);
      yield* subject.onSuccess(2);
      yield* subject.onSuccess(3);
      yield* subject.interrupt;

      expect(yield* Fiber.join(fiber)).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("allows replay of values", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>(2);

      yield* subject.onSuccess(1);
      yield* subject.onSuccess(2);
      yield* subject.onSuccess(3);

      expect(yield* Fx.collectAll(Fx.take(subject, 2))).toEqual([2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("delivers reentrant publications to every subscriber in FIFO order", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>();
      const left: number[] = [];
      const right: number[] = [];

      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) =>
              Effect.sync(() => left.push(value)).pipe(
                Effect.andThen(value === 1 ? subject.onSuccess(2) : Effect.void),
              ),
          ),
        ),
      );
      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) => Effect.sync(() => right.push(value)),
          ),
        ),
      );
      yield* awaitSubscriberCount(subject, 2);

      const outcome = yield* Effect.race(
        subject.onSuccess(1).pipe(Effect.as("done" as const)),
        Effect.sleep("250 millis").pipe(Effect.as("timeout" as const)),
      );
      expect(outcome).toBe("done");
      expect(left).toEqual([1, 2]);
      expect(right).toEqual([1, 2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("returns from a reentrant push before the queued publication is delivered", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>();
      const order: string[] = [];

      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) =>
              Effect.gen(function* () {
                order.push(`left:${value}:start`);
                if (value === 1) {
                  yield* subject.onSuccess(2);
                  order.push("left:1:after-reentrant-return");
                }
              }),
          ),
        ),
      );
      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) => Effect.sync(() => order.push(`right:${value}`)),
          ),
        ),
      );
      yield* awaitSubscriberCount(subject, 2);

      yield* subject.onSuccess(1);

      expect(order).toEqual([
        "left:1:start",
        "left:1:after-reentrant-return",
        "right:1",
        "left:2:start",
        "right:2",
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("can deliver a held value twice when a subscriber joins while it is queued", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>(1);
      const firstDeliveryStarted = yield* Deferred.make<void>();
      const releaseFirstDelivery = yield* Deferred.make<void>();
      const secondPublicationStarted = yield* Deferred.make<void>();

      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) =>
              value === 1
                ? Deferred.succeed(firstDeliveryStarted, undefined).pipe(
                    Effect.andThen(Deferred.await(releaseFirstDelivery)),
                  )
                : Effect.void,
          ),
        ),
      );
      yield* awaitSubscriberCount(subject, 1);

      const firstPublication = yield* Effect.forkScoped(subject.onSuccess(1));
      yield* Deferred.await(firstDeliveryStarted);
      const secondPublication = yield* Effect.forkScoped(
        Deferred.succeed(secondPublicationStarted, undefined).pipe(
          Effect.andThen(subject.onSuccess(2)),
        ),
      );
      yield* Deferred.await(secondPublicationStarted);
      yield* Effect.yieldNow;

      const lateSubscriber = yield* Effect.forkScoped(Fx.collectUpTo(subject, 2));
      yield* awaitSubscriberCount(subject, 2);
      yield* Deferred.succeed(releaseFirstDelivery, undefined);

      expect(yield* Fiber.join(lateSubscriber)).toEqual([2, 2]);
      yield* Fiber.join(firstPublication);
      yield* Fiber.join(secondPublication);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("snapshots subscribers once per publication", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>();
      const left: number[] = [];
      const removed: number[] = [];
      const added: number[] = [];
      let removedFiber!: Fiber.Fiber<unknown>;

      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) =>
              Effect.gen(function* () {
                left.push(value);

                if (value === 1) {
                  yield* Fiber.interrupt(removedFiber);
                  yield* Effect.forkScoped(
                    subject.run(
                      Sink.make(
                        () => Effect.void,
                        (value) => Effect.sync(() => added.push(value)),
                      ),
                    ),
                  );
                  yield* awaitSubscriberCount(subject, 2);
                }
              }),
          ),
        ),
      );
      removedFiber = yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) => Effect.sync(() => removed.push(value)),
          ),
        ),
      );
      yield* awaitSubscriberCount(subject, 2);

      yield* subject.onSuccess(1);
      yield* subject.onSuccess(2);

      expect(left).toEqual([1, 2]);
      expect(removed).toEqual([1]);
      expect(added).toEqual([2]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("drains 10,000 reentrant publications without recursive stack growth", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>();
      const observed: number[] = [];

      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) => (value < 10_000 ? subject.onSuccess(value + 1) : Effect.void),
          ),
        ),
      );
      yield* Effect.forkScoped(
        subject.run(
          Sink.make(
            () => Effect.void,
            (value) => Effect.sync(() => observed.push(value)),
          ),
        ),
      );
      yield* awaitSubscriberCount(subject, 2);

      yield* subject.onSuccess(0);

      expect(observed).toEqual(Array.from({ length: 10_001 }, (_, index) => index));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("queues failures in the same causal order as successes", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number, string>();
      const left: string[] = [];
      const right: string[] = [];
      const sink = (events: string[], reentrant: boolean) =>
        Sink.make<number, string>(
          () => Effect.sync(() => events.push("failure")),
          (value) =>
            Effect.sync(() => events.push(`success:${value}`)).pipe(
              Effect.andThen(
                reentrant && value === 1 ? subject.onFailure(Cause.fail("reentrant")) : Effect.void,
              ),
            ),
        );

      yield* Effect.forkScoped(subject.run(sink(left, true)));
      yield* Effect.forkScoped(subject.run(sink(right, false)));
      yield* awaitSubscriberCount(subject, 2);

      yield* subject.onSuccess(1);
      yield* subject.onSuccess(2);

      expect(left).toEqual(["success:1", "failure", "success:2"]);
      expect(right).toEqual(["success:1", "failure", "success:2"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not lose concurrent publications during drain handoff", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>();

      const outcomes = yield* Effect.all(
        Array.from({ length: 20 }, (_, value) => Effect.exit(subject.onSuccess(value))),
        { concurrency: "unbounded" },
      );

      expect(outcomes.filter(Exit.isSuccess)).toHaveLength(20);
    }).pipe(
      Effect.provideService(Scheduler.MaxOpsBeforeYield, 16),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("does not lose a synchronous first multicast value", () =>
    Effect.gen(function* () {
      expect(yield* Fx.collectAll(Subject.multicast(Fx.succeed(1)))).toEqual([1]);
    }).pipe(
      Effect.provideService(Scheduler.MaxOpsBeforeYield, 4),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("preserves every synchronous iterable value", () =>
    Effect.gen(function* () {
      expect(yield* Fx.collectAll(Subject.multicast(Fx.fromIterable([1, 2, 3])))).toEqual([
        1, 2, 3,
      ]);
    }).pipe(
      Effect.provideService(Scheduler.MaxOpsBeforeYield, 4),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("registers a RefSubject sink before delivering the first synchronous source value", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0);
      yield* ref;
      const emitted = yield* Deferred.make<void>();
      const values: number[] = [];
      let subscribersAtSourceStart = -1;
      const source = Fx.make<number>((sink) =>
        Effect.gen(function* () {
          subscribersAtSourceStart = yield* ref.subscriberCount;
          yield* sink.onSuccess(1);
          yield* Deferred.succeed(emitted, undefined);
          return yield* Effect.never;
        }),
      );

      const fiber = yield* Effect.forkScoped(
        Fx.observe(Subject.share(source, ref), (value) => Effect.sync(() => values.push(value))),
      );
      yield* Deferred.await(emitted);
      yield* awaitSubscriberCount(ref, 1);

      expect(subscribersAtSourceStart).toBe(1);
      expect(values).toEqual([0, 1]);
      yield* Fiber.interrupt(fiber);
    }).pipe(
      Effect.provideService(Scheduler.MaxOpsBeforeYield, 3),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("starts one shared source for two subscribers", () =>
    Effect.gen(function* () {
      const backingSubject = Subject.unsafeMake<number>();
      const release = yield* Deferred.make<void>();
      let starts = 0;
      const source = Fx.fromEffect(
        Effect.sync(() => {
          starts += 1;
        }).pipe(Effect.andThen(Deferred.await(release)), Effect.as(1)),
      );
      const shared = Subject.share(source, backingSubject);

      const left = yield* Effect.forkScoped(Fx.collectAll(shared));
      const right = yield* Effect.forkScoped(Fx.collectAll(shared));
      yield* awaitSubscriberCount(backingSubject, 2);
      yield* Deferred.succeed(release, undefined);

      const leftValues = yield* Fiber.join(left);
      const rightValues = yield* Fiber.join(right);
      expect(starts).toBe(1);
      expect(leftValues).toEqual([1]);
      expect(rightValues).toEqual([1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("finalizes the shared source once when the last subscriber leaves", () =>
    Effect.gen(function* () {
      const backingSubject = Subject.unsafeMake<never>();
      const started = yield* Deferred.make<void>();
      let finalizers = 0;
      const source = Fx.fromEffect(
        Deferred.succeed(started, undefined).pipe(Effect.andThen(Effect.never)),
      ).pipe(
        Fx.ensuring(
          Effect.sync(() => {
            finalizers += 1;
          }),
        ),
      );
      const shared = Subject.share(source, backingSubject);

      const left = yield* Effect.forkScoped(Fx.collectAll(shared));
      const right = yield* Effect.forkScoped(Fx.collectAll(shared));
      yield* awaitSubscriberCount(backingSubject, 2);
      yield* Deferred.await(started);

      yield* Fiber.interrupt(left);
      yield* awaitSubscriberCount(backingSubject, 1);
      expect(finalizers).toBe(0);

      yield* Fiber.interrupt(right);
      yield* awaitSubscriberCount(backingSubject, 0);
      expect(finalizers).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("starts a fresh shared session once after every subscriber leaves", () =>
    Effect.gen(function* () {
      const backingSubject = Subject.unsafeMake<never>();
      const firstStarted = yield* Deferred.make<void>();
      const secondStarted = yield* Deferred.make<void>();
      let starts = 0;
      let finalizers = 0;
      const source = Fx.fromEffect(
        Effect.gen(function* () {
          starts += 1;
          yield* Deferred.succeed(starts === 1 ? firstStarted : secondStarted, undefined);
          return yield* Effect.never;
        }),
      ).pipe(
        Fx.ensuring(
          Effect.sync(() => {
            finalizers += 1;
          }),
        ),
      );
      const shared = Subject.share(source, backingSubject);

      const first = yield* Effect.forkScoped(Fx.collectAll(shared));
      yield* awaitSubscriberCount(backingSubject, 1);
      yield* Deferred.await(firstStarted);
      yield* Fiber.interrupt(first);
      yield* awaitSubscriberCount(backingSubject, 0);

      const second = yield* Effect.forkScoped(Fx.collectAll(shared));
      yield* awaitSubscriberCount(backingSubject, 1);
      yield* Deferred.await(secondStarted);
      expect(starts).toBe(2);

      yield* Fiber.interrupt(second);
      yield* awaitSubscriberCount(backingSubject, 0);
      expect(finalizers).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("delivers a synchronous source failure to the first subscriber", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        Fx.collectAll(Subject.multicast(Fx.fail("first-source-failure"))),
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(Option.getOrThrow(Cause.findErrorOption(exit.cause))).toBe("first-source-failure");
      }
    }).pipe(
      Effect.provideService(Scheduler.MaxOpsBeforeYield, 4),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("hold replays the synchronous first value without starting a second active source", () =>
    Effect.gen(function* () {
      const emitted = yield* Deferred.make<void>();
      const release = yield* Deferred.make<void>();
      let starts = 0;
      const source = Fx.make<number>((sink) =>
        Effect.sync(() => {
          starts += 1;
        }).pipe(
          Effect.andThen(sink.onSuccess(1)),
          Effect.andThen(Deferred.succeed(emitted, undefined)),
          Effect.andThen(Deferred.await(release)),
        ),
      );
      const shared = Subject.hold(source);

      const first = yield* Effect.forkScoped(Fx.collectUpTo(shared, 2));
      yield* Deferred.await(emitted);

      expect(yield* Fx.collectUpTo(shared, 1)).toEqual([1]);
      expect(starts).toBe(1);

      yield* Deferred.succeed(release, undefined);
      expect(yield* Fiber.join(first)).toEqual([1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  describe("Service", () => {
    it("should allow defining a Subject as a Service", () =>
      Effect.gen(function* () {
        class MySubject extends Subject.Service<MySubject, number>()("MySubject") {}

        const layer = MySubject.make(1);

        yield* Effect.gen(function* () {
          yield* MySubject.onSuccess(1);
          const result = yield* Fx.collectAll(Fx.take(MySubject, 1));
          expect(result).toEqual([1]);
        }).pipe(Effect.provide(layer));
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
