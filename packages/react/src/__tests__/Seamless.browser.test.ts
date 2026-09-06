import { Component, StrictMode, createElement, type ReactNode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToReadableStream } from "react-dom/server";
import { Context, Effect, Exit, Layer, ManagedRuntime, Scope } from "effect";
import { describe, expect, it, vi } from "vitest";
import { commands } from "vitest/browser";
declare module "vitest/browser" {
  interface BrowserCommands {
    renderReactProviderFixture(): Promise<{ html: string; releasedBeforeDisposal: number }>;
  }
}
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { render } from "./native.js";
import { renderToHtmlString } from "./native.js";
import { isDomRenderEvent } from "@typed/template/RenderEvent";
import { view } from "../view.js";
import { Typed } from "../Typed.browser.js";
import { Typed as ServerTyped } from "../Typed.js";
import { Provider, fromContext, useService } from "../Runtime.js";

describe("seamless native browser entry points", () => {
  it("renders and hydrates React through Typed using the native renderer layers", async () => {
    const root = document.createElement("main");
    document.body.append(root);
    let clicks = 0;
    const value = view(createElement("button", { onClick: () => clicks++ }, "React"), {
      id: "automatic",
    });
    root.innerHTML = await Effect.runPromise(renderToHtmlString(value));
    const button = root.querySelector("button")!;
    try {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            yield* Fx.collectAll(Fx.take(render(value, root), 1));
            expect(root.querySelector("button")).toBe(button);
            yield* Effect.promise(() =>
              vi.waitFor(() => {
                button.click();
                expect(clicks).toBeGreaterThan(0);
              }),
            );
          }),
        ),
      );
    } finally {
      root.remove();
    }
  });

  it("hydrates Typed through React StrictMode without prepared markup or replacing server nodes", async () => {
    const scope = Scope.makeUnsafe();
    const count = Effect.runSync(RefSubject.make(0).pipe(Scope.provide(scope)));
    const value = html`<button onclick=${RefSubject.update(count, (n) => n + 1)}>${count}</button>`;
    const errors: unknown[] = [];
    const tree = createElement(
      StrictMode,
      null,
      createElement(Typed, { value, onError: (error) => errors.push(error) }),
    );
    const stream = await renderToReadableStream(
      createElement(StrictMode, null, createElement(ServerTyped, { value })),
    );
    await stream.allReady;
    const root = document.createElement("main");
    root.innerHTML = await new Response(stream).text();
    document.body.append(root);
    const button = root.querySelector("button")!;
    const react = hydrateRoot(root, tree, { onRecoverableError: (error) => errors.push(error) });
    try {
      await vi.waitFor(() => {
        expect(errors).toEqual([]);
        expect(root.querySelector("button")).toBe(button);
        button.click();
        expect(Effect.runSync(count)).toBeGreaterThan(0);
      });
      expect(root.querySelector("button")).toBe(button);
      await vi.waitFor(() => expect(button.textContent).toBe(String(Effect.runSync(count))));
      expect(errors).toEqual([]);
    } finally {
      react.unmount();
      root.remove();
      await Effect.runPromise(Scope.close(scope, Exit.void));
    }
  });

  it("does not run a server snapshot during client-only rendering and releases its sole DOM scope", async () => {
    let acquired = 0;
    let released = 0;
    const root = document.createElement("main");
    document.body.append(root);
    const react = createRoot(root);
    const value = html`<p>
      ${Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
          return "client";
        }),
        () =>
          Effect.sync(() => {
            released++;
          }),
      )}
    </p>`;
    react.render(createElement(Typed, { value }));
    await vi.waitFor(() => expect(root.textContent).toBe("client"));
    expect(acquired).toBe(1);
    expect(released).toBe(0);
    react.unmount();
    await vi.waitFor(() => expect(released).toBe(1));
    root.remove();
  });

  it("cancels pending native hydration when React unmounts", async () => {
    const root = document.createElement("main");
    document.body.append(root);
    class Text extends Context.Service<Text, Effect.Effect<string, never, Scope.Scope>>()(
      "HydrationText",
    ) {}
    const value = html`<p>${Effect.flatten(Text)}</p>`;
    const server = createElement(ServerTyped, {
      value,
      runtime: fromContext(Context.make(Text, Effect.succeed("server"))),
    });
    const stream = await renderToReadableStream(server);
    await stream.allReady;
    root.innerHTML = await new Response(stream).text();
    let acquired = 0;
    let released = 0;
    const pending = Effect.acquireRelease(
      Effect.sync(() => {
        acquired++;
      }),
      () =>
        Effect.sync(() => {
          released++;
        }),
    ).pipe(Effect.andThen(Effect.never));
    const react = hydrateRoot(
      root,
      createElement(Typed, {
        value,
        runtime: fromContext(Context.make(Text, pending)),
      }),
    );
    await vi.waitFor(() => expect(acquired).toBe(1));
    react.unmount();
    await vi.waitFor(() => expect(released).toBe(1));
    root.remove();
  });

  it("hydrates an opaque Typed host without replaying its server producer", async () => {
    const phases: string[] = [];
    let released = 0;
    const value = html`<button>
      ${Effect.gen(function* () {
        const probe = yield* Fx.first(html`<i></i>`);
        const environment = probe._tag === "Some" && isDomRenderEvent(probe.value) ? "dom" : "html";
        phases.push(environment!);
        yield* Effect.acquireRelease(Effect.void, () =>
          Effect.sync(() => {
            released++;
          }),
        );
        return "once";
      })}
    </button>`;
    const stream = await renderToReadableStream(createElement(ServerTyped, { value }));
    await stream.allReady;
    const root = document.createElement("main");
    root.innerHTML = await new Response(stream).text();
    document.body.append(root);
    const button = root.querySelector("button");
    const errors: unknown[] = [];
    const react = hydrateRoot(
      root,
      createElement(StrictMode, null, createElement(Typed, { value })),
      { onRecoverableError: (error) => errors.push(error) },
    );
    try {
      await vi.waitFor(() => expect(phases).toEqual(["html", "dom"]));
      expect(root.querySelector("button")).toBe(button);
      expect(released).toBe(1);
      expect(errors).toEqual([]);
    } finally {
      react.unmount();
      root.remove();
    }
    await vi.waitFor(() => expect(released).toBe(2));
  });

  it("hydrates a newly acquired borrowed Provider runtime without manual preparation", async () => {
    class Text extends Context.Service<Text, string>()("ProviderHydrationText") {}
    let released = 0;
    const makeRuntime = () =>
      ManagedRuntime.make(
        Layer.effect(
          Text,
          Effect.acquireRelease(
            Effect.promise(async () => "provided"),
            () =>
              Effect.sync(() => {
                released++;
              }),
          ),
        ),
      );
    const Seen = () => createElement("b", null, useService(Text));
    const value = html`<p>${Effect.map(Text, (text) => text)}</p>`;
    const fixture = await commands.renderReactProviderFixture();
    expect(fixture.releasedBeforeDisposal).toBe(0);
    const root = document.createElement("main");
    root.innerHTML = fixture.html;
    document.body.append(root);
    const before = Array.from(root.querySelectorAll("b,p"));
    const runtime = makeRuntime();
    const errors: unknown[] = [];
    const tree = createElement(
      Provider<Text>,
      { runtime },
      createElement(Seen),
      createElement(Typed, { value, onError: (error) => errors.push(error) }),
    );
    const react = hydrateRoot(root, tree, { onRecoverableError: (error) => errors.push(error) });
    try {
      await vi.waitFor(() => expect(runtime.cachedContext).toBeDefined());
      await vi.waitFor(() => {
        expect(errors).toEqual([]);
        expect(root.textContent).toBe("providedprovided");
      });
      expect(errors).toEqual([]);
      expect(root.querySelector("b")).toBe(before[0]);
      expect(root.querySelector("p")).toBe(before[1]);
      expect(released).toBe(0);
      expect(errors).toEqual([]);
    } finally {
      react.unmount();
      root.remove();
      await runtime.dispose();
    }
    expect(released).toBe(1);
  });

  it("sends unhandled Typed failures to a React Error Boundary", async () => {
    class Boundary extends Component<{ children?: ReactNode }, { error: unknown }> {
      override state = { error: undefined as unknown };
      static getDerivedStateFromError(error: unknown) {
        return { error };
      }
      override render() {
        return this.state.error ? "failed" : this.props.children;
      }
    }
    const root = document.createElement("main");
    document.body.append(root);
    const errors: unknown[] = [];
    const react = createRoot(root, { onCaughtError: (error) => errors.push(error) });
    react.render(
      createElement(Boundary, null, createElement(Typed, { value: Effect.fail("typed failure") })),
    );
    await vi.waitFor(() => expect(root.textContent).toBe("failed"));
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ _tag: "TypedRenderError" });
    react.unmount();
    root.remove();
  });
});
