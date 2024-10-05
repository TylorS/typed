import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import * as Sink from "@typed/fx/Sink";
import { fromStream } from "@typed/fx/Stream";
import * as Subject from "@typed/fx/Subject";
import * as Cause from "effect/Cause";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Option from "effect/Option";
import * as Schedule from "effect/Schedule";
import * as Stream from "effect/Stream";

describe(__filename, () => {
  it("maps a success value", async () => {
    const test = Fx.succeed(1).pipe(
      Fx.map((x) => x + 1),
      Fx.map((x) => x + 1),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([3]);
  });

  it("maps multiple values", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.map((x) => x + 1),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([2, 3, 4]);
  });

  it("maps a failure value", async () => {
    const test = Fx.fail(1).pipe(
      Fx.mapError((x) => x + 1),
      Fx.mapError((x) => x + 1),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(Effect.either(test));

    expect(array).toEqual(Either.left(3));
  });

  it("switchMap favors the latest inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.switchMap((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray,
      Effect.scoped
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual(["4"]);
  });

  it("exhaustMap favors the first inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.exhaustMap((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray,
      Effect.scoped
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual(["2"]);
  });

  it("exhaustMapLatest favors the first and last inner Fx", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.exhaustMapLatest((x) => Fx.succeed(String(x + 1))),
      Fx.toReadonlyArray,
      Effect.scoped
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual(["2", "4"]);
  });

  it("mergeBuffer keeps the ordering of streams", async () => {
    const test = Fx.mergeOrdered([
      Fx.fromEffect(Effect.succeed(1)),
      Fx.make<number>((sink) =>
        Effect.gen(function* (_) {
          yield* _(Effect.sleep(100));
          yield* _(sink.onSuccess(2));
          yield* _(Effect.sleep(100));
          yield* _(sink.onSuccess(3));
        })
      ),
      fromStream(Stream.fromIterable([4, 5, 6])),
      Fx.fromEffect(Effect.delay(Effect.succeed(7), 50)),
    ]).pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  describe("sharing", () => {
    describe("multicast", () => {
      it("shares a value", async () => {
        let i = 0;
        const iterator = Effect.sync(() => i++);

        const sut = Fx.periodic(iterator, 100).pipe(
          Fx.take(5),
          Fx.multicast,
          Fx.toReadonlyArray
        );

        const test = Effect.gen(function* (_) {
          // start first fiber
          const a = yield* _(Effect.fork(sut));

          // Allow fiber to start
          yield* _(Effect.sleep(1));

          // Allow 2 events to occur
          yield* _(Effect.sleep(200));

          // Start the second
          const b = yield* _(Effect.fork(sut));

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4]);
          expect(yield* _(Fiber.join(b))).toEqual([2, 3, 4]);
        }).pipe(Effect.retry(Schedule.recurUpTo(3)), Effect.scoped);

        await Effect.runPromise(test);
      });
    });

    describe("hold", () => {
      it("shares a value with replay of the last", async () => {
        let i = 0;
        const delay = 100;
        const iterator = Effect.sync(() => i++);

        const sut = Fx.periodic(iterator, delay).pipe(
          Fx.take(5),
          Fx.hold,
          Fx.toReadonlyArray
        );

        const test = Effect.gen(function* (_) {
          // start first fiber
          const a = yield* _(Effect.fork(sut));

          // Allow fiber to start
          yield* _(Effect.sleep(0));

          // Allow 2 events to occur
          yield* _(Effect.sleep(delay * 2));

          // Start the second
          const b = yield* _(Effect.fork(sut));

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4]);
          expect(yield* _(Fiber.join(b))).toEqual([1, 2, 3, 4]);
        }).pipe(Effect.retry(Schedule.recurUpTo(3)), Effect.scoped);

        await Effect.runPromise(test);
      });
    });

    describe("replay", () => {
      it("shares a value with replay of the last N events", async () => {
        let i = 0;
        const iterator = Effect.sync(() => i++);
        const delay = 100;

        const sut = Fx.periodic(iterator, delay).pipe(
          Fx.take(5),
          Fx.replay(2),
          Fx.toReadonlyArray
        );

        const test = Effect.gen(function* (_) {
          // start first fiber
          const a = yield* _(Effect.fork(sut));

          // Allow fiber to start + 2 events
          yield* _(Effect.sleep(delay * 2));

          // Start the second
          const b = yield* _(Effect.fork(sut));

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4]);
          expect(yield* _(Fiber.join(b))).toEqual([0, 1, 2, 3, 4]);
        }).pipe(Effect.scoped);

        await Effect.runPromise(test);
      });
    });
  });

  describe("RefSubject", () => {
    it("allows keeping state", async () => {
      const test = Effect.gen(function* (_) {
        const ref = yield* _(RefSubject.of(0));

        expect(yield* _(ref)).toEqual(0);

        yield* _(RefSubject.set(ref, 1));

        expect(yield* _(ref)).toEqual(1);

        yield* _(RefSubject.update(ref, (x) => x + 1));

        expect(yield* _(ref)).toEqual(2);

        yield* _(RefSubject.delete(ref));

        expect(yield* _(ref)).toEqual(0);
      }).pipe(Effect.scoped);

      await Effect.runPromise(test);
    });

    it("allows subscribing to those state changes", async () => {
      const test = Effect.gen(function* (_) {
        const ref = yield* _(RefSubject.of(0));

        const fiber = yield* _(
          Effect.fork(Fx.toReadonlyArray(Fx.take(ref, 3)))
        );

        // Allow fiber to start
        yield* _(Effect.sleep(0));

        yield* _(RefSubject.set(ref, 1));
        yield* _(RefSubject.set(ref, 2));

        expect(yield* _(Fiber.join(fiber))).toEqual([0, 1, 2]);
      }).pipe(Effect.scoped);

      await Effect.runPromise(test);
    });

    describe("map to a computed value", () => {
      it("transform success values", async () => {
        const test = Effect.gen(function* (_) {
          const ref = yield* _(RefSubject.of(0));
          const addOne = RefSubject.map(ref, (x) => x + 1);

          expect(yield* _(addOne)).toEqual(1);

          yield* _(RefSubject.set(ref, 1));

          expect(yield* _(addOne)).toEqual(2);

          yield* _(RefSubject.update(ref, (x) => x + 1));

          expect(yield* _(addOne)).toEqual(3);

          yield* _(RefSubject.delete(ref));

          expect(yield* _(addOne)).toEqual(1);
        }).pipe(Effect.scoped);

        await Effect.runPromise(test);
      });
    });

    describe("filterMap to filtered values", () => {
      it("returns Cause.NoSuchElementException when filtered", async () => {
        const test = Effect.gen(function* (_) {
          const ref = yield* _(RefSubject.of(0));
          const filtered = RefSubject.filterMap(
            ref,
            Option.liftPredicate((x) => x % 2 === 0)
          );

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(
            Option.some(0)
          );

          yield* _(RefSubject.set(ref, 1));

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(
            Option.none()
          );

          yield* _(RefSubject.set(ref, 2));

          expect(yield* _(Effect.optionFromOptional(filtered))).toEqual(
            Option.some(2)
          );
        }).pipe(Effect.scoped);

        await Effect.runPromise(test);
      });
    });

    it("allows being initialized by an Effect", async () => {
      const test = Effect.gen(function* (_) {
        const ref = yield* _(
          RefSubject.make(Effect.delay(Effect.succeed(0), 50))
        );

        expect(yield* _(ref)).toEqual(0);

        yield* _(RefSubject.set(ref, 1));

        expect(yield* _(ref)).toEqual(1);

        yield* _(RefSubject.update(ref, (x) => x + 1));

        expect(yield* _(ref)).toEqual(2);

        yield* _(RefSubject.delete(ref));

        expect(yield* _(ref)).toEqual(0);
      }).pipe(Effect.scoped);

      await Effect.runPromise(test);
    });

    it("allows being initialized by an Fx", async () => {
      const test = Effect.gen(function* (_) {
        const ref = yield* _(
          RefSubject.make(Fx.mergeAll([Fx.at("a", 10), Fx.at("z", 50)]))
        );
        yield* _(Effect.sleep(1));

        // Lazily initializes with the first value of the Fx
        expect(yield* _(ref)).toEqual("a");

        // Allows setting a value
        yield* _(RefSubject.set(ref, "b"));
        expect(yield* _(ref)).toEqual("b");

        yield* _(RefSubject.delete(ref));
        expect(yield* _(ref)).toEqual("a");

        yield* _(Effect.sleep(50));

        // Further emitted values reset the current state.
        expect(yield* _(ref)).toEqual("z");

        yield* _(RefSubject.delete(ref));

        expect(yield* _(ref)).toEqual("z");
      });

      await Effect.runPromise(Effect.scoped(test));
    });

    describe("tagged", () => {
      it("allows deferring provision via Effect context", async () => {
        const ref = RefSubject.tagged<number>()("test");
        const test = Effect.gen(function* (_) {
          expect(yield* _(ref)).toEqual(0);

          yield* _(RefSubject.set(ref, 1));

          expect(yield* _(ref)).toEqual(1);

          yield* _(RefSubject.update(ref, (x) => x + 1));

          expect(yield* _(ref)).toEqual(2);

          yield* _(RefSubject.delete(ref));

          expect(yield* _(ref)).toEqual(0);
        }).pipe(Effect.provide(ref.make(Effect.succeed(0))), Effect.scoped);

        await Effect.runPromise(test);
      });

      it("allows being initialized by an Fx", async () => {
        const ref = RefSubject.tagged<string>()("test");
        const test = Effect.gen(function* (_) {
          // Lazily initializes with the first value of the Fx
          expect(yield* _(ref)).toEqual("a");

          // Allows setting a value
          yield* _(RefSubject.set(ref, "b"));
          expect(yield* _(ref)).toEqual("b");

          yield* _(RefSubject.delete(ref));
          expect(yield* _(ref)).toEqual("a");

          yield* _(Effect.sleep(50));

          // Further emitted values reset the current state.
          expect(yield* _(ref)).toEqual("z");

          yield* _(RefSubject.delete(ref));

          expect(yield* _(ref)).toEqual("z");
        }).pipe(
          Effect.provide(
            ref.make(Fx.mergeAll([Fx.at("a", 10), Fx.at("z", 50)]))
          )
        );

        await Effect.runPromise(Effect.scoped(test));
      });

      it("multicasts to multiple subscribers", async () => {
        const ref = RefSubject.tagged<number>()("test");
        const max = 5;
        const delay = 100;
        const sut = ref.pipe(Fx.take(max), Fx.multicast, Fx.toReadonlyArray);

        const test = Effect.gen(function* (_) {
          yield* Effect.fork(
            Effect.gen(function* (_) {
              for (let i = 0; i < max; i++) {
                expect(yield* _(ref)).toEqual(i);
                yield* _(Effect.sleep(delay));
                yield* _(RefSubject.set(ref, i + 1));
              }
            })
          );

          // start first fiber
          const a = yield* _(Effect.fork(sut));

          // Allow 2 events to occur
          yield* _(Effect.sleep(delay * 2));

          // Start the second
          const b = yield* _(Effect.fork(sut));

          // Validate the outputs
          expect(yield* _(Fiber.join(a))).toEqual([0, 1, 2, 3, 4]);
          expect(yield* _(Fiber.join(b))).toEqual([2, 3, 4]);
        }).pipe(
          Effect.provide(ref.make(Effect.succeed(0))),
          Effect.retry(Schedule.recurUpTo(3)),
          Effect.scoped
        );

        await Effect.runPromise(test);
      });
    });

    describe("unsafe", () => {
      it("unsafeGetExit", async () => {
        const test = Effect.gen(function* (_) {
          // of() actually has a starting value by default
          const ref = yield* _(RefSubject.of(0));

          const exit = RefSubject.unsafeGetExit(ref);
          expect(exit).toEqual(Exit.succeed(0));
        }).pipe(Effect.scoped);

        await Effect.runPromise(test);
      });

      it("unsafeGet", async () => {
        const test = Effect.gen(function* (_) {
          const ref = yield* _(RefSubject.make(Effect.succeed(0)));

          expect(RefSubject.unsafeGet(ref)).toEqual(0);
        }).pipe(Effect.scoped);

        await Effect.runPromise(test);
      });
    });
  });

  describe("Subject", () => {
    it("can map the input values using Sink combinators", async () => {
      const subject = Subject.unsafeMake<never, number>();
      const sink = subject.pipe(Sink.map((x: string) => x.length));
      const test = Effect.gen(function* (_) {
        const fiber = yield* _(
          subject,
          Fx.take(3),
          Fx.toReadonlyArray,
          Effect.fork
        );

        // Allow fiber to start
        yield* _(Effect.sleep(0));

        yield* _(sink.onSuccess("a"));
        yield* _(sink.onSuccess("ab"));
        yield* _(sink.onSuccess("abc"));

        expect(yield* _(Fiber.join(fiber))).toEqual([1, 2, 3]);
      }).pipe(Effect.scoped);

      await Effect.runPromise(test);
    });
  });

  // Help me write unit tests for the behaviors of all the public API exposed from @typed/fx/Fx
  // which are not currently quite covered by the above tests.

  describe("Fx.empty", () => {
    it("ends immediately without producing events", async () => {
      const test = Fx.empty.pipe(Fx.toReadonlyArray);

      const array = await Effect.runPromise(test);

      expect(array).toEqual([]);
    });
  });

  describe("Fx.fromIterable", () => {
    it("produces events from an iterable", async () => {
      const test = Fx.fromIterable([1, 2, 3]).pipe(Fx.toReadonlyArray);

      const array = await Effect.runPromise(test);

      expect(array).toEqual([1, 2, 3]);
    });
  });

  describe("Fx.die", () => {
    it("produces a failure", async () => {
      const test = Fx.die("error").pipe(Fx.toReadonlyArray, Effect.exit);
      const exit = await Effect.runPromise(test);

      expect(exit).toEqual(Exit.die("error"));
    });
  });

  // describe("Fx.interrupt", () => {
  //   it("produces a failure", async () => {
  //     const test = Fx.fromEffect(Effect.interrupt(FiberId.none)).pipe(Fx.toReadonlyArray, Effect.exit)
  //     const exit = await Effect.runPromise(test)

  //     expect(exit).toEqual(Exit.interrupt(FiberId.none))
  //   })
  // })

  describe("Fx.fail", () => {
    it("produces a failure", async () => {
      const test = Fx.fail("error").pipe(Fx.toReadonlyArray, Effect.exit);
      const exit = await Effect.runPromise(test);

      expect(exit).toEqual(Exit.fail("error"));
    });
  });

  describe("Fx.make", () => {
    it("produces events from a Sink", async () => {
      const test = Fx.make<number>((sink) =>
        Effect.gen(function* (_) {
          yield* _(sink.onSuccess(1));
          yield* _(sink.onSuccess(2));
          yield* _(sink.onSuccess(3));
        })
      ).pipe(Fx.toReadonlyArray);

      const array = await Effect.runPromise(test);

      expect(array).toEqual([1, 2, 3]);
    });

    it("produces errors from a Sink", async () => {
      const test = Fx.make<never, number>((sink) =>
        Effect.gen(function* (_) {
          yield* _(sink.onFailure(Cause.fail(1)));
          yield* _(sink.onFailure(Cause.fail(2)));
          yield* _(sink.onFailure(Cause.fail(3)));
        })
      ).pipe(Fx.flip, Fx.toReadonlyArray);

      const array = await Effect.runPromise(test);

      expect(array).toEqual([1, 2, 3]);
    });
  });

  describe("Fx.withEmitter", () => {
    it("produces events from an Emitter", async () => {
      const test = Fx.withEmitter<number>((emitter) =>
        Effect.sync(() => {
          emitter.succeed(1);
          emitter.succeed(2);
          emitter.succeed(3);
          emitter.end();
        })
      ).pipe(Fx.toReadonlyArray, Effect.scoped);

      const array = await Effect.runPromise(test);

      expect(array).toEqual([1, 2, 3]);
    });

    it("produces errors from an Emitter", async () => {
      const test = Fx.withEmitter<never, number>((emitter) =>
        Effect.sync(() => {
          emitter.fail(1);
          emitter.fail(2);
          emitter.fail(3);
          emitter.end();
        })
      ).pipe(Fx.flip, Fx.toReadonlyArray, Effect.scoped);

      const array = await Effect.runPromise(test);

      expect(array).toEqual([1, 2, 3]);
    });
  });
});

