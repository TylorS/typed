import { Effect } from "effect";
import { HtmlRenderTemplate, html, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Tree from "../Tree.js";

describe("typed/ui/Tree", () => {
  it("hydrates active and expanded item state on the tree root", () =>
    Effect.gen(function* () {
      const state = yield* Tree.makeState({ activeId: "root", expandedIds: ["root"] });
      const markup = yield* renderToHtmlString(
        Tree.Root({
          state,
          label: "Files",
          content: Tree.Item({
            state,
            id: "root",
            hasChildren: true,
            content: html`Root${Tree.Group({ state, parentId: "root", content: Tree.Item({ state, id: "child", parentId: "root", content: "Child" }) })}`,
          }),
        }),
      );

      assert.match(markup, /role="tree"/);
      assert.match(markup, /aria-label="Files"/);
      assert.match(markup, /data-typed-refsubject=/);
      assert.match(markup, /role="treeitem"/);
      assert.match(markup, /aria-expanded="true"/);
      assert.match(markup, /role="group"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
