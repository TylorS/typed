import { createElement, Fragment, lazy, Suspense, useId } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Cause, Context, Effect, Exit, Fiber, Stream } from "effect";
import { describe, expect, it, vi } from "vitest";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { RenderTemplate } from "@typed/template/RenderTemplate";
import { HtmlRenderTemplate, renderToHtmlString as renderNativeHtml } from "@typed/template/Html";
import { isHtmlRenderEvent, HtmlRenderEvent, type RenderEvent } from "@typed/template/RenderEvent";
import { renderToHtmlString } from "./native.js";
import { view } from "../index.js";
import { useService } from "../Runtime.js";

describe("React server rendering", () => {
  it("renders through templates whose HTML chunks split inside tags", async () => {
    const output = await Effect.gen(function* () {
      const renderTemplate = yield* RenderTemplate;

      return yield* renderNativeHtml(
        html`<main>
          ${view(createElement("strong", null, "</div><div>"), { id: "split-host" })}
        </main>`,
      ).pipe(
        Effect.provideService(RenderTemplate, (strings, values) =>
          renderTemplate(strings, values).pipe(
            Fx.concatMap((event): Fx.Fx<RenderEvent> =>
              isHtmlRenderEvent(event)
                ? Fx.fromIterable(
                    Array.from(event.html, (character, index) =>
                      HtmlRenderEvent(character, event.last && index === event.html.length - 1),
                    ),
                  )
                : Fx.succeed(event),
            ),
          ),
        ),
      );
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise);

    expect(output).toContain('<div style="display:contents" id="split-host">');
    expect(output).toContain("<strong>&lt;/div&gt;&lt;div&gt;</strong>");
    expect(output).toContain("</div>");
    expect(output).toContain("</main>");
  });

  it("renders escaped React markup without a DOM and preserves a root identifier prefix", async () => {
    const Component = ({ label }: { label: string }) =>
      createElement("button", { id: useId() }, label);
    const output = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(
          view(Component, { label: "<hello>" }, { id: "react-html-1", identifierPrefix: "demo" }),
        ),
      ),
    );
    expect(output).toMatch(/<div\b[^>]*\bid="react-html-1"[^>]*>/);
    expect(output).toContain("&lt;hello&gt;");
    expect(output).toContain("demo");
    expect(typeof document).toBe("undefined");
  });

  it("preserves literal dollar replacement sequences in renderer-owned HTML", async () => {
    const node = createElement("b", null, "$& $$ $` $'");
    const expected = renderToStaticMarkup(node);
    const output = await Effect.runPromise(
      renderToHtmlString(view(node, { id: "literal-dollars" })),
    );

    expect(output).toContain(expected);
    expect(output.match(/<div\b[^>]*\bid="literal-dollars"[^>]*>/g)).toHaveLength(1);
    expect(output).toContain("</div><!--/t_");
  });

  it("makes ambient Effect services available to React during SSR", async () => {
    class Greeting extends Context.Service<Greeting, { readonly text: string }>()(
      "ReactSsrGreeting",
    ) {}
    const Component = () => createElement("b", null, useService(Greeting).text);
    const output = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(view(Component, {}, { id: "react-html-2" })).pipe(
          Effect.provideService(Greeting, { text: "from Effect" }),
        ),
      ),
    );
    expect(output).toContain("from Effect");
  });

  it("renders direct ReactNode text, arrays, fragments and null", async () => {
    const cases = [
      ["text", "hello", "hello"],
      ["array", ["one", "two"], "one<!-- -->two"],
      [
        "fragment",
        createElement(Fragment, null, createElement("b", null, "fragment")),
        "<b>fragment</b>",
      ],
      ["null", null, ""],
    ] as const;
    for (const [id, node, expected] of cases) {
      const output = await Effect.runPromise(Effect.scoped(renderToHtmlString(view(node, { id }))));
      expect(output).toContain(`id="${id}"`);
      expect(output).toContain(expected);
      expect(output).toContain("<!--n_");
    }
  });

  it("preserves callback and ReactNode props across each source kind", async () => {
    const callback = () => "called";
    const child = createElement("span", null, "child");
    const props = { callback, child };
    const Component = (value: typeof props) => {
      expect(value.callback).toBe(callback);
      expect(value.child).toBe(child);
      return createElement("p", null, value.callback(), value.child);
    };

    for (const source of [props, Effect.succeed(props), Fx.succeed(props), Stream.succeed(props)]) {
      const output = await Effect.runPromise(
        renderToHtmlString(view(Component, source, { id: "props" })),
      );
      expect(output).toContain("called<span>child</span>");
    }
  });

  it("keeps host SSR structure independent of its event policy", async () => {
    const first = await Effect.runPromise(renderToHtmlString(view("content", { id: "policy" })));
    const second = await Effect.runPromise(
      renderToHtmlString(view("content", { id: "policy", stopPropagation: { click: true } })),
    );
    expect(first).toEqual(second);
  });

  it("takes one reactive props value and finishes SSR", async () => {
    const Component = ({ count }: { count: number }) => createElement("b", null, count);
    const output = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(
          view(Component, Fx.fromIterable([{ count: 1 }, { count: 2 }]), { id: "react-html-3" }),
        ),
      ),
    );
    expect(output).toContain(">1</b>");
    expect(output).not.toContain(">2</b>");
  });

  it("closes an empty props host and leaves following Typed siblings intact", async () => {
    const empty = view(() => createElement("b", null, "unexpected"), Fx.empty, { id: "empty" });
    const output = await Effect.runPromise(
      renderToHtmlString(html`<main>${empty}<i>following</i></main>`),
    );
    expect(output).toContain('id="empty"');
    expect(output).toMatch(/<div\b[^>]*\bid="empty"[^>]*>/);
    expect(output).toMatch(/<div\b[^>]*\bid="empty"[^>]*><!--n_[^>]*><!--\/n_/);
    expect(output).toContain("<i>following</i></main>");
    expect(output).not.toContain("unexpected");
  });

  it("forwards React rendering failures in the typed error channel", async () => {
    const Broken = () => {
      throw new Error("broken component");
    };
    const result = await Effect.runPromise(
      Effect.scoped(renderToHtmlString(view(Broken, {}, { id: "react-html-4" })).pipe(Effect.flip)),
    );
    expect(result._tag).toBe("ReactRenderError");
  });

  it("awaits async React Suspense content before publishing its final chunk", async () => {
    const Lazy = lazy(async () => ({ default: () => createElement("strong", null, "resolved") }));
    const Component = () => createElement(Suspense, { fallback: "pending" }, createElement(Lazy));
    const output = await Effect.runPromise(
      Effect.scoped(renderToHtmlString(view(Component, {}, { id: "react-html-5" }))),
    );
    expect(output).toContain("resolved");
    expect(output).not.toContain("pending");
  });

  it("streams the shell before Suspense resolves and emits one final native marker", async () => {
    const pending = Promise.withResolvers<{ default: () => ReturnType<typeof createElement> }>();
    const Lazy = lazy(() => pending.promise);
    const Component = () =>
      createElement(
        "main",
        null,
        createElement("h1", null, "shell"),
        createElement(Suspense, { fallback: "waiting" }, createElement(Lazy)),
      );
    const events: HtmlRenderEvent[] = [];
    const fiber = Effect.runFork(
      Fx.observe(view(Component, {}, { id: "streaming" }), (event) => {
        if (isHtmlRenderEvent(event)) events.push(event);
      }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );

    try {
      await vi.waitFor(() =>
        expect(events.map((event) => event.html).join("")).toContain("waiting"),
      );
      const shell = events.map((event) => event.html).join("");
      expect(shell).toContain("<h1>shell</h1>");
      expect(shell).not.toContain("résolu 🍋");
      expect(events.some((event) => event.last)).toBe(false);

      pending.resolve({ default: () => createElement("b", null, "résolu 🍋") });
      await Effect.runPromise(Fiber.join(fiber));

      const output = events.map((event) => event.html).join("");
      expect(output).toContain("résolu 🍋");
      expect(output).toContain("</div><!--/t_");
      expect(events.filter((event) => event.last)).toHaveLength(1);
      expect(events.at(-1)?.last).toBe(true);
    } finally {
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
  });

  it("interrupts a streamed pending Suspense boundary and closes its scope", async () => {
    const pending = Promise.withResolvers<{ default: () => ReturnType<typeof createElement> }>();
    const Lazy = lazy(() => pending.promise);
    const Component = () =>
      createElement(
        "main",
        null,
        createElement("h1", null, "shell"),
        createElement(Suspense, { fallback: "waiting" }, createElement(Lazy)),
      );
    let acquired = 0;
    let released = 0;
    const props = Effect.acquireRelease(
      Effect.sync(() => {
        acquired++;
        return {};
      }),
      () =>
        Effect.sync(() => {
          released++;
        }),
    );
    const events: HtmlRenderEvent[] = [];
    const fiber = Effect.runFork(
      Fx.observe(view(Component, props, { id: "abort-stream" }), (event) => {
        if (isHtmlRenderEvent(event)) events.push(event);
      }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );

    try {
      await vi.waitFor(() =>
        expect(events.map((event) => event.html).join("")).toContain("waiting"),
      );
      expect(acquired).toBe(1);
      expect(released).toBe(0);

      await Effect.runPromise(Fiber.interrupt(fiber));
      const exit = await Effect.runPromise(Fiber.await(fiber));
      expect(Exit.isFailure(exit) && Cause.hasInterruptsOnly(exit.cause)).toBe(true);
      expect(released).toBe(1);
      expect(events.some((event) => event.last)).toBe(false);
    } finally {
      pending.resolve({ default: () => createElement("b", null, "too late") });
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
    expect(released).toBe(1);
  });

  it("reports rejected Suspense content instead of silently returning a client fallback", async () => {
    const Lazy = lazy(async () => {
      throw new Error("async component failed");
    });
    const Component = () => createElement(Suspense, { fallback: "pending" }, createElement(Lazy));
    const error = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(view(Component, {}, { id: "react-html-6" })).pipe(Effect.flip),
      ),
    );
    expect(error._tag).toBe("ReactRenderError");
    expect(String(error.cause)).toContain("async component failed");
  });

  it("interrupts pending props and runs their scoped cleanup", async () => {
    let started = false;
    let released = false;
    const props = Effect.gen(function* () {
      yield* Effect.acquireRelease(
        Effect.sync(() => {
          started = true;
        }),
        () =>
          Effect.sync(() => {
            released = true;
          }),
      );
      return yield* Effect.never;
    });
    const fiber = Effect.runFork(
      Effect.scoped(
        renderToHtmlString(view(() => createElement("b"), props, { id: "react-html-7" })),
      ),
    );
    await vi.waitFor(() => expect(started).toBe(true));
    await Effect.runPromise(Fiber.interrupt(fiber));
    expect(released).toBe(true);
  });

  it("renders hydratable Typed markup through the native API", async () => {
    const snapshot = await Effect.runPromise(
      Effect.scoped(renderToHtmlString(html`<p>${"Typed"}</p>`)),
    );
    expect(snapshot).toContain("Typed");
    expect(snapshot).toContain("<!--t_");
  });
});