describe("Fx.sync", () => {
  it("produces a success", async () => {
    const test = Fx.sync(() => 1).pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1]);
  });

  it("produces a failure", async () => {
    const error = new Error("error");
    const test = Fx.sync(() => {
      throw error;
    }).pipe(Fx.toReadonlyArray, Effect.exit);
    const exit = await Effect.runPromise(test);

    expect(exit).toEqual(Exit.die(error));
  });
});

describe("Fx.suspend", () => {
  it("produces a success", async () => {
    const test = Fx.suspend(() => Fx.succeed(1)).pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1]);
  });

  it("produces a failure", async () => {
    const test = Fx.suspend(() => Fx.fail(1)).pipe(
      Fx.toReadonlyArray,
      Effect.either
    );
    const either = await Effect.runPromise(test);

    expect(either).toEqual(Either.left(1));
  });
});

describe("Fx.at", () => {
  it("produces a successful value after the specified delay", async () => {
    const delay = Math.floor(Math.random() * 50 + 100);

    const control = Fx.succeed("a").pipe(Fx.toReadonlyArray, Effect.timed);

    const [controlDuration, controlArray] = await Effect.runPromise(control);

    expect(Math.floor(Duration.toMillis(controlDuration))).toBeLessThan(delay);
    expect(controlArray).toEqual(["a"]);

    const test = Fx.at("a", delay).pipe(Fx.toReadonlyArray, Effect.timed);

    const [duration, array] = await Effect.runPromise(test);

    expect(Math.ceil(Duration.toMillis(duration))).toBeGreaterThanOrEqual(
      delay
    );
    expect(array).toEqual(["a"]);
  });
});

