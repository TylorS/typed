import { createElement, Fragment, lazy, Suspense, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot, hydrateRoot } from "react-dom/client";
import { renderToReadableStream } from "react-dom/server";
import { Cause, Context, Effect, Fiber, Layer, ManagedRuntime } from "effect";
import * as Scope from "effect/Scope";
import * as Exit from "effect/Exit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { DomRenderEvent, isDomRenderEvent } from "@typed/template/RenderEvent";
import { CurrentRenderDocument, DomRenderTemplate } from "@typed/template/Render";
import { HtmlRenderTemplate } from "@typed/template/Html";
import { render } from "./native.js";
import { renderToHtmlString } from "./native.js";
import { view } from "../index.js";
import { Provider, useService } from "../Runtime.js";
import { Typed } from "../Typed.browser.js";
import { Typed as ServerTyped } from "../Typed.js";

const wait = (f: () => void) => Effect.promise(() => vi.waitFor(f));
afterEach(() => document.body.replaceChildren());

describe("React in Typed", () => {
  it("initializes one root for concurrent first props and releases it exactly once", async () => {
    let acquired = 0;
    let released = 0;
    function Component({ label }: { label: string }) {
      useEffect(() => {
        acquired++;
        return () => {
          released++;
        };
      }, []);
      return createElement("button", null, label);
    }
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const props = Fx.mergeAll(
            Fx.succeed({ label: "first" }),
            Fx.succeed({ label: "second" }),
          );
          yield* Fx.drain(
            Fx.take(render(view(Component, props, { id: "concurrent-props" }), document.body), 1),
          );
          yield* wait(() => expect(document.querySelector("button")?.textContent).toBe("second"));
          expect(acquired).toBe(1);
          expect(released).toBe(0);
        }),
      ),
    );
    expect(acquired).toBe(1);
    expect(released).toBe(1);
  });

  it("preserves React state and DOM identity across prop updates and unmounts once", async () => {
    let mounts = 0;
    let unmounts = 0;
    function Counter({ label }: { label: string }) {
      const [count, setCount] = useState(0);
      useEffect(() => {
        mounts++;
        return () => {
          unmounts++;
        };
      }, []);
      return createElement(
        "button",
        { onClick: () => setCount((n) => n + 1) },
        `${label}: ${count}`,
      );
    }
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const props = yield* RefSubject.make({ label: "first" });
          yield* Fx.collectAll(
            Fx.take(
              render(
                html`<main>${view(Counter, props, { id: "react-dom-1" })}</main>`,
                document.body,
              ),
              1,
            ),
          );
          yield* wait(() => expect(document.querySelector("button")?.textContent).toBe("first: 0"));
          const button = document.querySelector("button")!;
          expect(button.textContent).toBe("first: 0");
          button.click();
          yield* wait(() => expect(button.textContent).toBe("first: 1"));
          yield* RefSubject.set(props, { label: "second" });
          yield* wait(() => expect(button.textContent).toBe("second: 1"));
          expect(document.querySelector("button")).toBe(button);
          expect(mounts).toBe(1);
          expect(unmounts).toBe(0);
        }),
      ),
    );
    expect(unmounts).toBe(1);
  });

  it("genuinely hydrates equal sibling React roots, preserving Typed siblings and useId", async () => {
    const recoveries: unknown[] = [];
    function Component({ label }: { label: string }) {
      const id = useId();
      const [count, setCount] = useState(0);
      return createElement(
        "button",
        { id, onClick: () => setCount((n) => n + 1) },
        `${label}:${count}`,
      );
    }
    const app = html`<main>
      <i>before</i
      >${view(Component, { label: "a" }, { id: "react-dom-2", identifierPrefix: "a", onRecoverableError: (e) => recoveries.push(e) })}${view(Component, { label: "b" }, { id: "react-dom-3", identifierPrefix: "b", onRecoverableError: (e) => recoveries.push(e) })}<i
        >after</i
      >
    </main>`;
    document.body.innerHTML = await Effect.runPromise(Effect.scoped(renderToHtmlString(app)));
    const buttons = Array.from(document.querySelectorAll("button"));
    const siblings = Array.from(document.querySelectorAll("i"));
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Fx.collectAll(Fx.take(render(app, document.body), 1));
          expect(Array.from(document.querySelectorAll("button"))).toEqual(buttons);
          expect(Array.from(document.querySelectorAll("i"))).toEqual(siblings);
          buttons[1]!.click();
          yield* wait(() => expect(buttons[1]!.textContent).toBe("b:1"));
          expect(buttons[0]!.textContent).toBe("a:0");
          expect(recoveries).toEqual([]);
        }),
      ),
    );
  });

  it("keeps a completed props source mounted until its Effect scope closes", async () => {
    let cleanup = 0;
    function Component() {
      useEffect(
        () => () => {
          cleanup++;
        },
        [],
      );
      return createElement("b", null, "ready");
    }
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Fx.collectAll(
            Fx.take(
              render(view(Component, Effect.succeed({}), { id: "react-dom-4" }), document.body),
              1,
            ),
          );
          yield* wait(() => expect(document.querySelector("b")?.textContent).toBe("ready"));
          expect(cleanup).toBe(0);
        }),
      ),
    );
    expect(cleanup).toBe(1);
  });

  it("queues props through asynchronous Suspense hydration without replacing server nodes", async () => {
    const errors: unknown[] = [];
    function Content({ label }: { label: string }) {
      return createElement("b", null, label);
    }
    const gate = Promise.withResolvers<{ default: typeof Content }>();
    const Lazy = lazy(() => gate.promise);
    const Server = (props: { label: string }) =>
      createElement(Suspense, { fallback: "waiting" }, createElement(Content, props));
    const Client = (props: { label: string }) =>
      createElement(Suspense, { fallback: "waiting" }, createElement(Lazy, props));
    document.body.innerHTML = await Effect.runPromise(
      Effect.scoped(renderToHtmlString(view(Server, { label: "before" }, { id: "react-dom-5" }))),
    );
    const original = document.querySelector("b")!;
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          const props = yield* RefSubject.make({ label: "before" });
          yield* Fx.collectAll(
            Fx.take(
              render(
                view(Client, props, {
                  id: "react-dom-5",
                  onRecoverableError: (error) => errors.push(error),
                }),
                document.body,
              ),
              1,
            ),
          );
          yield* RefSubject.set(props, { label: "after" });
          gate.resolve({ default: Content });
          yield* wait(() => expect(original.textContent).toBe("after"));
          expect(document.querySelector("b")).toBe(original);
          expect(errors).toEqual([]);
        }),
      ),
    );
  });

  it("hydrates streamed Suspense markup after the browser applies React's scripts", async () => {
    let clicks = 0;
    const errors: unknown[] = [];
    const pending = Promise.withResolvers<{ default: () => ReturnType<typeof createElement> }>();
    const Lazy = lazy(() => pending.promise);
    const Component = () =>
      createElement(
        "section",
        null,
        createElement("h1", null, "streamed"),
        createElement(Suspense, { fallback: "waiting" }, createElement(Lazy)),
      );
    const value = view(
      Component,
      {},
      {
        id: "streamed-hydration",
        onRecoverableError: (error) => errors.push(error),
      },
    );
    const chunks: string[] = [];
    const server = Effect.runFork(
      Fx.observe(value, (event) => {
        chunks.push(event.toString());
      }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );

    await vi.waitFor(() => expect(chunks.join("")).toContain("waiting"));
    pending.resolve({
      default: () => createElement("button", { onClick: () => clicks++ }, "resolved"),
    });
    await Effect.runPromise(Fiber.join(server));

    const target = document.createElement("main");
    document.body.append(target);
    target.innerHTML = chunks.join("");
    // innerHTML is inert. Execute only these trusted React SSR scripts as an HTML response would.
    for (const script of target.querySelectorAll("script")) {
      const executable = document.createElement("script");
      executable.textContent = script.textContent;
      script.replaceWith(executable);
    }
    await vi.waitFor(() => expect(target.textContent).not.toContain("waiting"));
    const button = target.querySelector("button")!;
    expect(button.closest("[hidden]")).toBeNull();

    try {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            yield* render(value, target).pipe(Fx.take(1), Fx.drain);
            yield* wait(() => {
              button.click();
              expect(clicks).toBeGreaterThan(0);
            });
            expect(target.querySelector("button")).toBe(button);
            expect(errors).toEqual([]);
          }),
        ),
      );
    } finally {
      target.remove();
    }
  });

  it("passes the surrounding Effect service context into React", async () => {
    class Greeting extends Context.Service<Greeting, { readonly text: string }>()(
      "ReactDomGreeting",
    ) {}
    const Component = () => createElement("b", null, useService(Greeting).text);
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Fx.collectAll(
            Fx.take(render(view(Component, {}, { id: "react-dom-7" }), document.body), 1),
          );
          yield* wait(() => expect(document.querySelector("b")?.textContent).toBe("from Effect"));
        }).pipe(Effect.provideService(Greeting, { text: "from Effect" })),
      ),
    );
  });

  it("supports direct ReactNode content and releases portal output", async () => {
    const target = document.createElement("section");
    const portal = document.createElement("aside");
    document.body.append(target, portal);
    const nodes = [
      ["text", "text"],
      [["one", "two"], "onetwo"],
      [createElement(Fragment, null, createElement("b", null, "fragment")), "fragment"],
      [null, ""],
    ] as const;
    for (const [node, expected] of nodes) {
      await Effect.runPromise(
        Effect.scoped(
          Effect.gen(function* () {
            yield* Fx.collectAll(Fx.take(render(view(node, { id: "direct" }), target), 1));
            yield* wait(() => expect(target.textContent).toBe(expected));
            expect(target.querySelector("#direct")?.id).toBe("direct");
          }),
        ),
      );
    }
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Fx.collectAll(
            Fx.take(
              render(
                view(createPortal(createElement("b", null, "portal"), portal), { id: "portal" }),
                target,
              ),
              1,
            ),
          );
          yield* wait(() => expect(portal.textContent).toBe("portal"));
          expect(target.querySelector("#portal")?.id).toBe("portal");
        }),
      ),
    );
    expect(portal.textContent).toBe("");
  });

  it("uses CurrentRenderDocument for its owned hosts", async () => {
    const otherDocument = document.implementation.createHTMLDocument("other");
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Fx.collectAll(
            Fx.take(
              render(
                view(() => createElement("b", null, "other"), {}, { id: "react-dom-8" }),
                otherDocument.body,
              ),
              1,
            ),
          );
          expect(otherDocument.querySelector("#react-dom-8")?.ownerDocument).toBe(otherDocument);
          yield* wait(() =>
            expect(otherDocument.querySelector("b")?.ownerDocument).toBe(otherDocument),
          );
        }).pipe(Effect.provideService(CurrentRenderDocument, otherDocument)),
      ),
    );
  });

  it("finishes an empty props source without blocking its containing template", async () => {
    const Component = () => createElement("b", null, "unexpected");
    await Effect.runPromise(
      Effect.scoped(
        Effect.gen(function* () {
          yield* Fx.collectAll(
            Fx.take(
              render(
                html`<main>${view(Component, Fx.empty, { id: "react-dom-9" })}<i>ready</i></main>`,
                document.body,
              ),
              1,
            ),
          );
          expect(document.querySelector("i")?.textContent).toBe("ready");
          expect(document.querySelector("b")).toBeNull();
        }),
      ),
    );
  });

  it("releases pending DOM acquisitions when interrupted before publication, while the parent scope remains open", async () => {
    const scope = Scope.makeUnsafe();
    const started = Promise.withResolvers<void>();
    let released = 0;
    const source = Effect.acquireRelease(
      Effect.sync(() => started.resolve()),
      () =>
        Effect.sync(() => {
          released++;
        }),
    ).pipe(Effect.andThen(Effect.never));
    const fiber = Effect.runFork(
      Fx.drain(view(() => createElement("b"), source, { id: "react-dom-10" })).pipe(
        Effect.provide(DomRenderTemplate),
        Scope.provide(scope),
      ),
    );
    try {
      await started.promise;
      await Effect.runPromise(Fiber.interrupt(fiber));
      expect(released).toBe(1);
      expect(document.querySelector("#react-dom-10")).toBeNull();
    } finally {
      await Effect.runPromise(Scope.close(scope, Exit.void));
    }
    expect(released).toBe(1);
  });

  it("reports initial React failures to an active raw observer after publishing its host", async () => {
    let successfulRenders = 0;
    function Component({ fail }: { fail: boolean }) {
      if (fail) throw new Error("initial render failed");
      successfulRenders++;
      return createElement("b", null, "unexpected");
    }
    const sources = [
      Fx.succeed({ fail: true }),
      Fx.mergeAll(Fx.succeed({ fail: true }), Fx.succeed({ fail: false })),
    ];
    for (const props of sources) {
      let outputs = 0;
      const exit = await Effect.runPromise(
        Effect.exit(
          Effect.scoped(
            Fx.observe(view(Component, props, { id: "raw-initial-failure" }), () => {
              outputs++;
            }).pipe(Effect.provide(DomRenderTemplate)),
          ),
        ),
      );
      expect(Exit.isFailure(exit)).toBe(true);
      expect(outputs).toBe(1);
    }
    expect(successfulRenders).toBe(0);
  });

  it("keeps a raw observer alive for React state failures after finite props complete", async () => {
    let mounted = 0;
    let released = 0;

    function Component() {
      const [step, setStep] = useState(0);
      useEffect(() => {
        mounted++;
        return () => {
          released++;
        };
      }, []);

      if (step === 2) throw new Error("later React state failure");
      return createElement(
        "button",
        { onClick: () => setStep((value) => value + 1) },
        String(step),
      );
    }

    const scope = Scope.makeUnsafe();
    const exits: Array<Exit.Exit<unknown, unknown>> = [];
    const fiber = Effect.runFork(
      Fx.observe(view(Component, {}, { id: "late-state-failure" }), (event) => {
        if (isDomRenderEvent(event)) document.body.append(event.valueOf() as HTMLElement);
      }).pipe(Effect.provide(DomRenderTemplate), Scope.provide(scope)),
    );
    fiber.addObserver((exit) => {
      exits.push(exit);
    });

    try {
      await vi.waitFor(() => expect(mounted).toBe(1));
      document.querySelector("button")!.click();
      await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("1"));
      expect(exits).toEqual([]);

      document.querySelector("button")!.click();
      await vi.waitFor(() => expect(exits).toHaveLength(1));
      const exit = exits[0]!;
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        expect(Cause.squash(exit.cause)).toMatchObject({ _tag: "ReactRenderError" });
      }
      await vi.waitFor(() => expect(released).toBe(1));
    } finally {
      await Effect.runPromise(Fiber.interrupt(fiber));
      await Effect.runPromise(Scope.close(scope, Exit.void));
    }
    expect(released).toBe(1);
  });

  it("reports React render exceptions through the Fx error channel", async () => {
    function Broken(): never {
      throw new Error("render broke");
    }
    const error = await Effect.runPromise(
      Effect.scoped(
        Fx.collectAll(render(view(Broken, {}, { id: "react-dom-11" }), document.body)).pipe(
          Effect.flip,
        ),
      ),
    );
    expect(error._tag).toBe("ReactRenderError");
  });
});

