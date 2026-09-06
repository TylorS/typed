import { Effect } from "effect";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { assert, describe, it } from "vitest";
import * as Menu from "../Menu.js";

describe("typed/ui/Menu", () => {
  it("renders a hydrated native menu popover and trigger", () =>
    Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions" });
      const markup = yield* renderToHtmlString([
        Menu.Trigger({ state, content: "Actions" }),
        Menu.Content({ state, content: Menu.Item({ state, id: "edit", content: "Edit" }) }),
      ]);
      assert.match(markup, /popovertarget="actions"/);
      assert.match(markup, /aria-haspopup="menu"/);
      assert.match(markup, /id="actions"/);
      assert.match(markup, /role="menu"/);
      assert.match(markup, /popover="manual"/);
      assert.match(markup, /role="menuitem"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("renders checkbox, radio, separator, and group semantics", () =>
    Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions" });
      const markup = yield* renderToHtmlString(
        Menu.Group({
          label: "Actions",
          content: [
            Menu.CheckboxItem({ state, id: "pin", checked: true, content: "Pin" }),
            Menu.RadioItem({ state, id: "grid", checked: false, content: "Grid" }),
            Menu.Separator({}),
          ],
        }),
      );

      assert.match(markup, /role="group"/);
      assert.match(markup, /role="menuitemcheckbox"/);
      assert.match(markup, /role="menuitemradio"/);
      assert.match(markup, /aria-checked="true"/);
      assert.match(markup, /role="separator"/);
      assert.match(markup, /aria-orientation="horizontal"/);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));
});