describe("Fx.combine", () => {
  it("combines multiple Fx into a single Fx with an output as an array", async () => {
    const test = Fx.tuple([
      Fx.succeed(1),
      Fx.succeed(2),
      Fx.mergeAll([Fx.succeed(3), Fx.at(4, 50), Fx.at(5, 100)]),
    ]).pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([
      [1, 2, 3],
      [1, 2, 4],
      [1, 2, 5],
    ]);
  });
});

describe("Fx.struct", () => {
  it("combines multiple Fx into a single Fx with an output as a record", async () => {
    const test = Fx.struct({
      a: Fx.succeed(1),
      b: Fx.succeed(2),
      c: Fx.mergeAll([Fx.succeed(3), Fx.at(4, 50), Fx.at(5, 100)]),
    }).pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([
      { a: 1, b: 2, c: 3 },
      { a: 1, b: 2, c: 4 },
      { a: 1, b: 2, c: 5 },
    ]);
  });
});

describe("Fx.race", () => {
  it("returns the first successful value", async () => {
    let runs = 0;
    const inc = Fx.tap(() => runs++);

    const test = Fx.raceAll([
      inc(Fx.at(1, 100)),
      inc(Fx.at(2, 50)),
      inc(Fx.at(3, 150)),
    ]).pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([2]);

    expect(runs).toEqual(1);
  });
});

