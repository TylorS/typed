import { describe, expect, it } from "vitest";
import { Effect, Layer, ManagedRuntime } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template/RenderTemplate";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { CurrentRootEvents } from "@typed/template/RootEvents";
import { mount, tick, unmount } from "svelte";
import { view } from "../view.js";
import Typed from "@typed/svelte/Typed.svelte";
import Stateful from "./fixtures/Stateful.svelte";

describe("Svelte root event propagation", () => {
  it("stops selected bubbling events after Svelte handlers and cleans listeners with Scope", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    let clicks = 0;
    let keys = 0;
    const click = () => {
      clicks++;
    };
    const keydown = () => {
      keys++;
    };
    document.body.addEventListener("click", click);
    document.body.addEventListener("keydown", keydown);
    try {
      await Effect.gen(function* () {
        yield* Fx.collectAll(
          Fx.take(
            render(
              view(
                Stateful,
                { label: "events" },
                {
                  id: "events",
                  stopPropagation: { click: true, keydown: false },
                },
              ),
              root,
            ),
            1,
          ),
        );
        const button = root.querySelector<HTMLButtonElement>("button")!;
        button.click();
        yield* Effect.promise(() => tick());
        expect(button.textContent).toBe("events:1");
        expect(clicks).toBe(0);
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true });
        button.dispatchEvent(event);
        expect(keys).toBe(1);
        expect(event.defaultPrevented).toBe(false);
      }).pipe(
        Effect.provide(DomRenderTemplate.using(document)),
        Effect.provideService(CurrentRootEvents, { keydown: true }),
        Effect.scoped,
        Effect.runPromise,
      );
      root.querySelector("#events")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(clicks).toBe(1);
    } finally {
      document.body.removeEventListener("click", click);
      document.body.removeEventListener("keydown", keydown);
      root.remove();
    }
  });

  it("the inverse component inherits policy and can explicitly allow individual events", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const runtime = ManagedRuntime.make(
      Layer.succeed(CurrentRootEvents, { click: true, keydown: true }),
    );
    let handled = 0;
    let bubbled = 0;
    let keys = 0;
    let ready = false;
    const view = html`<button
      onclick=${Effect.sync(() => {
        handled++;
      })}
    >
      typed
    </button>`;
    const click = () => {
      bubbled++;
    };
    const keydown = () => {
      keys++;
    };
    document.body.addEventListener("click", click);
    document.body.addEventListener("keydown", keydown);
    const instance = mount(Typed, {
      target: root,
      props: {
        runtime,
        value: view,
        id: "svelte-rootevents-inverse",
        stopPropagation: { click: false },
        onReady: () => {
          ready = true;
        },
      },
    });
    try {
      await expect.poll(() => ready).toBe(true);
      const button = root.querySelector("button")!;
      button.click();
      await expect.poll(() => handled).toBe(1);
      expect(bubbled).toBe(1);
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true });
      button.dispatchEvent(event);
      expect(keys).toBe(0);
      expect(event.defaultPrevented).toBe(false);
    } finally {
      await unmount(instance);
      await runtime.dispose();
      document.body.removeEventListener("click", click);
      document.body.removeEventListener("keydown", keydown);
      root.remove();
    }
  });
});
