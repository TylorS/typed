import { Effect } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Menu from "../Menu.js";

describe("typed/ui/Menu in browsers", () => {
  it("opens from its trigger with ArrowDown", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions" });
      const collection = yield* Menu.makeCollection();
      yield* render(
        [
          Menu.Trigger({ state, content: "Actions" }),
          Menu.Content({
            state,
            collection,
            content: Menu.Item({ state, collection, id: "edit", content: "Edit" }),
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("button") as HTMLButtonElement;
      trigger.focus();
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).open, true);
      assert.strictEqual(document.activeElement?.id, "edit");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("moves focus with printable-key typeahead", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions", open: true, activeId: "edit" });
      const collection = yield* Menu.makeCollection();
      yield* render(
        Menu.Content({
          state,
          collection,
          content: [
            Menu.Item({ state, collection, id: "edit", content: "Edit" }),
            Menu.Item({ state, collection, id: "remove", textValue: "Remove", content: "Remove" }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("#edit") as HTMLDivElement).focus();
      document
        .querySelector("#edit")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
      const context = yield* Effect.context();
      yield* Effect.promise(() =>
        vi.waitFor(
          () =>
            Effect.runPromiseWith(context)(state).then((value) =>
              assert.strictEqual(value.activeId, "remove"),
            ),
          { interval: 10, timeout: 500 },
        ),
      );

      assert.strictEqual((yield* state).activeId, "remove");
      assert.strictEqual(document.activeElement?.id, "remove");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps checkbox items open while their caller-owned state changes", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions", open: true });
      const checked = yield* RefSubject.make(false);
      yield* render(
        Menu.Content({
          state,
          content: Menu.CheckboxItem({
            state,
            id: "pin",
            checked,
            content: "Pin",
            props: { onclick: RefSubject.set(checked, true) },
          }),
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("#pin") as HTMLDivElement).click();
      yield* Effect.sleep(0);
      assert.strictEqual(yield* checked, true);
      assert.strictEqual((yield* state).open, true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("focuses disabled items without activating them", async () => {
    document.body.replaceChildren();
    let activated = 0;
    await Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions", open: true, activeId: "edit" });
      const collection = yield* Menu.makeCollection();
      yield* render(
        Menu.Content({
          state,
          collection,
          content: [
            Menu.Item({ state, collection, id: "edit", content: "Edit" }),
            Menu.Item({ state, collection, id: "skip", disabled: true, content: "Skip" }),
            Menu.Item({
              state,
              collection,
              id: "delete",
              content: "Delete",
              props: {
                onclick: Effect.sync(() => {
                  activated += 1;
                }),
              },
            }),
          ],
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const edit = document.querySelector("#edit") as HTMLDivElement;
      edit.focus();
      edit.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "skip");
      assert.strictEqual(document.activeElement?.id, "skip");

      document
        .querySelector("#skip")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual(activated, 0);
      assert.strictEqual((yield* state).open, true);

      document
        .querySelector("#skip")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).activeId, "delete");

      document
        .querySelector("#delete")
        ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual(activated, 1);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("focuses the first item on open and restores its invoker on Escape", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions" });
      const collection = yield* Menu.makeCollection();
      yield* render(
        [
          Menu.Trigger({ state, content: "Actions" }),
          Menu.Content({
            state,
            collection,
            content: [
              Menu.Item({ state, collection, id: "skip", disabled: true, content: "Skip" }),
              Menu.Item({ state, collection, id: "edit", content: "Edit" }),
            ],
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("button") as HTMLButtonElement;
      const skip = document.querySelector("#skip") as HTMLDivElement;
      trigger.click();
      yield* Effect.sleep(0);

      assert.strictEqual((yield* state).open, true);
      assert.strictEqual((yield* state).activeId, "skip");
      assert.strictEqual(document.activeElement, skip);

      skip.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).open, false);
      assert.strictEqual(document.activeElement, trigger);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("opens a registered native submenu with ArrowRight", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Menu.makeState({ id: "actions", activeId: "more" });
      const collection = yield* Menu.makeCollection();
      const submenu = yield* Menu.makeState({ id: "more-menu", activeId: "archive" });
      const submenuCollection = yield* Menu.makeCollection();
      yield* render(
        [
          Menu.Content({
            state,
            collection,
            content: Menu.SubmenuTrigger({
              state,
              submenu,
              collection,
              id: "more",
              content: "More",
            }),
          }),
          Menu.Content({
            state: submenu,
            collection: submenuCollection,
            parent: { state, collection, triggerId: "more" },
            content: Menu.Item({
              state: submenu,
              collection: submenuCollection,
              id: "archive",
              content: "Archive",
            }),
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      yield* Menu.setOpen(state, true);
      yield* Effect.sleep(0);

      const trigger = document.querySelector("#more") as HTMLButtonElement;
      trigger.focus();
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);

      assert.strictEqual((yield* submenu).open, true);
      assert.strictEqual(
        (document.querySelector("#more-menu") as HTMLDivElement).matches(":popover-open"),
        true,
      );

      const archive = document.querySelector("#archive") as HTMLDivElement;
      archive.focus();
      archive.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
      yield* Effect.sleep(20);
      assert.strictEqual((yield* submenu).open, false);
      assert.strictEqual((yield* state).open, true);
      assert.strictEqual(
        (document.querySelector("#actions") as HTMLDivElement).matches(":popover-open"),
        true,
      );
      assert.strictEqual((yield* state).activeId, "more");
      assert.strictEqual(document.activeElement?.id, "more");
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