describe("Fx.merge", () => {
  it("merges multiple Fx into a single Fx with an output as an array", async () => {
    const test = Fx.mergeAll([
      Fx.succeed(1),
      Fx.succeed(2),
      Fx.mergeAll([Fx.succeed(3), Fx.at(4, 50), Fx.at(5, 100)]),
    ]).pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("Fx.schedule", () => {
  it("runs an Effect on a schedule emitting its output values", async () => {
    const schedule = Schedule.recurs(2);
    const effect = Effect.succeed(1);
    const fx = Fx.schedule(effect, schedule);
    const test = fx.pipe(Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 1]);
  });
});

describe("Fx.reduce", () => {
  it("reduces a stream of values into a single value", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.reduce(0, (acc, x) => acc + x)
    );

    const value = await Effect.runPromise(test);

    expect(value).toEqual(6);
  });
});

describe("Fx.filter", () => {
  it("filters values from a stream", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.filter((x) => x % 2 === 0),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([2]);
  });
});

describe("Fx.filterMap", () => {
  it("filters values from a stream", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.filterMap(Option.liftPredicate((x) => x % 2 === 0)),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([2]);
  });
});

describe("Fx.compact", () => {
  it("flattens Option values from a stream", async () => {
    const test = Fx.fromIterable([
      Option.some(1),
      Option.none(),
      Option.some(2),
    ]).pipe(Fx.compact, Fx.toReadonlyArray);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2]);
  });
});

