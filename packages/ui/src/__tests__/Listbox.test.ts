import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Listbox from "../Listbox.js";

describe("typed/ui/Listbox", () => {
  it("hydrates selection state on the listbox root", () =>
    Effect.gen(function* () {
      const state = yield* Listbox.makeState({ value: "one" });
      const markup = yield* renderToHtmlString(
        Listbox.Root({
          state,
          content: Listbox.Option({ state, id: "one", value: "one", content: "One" }),
        }),
      );
      assert.match(markup, /role="listbox"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="option"/);
      assert.match(markup, /aria-selected="true"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("commits an arrow-key selection once", () =>
    Effect.gen(function* () {
      const state = yield* Listbox.makeState({ value: "one", activeId: "one" });
      const collection = yield* Listbox.makeCollection([
        { id: "one", value: "one" },
        { id: "two", value: "two" },
      ]);
      yield* RefSubject.set(state, yield* state);
      const version = yield* state.version;

      yield* Listbox.move(state, collection, "next");

      assert.strictEqual((yield* state).activeId, "two");
      assert.strictEqual((yield* state).value, "two");
      assert.strictEqual(yield* state.version, version + 1);
    }).pipe(
      Effect.provideService(RefSubject.CurrentComputedBehavior, "one"),
      Effect.scoped,
      Effect.runPromise,
    ));
});
