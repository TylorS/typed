import { Fx, RefSubject } from "@typed/fx";
import { Cause, Deferred, Effect, Exit, Fiber, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";
import { html, RenderTemplate } from "../RenderTemplate.js";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "../Html.js";
import * as WebComponent from "../WebComponent.js";

describe("WebComponent server rendering", () => {
  it("streams early content before pending content and preserves slot order", async () => {
    const gate = Deferred.makeUnsafe<void>();
    const chunks: string[] = [];
    let released = 0;

    const definition = WebComponent.make({
      name: "typed-streaming-example",
      defaults: () => ({}),
      render: () =>
        html`<p>early</p>
          ${Effect.gen(function* () {
            yield* Effect.addFinalizer(() =>
              Effect.sync(() => {
                released++;
              }),
            );
            yield* Deferred.await(gate);

            return html`<p>later</p>`;
          })}`,
    });
    const page = html`<main>${WebComponent.server(definition, {}, html`<span>slot</span>`)}</main>`;
    const fiber = Effect.runFork(
      renderToHtml(page).pipe(
        Fx.observe((chunk) => {
          chunks.push(chunk);
        }),
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
      ),
    );

    try {
      await vi.waitFor(() => expect(chunks.join("")).toContain("early"));
      expect(chunks.join("")).not.toContain("later");
      expect(chunks.join("")).not.toContain("slot");

      await Effect.runPromise(Deferred.succeed(gate, undefined));
      await Effect.runPromise(Fiber.join(fiber));

      const markup = chunks.join("");
      expect(markup.indexOf("early")).toBeLessThan(markup.indexOf("later"));
      expect(markup.indexOf("later")).toBeLessThan(markup.indexOf("slot"));
      expect(markup).toContain("</typed-streaming-example>");
      expect(released).toBe(1);
    } finally {
      await Effect.runPromise(Fiber.interrupt(fiber));
    }
  });

  for (const outcome of ["interrupt", "failure"] as const) {
    it(`releases pending streamed content on ${outcome}`, async () => {
      const started = Deferred.makeUnsafe<void>();
      const gate = Deferred.makeUnsafe<void>();
      const chunks: string[] = [];
      let released = 0;

      const definition = WebComponent.make({
        name: "typed-pending-stream",
        defaults: () => ({}),
        render: () =>
          Effect.gen(function* () {
            yield* Effect.addFinalizer(() =>
              Effect.sync(() => {
                released++;
              }),
            );
            yield* Deferred.succeed(started, undefined);
            yield* Deferred.await(gate);

            return yield* Effect.fail("late failure");
          }),
      });
      const fiber = Effect.runFork(
        renderToHtml(WebComponent.server(definition)).pipe(
          Fx.observe((chunk) => {
            chunks.push(chunk);
          }),
          Effect.provide(HtmlRenderTemplate),
          Effect.scoped,
        ),
      );

      try {
        await Effect.runPromise(Deferred.await(started));
        expect(chunks.join("")).toContain("<typed-pending-stream");

        const exit =
          outcome === "interrupt"
            ? await Effect.runPromise(
                Fiber.interrupt(fiber).pipe(Effect.andThen(Fiber.await(fiber))),
              )
            : await Effect.runPromise(
                Deferred.succeed(gate, undefined).pipe(Effect.andThen(Fiber.await(fiber))),
              );

        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          if (outcome === "interrupt") expect(Cause.hasInterruptsOnly(exit.cause)).toBe(true);
          else expect(Cause.squash(exit.cause)).toBe("late failure");
        }

        expect(chunks.join("")).not.toContain("</typed-pending-stream>");
        expect(released).toBe(1);
      } finally {
        await Effect.runPromise(Fiber.interrupt(fiber));
      }
    });
  }

  it("imports and renders without DOM globals, with escaped schema attributes and text", async () => {
    expect(typeof globalThis.HTMLElement).toBe("undefined");
    const definition = WebComponent.make({
      name: "typed-server-example",
      defaults: () => ({ label: "default" }),
      attributes: Schema.Struct({ label: Schema.String }),
      render: (props) => html`<p>${RefSubject.map(props, (value) => value.label)}</p>`,
    });
    const result = await Effect.runPromise(
      renderToHtmlString(
        WebComponent.server(definition, { label: '"><script>alert(1)</script>' }),
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );
    expect(result).toContain('style="display:contents"');
    expect(result).toContain('<template shadowrootmode="open">');
    expect(result).toContain('label="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
    expect(result).not.toContain("<script>");
    expect(result).toContain("<!--t_");
  });

  it("composes trusted component markup in an outer server template", async () => {
    const definition = WebComponent.make({
      name: "typed-composed-server",
      defaults: () => ({ label: "" }),
      render: (props) => html`<p>${RefSubject.map(props, (value) => value.label)}</p>`,
    });
    const result = await Effect.runPromise(
      renderToHtmlString(
        html`<main>${WebComponent.server(definition, { label: "<em>data</em>" })}</main>`,
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );
    expect(result).toContain('<typed-composed-server style="display:contents">');
    expect(result).toContain('<template shadowrootmode="open">');
    expect(result).toContain("&lt;em&gt;data&lt;/em&gt;");
    expect(result).not.toContain("&lt;typed-composed-server");
    expect(result).not.toContain("<em>data</em>");
  });

  it("borrows an explicitly supplied HTML renderer for its view and slots", () =>
    Effect.gen(function* () {
      const renderer = new Proxy(yield* RenderTemplate, {});
      const selected: unknown[] = [];
      const content = Effect.map(RenderTemplate, (current) => {
        selected.push(current);
        return html`<p>borrowed</p>`;
      });
      const definition = WebComponent.make({
        name: "typed-borrowed-renderer",
        defaults: () => ({}),
        render: () => content,
      });
      const markup = yield* renderToHtmlString(WebComponent.server(definition, {}, content)).pipe(
        Effect.provideService(RenderTemplate, renderer),
      );
      expect(markup).toContain("borrowed");
      expect(selected).toEqual([renderer, renderer]);
    }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise));

  it("creates independent default state per SSR request", async () => {
    let counter = 0;
    const definition = WebComponent.make({
      name: "typed-request-state",
      defaults: () => ({ value: ++counter }),
      render: (props) => html`<p>${RefSubject.map(props, (value) => value.value)}</p>`,
    });
    const first = await Effect.runPromise(
      renderToHtmlString(WebComponent.server(definition)).pipe(
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
      ),
    );
    const second = await Effect.runPromise(
      renderToHtmlString(WebComponent.server(definition)).pipe(
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
      ),
    );
    expect(first).toContain(">1<!--");
    expect(second).toContain(">2<!--");
  });

  it("validates host and serialized attribute names before producing HTML", () => {
    for (const name of ["div", "script><img", "font-face", "Typed-Example"]) {
      expect(() => WebComponent.make({ name, defaults: () => ({}), render: () => "" })).toThrow(
        TypeError,
      );
    }
    for (const name of ["onclick", 'x" onclick="bad']) {
      expect(() =>
        WebComponent.make({
          name: "typed-invalid-attribute",
          defaults: () => ({ value: "" }),
          render: () => "",
          attributes: Schema.Struct({ value: Schema.String }).pipe(
            Schema.encodeKeys({ value: name }),
          ),
        }),
      ).toThrow(TypeError);
    }
  });

  it("requires finite encoded attribute names", () => {
    expect(() =>
      WebComponent.make({
        name: "typed-unbounded-attributes",
        defaults: (): Record<string, string> => ({}),
        attributes: Schema.Record(Schema.String, Schema.String),
        render: () => "",
      }),
    ).toThrow("Web Component attributes require a finite set of encoded keys");

    expect(() =>
      WebComponent.make({
        name: "typed-duplicate-attributes",
        defaults: () => ({ first: "", second: "" }),
        attributes: Schema.Struct({ first: Schema.String, second: Schema.String }).pipe(
          Schema.encodeKeys({ first: "label", second: "label" }),
        ),
        render: () => "",
      }),
    ).toThrow();
  });
});
