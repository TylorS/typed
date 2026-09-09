import { describe, expect, it, vi } from "vitest";
import { Cause, Deferred, Effect, Exit, Fiber } from "effect";
import { Fx } from "@typed/fx";
import {
  HtmlRenderTemplate,
  StaticHtmlRenderTemplate,
  html,
  renderToHtml,
  renderToHtmlString,
} from "@typed/template";
import { RenderTemplate } from "@typed/template/RenderTemplate";
import { HtmlRenderEvent, isHtmlRenderEvent, type RenderEvent } from "@typed/template/RenderEvent";
import Stateful from "./fixtures/Stateful.svelte";
import { view } from "../view.js";

describe("Svelte view HTML renderer", () => {
  it("renders through templates whose HTML chunks split inside tags", async () => {
    const output = await Effect.gen(function* () {
      const renderTemplate = yield* RenderTemplate;

      return yield* renderToHtmlString(
        html`<main>${view(Stateful, { label: "</div><div>" }, { id: "split-host" })}</main>`,
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

    expect(output).toMatch(/<div\b[^>]*\sid="split-host"[^>]*>/);
    expect(output).toContain('style="display: contents"');
    expect(output).toContain("&lt;/div>&lt;div>");
    expect(output).toContain("</div>");
    expect(output).toContain("</main>");
  });

  it.each([HtmlRenderTemplate, StaticHtmlRenderTemplate])(
    "streams the surrounding template and host before waiting for Svelte props",
    async (renderer) => {
      const props = Deferred.makeUnsafe<{ label: string }>();
      const chunks: string[] = [];
      const page = html`<main>
        before${view(Stateful, Deferred.await(props), {
          id: "streaming-counter",
        })}after
      </main>`;

      const fiber = Effect.runFork(
        renderToHtml(page).pipe(
          Fx.observe((chunk) =>
            Effect.sync(() => {
              chunks.push(chunk);
            }),
          ),
          Effect.provide(renderer),
          Effect.scoped,
        ),
      );

      try {
        await vi.waitFor(() => expect(chunks.join("")).toContain('id="streaming-counter"'));

        expect(chunks.join("")).toContain("before");
        const shell = chunks.join("");
        const shellHost = shell.indexOf('id="streaming-counter"');
        expect(shellHost).toBeGreaterThan(-1);
        expect(shell.indexOf("</div>", shellHost)).toBe(-1);
        expect(chunks.join("")).not.toContain("after");

        await Effect.runPromise(Deferred.succeed(props, { label: "ready" }));
        await Effect.runPromise(Fiber.join(fiber));

        const output = chunks.join("");

        expect(output).toContain("ready:0");
        expect(output.indexOf("before")).toBeLessThan(output.indexOf('id="streaming-counter"'));
        const host = output.indexOf('id="streaming-counter"');
        const closingHost = output.indexOf("</div>", host);
        expect(output.indexOf("ready:0")).toBeLessThan(closingHost);
        expect(closingHost).toBeLessThan(output.indexOf("after"));
        expect(output).toContain("</main>");
      } finally {
        await Effect.runPromise(Fiber.interrupt(fiber));
      }
    },
  );

  it("server-renders the first props value and exposes head output", async () => {
    const heads: Array<string> = [];
    const props = Fx.fromIterable([{ label: "first" }, { label: "second" }]);

    const markup = await renderToHtmlString(
      view(Stateful, props, { id: "counter", onHead: (head) => heads.push(head) }),
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise);

    expect(markup).toMatch(/<div\b[^>]*\bid="counter"[^>]*>/);
    expect(markup).toContain('style="display: contents"');
    expect(markup).toContain("first:0");
    expect(markup).not.toContain("second:0");
    expect(heads.join("\n")).toContain("<title>first</title>");
  });
});

describe("Svelte SSR contracts", () => {
  it("escapes component props and closes request resources", async () => {
    let closed = 0;
    const source = Fx.unwrap(
      Effect.acquireRelease(Effect.succeed({ label: '<script>alert("x")</script>' }), () =>
        Effect.sync(() => {
          closed++;
        }),
      ).pipe(Effect.map(Fx.succeed)),
    );
    const markup = await Effect.runPromise(
      Effect.scoped(
        renderToHtmlString(view(Stateful, source, { id: "counter" })).pipe(
          Effect.provide(HtmlRenderTemplate),
        ),
      ),
    );
    expect(markup).toContain("&lt;script>");
    expect(markup).not.toContain('<script>alert("x")</script>');
    expect(closed).toBe(1);
  });

  it("retains source failures and represents an empty source without inventing props", async () => {
    const result = await Effect.runPromiseExit(
      Effect.scoped(
        renderToHtmlString(view(Stateful, Fx.fail("failed"), { id: "counter" })).pipe(
          Effect.provide(HtmlRenderTemplate),
        ),
      ),
    );
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) expect(Cause.hasFails(result.cause)).toBe(true);
    const empty = await renderToHtmlString(view(Stateful, Fx.empty, { id: "counter" })).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.runPromise,
    );

    expect(empty).toMatch(/<div\b[^>]*\bid="counter"[^>]*><!--n_\d+--><!--\/n_\d+--><\/div>/);
    expect(empty).not.toContain("data-stateful");
  });

  it("uses the selected native HTML renderer even when a document global exists", async () => {
    vi.stubGlobal("document", {});

    try {
      const output = await renderToHtmlString(
        view(Stateful, { label: "static" }, { id: "static" }),
      ).pipe(Effect.provide(StaticHtmlRenderTemplate), Effect.scoped, Effect.runPromise);

      expect(output).toContain("static:0");
      expect(output).toMatch(/<div\b[^>]*\bid="static"[^>]*>/);
      expect(output).not.toContain("<!--t_");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("imports emitted server and root entries without a document or .svelte loader", async () => {
    expect(typeof document).toBe("undefined");
    const rootPath = new URL("../../dist/index.js", import.meta.url).href;
    const root = await import(rootPath);
    expect(root.view).toBeTypeOf("function");
    const inverse = await import("@typed/svelte/Typed.svelte");
    expect(inverse.default).toBeTypeOf("function");
  });
});
