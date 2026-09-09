import { createElement, useId, useState } from "react";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { describe, expect, it, vi } from "vitest";
import { render, renderToHtmlString } from "./native.js";
import { view } from "../view.js";

function Counter() {
  const id = useId();
  const [count, setCount] = useState(0);
  return createElement("button", { id, onClick: () => setCount((n) => n + 1) }, String(count));
}

function page(errors: unknown[]) {
  const island = view(Counter, {}, { onRecoverableError: (error) => errors.push(error) });
  return html`<main>${island}${island}</main>`;
}

describe("automatic React root identity", () => {
  it("restores independent server identities for fresh views and preserves interactive server nodes", async () => {
    const errors: unknown[] = [];
    const root = document.createElement("section");
    root.innerHTML = await Effect.runPromise(renderToHtmlString(page(errors)));
    document.body.append(root);
    const hosts = Array.from(root.querySelectorAll("main > div"));
    const buttons = Array.from(root.querySelectorAll("button"));
    const ids = hosts.map((host) => host.id);
    const buttonIds = buttons.map((button) => button.id);
    expect(new Set(ids).size).toBe(2);
    expect(new Set(buttonIds).size).toBe(2);
    try {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            yield* Fx.drain(Fx.take(render(page(errors), root), 1));
            yield* Effect.promise(() =>
              vi.waitFor(() => {
                buttons[0]!.click();
                expect(Number(buttons[0]!.textContent)).toBeGreaterThan(0);
              }),
            );
            const hydratedHosts = Array.from(root.querySelectorAll("main > div"));
            const hydratedButtons = Array.from(root.querySelectorAll("button"));
            for (let index = 0; index < hosts.length; index++) {
              expect(hydratedHosts[index]).toBe(hosts[index]);
              expect(hydratedButtons[index]).toBe(buttons[index]);
            }
            expect(hosts.map((host) => host.id)).toEqual(ids);
            expect(buttons.map((button) => button.id)).toEqual(buttonIds);
            expect(buttons[1]!.textContent).toBe("0");
            expect(errors).toEqual([]);
          }),
        ),
      );
    } finally {
      root.remove();
    }
  });

  it("mounts repeated views without options into unique client-only roots", async () => {
    const root = document.createElement("section");
    document.body.append(root);
    const island = view(Counter, {});
    try {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            yield* Fx.drain(Fx.take(render(html`<main>${island}${island}</main>`, root), 1));
            yield* Effect.promise(() =>
              vi.waitFor(() => expect(root.querySelectorAll("button")).toHaveLength(2)),
            );
            const ids = Array.from(root.querySelectorAll("[id]"), (element) => element.id);
            expect(ids).toHaveLength(4);
            expect(new Set(ids).size).toBe(4);
          }),
        ),
      );
    } finally {
      root.remove();
    }
  });

  it("generates IDs when randomUUID is unavailable outside secure browser contexts", async () => {
    const randomUUID = vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new Error("randomUUID is unavailable");
    });
    const root = document.createElement("section");
    document.body.append(root);
    try {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            yield* Fx.drain(Fx.take(render(view("HTTP preview"), root), 1));
            yield* Effect.promise(() =>
              vi.waitFor(() => expect(root.textContent).toBe("HTTP preview")),
            );
            expect(root.firstElementChild?.id).toBeTruthy();
          }),
        ),
      );
    } finally {
      randomUUID.mockRestore();
      root.remove();
    }
  });
});
