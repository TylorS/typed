import { expect, it } from "vitest";
import { Context, Deferred, Effect, Fiber, Option, Scope } from "effect";
import { Fx, RefSubject } from "../index.js";

class Value extends RefSubject.Service<Value, string>()("test/CompositeContext") {}

type Composite = readonly [string] | { readonly value: string };
const read = (value: Composite) => ("value" in value ? value.value : value[0]);
const composites: ReadonlyArray<{
  readonly name: string;
  readonly make: () => Fx.Fx<Composite, unknown, Value | Scope.Scope> & Effect.Effect<Composite, unknown, Value>;
}> = [
  { name: "tuple", make: () => RefSubject.tuple([Value]) },
  { name: "struct", make: () => RefSubject.struct({ value: Value }) },
  { name: "tuple fallback", make: () => RefSubject.tuple([RefSubject.slice(Value, 0, Infinity)]) },
  {
    name: "struct fallback",
    make: () => RefSubject.struct({ value: RefSubject.slice(Value, 0, Infinity) }),
  },
  {
    name: "computed tuple",
    make: () => RefSubject.tuple([RefSubject.map(Value, (value) => value)]),
  },
  {
    name: "computed struct",
    make: () => RefSubject.struct({ value: RefSubject.map(Value, (value) => value) }),
  },
  {
    name: "filtered tuple",
    make: () => RefSubject.tuple([RefSubject.filterMap(Value, Option.some)]),
  },
  {
    name: "filtered struct",
    make: () => RefSubject.struct({ value: RefSubject.filterMap(Value, Option.some) }),
  },
];

it.each(composites)(
  "isolates concurrent $name publications from separate service Layers",
  ({ make }) =>
    Effect.gen(function* () {
      const composite = make();
      const firstReady = yield* Deferred.make<void>();
      const secondReady = yield* Deferred.make<void>();
      const first: unknown[] = [];
      const second: unknown[] = [];
      const observe = (seen: unknown[], ready: Deferred.Deferred<void>) =>
        Fx.observe(composite, (value) => {
          seen.push(read(value));
          return Deferred.succeed(ready, undefined);
        });
      yield* Effect.forkScoped(
        observe(first, firstReady).pipe(Effect.provide(Value.make("first"))),
      );
      yield* Deferred.await(firstReady);
      yield* Effect.forkScoped(
        observe(second, secondReady).pipe(Effect.provide(Value.make("second"))),
      );
      yield* Deferred.await(secondReady);
      expect(first).toEqual(["first"]);
      expect(second).toEqual(["second"]);
    }).pipe(Effect.scoped, Effect.runPromise),
);

it.each(composites)(
  "isolates concurrent $name current reads while initializers are pending",
  ({ make }) =>
    Effect.gen(function* () {
      const release = yield* Deferred.make<void>();
      const firstStarted = yield* Deferred.make<void>();
      const secondStarted = yield* Deferred.make<void>();
      const create = (value: string, started: Deferred.Deferred<void>) =>
        RefSubject.make(
          Deferred.succeed(started, undefined).pipe(
            Effect.andThen(Deferred.await(release)),
            Effect.as(value),
          ),
        );
      const first = yield* create("first", firstStarted);
      const second = yield* create("second", secondStarted);
      const context = yield* Effect.context<Scope.Scope>();
      const firstContext = Context.add(context, Value.service, first);
      const secondContext = Context.add(context, Value.service, second);
      const composite = make();
      const firstRead = yield* Effect.forkScoped(
        composite.pipe(Effect.updateContext((_: Context.Context<never>) => firstContext)),
      );
      yield* Deferred.await(firstStarted);
      const secondRead = yield* Effect.forkScoped(
        composite.pipe(Effect.updateContext((_: Context.Context<never>) => secondContext)),
      );
      const independent = yield* Effect.race(
        Deferred.await(secondStarted).pipe(Effect.as(true)),
        Effect.sleep("100 millis").pipe(Effect.as(false)),
      );
      yield* Deferred.succeed(release, undefined);
      const firstValue = yield* Fiber.join(firstRead);
      const secondValue = yield* Fiber.join(secondRead);
      expect(independent).toBe(true);
      expect(read(firstValue)).toBe("first");
      expect(read(secondValue)).toBe("second");
    }).pipe(Effect.scoped, Effect.runPromise),
);

it.each(composites)(
  "keeps $name updates isolated when both owners start with the same value",
  ({ make }) =>
    Effect.gen(function* () {
      const first = yield* RefSubject.make("initial");
      const second = yield* RefSubject.make("initial");
      const composite = make();
      const firstSeen: string[] = [];
      const secondSeen: string[] = [];
      const observe = (values: string[]) =>
        Fx.observe(composite, (value) => {
          values.push(read(value));
        });
      yield* Effect.forkScoped(
        observe(firstSeen).pipe(Effect.provideService(Value.service, first)),
      );
      yield* Effect.forkScoped(
        observe(secondSeen).pipe(Effect.provideService(Value.service, second)),
      );
      const subscribed = yield* Effect.race(
        Effect.gen(function* () {
          while ((yield* first.subscriberCount) < 1 || (yield* second.subscriberCount) < 1) {
            yield* Effect.yieldNow;
          }
          return true;
        }),
        Effect.sleep("100 millis").pipe(Effect.as(false)),
      );
      expect(subscribed).toBe(true);
      yield* RefSubject.set(first, "changed");
      expect(firstSeen.at(-1)).toBe("changed");
      expect(secondSeen).toEqual(["initial"]);
    }).pipe(Effect.scoped, Effect.runPromise),
);
