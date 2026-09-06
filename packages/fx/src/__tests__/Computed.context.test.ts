import { expect, it } from "vitest";
import { Context, Deferred, Effect, Fiber, Option, Scope } from "effect";
import { Fx, RefSubject } from "../index.js";

class Value extends RefSubject.Service<Value, string>()("test/ComputedContext") {}

it.each([
  { name: "map", make: () => RefSubject.map(Value, (value) => value.toUpperCase()) },
  {
    name: "tuple source",
    make: () => RefSubject.map(RefSubject.tuple([Value]), ([value]) => value.toUpperCase()),
  },
  {
    name: "struct source",
    make: () =>
      RefSubject.map(RefSubject.struct({ value: Value }), ({ value }) => value.toUpperCase()),
  },
  {
    name: "nested map",
    make: () =>
      RefSubject.map(
        RefSubject.map(Value, (value) => value.toLowerCase()),
        (value) => value.toUpperCase(),
      ),
  },
  {
    name: "filterMap",
    make: () => RefSubject.filterMap(Value, (value) => Option.some(value.toUpperCase())),
  },
  {
    name: "scan",
    make: () => RefSubject.scan(Value, "", (state, value) => state + value.toUpperCase()),
  },
])("isolates $name subscriptions provided different services in the same Scope", ({ make }) =>
  Effect.gen(function* () {
    const derived = make();
    const first = yield* RefSubject.make("first");
    const second = yield* RefSubject.make("second");
    const firstReady = yield* Deferred.make<void>();
    const secondReady = yield* Deferred.make<void>();
    const firstSeen: string[] = [];
    const secondSeen: string[] = [];
    const scope = yield* Scope.Scope;
    const observe = (
      ref: RefSubject.RefSubject<string>,
      seen: string[],
      ready: Deferred.Deferred<void>,
    ) =>
      Effect.gen(function* () {
        expect(yield* Scope.Scope).toBe(scope);
        expect(yield* derived).toBe((yield* ref).toUpperCase());
        yield* Fx.observe(derived, (value) => {
          if (value === "") return;
          seen.push(value);
          return Deferred.succeed(ready, undefined);
        });
      }).pipe(Effect.provideService(Value.service, ref));

    yield* Effect.forkScoped(observe(first, firstSeen, firstReady));
    yield* Deferred.await(firstReady);
    yield* Effect.forkScoped(observe(second, secondSeen, secondReady));
    yield* Deferred.await(secondReady);
    expect(firstSeen).toEqual(["FIRST"]);
    expect(secondSeen).toEqual(["SECOND"]);
  }).pipe(Effect.scoped, Effect.runPromise),
);

it("reuses sampled projections when returning to the same Context", () =>
  Effect.gen(function* () {
    const first = yield* RefSubject.make("first");
    const second = yield* RefSubject.make("second");
    yield* first;
    yield* second;
    const context = yield* Effect.context<Scope.Scope>();
    const firstContext = Context.add(context, Value.service, first);
    const secondContext = Context.add(context, Value.service, second);
    let projected = 0;
    const derived = RefSubject.map(Value, (value) => {
      projected++;
      return value.toUpperCase();
    });
    const readFirst = derived.pipe(
      Effect.updateContext((_: Context.Context<never>) => firstContext),
    );
    const readSecond = derived.pipe(
      Effect.updateContext((_: Context.Context<never>) => secondContext),
    );
    expect(yield* readFirst).toBe("FIRST");
    expect(yield* readFirst).toBe("FIRST");
    expect(yield* readSecond).toBe("SECOND");
    expect(yield* readFirst).toBe("FIRST");
    expect(projected).toBe(2);
    yield* RefSubject.set(first, "updated");
    expect(yield* readFirst).toBe("UPDATED");
    expect(yield* readSecond).toBe("SECOND");
    expect(projected).toBe(3);
  }).pipe(Effect.scoped, Effect.runPromise));

