import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, EventHandler, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import * as Popover from "../Popover.js";

describe("typed/ui/Popover in browsers", () => {
  it("opens an initially hydrated popover after its host is attached", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState({ open: true });
      yield* render(Popover.Content({ state, content: "Actions" }), document.body).pipe(
        Fx.take(1),
        Fx.collectAll,
      );
      yield* Effect.promise(() => vi.waitFor(() => {
        assert.strictEqual(document.querySelector("[popover]")?.matches(":popover-open"), true);
      }));
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("synchronizes native popover toggles", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState();
      yield* render(
        [
          Popover.Trigger({ state, controls: "actions", content: "Open" }),
          Popover.Content({
            state,
            content: "Actions",
            props: { id: "actions" },
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector("button")!;
      const content = document.querySelector<HTMLElement>("[popover]")!;
      trigger.click();
      yield* Effect.promise(() => vi.waitFor(() => assert.isTrue(content.matches(":popover-open"))));
      yield* Effect.promise(() => vi.waitFor(() => assert.strictEqual(trigger.getAttribute("aria-expanded"), "true")));
      assert.strictEqual((yield* state).open, true);

      content.hidePopover();
      yield* Effect.promise(() => vi.waitFor(() => assert.strictEqual(trigger.getAttribute("aria-expanded"), "false")));
      assert.strictEqual((yield* state).open, false);
      assert.isFalse(content.matches(":popover-open"));
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("keeps a native close when opening and closing precede the queued toggle", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState();
      yield* render(Popover.Content({ state, content: "Actions" }), document.body).pipe(Fx.take(1), Fx.drain);
      const content = document.querySelector<HTMLElement>("[popover]")!;
      const toggled = new Promise<void>((resolve) => content.addEventListener("toggle", () => resolve(), { once: true }));
      content.showPopover();
      content.hidePopover();
      yield* Effect.promise(() => toggled);
      assert.isFalse(content.matches(":popover-open"));
      assert.isFalse((yield* state).open);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("preserves caller cancellation of a native opening", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState();
      yield* render([
        Popover.Trigger({ state, controls: "cancelled-actions", content: "Open" }),
        Popover.Content({ state, content: "Actions", props: {
          id: "cancelled-actions",
          onbeforetoggle: EventHandler.make((event: ToggleEvent) => Effect.sync(() => event.preventDefault())),
        } }),
      ], document.body).pipe(Fx.take(1), Fx.drain);
      document.querySelector<HTMLButtonElement>("button")!.click();
      assert.isFalse(document.querySelector<HTMLElement>("[popover]")!.matches(":popover-open"));
      assert.isFalse((yield* state).open);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("closes an open manual popover with Escape from its trigger", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* Popover.makeState();
      yield* render(
        [
          Popover.Trigger({ state, content: "Open" }),
          Popover.Content({
            state,
            content: "Actions",
          }),
        ],
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);

      const trigger = document.querySelector<HTMLButtonElement>("button")!;
      const content = document.querySelector<HTMLElement>("[popover]")!;
      trigger.click();
      yield* Effect.promise(() => vi.waitFor(() => assert.isTrue(content.matches(":popover-open"))));

      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      yield* Effect.promise(() => vi.waitFor(() => assert.isFalse(content.matches(":popover-open"))));
      assert.strictEqual((yield* state).open, false);
      assert.isFalse(content.matches(":popover-open"));
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
