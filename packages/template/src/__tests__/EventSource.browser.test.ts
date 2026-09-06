import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Scope from "effect/Scope";
import * as EventHandler from "../EventHandler.js";
import { makeEventSource } from "../EventSource.js";

describe("EventSource in Chromium", () => {
  it("consumes a delegated once handler only when its own target matches", () =>
    Effect.gen(function* () {
      const root = document.createElement("div");
      const unrelated = document.createElement("button");
      const first = document.createElement("button");
      const second = document.createElement("button");
      root.append(unrelated, first, second);

      const calls: Array<string> = [];
      const source = makeEventSource();
      source.addEventListener(
        first,
        "click",
        EventHandler.make(
          () => {
            calls.push("first");
          },
          { once: true },
        ),
      );
      source.addEventListener(
        second,
        "click",
        EventHandler.make(
          () => {
            calls.push("second");
          },
          { once: true },
        ),
      );

      yield* source.setup(root, yield* Scope.Scope);

      unrelated.click();
      first.click();
      first.click();
      second.click();
      second.click();

      assert.deepEqual(calls, ["first", "second"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves capture for a delegated handler", () =>
    Effect.gen(function* () {
      const root = document.createElement("div");
      const target = document.createElement("button");
      root.append(target);
      target.addEventListener("click", (event) => event.stopPropagation());

      let calls = 0;
      const source = makeEventSource();
      source.addEventListener(
        target,
        "click",
        EventHandler.make(
          () => {
            calls += 1;
          },
          { capture: true },
        ),
      );

      yield* source.setup(root, yield* Scope.Scope);
      target.click();

      assert.equal(calls, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves an AbortSignal for a delegated handler", () =>
    Effect.gen(function* () {
      const root = document.createElement("div");
      const target = document.createElement("button");
      root.append(target);

      let calls = 0;
      // @effect-diagnostics-next-line abortControllerInEffect:off -- this test exercises manual DOM signal cancellation before scope closure
      const controller = new AbortController();
      const source = makeEventSource();
      source.addEventListener(
        target,
        "click",
        EventHandler.make(
          () => {
            calls += 1;
          },
          { signal: controller.signal },
        ),
      );

      yield* source.setup(root, yield* Scope.Scope);
      controller.abort();
      target.click();

      assert.equal(calls, 0);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not downgrade a passive handler sharing an event name", () =>
    Effect.gen(function* () {
      const root = document.createElement("div");
      const passiveTarget = document.createElement("button");
      const normalTarget = document.createElement("button");
      root.append(passiveTarget, normalTarget);

      let defaultPrevented: boolean | undefined;
      const source = makeEventSource();
      source.addEventListener(
        passiveTarget,
        "click",
        EventHandler.make(
          (event) => {
            event.preventDefault();
            defaultPrevented = event.defaultPrevented;
          },
          { passive: true },
        ),
      );
      source.addEventListener(
        normalTarget,
        "click",
        EventHandler.make(() => {}),
      );

      yield* source.setup(root, yield* Scope.Scope);
      passiveTarget.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

      assert.strictEqual(defaultPrevented, false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("attaches and detaches handlers registered after setup", () =>
    Effect.gen(function* () {
      const root = document.createElement("div");
      const target = document.createElement("button");
      root.append(target);

      let calls = 0;
      const source = makeEventSource();
      yield* source.setup(root, yield* Scope.Scope);

      const registration = source.addEventListener(
        target,
        "click",
        EventHandler.make(() => {
          calls += 1;
        }),
      );
      target.click();
      assert.equal(calls, 1);

      registration[Symbol.dispose]();
      target.click();
      assert.equal(calls, 1);
    }).pipe(Effect.scoped, Effect.runPromise));
});
