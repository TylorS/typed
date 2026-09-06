import * as Effect from "effect/Effect";
import { RefSubject } from "@typed/fx";
import { Window } from "happy-dom";
import { assert, describe, it } from "vitest";
import * as Collection from "../Collection.js";
import * as Composite from "../Composite.js";

describe("typed/ui/Composite", () => {
  it("hydrates active state and moves through enabled items", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState([
        { id: "first" },
        { id: "disabled", disabled: true },
        { id: "last" },
      ]);
      const state = yield* Composite.makeState({ activeId: "first" });

      assert.strictEqual(RefSubject.isHydrationRef(state), true);
      assert.strictEqual((yield* Composite.move({ state, collection }, "next")).activeId, "last");
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("derives roving tabindex and virtual active descendants", () =>
    Effect.gen(function* () {
      const state = yield* Composite.makeState({ activeId: "first" });

      assert.strictEqual(yield* Composite.tabIndex(state, "first"), 0);
      assert.strictEqual(yield* Composite.tabIndex(state, "second"), -1);
      assert.strictEqual(yield* Composite.activeDescendant(state), undefined);

      yield* RefSubject.update(state, (current) => ({ ...current, virtualFocus: true }));
      assert.strictEqual(yield* Composite.tabIndex(state, "first"), -1);
      assert.strictEqual(yield* Composite.activeDescendant(state), "first");
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("maps composite keys and skips non-text typeahead keys", () => {
    assert.strictEqual(
      Composite.keyMove({ key: "ArrowRight" }, { orientation: "horizontal", rtl: true }),
      "previous",
    );
    assert.strictEqual(
      Composite.keyMove({ key: "ArrowDown" }, { orientation: "vertical" }),
      "next",
    );
    assert.strictEqual(Composite.keyMove({ key: "Home" }, {}), "first");
    assert.strictEqual(Composite.typeaheadKey({ key: "a" }), "a");
    assert.strictEqual(Composite.typeaheadKey({ key: "ArrowDown" }), null);
    assert.strictEqual(Composite.typeaheadKey({ key: "a", ctrlKey: true }), null);
  });

  it("handles keyboard movement and finds enabled typeahead matches", () =>
    Effect.gen(function* () {
      const collection = yield* Collection.makeState([
        { id: "archive", textValue: "Archive" },
        { id: "rename", textValue: "Rename", disabled: true },
        { id: "remove", textValue: "Remove" },
      ]);
      const state = yield* Composite.makeState({ activeId: "archive", orientation: "vertical" });
      let prevented = 0;

      assert.strictEqual(
        yield* Composite.moveByKey(
          { key: "ArrowDown", preventDefault: () => prevented++ },
          { state, collection },
        ),
        true,
      );
      assert.strictEqual(prevented, 1);
      assert.strictEqual((yield* state).activeId, "remove");
      assert.strictEqual(Composite.typeahead(yield* collection, "re"), "remove");
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("updates and resets the typeahead buffer", () => {
    assert.deepEqual(Composite.updateTypeaheadBuffer({ value: "a", updatedAt: 100 }, "b", 400), {
      value: "ab",
      updatedAt: 400,
    });
    assert.deepEqual(Composite.updateTypeaheadBuffer({ value: "a", updatedAt: 100 }, "b", 700), {
      value: "b",
      updatedAt: 700,
    });
  });

  it("starts next navigation at the first item when the active id is stale", () => {
    assert.strictEqual(
      Composite.moveActiveId(
        [{ id: "first" }, { id: "second" }],
        { activeId: "missing", loop: true },
        "next",
      ),
      "first",
    );
  });

  it("moves focus through registered enabled elements", () =>
    Effect.gen(function* () {
      const window = new Window();
      const first = window.document.createElement("button");
      const second = window.document.createElement("button");
      window.document.body.append(first, second);
      const collection = yield* Collection.makeState([
        { id: "first", element: first },
        { id: "second", element: second },
      ]);
      const state = yield* Composite.makeState({ activeId: "first" });

      yield* Composite.moveAndFocus({ state, collection }, "next");
      assert.strictEqual((yield* state).activeId, "second");
      assert.strictEqual(window.document.activeElement, second);
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));
});
