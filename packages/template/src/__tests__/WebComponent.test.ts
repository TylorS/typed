import { Fx, RefSubject } from "@typed/fx";
import { Cause, Deferred, Effect, Exit, Fiber, Schema } from "effect";
import { describe, expect, it, vi } from "vitest";
import { html, RenderTemplate } from "../RenderTemplate.js";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "../Html.js";
import * as WebComponent from "../WebComponent.js";

describe("WebComponent server rendering", () => {
  it("derives defaults and optional fields from attribute schemas and renders computed fields", async () => {
    const definition = WebComponent.make({
      name: "typed-schema-props",
      attributes: {
        count: Schema.FiniteFromString.pipe(Schema.withDecodingDefaultTypeKey(Effect.succeed(7))),
        label: Schema.optionalKey(Schema.String),
      },
      render: ({ count, label }) => html`<p>${count}:${label}</p>`,
    });
    const markup = await Effect.runPromise(
      renderToHtmlString(WebComponent.server(definition)).pipe(
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
      ),
    );
    expect(markup).toContain('count="7"');
    expect(markup).not.toContain('label="');
    expect(markup).toContain(">7<!--");
  });

  it("serializes only attributes while rendering typed property values", async () => {
    let defaults = 0;
    const definition = WebComponent.make({
      name: "typed-rich-properties",
      attributes: {
        count: Schema.FiniteFromString.pipe(
          Schema.withDecodingDefaultTypeKey(
            Effect.sync(() => {
              defaults++;
              return 0;
            }),
          ),
        ),
        ".user": Schema.Struct({ name: Schema.String }),
      },
      render: ({ count, user }) =>
        html`<p>${count}:${RefSubject.map(user, (value) => value.name)}</p>`,
    });
    const markup = await Effect.runPromise(
      renderToHtmlString(
        WebComponent.server(definition, {
          count: 8,
          user: { name: "Ada" },
        }),
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );
    expect(markup).toContain('count="8"');
    expect(markup).toContain("Ada");
    expect(markup).not.toContain("user=");
    expect(defaults).toBe(0);
  });

  it("streams early content before pending content and preserves slot order", async () => {
    const gate = Deferred.makeUnsafe<void>();
    const chunks: string[] = [];
    let released = 0;

    const definition = WebComponent.make({
      name: "typed-streaming-example",

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
      attributes: { label: Schema.String },
      render: (props) => html`<p>${props.label}</p>`,
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
      attributes: { ".label": Schema.String },
      render: (props) => html`<p>${props.label}</p>`,
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
      attributes: {
        ".value": Schema.Finite.pipe(Schema.withConstructorDefault(Effect.sync(() => ++counter))),
      },
      render: (props) => html`<p>${props.value}</p>`,
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
      expect(() => WebComponent.make({ name, render: () => "" })).toThrow(TypeError);
    }
    for (const name of ["onclick", 'x" onclick="bad']) {
      expect(() =>
        WebComponent.make({
          name: "typed-invalid-attribute",
          render: () => "",
          attributes: { [name]: Schema.String },
        }),
      ).toThrow(TypeError);
    }
  });

  it("rejects symbol keys and duplicate normalized field names", () => {
    expect(() =>
      WebComponent.make({
        name: "typed-symbol-attribute",
        attributes: { [Symbol("label")]: Schema.String },
        render: () => "",
      }),
    ).toThrow(TypeError);

    expect(() =>
      WebComponent.make({
        name: "typed-duplicate-attributes",
        attributes: { label: Schema.String, ".label": Schema.String },
        render: () => "",
      }),
    ).toThrow();
  });
});
