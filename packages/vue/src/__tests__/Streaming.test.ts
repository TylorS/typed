import * as Fx from "@typed/fx/Fx";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";
import { isHtmlRenderEvent, type HtmlRenderEvent } from "@typed/template/RenderEvent";
import { html } from "@typed/template/RenderTemplate";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h, onServerPrefetch } from "vue";
import { renderToWebStream } from "vue/server-renderer";
import { Typed } from "../Typed.js";
import { view, VueError } from "../view.js";

describe("Vue streaming HTML", () => {
  it("streams a native Vue shell while its Typed slot awaits a complete snapshot", async () => {
    const pending = Promise.withResolvers<string>();
    const value = html`<b>${Effect.promise(() => pending.promise)}</b>`;
    const app = createSSRApp({
      render: () =>
        h("main", [h("h1", "shell"), h(Typed, { id: "streaming-slot", value }), h("i", "after")]),
    });
    const reader = renderToWebStream(app).getReader();
    const decoder = new TextDecoder();

    try {
      const first = await reader.read();
      const shell = decoder.decode(first.value, { stream: true });
      expect(first.done).toBe(false);
      expect(shell).toContain("<h1>shell</h1>");
      expect(shell).not.toContain('id="streaming-slot"');
      expect(shell).not.toContain("after");

      pending.resolve("Typed body");
      let output = shell;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        output += decoder.decode(chunk.value, { stream: true });
      }
      output += decoder.decode();

      expect(output).toMatch(/<div\b[^>]*\bid="streaming-slot"[^>]*>/);
      expect(output).toContain("<!--t_");
      expect(output.replace(/<!--.*?-->/g, "")).toContain("<b>Typed body</b>");
      const host = output.indexOf('id="streaming-slot"');
      const closingHost = output.indexOf("</div>", host);
      expect(closingHost).toBeGreaterThan(host);
      expect(closingHost).toBeLessThan(output.indexOf("<i>after</i></main>"));
    } finally {
      pending.resolve("Typed body");
      await reader.cancel();
      reader.releaseLock();
    }
  });

  it("emits the shell before an async descendant and closes the native host once", async () => {
    const pending = Promise.withResolvers<void>();
    const Child = defineComponent({
      setup() {
        onServerPrefetch(() => pending.promise);
        return () => h("b", "résolu 🍋");
      },
    });
    const Component = defineComponent({
      setup: () => () => h("section", [h("h1", "shell"), h(Child), h("i", "after")]),
    });
    const events: HtmlRenderEvent[] = [];
    const contexts = vi.fn();
    const fiber = Effect.runFork(
      Fx.observe(view(Component, {}, { id: "streaming", onSSRContext: contexts }), (event) => {
        if (isHtmlRenderEvent(event)) events.push(event);
      }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );

    try {
      await vi.waitFor(() =>
        expect(events.map((event) => event.html).join("")).toContain("<h1>shell</h1>"),
      );
      const shell = events.map((event) => event.html).join("");
      expect(shell).not.toContain("résolu");
      expect(shell).not.toContain("after");
      expect(shell).not.toContain("</div><!--/t_");
      expect(events.some((event) => event.last)).toBe(false);
      expect(contexts).not.toHaveBeenCalled();

      pending.resolve();
      await Effect.runPromise(Fiber.join(fiber));

      const output = events.map((event) => event.html).join("");
      expect(output.replace(/<!--.*?-->/g, "")).toContain(
        "<b>résolu 🍋</b><i>after</i></section></div>",
      );
      expect(output.match(/<\/section><!--\/n_\d+--><\/div><!--\/t_/g)).toHaveLength(1);
      expect(events.filter((event) => event.last)).toHaveLength(1);
      expect(events.at(-1)?.last).toBe(true);
      expect(contexts).toHaveBeenCalledOnce();
    } finally {
      pending.resolve();
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
  });

  it("cancels a pending consumer and releases its scope without publishing later output or context", async () => {
    const pending = Promise.withResolvers<void>();
    let prefetchCompleted = false;
    let released = 0;
    const contexts = vi.fn();
    const Child = defineComponent({
      setup() {
        onServerPrefetch(async () => {
          await pending.promise;
          prefetchCompleted = true;
        });
        return () => h("b", "late");
      },
    });
    const Component = defineComponent({
      setup: () => () => h("section", [h("h1", "shell"), h(Child)]),
    });
    const props = Effect.acquireRelease(Effect.succeed({}), () => Effect.sync(() => released++));
    const chunks: string[] = [];
    const fiber = Effect.runFork(
      Fx.observe(
        renderToHtml(view(Component, props, { id: "cancel-stream", onSSRContext: contexts })),
        (chunk) => {
          chunks.push(chunk);
        },
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );

    try {
      await vi.waitFor(() => expect(chunks.join("")).toContain("<h1>shell</h1>"));
      expect(released).toBe(0);
      await Effect.runPromise(Fiber.interrupt(fiber));
      expect(released).toBe(1);
      const shell = chunks.join("");

      // Native Vue cancellation cannot abort application promises.
      pending.resolve();
      await vi.waitFor(() => expect(prefetchCompleted).toBe(true));
      expect(chunks.join("")).toBe(shell);
      expect(shell).not.toContain("</div><!--/t_");
      expect(contexts).not.toHaveBeenCalled();
    } finally {
      pending.resolve();
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
  });

  it("reports asynchronous Vue prefetch failures in the typed error channel", async () => {
    const cause = new Error("prefetch failed");
    const configured = vi.fn();
    const contexts = vi.fn();
    const Component = defineComponent({
      setup() {
        onServerPrefetch(async () => {
          throw cause;
        });
        return () => h("b", "unexpected");
      },
    });
    const error = await renderToHtmlString(
      view(
        Component,
        {},
        {
          id: "prefetch-failure",
          configureApp: (app) => {
            app.config.errorHandler = configured;
          },
          onSSRContext: contexts,
        },
      ),
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.flip, Effect.runPromise);

    expect(error).toBeInstanceOf(VueError);
    expect(error.cause).toBe(cause);
    expect(configured).toHaveBeenCalledWith(cause, expect.anything(), expect.any(String));
    expect(contexts).not.toHaveBeenCalled();
  });

  it("waits for the SSR context callback before its final native marker", async () => {
    const pending = Promise.withResolvers<void>();
    const contexts = vi.fn(() => pending.promise);
    const Component = defineComponent({ setup: () => () => h("b", "complete") });
    const events: HtmlRenderEvent[] = [];
    const fiber = Effect.runFork(
      Fx.observe(view(Component, {}, { id: "context-stream", onSSRContext: contexts }), (event) => {
        if (isHtmlRenderEvent(event)) events.push(event);
      }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );

    try {
      await vi.waitFor(() => expect(contexts).toHaveBeenCalledOnce());
      expect(events.map((event) => event.html).join("")).toContain("<b>complete</b>");
      expect(events.some((event) => event.last)).toBe(false);
      pending.resolve();
      await Effect.runPromise(Fiber.join(fiber));
      expect(events.at(-1)?.html).toContain("</div><!--/t_");
      expect(events.at(-1)?.last).toBe(true);
    } finally {
      pending.resolve();
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
  });

  it.each(["configureApp", "onSSRContext"] as const)(
    "retains %s failures in the typed channel",
    async (callback) => {
      const cause = new Error(callback);
      const Component = defineComponent({ setup: () => () => h("b", "content") });
      const error = await renderToHtmlString(
        view(
          Component,
          {},
          {
            id: "callback-failure",
            [callback]: () => {
              throw cause;
            },
          },
        ),
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.flip, Effect.runPromise);

      expect(error).toBeInstanceOf(VueError);
      expect(error.cause).toBe(cause);
    },
  );

  it("closes an empty props host before its following Typed sibling", async () => {
    const Component = defineComponent({ setup: () => () => h("b", "unexpected") });
    const page = html`<main>
      ${view(Component, Fx.empty, { id: "empty-stream" })}<i>following</i>
    </main>`;
    const output = await renderToHtmlString(page).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(output).toMatch(/<div\b[^>]*\bid="empty-stream"[^>]*>/);
    expect(output).toMatch(
      /<div\b[^>]*\bid="empty-stream"[^>]*><!--n_\d+--><!--\/n_\d+--><\/div><!--\/t_/,
    );
    expect(output).toContain("<i>following</i></main>");
    expect(output).not.toContain("unexpected");
  });
});