describe("Fx.mapError", () => {
  it("maps errors from a stream", async () => {
    const test = Fx.fail(1).pipe(
      Fx.mapError((x) => x + 1),
      Fx.toReadonlyArray,
      Effect.either
    );

    const either = await Effect.runPromise(test);

    expect(either).toEqual(Either.left(2));
  });
});

describe("Fx.filterError", () => {
  it("filters errors from a stream", async () => {
    const test = Fx.fail(1).pipe(
      Fx.filterError((x) => x === 1),
      Fx.toReadonlyArray,
      Effect.either
    );

    const either = await Effect.runPromise(test);

    expect(either).toEqual(Either.left(1));
  });
});

describe("Fx.take", () => {
  it("takes N values from a stream", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.take(2),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2]);
  });
});

describe("Fx.takeWhile", () => {
  it("takes values from a stream while the predicate is true", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.takeWhile((x) => x < 3),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2]);
  });
});

describe("Fx.takeUntil", () => {
  it("takes values from a stream until the predicate is true", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.takeUntil((x) => x === 3),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2]);
  });
});

describe("Fx.drop", () => {
  it("drops N values from a stream", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.drop(2),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([3]);
  });
});

describe("Fx.dropWhile", () => {
  it("drops values from a stream while the predicate is true", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.dropWhile((x) => x < 3),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([3]);
  });
});

