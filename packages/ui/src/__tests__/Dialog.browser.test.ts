import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, EventHandler, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Dialog from "../Dialog.js";

describe("typed/ui/Dialog in browsers", () => {
  it("keeps a reopened dialog open when the previous close event arrives", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      yield* render(
        Dialog.Content({ state, label: "Rapidly reopened dialog", content: "Body" }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const dialog = document.querySelector("dialog")!;
      yield* Dialog.setOpen(state, true);
      yield* Effect.promise(() => vi.waitFor(() => assert.strictEqual(dialog.open, true)));
      const closed = new Promise<void>((resolve) =>
        dialog.addEventListener("close", () => resolve(), { once: true }),
      );
      dialog.close();
      dialog.showModal();
      yield* Effect.promise(() => closed);
      yield* Effect.promise(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );

      assert.strictEqual(dialog.open, true);
      assert.strictEqual((yield* state).open, true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("synchronizes state after an accepted programmatic close request", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      yield* render(
        [
          Dialog.Trigger({ state, content: "Open" }),
          Dialog.Content({ state, label: "Test dialog", content: "Body" }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("button") as HTMLButtonElement).click();
      yield* Effect.sleep(0);
      yield* Dialog.requestClose(state);
      yield* Effect.sleep(0);

      assert.strictEqual(document.querySelector("dialog")?.open, false);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("requests a cancelable native close from hydrated dialog state", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      let canceled = false;
      yield* render(
        [
          Dialog.Trigger({ state, content: "Open" }),
          Dialog.Content({
            state,
            label: "Test dialog",
            content: "Body",
            props: {
              oncancel: EventHandler.make(
                Effect.fn((event) =>
                  Effect.sync(() => {
                    canceled = true;
                    event.preventDefault();
                  }),
                ),
              ),
            },
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      (document.querySelector("button") as HTMLButtonElement).click();
      yield* Effect.sleep(0);
      yield* Dialog.requestClose(state);
      yield* Effect.sleep(0);

      assert.strictEqual(canceled, true);
      assert.strictEqual(document.querySelector("dialog")?.open, true);
      assert.strictEqual((yield* state).open, true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("opens an initially hydrated dialog after its host is attached", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Dialog.makeState({ open: true });
      yield* render(
        Dialog.Content({ state, label: "Test dialog", content: "Body" }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(document.querySelector("dialog")?.open, true)),
      );
      yield* Dialog.setOpen(state, false);
      yield* Effect.promise(() =>
        vi.waitFor(() => assert.strictEqual(document.querySelector("dialog")?.open, false)),
      );
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("synchronizes the native dialog close lifecycle", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      yield* render(
        [
          Dialog.Trigger({ state, content: "Open" }),
          Dialog.Content({ state, label: "Test dialog", content: "Body" }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("button")!;
      const dialog = document.querySelector("dialog")!;
      trigger.click();
      yield* Effect.sleep(0);
      assert.strictEqual(dialog.open, true);
      assert.strictEqual((yield* state).open, true);

      dialog.close();
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("uses request-close to synchronize a native command dialog", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      yield* render(
        [
          Dialog.Trigger({ state, content: "Open" }),
          Dialog.Content({ state, id: "confirm", label: "Test dialog", content: "Body" }),
          Dialog.RequestClose({ state, controls: "confirm", content: "Cancel" }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const dialog = document.querySelector("dialog")!;
      (document.querySelector("button") as HTMLButtonElement).click();
      yield* Effect.sleep(0);
      assert.strictEqual(dialog.open, true);
      (document.querySelectorAll("button")[1] as HTMLButtonElement).click();
      yield* Effect.sleep(0);

      assert.strictEqual(dialog.open, false);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("lets RequestClose consumers cancel the native close lifecycle", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Dialog.makeState();
      let canceled = false;
      yield* render(
        [
          Dialog.Trigger({ state, content: "Open" }),
          Dialog.Content({
            state,
            label: "Test dialog",
            content: "Body",
            props: {
              oncancel: EventHandler.preventDefault(
                EventHandler.fromEffectOrEventHandler(
                  Effect.sync(() => {
                    canceled = true;
                  }),
                ),
              ),
            },
          }),
          Dialog.RequestClose({ state, content: "Cancel" }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      (document.querySelector("button") as HTMLButtonElement).click();
      yield* Effect.sleep(0);
      assert.strictEqual(document.querySelector("dialog")?.open, true);

      (document.querySelectorAll("button")[1] as HTMLButtonElement).click();
      yield* Effect.sleep(0);
      assert.strictEqual(canceled, true);
      assert.strictEqual(document.querySelector("dialog")?.open, true);
      assert.strictEqual((yield* state).open, true);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