it("isolates cached current reads across contexts with equal source versions", () =>
  Effect.gen(function* () {
    const derived = RefSubject.map(Value, (value) => value.toUpperCase());
    const first = yield* RefSubject.make("first");
    const second = yield* RefSubject.make("second");
    expect(yield* derived.pipe(Effect.provideService(Value.service, first))).toBe("FIRST");
    expect(yield* derived.pipe(Effect.provideService(Value.service, second))).toBe("SECOND");
  }).pipe(Effect.scoped, Effect.runPromise));

it("keeps sampled scan accumulators local to each service context", () =>
  Effect.gen(function* () {
    const first = yield* RefSubject.make("a");
    const second = yield* RefSubject.make("b");
    yield* first;
    yield* second;
    const derived = RefSubject.scan(Value, "", (state, value) => state + value);
    yield* Effect.gen(function* () {
      expect(yield* derived).toBe("a");
      expect(yield* derived).toBe("a");
      yield* RefSubject.set(Value, "c");
      expect(yield* derived).toBe("ac");
    }).pipe(Effect.provideService(Value.service, first));
    yield* Effect.gen(function* () {
      expect(yield* derived).toBe("b");
      yield* RefSubject.set(Value, "d");
      expect(yield* derived).toBe("bd");
    }).pipe(Effect.provideService(Value.service, second));
  }).pipe(Effect.scoped, Effect.runPromise));

it("shares one upstream run within the same Context and cleans up before remount", () =>
  Effect.gen(function* () {
    const value = yield* RefSubject.make(1);
    let starts = 0;
    const derived = RefSubject.mapEffect(value, (n) =>
      Effect.sync(() => {
        starts++;
        return n;
      }),
    );
    const mount = () =>
      Effect.gen(function* () {
        const ready = yield* Deferred.make<void>();
        const seen: number[] = [];
        const fiber = yield* Effect.forkScoped(
          Fx.observe(derived, (value) => {
            seen.push(value);
            return Deferred.succeed(ready, undefined);
          }),
        );
        yield* Deferred.await(ready);
        yield* Effect.yieldNow;
        return { fiber, seen };
      });
    const first = yield* mount();
    const second = yield* mount();
    expect(starts).toBe(1);
    expect(first.seen).toEqual([1]);
    expect(second.seen).toEqual([1]);
    const subscribed = yield* Effect.race(
      Effect.gen(function* () {
        while ((yield* value.subscriberCount) !== 1) yield* Effect.yieldNow;
        return true;
      }),
      Effect.sleep("100 millis").pipe(Effect.as(false)),
    );
    expect(subscribed).toBe(true);
    yield* Fiber.interrupt(first.fiber);
    expect(yield* value.subscriberCount).toBe(1);
    yield* Fiber.interrupt(second.fiber);
    expect(yield* value.subscriberCount).toBe(0);
    yield* RefSubject.set(value, 2);
    const remounted = yield* mount();
    expect(remounted.seen).toEqual([2]);
    expect(starts).toBe(2);
    yield* Fiber.interrupt(remounted.fiber);
    expect(yield* value.subscriberCount).toBe(0);
  }).pipe(Effect.scoped, Effect.runPromise));

it("keeps one-value computed behavior independent from an active multiple subscription", () =>
  Effect.gen(function* () {
    const value = yield* RefSubject.make(1);
    const derived = RefSubject.map(value, (n) => n * 2);
    const ready = yield* Deferred.make<void>();
    const multiple: number[] = [];
    yield* Effect.forkScoped(
      Fx.observe(derived, (value) => {
        multiple.push(value);
        return Deferred.succeed(ready, undefined);
      }),
    );
    yield* Deferred.await(ready);
    const one = yield* Effect.race(
      Fx.collectAll(derived).pipe(Effect.provideService(RefSubject.CurrentComputedBehavior, "one")),
      Effect.sleep("100 millis").pipe(Effect.as("timed out")),
    );
    expect(one).toEqual([2]);
    yield* RefSubject.set(value, 2);
    expect(multiple).toEqual([2, 4]);
  }).pipe(Effect.scoped, Effect.runPromise));
