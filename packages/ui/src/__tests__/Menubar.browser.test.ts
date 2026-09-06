import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Menu from "../Menu.js";
import * as Menubar from "../Menubar.js";

describe("typed/ui/Menubar in browsers", () => {
  it("focuses its first item when the menubar receives focus", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menubar.makeState();
      const collection = yield* Menubar.makeCollection();
      yield* render(
        Menubar.Root({
          state,
          collection,
          content: [
            Menubar.Item({ state, collection, id: "file", content: "File" }),
            Menubar.Item({ state, collection, id: "edit", content: "Edit" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector('[role="menubar"]') as HTMLDivElement).focus();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "file");
      assert.strictEqual(document.activeElement?.id, "file");
      assert.strictEqual(document.querySelectorAll('[tabindex="0"]').length, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("activates a role-only menu item with Enter", async () => {
    document.body.replaceChildren();
    let activations = 0;
    await Effect.gen(function* () {
      const state = yield* Menubar.makeState({ activeId: "file" });
      const collection = yield* Menubar.makeCollection();
      yield* render(
        Menubar.Root({
          state,
          collection,
          content: Menubar.Item({
            state,
            collection,
            id: "file",
            content: "File",
            onclick: Effect.sync(() => activations++),
          }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      document
        .querySelector("#file")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual(activations, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("opens a nested menu from its active submenu trigger", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menubar.makeState({ activeId: "file" });
      const collection = yield* Menubar.makeCollection();
      const submenu = yield* Menu.makeState({ id: "file-menu" });
      const submenuCollection = yield* Menu.makeCollection();
      yield* render(
        [
          Menubar.Root({
            state,
            collection,
            content: [
              Menu.SubmenuTrigger({ state, submenu, collection, id: "file", content: "File" }),
              Menubar.Item({ state, collection, id: "view", content: "View" }),
            ],
          }),
          Menu.Content({
            state: submenu,
            collection: submenuCollection,
            content: Menu.Item({
              state: submenu,
              collection: submenuCollection,
              id: "new",
              content: "New",
            }),
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("#file") as HTMLButtonElement;
      const context = yield* Effect.context();
      trigger.focus();
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.promise(() =>
        vi.waitFor(
          () =>
            Effect.runPromiseWith(context)(submenu).then((value) => {
              assert.strictEqual(value.open, true);
              assert.strictEqual(document.activeElement?.id, "new");
            }),
          { interval: 10, timeout: 500 },
        ),
      );

      (document.querySelector("#new") as HTMLDivElement).dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      yield* Effect.promise(() =>
        vi.waitFor(
          () =>
            Promise.all([
              Effect.runPromiseWith(context)(submenu),
              Effect.runPromiseWith(context)(state),
            ]).then(([submenuValue, stateValue]) => {
              assert.strictEqual(submenuValue.open, false);
              assert.strictEqual(stateValue.activeId, "file");
              assert.strictEqual(document.activeElement, trigger);
            }),
          { interval: 10, timeout: 500 },
        ),
      );

      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.promise(() =>
        vi.waitFor(
          () =>
            Effect.runPromiseWith(context)(submenu).then((value) => {
              assert.strictEqual(value.open, true);
              assert.strictEqual(document.activeElement?.id, "new");
            }),
          { interval: 10, timeout: 500 },
        ),
      );
      (document.querySelector("#new") as HTMLDivElement).dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      );
      yield* Effect.promise(() =>
        vi.waitFor(
          () =>
            Promise.all([
              Effect.runPromiseWith(context)(submenu),
              Effect.runPromiseWith(context)(state),
            ]).then(([submenuValue, stateValue]) => {
              assert.strictEqual(submenuValue.open, false);
              assert.strictEqual(stateValue.activeId, "view");
              assert.strictEqual(document.activeElement?.id, "view");
            }),
          { interval: 10, timeout: 500 },
        ),
      );
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps disabled items focusable while moving through the menubar", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menubar.makeState({ activeId: "file" });
      const collection = yield* Menubar.makeCollection();
      yield* render(
        Menubar.Root({
          state,
          collection,
          content: [
            Menubar.Item({ state, collection, id: "file", textValue: "File", content: "File" }),
            Menubar.Item({ state, collection, id: "edit", disabled: true, content: "Edit" }),
            Menubar.Item({ state, collection, id: "view", content: "View" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const file = document.querySelector("#file") as HTMLDivElement;
      const view = document.querySelector("#view") as HTMLDivElement;
      file.focus();
      file.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).activeId, "edit");
      assert.strictEqual(document.activeElement?.id, "edit");

      (document.querySelector("#edit") as HTMLDivElement).dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "view");
      assert.strictEqual(document.activeElement, view);

      view.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "file");
      assert.strictEqual(document.activeElement, file);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