describe("Fx.dropUntil", () => {
  it("drops values from a stream until the predicate is true", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.dropUntil((x) => x === 3),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([3]);
  });
});

describe("Fx.orElse", () => {
  it("allows running an Fx after the failure of another", async () => {
    const test = Fx.fail(1).pipe(
      Fx.orElse(() => Fx.succeed(2)),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([2]);
  });
});

describe("Fx.mapEffect", () => {
  it("maps the inner Effect", async () => {
    const test = Fx.succeed(1).pipe(
      Fx.mapEffect((x) => Effect.succeed(x + 1)),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([2]);
  });
});

describe("Fx.loop", () => {
  it("loops over an Effect until it produces a failure", async () => {
    const test = Fx.fromIterable([1, 2, 3, 4, 5]).pipe(
      Fx.loop(0, (acc, x) => [acc + x, x]),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 3, 5, 7, 9]);
  });
});

describe("Fx.prepend", () => {
  it("starts a stream with a value", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.prepend(0),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([0, 1, 2, 3]);
  });
});

describe("Fx.append", () => {
  it("ends a stream with a value", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.append(4),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2, 3, 4]);
  });
});

describe("Fx.during", () => {
  it("uses a higher-order Fx to take and drop values", async () => {
    let i = 0;
    const iterator = Effect.sync(() => i++);
    const test = Fx.toReadonlyArray(
      Fx.during(Fx.periodic(iterator, 50), Fx.at(Fx.at(null, 100), 100))
    );

    const array = await Effect.runPromise(Effect.scoped(test));

    expect(array).toEqual([2, 3]);
  });
});

