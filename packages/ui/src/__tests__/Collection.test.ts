import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Scope from "effect/Scope";
import { RefSubject } from "@typed/fx";
import { Window } from "happy-dom";
import { assert, describe, it } from "vitest";
import * as Collection from "../Collection.js";

describe("typed/ui/Collection", () => {
  it("removes an item when its registration scope closes", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState<string>();
      const firstScope = yield* Scope.make();
      const secondScope = yield* Scope.make();

      yield* Collection.register(collection, { id: "first", value: "first" }).pipe(
        Scope.provide(firstScope),
      );
      yield* Collection.register(collection, { id: "second", value: "second" }).pipe(
        Scope.provide(secondScope),
      );
      assert.deepEqual(
        (yield* collection).map((item) => item.id),
        ["first", "second"],
      );

      yield* Scope.close(firstScope, Exit.succeed(undefined));
      assert.deepEqual(
        (yield* collection).map((item) => item.id),
        ["second"],
      );
    }).pipe(Effect.scoped, Effect.runPromise));

  it("keeps a newer registration when an older scope closes", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState<string>();
      const firstScope = yield* Scope.make();
      const secondScope = yield* Scope.make();

      yield* Collection.register(collection, { id: "item", value: "first" }).pipe(
        Scope.provide(firstScope),
      );
      yield* Collection.register(collection, { id: "item", value: "second" }).pipe(
        Scope.provide(secondScope),
      );
      yield* Scope.close(firstScope, Exit.succeed(undefined));

      assert.deepEqual(yield* collection, [{ id: "item", value: "second" }]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("excludes disabled items", () => {
    const enabled = Collection.enabledItems([
      { id: "first" },
      { id: "disabled", disabled: true },
      { id: "second", disabled: false },
    ]);

    assert.deepEqual(
      enabled.map((item) => item.id),
      ["first", "second"],
    );
  });

  it("orders registered elements by their DOM position", () => {
    const window = new Window();
    const first = window.document.createElement("button");
    const second = window.document.createElement("button");
    window.document.body.append(first, second);

    const items = Collection.byDomOrder([
      { id: "second", element: second },
      { id: "first", element: first },
    ]);

    assert.deepEqual(
      items.map((item) => item.id),
      ["first", "second"],
    );
  });

  it("compares values structurally while retaining element identity", () =>
    Effect.gen(function* () {
      const window = new Window();
      const first = window.document.createElement("button");
      const initial = [{ id: "item", element: first, value: { label: "Item" } }] as const;
      const collection = yield* Collection.makeState(initial);
      yield* RefSubject.set(collection, initial);
      const version = yield* collection.version;

      yield* RefSubject.set(collection, [{ id: "item", element: first, value: { label: "Item" } }]);
      assert.strictEqual(yield* collection.version, version);

      const replacement = window.document.createElement("button");
      yield* RefSubject.set(collection, [{ id: "item", element: replacement, value: { label: "Item" } }]);
      assert.notStrictEqual(yield* collection.version, version);
    }).pipe(Effect.scoped, Effect.runPromise));
});
