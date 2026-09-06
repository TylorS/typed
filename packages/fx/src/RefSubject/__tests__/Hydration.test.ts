import { assert, describe, it } from "vitest";
import * as Deferred from "effect/Deferred";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Schema from "effect/Schema";
import * as SchemaIssue from "effect/SchemaIssue";
import * as SchemaTransformation from "effect/SchemaTransformation";
import * as Scope from "effect/Scope";
import * as Stream from "effect/Stream";
import * as Fx from "../../Fx.js";
import * as RefSubject from "../RefSubject.js";

const NumberFromStringExcept13 = Schema.String.pipe(
  Schema.decodeTo(
    Schema.Finite,
    SchemaTransformation.transformOrFail({
      decode: (value) => Effect.succeed(Number(value)),
      encode: (value, options) =>
        value === 13
          ? Effect.fail(
              new SchemaIssue.InvalidValue({ message: "13 cannot be encoded" }, value, options),
            )
          : Effect.succeed(String(value)),
    }),
  ),
);

describe("RefSubject hydration", () => {
  it("keeps make arguments after the leading Schema and honors options.eq", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.hydrate(Schema.Finite, Effect.succeed(1), {
        eq: () => true,
      });

      assert.strictEqual(yield* ref, 1);
      assert.strictEqual(typeof ref, "function");
      assert.strictEqual(RefSubject.isHydrationRef(ref), true);
      assert.strictEqual(RefSubject.isRefSubject(ref), true);
      assert.strictEqual(Fx.isFx(ref), true);
      yield* RefSubject.set(ref, 1);
      const version = yield* ref.version;

      yield* RefSubject.set(ref, 2);
      assert.strictEqual(yield* ref.version, version);
      assert.strictEqual(yield* ref, 2);
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("derives equality from the Schema by default", () =>
    Effect.gen(function* () {
      const Value = Schema.Struct({ count: Schema.Finite });
      const initial = { count: 1 };
      const ref = yield* RefSubject.hydrate(Value, initial);
      yield* RefSubject.set(ref, initial);
      const version = yield* ref.version;

      yield* RefSubject.set(ref, { count: 1 });

      assert.strictEqual(yield* ref.version, version);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses the DOM value as the first initialization without evaluating an Effect initializer", () =>
    Effect.gen(function* () {
      let initialized = 0;
      const ref = yield* RefSubject.hydrate(
        Schema.Finite,
        Effect.sync(() => {
          initialized++;
          return 0;
        }),
      );
      const values: number[] = [];
      yield* Effect.forkChild(
        Fx.observe(ref, (value) => {
          values.push(value);
        }),
      );
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(initialized, 0);
      assert.deepStrictEqual(values, []);

      yield* ref(makeElement('{"version":1,"values":[7]}'));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(initialized, 0);
      assert.deepStrictEqual(values, [7]);
      assert.strictEqual(yield* ref, 7);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("initializes from the DOM before continuing with an Fx", () =>
    Effect.gen(function* () {
      const release = yield* Deferred.make<void>();
      let started = 0;
      const source = Fx.make<number>((sink) =>
        Effect.gen(function* () {
          yield* Effect.sync(() => started++);
          yield* Deferred.await(release);
          yield* sink.onSuccess(0);
          yield* sink.onSuccess(1);
        }),
      );
      const ref = yield* RefSubject.hydrate(Schema.Finite, source);
      const values: number[] = [];
      yield* Effect.forkChild(
        Fx.observe(ref, (value) => {
          values.push(value);
          return Effect.void;
        }),
      );
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 0);
      assert.deepStrictEqual(values, []);

      yield* ref(makeElement('{"version":1,"values":[7]}'));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 1);
      assert.deepStrictEqual(values, [7]);

      yield* Deferred.succeed(release, undefined);
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.deepStrictEqual(values, [7, 0, 1]);
      assert.strictEqual(yield* ref, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("initializes from the DOM before continuing with a Stream", () =>
    Effect.gen(function* () {
      const release = yield* Deferred.make<void>();
      let started = 0;
      const source = Stream.unwrap(
        Effect.gen(function* () {
          yield* Effect.sync(() => started++);
          yield* Deferred.await(release);
          return Stream.fromIterable([0, 1]);
        }),
      );
      const ref = yield* RefSubject.hydrate(Schema.Finite, source);
      const values: number[] = [];
      yield* Effect.forkChild(
        Fx.observe(ref, (value) => {
          values.push(value);
          return Effect.void;
        }),
      );
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 0);
      assert.deepStrictEqual(values, []);

      yield* ref(makeElement('{"version":1,"values":[7]}'));
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.strictEqual(started, 1);
      assert.deepStrictEqual(values, [7]);

      yield* Deferred.succeed(release, undefined);
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.deepStrictEqual(values, [7, 0, 1]);
      assert.strictEqual(yield* ref, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses the original Fx and Stream initializers for server serialization", () =>
    Effect.gen(function* () {
      const fx = yield* RefSubject.hydrate(Schema.Finite, Fx.fromIterable([1]));
      const stream = yield* RefSubject.hydrate(Schema.Finite, Stream.fromIterable([2]));

      const attributes = yield* RefSubject.hydrateAll(fx, stream)[RefSubject.HydrationRefTypeId]
        .toAttributes;

      assert.deepStrictEqual(attributes, [
        {
          name: RefSubject.HYDRATION_ATTRIBUTE,
          value: '{"version":1,"values":[1,2]}',
        },
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses the original Fx and Stream initializers when DOM metadata is absent", () =>
    Effect.gen(function* () {
      const fx = yield* RefSubject.hydrate(Schema.Finite, Fx.fromIterable([1, 2]));
      const stream = yield* RefSubject.hydrate(Schema.Finite, Stream.fromIterable([3, 4]));

      yield* RefSubject.hydrateAll(fx, stream)(makeElement(null));

      assert.strictEqual(yield* fx, 2);
      assert.strictEqual(yield* stream, 4);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("round-trips transformed values through the hydration attribute", () =>
    Effect.gen(function* () {
      const Value = Schema.Struct({ at: Schema.Date, total: Schema.BigInt });
      const server = yield* RefSubject.hydrate(Value, {
        at: new Date("2026-08-21T00:00:00.000Z"),
        total: 42n,
      });
      const attributes = yield* server[RefSubject.HydrationRefTypeId].toAttributes;
      const element = makeElement(attributes[0].value);
      const client = yield* RefSubject.hydrate(Value, { at: new Date(0), total: 0n });

      yield* client(element);

      assert.deepStrictEqual(yield* client, {
        at: new Date("2026-08-21T00:00:00.000Z"),
        total: 42n,
      });
      assert.strictEqual(element.getAttribute(RefSubject.HYDRATION_ATTRIBUTE), null);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves the make initializer when hydration metadata is absent", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.hydrate(Schema.Finite, 3);

      yield* ref(makeElement(null));

      assert.strictEqual(yield* ref, 3);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates a composed tuple in argument order", () =>
    Effect.gen(function* () {
      const serverCount = yield* RefSubject.hydrate(Schema.Finite, 2);
      const serverWhen = yield* RefSubject.hydrate(
        Schema.Date,
        new Date("2026-08-21T12:00:00.000Z"),
      );
      const attributes = yield* RefSubject.hydrateAll(serverCount, serverWhen)[
        RefSubject.HydrationRefTypeId
      ].toAttributes;

      const clientCount = yield* RefSubject.hydrate(Schema.Finite, 0);
      const clientWhen = yield* RefSubject.hydrate(Schema.Date, new Date(0));
      yield* RefSubject.hydrateAll(clientCount, clientWhen)(makeElement(attributes[0].value));

      assert.strictEqual(yield* clientCount, 2);
      assert.strictEqual((yield* clientWhen).toISOString(), "2026-08-21T12:00:00.000Z");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("serializes a named member as a scalar data attribute", () =>
    Effect.gen(function* () {
      const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 7, { name: "page" });

      const attributes = yield* page[RefSubject.HydrationRefTypeId].toAttributes;

      assert.deepStrictEqual(attributes, [{ name: "data-page", value: "7" }]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("groups unnamed members and preserves named members in argument order", () =>
    Effect.gen(function* () {
      const first = yield* RefSubject.hydrate(Schema.Finite, 1);
      const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 3, { name: "page" });
      const second = yield* RefSubject.hydrate(Schema.Finite, 2);

      const attributes = yield* RefSubject.hydrateAll(first, page, second)[
        RefSubject.HydrationRefTypeId
      ].toAttributes;

      assert.deepStrictEqual(attributes, [
        {
          name: RefSubject.HYDRATION_ATTRIBUTE,
          value: '{"version":1,"values":[1,2]}',
        },
        { name: "data-page", value: "3" },
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("rejects unsafe, empty, and reserved hydration names", () => {
    for (const name of ["", "typed-refsubject", 'x" onclick="alert(1)']) {
      assert.throws(() => RefSubject.hydrate(Schema.FiniteFromString, 1, { name }), TypeError);
    }
  });

  it("rejects duplicate normalized hydration names during composition", () =>
    Effect.gen(function* () {
      const first = yield* RefSubject.hydrate(Schema.FiniteFromString, 1, { name: "page" });
      const second = yield* RefSubject.hydrate(Schema.FiniteFromString, 2, { name: "PAGE" });

      assert.throws(
        () => RefSubject.hydrateAll(first, second),
        /Duplicate hydration attribute: data-page/,
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates, retains, and minimally synchronizes a named attribute", () =>
    Effect.gen(function* () {
      let initialized = 0;
      const state = yield* RefSubject.hydrate(
        Schema.FiniteFromString,
        Effect.sync(() => {
          initialized++;
          return 0;
        }),
        { name: "page" },
      );
      const { element, writes } = makeAttributeElement({ "data-page": "7" });
      const hydrationScope = yield* Scope.make();

      yield* state(element).pipe(Effect.provideService(Scope.Scope, hydrationScope));
      yield* settle;

      assert.strictEqual(initialized, 0);
      assert.strictEqual(yield* state.subscriberCount, 1);
      assert.strictEqual(yield* state, 7);
      assert.strictEqual(element.getAttribute("data-page"), "7");
      assert.deepStrictEqual(writes, []);

      yield* RefSubject.set(state, 8);
      yield* settle;
      assert.strictEqual(element.getAttribute("data-page"), "8");
      assert.deepStrictEqual(writes, [{ name: "data-page", value: "8" }]);

      yield* RefSubject.set(state, 8);
      yield* settle;
      assert.deepStrictEqual(writes, [{ name: "data-page", value: "8" }]);

      yield* Scope.close(hydrationScope, Exit.void);
      yield* settle;
      assert.strictEqual(yield* state.subscriberCount, 0);

      yield* RefSubject.set(state, 9);
      yield* settle;
      assert.strictEqual(element.getAttribute("data-page"), "8");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("initializes and writes a missing named attribute before synchronization", () =>
    Effect.gen(function* () {
      const state = yield* RefSubject.hydrate(Schema.FiniteFromString, 3, { name: "page" });
      const { element, writes } = makeAttributeElement();

      yield* state(element);
      yield* settle;

      assert.strictEqual(element.getAttribute("data-page"), "3");
      assert.deepStrictEqual(writes, [{ name: "data-page", value: "3" }]);
      assert.strictEqual(yield* state.subscriberCount, 1);
      assert.strictEqual(yield* state, 3);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("samples composed hydration members with unbounded concurrency", () =>
    Effect.gen(function* () {
      let running = 0;
      let maxRunning = 0;
      const initial = (value: number) =>
        Effect.gen(function* () {
          running++;
          maxRunning = Math.max(maxRunning, running);
          yield* Effect.yieldNow;
          running--;
          return value;
        });
      const first = yield* RefSubject.hydrate(Schema.Finite, initial(1));
      const second = yield* RefSubject.hydrate(Schema.Finite, initial(2));

      yield* RefSubject.hydrateAll(first, second)[RefSubject.HydrationRefTypeId].toAttributes;

      assert.strictEqual(maxRunning, 2);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("keeps a missing named initializer failure on the state", () =>
    Effect.gen(function* () {
      const state = yield* RefSubject.hydrate(
        Schema.FiniteFromString,
        Effect.fail("initializer failed"),
        { name: "page" },
      );
      const { element } = makeAttributeElement();

      const hydrationExit = yield* Effect.exit(state(element));
      const stateExit = yield* Effect.exit(state);
      yield* settle;

      assert.strictEqual(Exit.isSuccess(hydrationExit), true);
      assert.strictEqual(Exit.isFailure(stateExit), true);
      assert.strictEqual(yield* state.subscriberCount, 1);

      yield* RefSubject.set(state, 4);
      yield* settle;
      assert.strictEqual(yield* state, 4);
      assert.strictEqual(element.getAttribute("data-page"), "4");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("isolates named synchronization encode failures", () =>
    Effect.gen(function* () {
      const failing = yield* RefSubject.hydrate(NumberFromStringExcept13, 1, { name: "failing" });
      const healthy = yield* RefSubject.hydrate(Schema.FiniteFromString, 2, { name: "healthy" });
      const { element } = makeAttributeElement({
        "data-failing": "1",
        "data-healthy": "2",
      });

      yield* RefSubject.hydrateAll(failing, healthy)(element);
      yield* settle;

      yield* RefSubject.set(failing, 13);
      yield* settle;

      assert.strictEqual(Exit.isFailure(yield* Effect.exit(failing)), true);
      assert.strictEqual(element.getAttribute("data-failing"), "1");
      assert.strictEqual(yield* healthy.subscriberCount, 1);

      yield* RefSubject.set(healthy, 3);
      yield* settle;
      assert.strictEqual(element.getAttribute("data-healthy"), "3");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("recovers from an initial named encode failure without stopping sibling synchronization", () =>
    Effect.gen(function* () {
      const failing = yield* RefSubject.hydrate(NumberFromStringExcept13, 13, { name: "failing" });
      const healthy = yield* RefSubject.hydrate(Schema.FiniteFromString, 2, { name: "healthy" });
      const { element } = makeAttributeElement();

      yield* RefSubject.hydrateAll(failing, healthy)(element);
      yield* settle;

      assert.strictEqual(Exit.isFailure(yield* Effect.exit(failing)), true);
      assert.strictEqual(element.getAttribute("data-failing"), null);
      assert.strictEqual(element.getAttribute("data-healthy"), "2");
      assert.strictEqual(yield* failing.subscriberCount, 1);
      assert.strictEqual(yield* healthy.subscriberCount, 1);

      yield* RefSubject.set(failing, 14);
      yield* settle;
      assert.strictEqual(yield* failing, 14);
      assert.strictEqual(element.getAttribute("data-failing"), "14");

      yield* RefSubject.set(healthy, 3);
      yield* settle;
      assert.strictEqual(element.getAttribute("data-healthy"), "3");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("isolates malformed named attributes while other named members hydrate and synchronize", () =>
    Effect.gen(function* () {
      const page = yield* RefSubject.hydrate(Schema.FiniteFromString, 0, { name: "page" });
      const size = yield* RefSubject.hydrate(Schema.FiniteFromString, 0, { name: "size" });
      const { element } = makeAttributeElement({
        "data-page": "not-a-number",
        "data-size": "4",
      });

      yield* RefSubject.hydrateAll(page, size)(element);
      yield* settle;

      assert.strictEqual(Exit.isFailure(yield* Effect.exit(page)), true);
      assert.strictEqual(yield* size, 4);
      assert.strictEqual(element.getAttribute("data-page"), "not-a-number");
      assert.strictEqual(element.getAttribute("data-size"), "4");
      assert.strictEqual(yield* page.subscriberCount, 1);
      assert.strictEqual(yield* size.subscriberCount, 1);

      yield* RefSubject.set(page, 6);
      yield* RefSubject.set(size, 5);
      yield* settle;
      assert.strictEqual(element.getAttribute("data-page"), "6");
      assert.strictEqual(element.getAttribute("data-size"), "5");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not partially apply a malformed composed tuple", () =>
    Effect.gen(function* () {
      const count = yield* RefSubject.hydrate(Schema.Finite, 0);
      const when = yield* RefSubject.hydrate(Schema.Date, new Date(0));
      const seenCounts: number[] = [];
      const seenDates: Date[] = [];
      yield* Effect.forkChild(
        Fx.observe(count, (value) => {
          seenCounts.push(value);
          return Effect.void;
        }),
      );
      yield* Effect.forkChild(
        Fx.observe(when, (value) => {
          seenDates.push(value);
          return Effect.void;
        }),
      );
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      const element = makeElement('{"version":1,"values":[2,"not-a-date"]}');
      yield* RefSubject.hydrateAll(count, when)(element);
      for (let i = 0; i < 5; i++) yield* Effect.yieldNow;

      assert.deepStrictEqual(seenCounts, []);
      assert.deepStrictEqual(seenDates, []);
      assert.notStrictEqual(element.getAttribute(RefSubject.HYDRATION_ATTRIBUTE), null);
      assert.strictEqual(Exit.isFailure(yield* Effect.exit(count)), true);
      assert.strictEqual(Exit.isFailure(yield* Effect.exit(when)), true);
    }).pipe(Effect.scoped, Effect.runPromise));
});

const settle = Effect.gen(function* () {
  for (let i = 0; i < 5; i++) yield* Effect.yieldNow;
});

function makeAttributeElement(initial: Readonly<Record<string, string>> = {}) {
  const attributes = new Map(Object.entries(initial));
  const writes: Array<{ readonly name: string; readonly value: string }> = [];
  const element: RefSubject.HydrationElement = {
    getAttribute: (name) => attributes.get(name) ?? null,
    setAttribute: (name, value) => {
      attributes.set(name, value);
      writes.push({ name, value });
    },
    removeAttribute: (name) => {
      attributes.delete(name);
    },
  };
  return { element, writes };
}

function makeElement(initial: string | null): RefSubject.HydrationElement {
  let value: string | null = initial;
  return {
    getAttribute: (name) => (name === RefSubject.HYDRATION_ATTRIBUTE ? value : null),
    setAttribute: (name, next) => {
      if (name === RefSubject.HYDRATION_ATTRIBUTE) value = next;
    },
    removeAttribute: (name) => {
      if (name === RefSubject.HYDRATION_ATTRIBUTE) value = null;
    },
  };
}
