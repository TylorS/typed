import * as Fx from "@typed/fx/Fx";
import { html, RenderTemplate } from "@typed/template/RenderTemplate";
import { HtmlRenderEvent, isHtmlRenderEvent, type RenderEvent } from "@typed/template/RenderEvent";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { describe, expect, it } from "vitest";
import { defineComponent, h, inject, onServerPrefetch, ref, Teleport } from "vue";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { Typed, createTypedComponent } from "../Typed.js";
import { view, VueError } from "../view.js";

const Greeting = defineComponent({
  props: { name: { type: String, required: true } },
  setup: (props) => () => h("strong", props.name),
});
describe("Vue server rendering", () => {
  it("renders through templates whose HTML chunks split inside tags", async () => {
    const output = await Effect.gen(function* () {
      const renderTemplate = yield* RenderTemplate;

      return yield* renderToHtmlString(
        html`<main>${view(Greeting, { name: "</div><div>" }, { id: "split-host" })}</main>`,
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

    expect(output).toMatch(/<div\b[^>]*style="display:contents"[^>]* id="split-host"[^>]*>/);
    expect(output).toContain("<strong>&lt;/div&gt;&lt;div&gt;</strong>");
    expect(output).toContain("</div>");
    expect(output).toContain("</main>");
  });

  it("automatically supplies the enclosing Effect context to nested Typed views", async () => {
    class Request extends Context.Service<Request, string>()("VueRequest") {}
    const nested = html`<em>${Effect.map(Request, (request) => request)}</em>`;
    const Component = defineComponent({ setup: () => () => h(Typed, { value: nested }) });
    const output = await renderToHtmlString(view(Component, {}, { id: "vue-html-1" })).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.provideService(Request, "request-local"),
      Effect.runPromise,
    );
    expect(output).toContain("request-local");
    expect(output).toContain("data-typed-vue-slot");
  });
  it("imports and renders without document, escapes props, and uses the first snapshot", async () => {
    expect(typeof document).toBe("undefined");
    const output = await renderToHtmlString(
      view(Greeting, Fx.fromIterable([{ name: "<first>" }, { name: "second" }]), {
        id: "vue-html-2",
      }),
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise);
    expect(output).toContain("<strong>&lt;first&gt;</strong>");
    expect(output).not.toContain("second");
  });

  it("nests in Typed SSR with sibling islands", async () => {
    const output = await renderToHtmlString(
      html`<main>
        ${view(Greeting, { name: "one" }, { id: "vue-html-3" })}${view(Greeting, { name: "two" }, { id: "vue-html-4" })}
      </main>`,
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.scoped, Effect.runPromise);
    expect(output.match(/<div\b[^>]*\bid="vue-html-3"[^>]*>/g)).toHaveLength(1);
    expect(output.match(/<div\b[^>]*\bid="vue-html-4"[^>]*>/g)).toHaveLength(1);
    expect(output).toContain("<strong>one</strong>");
    expect(output).toContain("<strong>two</strong>");
  });

  it("creates request-local apps and forwards SSR context including teleports", async () => {
    const contexts: unknown[] = [];
    const apps: unknown[] = [];
    const Component = defineComponent({
      setup() {
        const value = inject<string>("request");
        return () =>
          h("section", [h("span", value), h(Teleport, { to: "#modals" }, h("aside", value))]);
      },
    });
    const output = await Promise.all(
      ["alpha", "beta"].map((request) =>
        renderToHtmlString(
          view(
            Component,
            {},
            {
              id: "vue-html-5",
              configureApp(app) {
                apps.push(app);
                app.provide("request", request);
              },
              onSSRContext(context) {
                contexts.push(context);
              },
            },
          ),
        ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise),
      ),
    );
    expect(apps[0]).not.toBe(apps[1]);
    expect(contexts[0]).not.toBe(contexts[1]);
    expect(output[0]).toContain("<span>alpha</span>");
    expect(output[1]).toContain("<span>beta</span>");
    expect(contexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teleports: expect.objectContaining({
            "#modals": expect.stringContaining("<aside>alpha</aside>"),
          }),
        }),
        expect.objectContaining({
          teleports: expect.objectContaining({
            "#modals": expect.stringContaining("<aside>beta</aside>"),
          }),
        }),
      ]),
    );
  });

  it("awaits Vue server prefetch and propagates setup errors", async () => {
    const Prefetch = defineComponent({
      setup() {
        const text = ref("initial");
        onServerPrefetch(async () => {
          await Promise.resolve();
          text.value = "loaded";
        });
        return () => h("p", text.value);
      },
    });
    expect(
      await renderToHtmlString(view(Prefetch, {}, { id: "vue-html-6" })).pipe(
        Effect.provide(HtmlRenderTemplate),
        Effect.scoped,
        Effect.runPromise,
      ),
    ).toContain("<p>loaded</p>");
    const cause = new Error("broken Vue setup");
    const Broken = defineComponent({
      setup() {
        throw cause;
      },
    });
    const error = await renderToHtmlString(view(Broken, {}, { id: "vue-html-7" })).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.flip,
      Effect.runPromise,
    );
    expect(error).toBeInstanceOf(VueError);
    expect(error.cause).toBe(cause);
  });

  it("preserves typed props failures and interrupts pending props", async () => {
    expect(
      await renderToHtmlString(
        view(Greeting, Effect.fail("props failed"), { id: "vue-html-8" }),
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.flip, Effect.runPromise),
    ).toBe("props failed");
    let finalized = false;
    const controller = new AbortController();
    const pending = renderToHtmlString(
      view(
        Greeting,
        Effect.never.pipe(
          Effect.ensuring(
            Effect.sync(() => {
              finalized = true;
            }),
          ),
        ),
        { id: "vue-html-9" },
      ),
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, (effect) =>
      Effect.runPromiseExit(effect, { signal: controller.signal }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    controller.abort();
    expect(Exit.isFailure(await pending)).toBe(true);
    expect(finalized).toBe(true);
  });

  it("renders Typed inside a real Vue SSR app and leaves its runtime caller-owned", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    try {
      const Typed = createTypedComponent(runtime);
      const output = await renderToString(
        createSSRApp({ render: () => h(Typed, { value: html`<button>${"Typed"}</button>` }) }),
      );
      expect(output).toContain("data-typed-vue-slot");
      expect(output).toContain("Typed");
      expect(await runtime.runPromise(Effect.succeed("still alive"))).toBe("still alive");
    } finally {
      await runtime.dispose();
    }
  });
});
