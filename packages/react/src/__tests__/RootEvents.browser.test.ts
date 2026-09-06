import { createElement, useLayoutEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Effect, Layer, ManagedRuntime } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { CurrentRootEvents } from "@typed/template/RootEvents";
import { render } from "./native.js";
import { afterEach, expect, it, vi } from "vitest";
import { Typed } from "../Typed.browser.js";
import { view } from "../index.js";

afterEach(() => document.body.replaceChildren());

it("stops selected view events after React handlers run, and releases listeners with the scope", async () => {
  const target = document.createElement("section");
  document.body.appendChild(target);
  let inside = 0;
  let outside = 0;
  let keys = 0;
  target.addEventListener("click", () => outside++);
  target.addEventListener("keydown", () => keys++);
  const Button = () => createElement("button", { onClick: () => inside++ }, "click");
  await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        yield* Fx.collectAll(
          Fx.take(
            render(
              view(Button, {}, { id: "react-rootevents-1", stopPropagation: { keydown: false } }),
              target,
            ),
            1,
          ),
        );
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(target.querySelector("button")).not.toBeNull()),
        );
        const button = target.querySelector("button")!;
        button.click();
        button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
        expect(inside).toBe(1);
        expect(outside).toBe(0);
        expect(keys).toBe(1);
      }).pipe(Effect.provideService(CurrentRootEvents, { click: true, keydown: true })),
    ),
  );
  target
    .querySelector("#react-rootevents-1")!
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(outside).toBe(1);
});

it("allows a view to explicitly disable an inherited policy", async () => {
  const target = document.createElement("section");
  document.body.appendChild(target);
  let outside = 0;
  target.addEventListener("click", () => outside++);
  await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* () {
        yield* Fx.collectAll(
          Fx.take(
            render(
              view(
                () => createElement("button", null, "click"),
                {},
                { id: "react-rootevents-2", stopPropagation: false },
              ),
              target,
            ),
            1,
          ),
        );
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(target.querySelector("button")).not.toBeNull()),
        );
        target.querySelector("button")!.click();
        expect(outside).toBe(1);
      }).pipe(Effect.provideService(CurrentRootEvents, { click: true })),
    ),
  );
});

it("installs Typed root events before parent layout effects can emit", async () => {
  let outside = 0;
  const value = html`<span>content</span>`;
  function Parent({ runtime }: { runtime: ManagedRuntime.ManagedRuntime<never, never> }) {
    const section = useRef<HTMLElement>(null);
    useLayoutEffect(() => {
      section
        .current!.querySelector("#react-rootevents-3")!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    }, []);
    return createElement(
      "section",
      { ref: section, onClick: () => outside++ },
      createElement(Typed, { value, runtime, id: "react-rootevents-3" }),
    );
  }

  const runtime = ManagedRuntime.make(Layer.succeed(CurrentRootEvents, { click: true }));
  const root = createRoot(document.body);
  root.render(createElement(Parent, { runtime }));
  try {
    await vi.waitFor(() =>
      expect(document.querySelector("section > #react-rootevents-3")).not.toBeNull(),
    );
    expect(outside).toBe(0);
  } finally {
    root.unmount();
    await runtime.dispose();
  }
});

it("updates Typed event policy without replacing its nodes or remounting its handlers", async () => {
  let inside = 0;
  let outside = 0;
  let keys = 0;
  const value = html`<button onclick=${Effect.sync(() => inside++)}>click</button>`;
  const runtime = ManagedRuntime.make(
    Layer.succeed(CurrentRootEvents, { click: true, keydown: true }),
  );
  const errors: unknown[] = [];
  const root = createRoot(document.body);
  const props = { value, runtime, onError: (cause: unknown) => errors.push(cause) };
  const tree = (stopPropagation: false | Readonly<Record<string, boolean>>) =>
    createElement(
      "section",
      {
        onClick: () => outside++,
        onKeyDown: () => keys++,
      },
      createElement(Typed, { ...props, stopPropagation }),
    );
  root.render(tree({ keydown: false }));
  try {
    await vi.waitFor(() => expect(document.querySelector("button")).not.toBeNull());
    const button = document.querySelector("button")!;
    button.click();
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
    await vi.waitFor(() => expect(inside).toBe(1));
    expect(outside).toBe(0);
    expect(keys).toBe(1);
    root.render(tree(false));
    await vi.waitFor(() => {
      const previous = outside;
      button.click();
      expect(outside).toBe(previous + 1);
    });
    expect(document.querySelector("button")).toBe(button);
    expect(errors).toEqual([]);
  } finally {
    root.unmount();
    await runtime.dispose();
  }
});
