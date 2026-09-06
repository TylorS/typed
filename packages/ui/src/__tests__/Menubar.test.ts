import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Menubar from "../Menubar.js";

describe("typed/ui/Menubar", () => {
  it("hydrates composite state on a semantic menubar", () =>
    Effect.gen(function* () {
      const state = yield* Menubar.makeState({ activeId: "file" });
      const markup = yield* renderToHtmlString(Menubar.Root({ state, content: "File" }));
      assert.match(markup, /role="menubar"/);
      assert.match(markup, /data-typed-refsubject=/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders roving menubar items", () =>
    Effect.gen(function* () {
      const state = yield* Menubar.makeState({ activeId: "file" });
      const markup = yield* renderToHtmlString(Menubar.Item({ state, id: "file", content: "File" }));
      assert.match(markup, /role="menuitem"/);
      assert.match(markup, /tabindex="0"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
