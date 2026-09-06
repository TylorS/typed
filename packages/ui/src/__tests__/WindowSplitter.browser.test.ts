import { Effect, Exit, Scope } from "effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { assert, describe, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import * as WindowSplitter from "../WindowSplitter.js";

describe("typed/ui/WindowSplitter in browsers", () => {
  it("adjusts, collapses, and restores the primary pane with APG keys", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40, step: 10 });
      yield* render(
        WindowSplitter.WindowSplitter({
          state,
          primaryPaneId: "contents",
          label: "Table of contents",
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 50);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 0);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 50);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 0);

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 100);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("resizes the rendered pane through a native mouse drag beyond the separator", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40, min: 20, max: 80 });
      const columns = RefSubject.map(state, ({ value }) =>
        `display:grid;width:500px;height:100px;grid-template-columns:${value}fr 10px ${100 - value}fr;`);
      yield* render(html`<div style=${columns}>
        <aside id="drag-pane">Contents</aside>
        ${WindowSplitter.WindowSplitter({ state, primaryPaneId: "drag-pane", label: "Resize contents" })}
        <main>Document</main>
      </div>`, document.body).pipe(Fx.take(1), Fx.drain);
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;
      const pane = document.getElementById("drag-pane")!;
      const originalWidth = pane.getBoundingClientRect().width;
      const target = document.querySelector("main")!;
      yield* Effect.promise(() => userEvent.dragAndDrop(splitter, target, {
        targetPosition: { x: target.getBoundingClientRect().width - 1, y: 30 },
      }));
      yield* Effect.promise(() => vi.waitFor(() => {
        assert.isAbove(Number(splitter.getAttribute("aria-valuenow")), 40);
        assert.isAbove(pane.getBoundingClientRect().width, originalWidth);
      }));
      assert.strictEqual((yield* state).value, 80);
      yield* Effect.promise(() => userEvent.hover(pane));
      assert.strictEqual((yield* state).value, 80);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it.each([
    { units: "percentage", valuePerPixel: undefined },
    { units: "CSS pixels", valuePerPixel: 1 },
  ])("measures scaled, bordered parent geometry in $units", async ({ valuePerPixel }) => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40 });
      // Keep the transformed fixture inside the 414px browser viewport. A wider
      // target makes dragAndDrop scroll horizontally between its down/move steps.
      const columns = RefSubject.map(state, ({ value }) =>
        `display:grid;width:160px;height:60px;border:8px solid;transform:scale(2);transform-origin:top left;grid-template-columns:${value}fr 10px ${100 - value}fr;`);
      yield* render(html`<div style=${columns}>
        <aside id="scaled-pane">A</aside>
        ${WindowSplitter.WindowSplitter({ state, primaryPaneId: "scaled-pane", label: "Resize scaled pane", valuePerPixel })}
        <main>B</main>
      </div>`, document.body).pipe(Fx.take(1), Fx.drain);
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;
      const target = document.querySelector("main")!;
      yield* Effect.promise(() => vi.waitFor(() => {
        assert.strictEqual(splitter.getAttribute("aria-valuenow"), "40");
        assert.strictEqual(splitter.getAttribute("aria-orientation"), "vertical");
      }));
      let startX: number | undefined;
      let endX: number | undefined;
      splitter.addEventListener("pointerdown", (event) => { startX = event.clientX; }, { once: true });
      splitter.addEventListener("pointermove", (event) => { if (event.buttons === 1) endX = event.clientX; });
      yield* Effect.promise(() => userEvent.dragAndDrop(splitter, target));
      if (startX === undefined || endX === undefined) throw new Error("Native drag did not deliver a pressed pointer move");
      const delta = valuePerPixel === undefined
        ? (endX - startX) / (150 * 2) * 100
        : (endX - startX) / 2;
      const expected = Math.min(100, Math.max(0, 40 + delta));
      assert.notStrictEqual(endX, startX);
      yield* Effect.promise(() => vi.waitFor(() => {
        assert.closeTo(Number(splitter.getAttribute("aria-valuenow")), expected, 0.2);
      }));
      assert.closeTo(document.getElementById("scaled-pane")!.getBoundingClientRect().width,
        expected / 100 * 150 * 2, 1);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("uses vertical pointer travel for a horizontal separator with pixel units", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 100, min: 50, max: 180, orientation: "horizontal" });
      const rows = RefSubject.map(state, ({ value }) =>
        `display:grid;width:300px;height:300px;grid-template-rows:${value}px 10px 1fr;`);
      yield* render(html`<div style=${rows}>
        <aside id="top-pane">Top pane</aside>
        ${WindowSplitter.WindowSplitter({ state, primaryPaneId: "top-pane", label: "Resize top pane", valuePerPixel: 1 })}
        <main>Bottom pane</main>
      </div>`, document.body).pipe(Fx.take(1), Fx.drain);
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;
      yield* Effect.promise(() => userEvent.dragAndDrop(splitter, document.querySelector("main")!));
      yield* Effect.promise(() => vi.waitFor(() => {
        assert.strictEqual(splitter.getAttribute("aria-valuenow"), "180");
        assert.strictEqual(document.getElementById("top-pane")!.getBoundingClientRect().height, 180);
      }));
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("releases capture on cancellation and render-scope teardown without later resize", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40 });
      const disabled = yield* RefSubject.make(false);
      const scope = yield* Scope.make();
      yield* render(html`<div style="width:300px;height:100px;">
        ${WindowSplitter.WindowSplitter({ state, primaryPaneId: "pane", label: "Resize", valuePerPixel: 1, disabled,
          props: { style: "width:10px;height:100px;touch-action:pan-y;" } })}
      </div>`, document.body).pipe(Fx.take(1), Fx.drain, Scope.provide(scope));
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;
      assert.strictEqual(splitter.style.touchAction, "none");
      let captured = false;
      vi.spyOn(splitter, "setPointerCapture").mockImplementation(() => { captured = true; });
      vi.spyOn(splitter, "hasPointerCapture").mockImplementation(() => captured);
      const release = vi.spyOn(splitter, "releasePointerCapture").mockImplementation(() => { captured = false; });
      const pointer = (type: string, clientX: number, pointerId = 7) => splitter.dispatchEvent(
        new PointerEvent(type, { bubbles: true, cancelable: true, pointerId, pointerType: "touch", isPrimary: true, button: 0, buttons: 1, clientX }));
      assert.strictEqual(pointer("pointerdown", 40), false);
      pointer("pointermove", 60, 9);
      assert.strictEqual((yield* state).value, 40);
      pointer("pointermove", 60);
      assert.strictEqual((yield* state).value, 60);
      pointer("pointercancel", 60);
      assert.strictEqual(captured, false);
      pointer("pointermove", 80);
      assert.strictEqual((yield* state).value, 60);
      pointer("pointerdown", 60);
      yield* RefSubject.set(disabled, true);
      yield* Effect.promise(() => vi.waitFor(() => assert.strictEqual(splitter.getAttribute("aria-disabled"), "true")));
      pointer("pointermove", 70);
      assert.strictEqual(captured, false);
      assert.strictEqual((yield* state).value, 60);
      yield* RefSubject.set(disabled, false);
      yield* Effect.promise(() => vi.waitFor(() => assert.strictEqual(splitter.getAttribute("aria-disabled"), "false")));
      pointer("pointerdown", 60);
      assert.strictEqual(captured, true);
      yield* Scope.close(scope, Exit.void);
      assert.strictEqual(captured, false);
      assert.strictEqual(release.mock.calls.length, 3);

      pointer("pointermove", 90);
      assert.strictEqual((yield* state).value, 60);
      vi.restoreAllMocks();
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });

  it("does not mutate while aria-disabled", async () => {
    document.body.replaceChildren();
    await Effect.gen(function* () {
      const state = yield* WindowSplitter.makeState({ value: 40, step: 10 });
      yield* render(
        WindowSplitter.WindowSplitter({
          state,
          primaryPaneId: "contents",
          label: "Table of contents",
          disabled: true,
        }),
        document.body,
      ).pipe(Fx.take(1), Fx.collectAll);
      const splitter = document.querySelector('[role="separator"]') as HTMLDivElement;

      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      splitter.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      splitter.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 8, isPrimary: true, button: 0, buttons: 1 }));
      splitter.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerId: 8, buttons: 1, clientX: 500 }));
      yield* Effect.sleep(0);
      assert.strictEqual((yield* state).value, 40);
    }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
  });
});