describe("Fx.since", () => {
  it("uses an Fx to take values", async () => {
    let i = 0;
    const iterator = Effect.sync(() => i++);
    const test = Fx.periodic(iterator, 50).pipe(
      Fx.since(Fx.at(null, 100)),
      Fx.take(2),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(Effect.scoped(test));

    expect(array).toEqual([2, 3]);
  });
});

describe("Fx.until", () => {
  it("uses an Fx to drop values", async () => {
    let i = 0;
    const iterator = Effect.sync(() => i++);
    const test = Fx.periodic(iterator, 50).pipe(
      Fx.until(Fx.at(null, 100)),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(Effect.scoped(test));

    expect(array).toEqual([0, 1]);
  });
});

describe("Fx.skipRepeats", () => {
  it("skips repeated values", async () => {
    const test = Fx.fromIterable([1, 1, 2, 2, 3, 3]).pipe(
      Fx.skipRepeats,
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2, 3]);
  });
});

describe("Fx.snapshot", () => {
  it("combines the latest value from an Fx with the current value", async () => {
    const test = Fx.fromIterable([1, 2, 3]).pipe(
      Fx.snapshot(Fx.fromIterable(["a", "b", "c"]), (a, b) => a + b),
      Fx.toReadonlyArray
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual(["1c", "2c", "3c"]);
  });
});

describe("Fx.debounce", () => {
  it("debounces values", async () => {
    const test = Fx.mergeAll([Fx.at(1, 50), Fx.at(2, 100), Fx.at(3, 150)]).pipe(
      Fx.debounce(75),
      Fx.toReadonlyArray,
      Effect.scoped
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([3]);
  });
});

describe("Fx.throttle", () => {
  it("throttles values", async () => {
    const test = Fx.mergeAll([Fx.at(1, 50), Fx.at(2, 100), Fx.at(3, 150)]).pipe(
      Fx.throttle(50),
      Fx.toReadonlyArray,
      Effect.scoped
    );

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 3]);
  });
});

describe("Fx.if", () => {
  it("runs an Fx if the predicate is true", async () => {
    const test = Fx.if(Fx.succeed(true), {
      onTrue: Fx.succeed(1),
      onFalse: Fx.succeed(2),
    }).pipe(Fx.toReadonlyArray, Effect.scoped);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1]);
  });

  it("runs an Fx if the predicate is false", async () => {
    const test = Fx.if(Fx.succeed(false), {
      onTrue: Fx.succeed(1),
      onFalse: Fx.succeed(2),
    }).pipe(Fx.toReadonlyArray, Effect.scoped);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([2]);
  });

  it("allows boolean to be an Fx", async () => {
    const test = Fx.if(Fx.mergeAll([Fx.at(true, 50), Fx.at(false, 100)]), {
      onTrue: Fx.succeed(1),
      onFalse: Fx.succeed(2),
    }).pipe(Fx.toReadonlyArray, Effect.scoped);

    const array = await Effect.runPromise(test);

    expect(array).toEqual([1, 2]);
  });
});

describe("Fx.partitionMap", () => {
  it("partitions values into successes and failures", async () => {
    const [oddsFx, evensFx] = Fx.withEmitter<number>((emitter) =>
      Effect.sync(() => {
        emitter.succeed(1);
        emitter.succeed(2);
        emitter.succeed(3);
        emitter.succeed(4);
        emitter.end();
      })
    ).pipe(
      Fx.partitionMap((x) => (x % 2 === 0 ? Either.right(x) : Either.left(x)))
    );

    const [odds, evens] = await Effect.all([
      oddsFx.pipe(Fx.toReadonlyArray),
      evensFx.pipe(Fx.toReadonlyArray),
    ]).pipe(Effect.scoped, Effect.runPromise);

    expect(odds).toEqual([1, 3]);
    expect(evens).toEqual([2, 4]);
  });

  describe("fusion", () => {
    describe("filterMap + tapEffect", () => {
      it("works as expected", async () => {
        const values: Array<number> = [];
        const test = Fx.fromIterable([1, 2, 3]).pipe(
          Fx.filterMap(Option.liftPredicate((x) => x % 2 === 0)),
          Fx.tapEffect((x) => Effect.sync(() => values.push(x))),
          Fx.toReadonlyArray
        );

        const array = await Effect.runPromise(test);

        expect(array).toEqual([2]);
        expect(values).toEqual([2]);
      });
    });
  });
});