describe("Typed in React", () => {
  it("hydrates SSR Typed nodes and preserves an active reactive subscription", async () => {
    const scope = Scope.makeUnsafe();
    const count = Effect.runSync(
      RefSubject.make(0).pipe(Effect.provideService(Scope.Scope, scope)),
    );
    const value = html`<button onclick=${RefSubject.update(count, (n) => n + 1)}>${count}</button>`;
    const runtime = ManagedRuntime.make(Layer.empty);
    const errors: unknown[] = [];
    const tree = createElement(Typed, {
      value,
      runtime,
      onError: (cause) => errors.push(cause),
    });
    const stream = await renderToReadableStream(createElement(ServerTyped, tree.props));
    await stream.allReady;
    document.body.innerHTML = await new Response(stream).text();
    const button = document.querySelector("button")!;
    const root = hydrateRoot(document.body, tree);
    try {
      await vi.waitFor(() => expect(button.onclick !== null || button.isConnected).toBe(true));
      // Repeated interaction waits for Typed's asynchronous scope setup without assuming a timer.
      await vi.waitFor(() => {
        button.click();
        expect(Effect.runSync(count)).toBeGreaterThan(0);
      });
      expect(document.querySelector("button")).toBe(button);
      await vi.waitFor(() => expect(button.textContent).toBe(String(Effect.runSync(count))));
      expect(errors).toEqual([]);
    } finally {
      root.unmount();
      await runtime.dispose();
      await Effect.runPromise(Scope.close(scope, Exit.void));
    }
  });

  it("inherits React Provider services without requiring a runtime prop", async () => {
    class Greeting extends Context.Service<Greeting, { readonly text: string }>()(
      "ReactTypedGreeting",
    ) {}
    const value = html`<b>${Effect.map(Greeting, (service) => service.text)}</b>`;
    const context = Context.make(Greeting, { text: "inherited" });
    const errors: unknown[] = [];
    const root = createRoot(document.body);
    root.render(
      createElement(
        Provider<never, never, Greeting>,
        { context },
        createElement(Typed, { value, onError: (cause) => errors.push(cause) }),
      ),
    );
    try {
      await vi.waitFor(() => expect(document.querySelector("b")?.textContent).toBe("inherited"));
      expect(errors).toEqual([]);
    } finally {
      root.unmount();
    }
  });

  it("forwards Typed source failures and leaves borrowed runtimes usable", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    const errors: unknown[] = [];
    let released = 0;
    const value = Effect.addFinalizer(() => Effect.sync(() => released++)).pipe(
      Effect.andThen(Effect.fail("source failed")),
    );

    const root = createRoot(document.body);
    root.render(
      createElement(Typed, {
        value,
        runtime,
        onError: (cause) => errors.push(cause),
      }),
    );
    await vi.waitFor(() => expect(errors).toHaveLength(1));
    await vi.waitFor(() => expect(released).toBe(1));
    root.unmount();
    expect(await runtime.runPromise(Effect.succeed("still alive"))).toBe("still alive");
    await runtime.dispose();
  });

  it("awaits asynchronous old-runtime cleanup before mounting its replacement", async () => {
    const firstRuntime = ManagedRuntime.make(Layer.empty);
    const secondRuntime = ManagedRuntime.make(Layer.empty);
    const cleanupStarted = Promise.withResolvers<void>();
    const finishCleanup = Promise.withResolvers<void>();
    let acquired = 0;
    let released = 0;
    const errors: unknown[] = [];
    const value = Fx.fromEffect(
      Effect.acquireRelease(
        Effect.sync(() => {
          acquired++;
          const button = document.createElement("button");
          button.textContent = String(acquired);
          return DomRenderEvent(button);
        }),
        () =>
          Effect.promise(async () => {
            cleanupStarted.resolve();
            await finishCleanup.promise;
            released++;
          }),
      ),
    );
    const root = createRoot(document.body);
    root.render(
      createElement(Typed, {
        value,
        runtime: firstRuntime,
        onError: (cause) => errors.push(cause),
      }),
    );
    await vi.waitFor(() => expect(acquired).toBe(1));
    root.render(
      createElement(Typed, {
        value,
        runtime: secondRuntime,
        onError: (cause) => errors.push(cause),
      }),
    );
    await cleanupStarted.promise;
    expect(acquired).toBe(1);
    expect(released).toBe(0);
    finishCleanup.resolve();
    await vi.waitFor(() => expect(acquired).toBe(2));
    expect(released).toBe(1);
    root.unmount();
    await vi.waitFor(() => expect(released).toBe(2));
    await firstRuntime.dispose();
    await secondRuntime.dispose();
    expect(errors).toEqual([]);
  });

  it("closes each replaced Typed value scope while keeping finite values alive until replacement", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    const errors: unknown[] = [];
    const released: string[] = [];
    const value = (label: string) =>
      Fx.fromEffect(
        Effect.acquireRelease(
          Effect.sync(() => {
            const button = document.createElement("button");
            button.textContent = label;
            return DomRenderEvent(button);
          }),
          () =>
            Effect.sync(() => {
              released.push(label);
            }),
        ),
      );
    const first = value("first");
    const second = value("second");
    const root = createRoot(document.body);
    root.render(
      createElement(Typed, { value: first, runtime, onError: (cause) => errors.push(cause) }),
    );
    await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("first"));
    expect(released).toEqual([]);
    root.render(
      createElement(Typed, { value: second, runtime, onError: (cause) => errors.push(cause) }),
    );
    await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("second"));
    expect(released).toEqual(["first"]);
    root.unmount();
    await vi.waitFor(() => expect(released).toEqual(["first", "second"]));
    expect(errors).toEqual([]);
    await runtime.dispose();
  });

  it("skips Typed values superseded while the previous value is closing", async () => {
    const closing = Promise.withResolvers<void>();
    const release = Promise.withResolvers<void>();
    const opened: string[] = [];
    const value = (label: string) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          opened.push(label);
          return html`<button>${label}</button>`;
        }),
        () =>
          Effect.promise(async () => {
            if (label === "A") {
              closing.resolve();
              await release.promise;
            }
          }),
      );
    const root = createRoot(document.body);

    try {
      root.render(createElement(Typed, { value: value("A") }));
      await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("A"));

      root.render(createElement(Typed, { value: value("B") }));
      await closing.promise;
      root.render(createElement(Typed, { value: value("C"), id: "latest-typed-value" }));
      await vi.waitFor(() => expect(document.querySelector("#latest-typed-value")).not.toBeNull());

      release.resolve();
      await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("C"));
      expect(opened).toEqual(["A", "C"]);
    } finally {
      release.resolve();
      root.unmount();
    }
  });

  it("replaces Typed values when React props change and releases listeners on unmount", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    const errors: unknown[] = [];
    let clicks = 0;
    const first = html`<button onclick=${Effect.sync(() => clicks++)}>first</button>`;
    const second = html`<button onclick=${Effect.sync(() => (clicks += 10))}>second</button>`;
    const root = createRoot(document.body);
    root.render(
      createElement(Typed, { value: first, runtime, onError: (cause) => errors.push(cause) }),
    );
    await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("first"));
    const old = document.querySelector("button")!;
    root.render(
      createElement(Typed, { value: second, runtime, onError: (cause) => errors.push(cause) }),
    );
    await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("second"));
    const current = document.querySelector("button")!;
    current.click();
    await vi.waitFor(() => expect(clicks).toBe(10));
    root.unmount();
    await runtime.dispose();
    old.click();
    current.click();
    expect(clicks).toBe(10);
    expect(errors).toEqual([]);
  });
});
