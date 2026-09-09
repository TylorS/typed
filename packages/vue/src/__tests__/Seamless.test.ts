import { html } from "@typed/template/RenderTemplate";
import {
  HtmlRenderTemplate,
  renderToHtmlString,
  StaticHtmlRenderTemplate,
} from "@typed/template/Html";
import * as Context from "effect/Context";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Option from "effect/Option";
import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h, inject, Teleport } from "vue";
import { renderToString } from "vue/server-renderer";
import { useEffect } from "../Reactive.js";
import { provideServices } from "../Runtime.js";
import { Typed, createTypedComponent } from "../Typed.js";
import { view } from "../view.js";

const Greeting = defineComponent({
  props: { label: { type: String, required: true } },
  setup: (props) => () => h("strong", props.label),
});

describe("automatic Vue rendering", () => {
  it("renders Vue inside native Typed HTML without Vue renderer layers or a DOM", async () => {
    expect(typeof document).toBe("undefined");
    class Request extends Context.Service<Request, string>()("SeamlessRequest") {}
    const page = html`<main>
      ${view(
        Greeting,
        Effect.map(Request, (label) => ({ label })),
        { id: "auto-html" },
      )}
    </main>`;
    const output = await renderToHtmlString(page).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.provideService(Request, "request value"),
      Effect.runPromise,
    );
    expect(output).toContain("<strong>request value</strong>");
    expect(output).toContain('id="auto-html"');
  });

  it("honors native static rendering for build-time output", async () => {
    const output = await renderToHtmlString(
      view(Greeting, { label: "static" }, { id: "auto-static" }),
    ).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.runPromise,
    );
    expect(output).toContain("<strong>static</strong>");
    expect(output).not.toContain("<!--t_");
    expect(output).not.toContain("<!--n_");
  });

  it("uses configureApp and forwards SSR context through view options", async () => {
    let teleported = "";
    const Component = defineComponent({
      setup() {
        const request = inject<string>("request");
        return () =>
          h("div", [h("span", request), h(Teleport, { to: "#dialogs" }, h("aside", request))]);
      },
    });
    const output = await renderToHtmlString(
      view(
        Component,
        {},
        {
          id: "auto-context",
          configureApp: (app) => app.provide("request", "configured"),
          onSSRContext: (context) => {
            teleported = context.teleports?.["#dialogs"] ?? "";
          },
        },
      ),
    ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped, Effect.runPromise);
    expect(output).toContain("<span>configured</span>");
    expect(teleported).toContain("<aside>configured</aside>");
  });

  it("renders service-free Typed and composables inside native Vue SSR without providers", async () => {
    const Component = defineComponent({
      setup() {
        const message = useEffect(Effect.succeed("composable"));
        return () =>
          h("main", [
            h("p", Option.getOrUndefined(message.value.value)),
            h(Typed, { value: html`<em>Typed</em>` }),
          ]);
      },
    });
    const output = await renderToString(createSSRApp(Component));
    expect(output).toContain("<p>composable</p>");
    expect(output).toContain("<em>Typed</em>");
  });

  it("selects HTML through nested native Vue to Typed to Vue to Typed rendering", async () => {
    const Inner = defineComponent({
      setup: () => () =>
        h("section", [h("b", "Vue"), h(Typed, { value: html`<em>nested Typed</em>` })]),
    });
    const value = html`<article>${view(Inner, {}, { id: "nested-auto" })}</article>`;
    const output = await renderToString(createSSRApp({ render: () => h(Typed, { value }) }));
    expect(output).toContain("<b>Vue</b>");
    expect(output).toContain("<em>nested Typed</em>");
    expect(output).toContain('id="nested-auto"');
  });

  it("keeps application services request-local across nested native rendering", async () => {
    class Request extends Context.Service<Request, string>()("NativeVueRequest") {}
    const Inner = defineComponent({
      setup() {
        const request = useEffect(Request);
        return () =>
          h(Typed, { value: html`<em>${Option.getOrUndefined(request.value.value)}</em>` });
      },
    });
    const output = await Promise.all(
      ["first", "second"].map((request) =>
        renderToString(
          createSSRApp({
            setup() {
              provideServices(Context.make(Request, request));
              return () => h(Typed, { value: view(Inner, {}, { id: "native-request" }) });
            },
          }),
        ),
      ),
    );
    expect(output[0].replace(/<!--.*?-->/g, "")).toContain("<em>first</em>");
    expect(output[0]).not.toContain("second");
    expect(output[1].replace(/<!--.*?-->/g, "")).toContain("<em>second</em>");
  });

  it("reports complete Typed server failures to the supplied Vue callback", async () => {
    const failures: Cause.Cause<unknown>[] = [];
    await renderToString(
      createSSRApp({
        render: () =>
          h(Typed, {
            value: Effect.fail("native server failure"),
            onError: (cause: Cause.Cause<unknown>) => {
              failures.push(cause);
            },
          }),
      }),
    );
    expect(failures).toHaveLength(1);
    expect(Cause.squash(failures[0])).toBe("native server failure");
  });

  it("reports composable server failures through onError", async () => {
    const failures: Cause.Cause<string>[] = [];
    await renderToString(
      createSSRApp(
        defineComponent({
          setup() {
            useEffect(Effect.fail("request failed"), {
              onError: (cause) => failures.push(cause),
            });
            return () => h("div");
          },
        }),
      ),
    );
    expect(failures.map(Cause.squash)).toEqual(["request failed"]);
  });

  it("reports borrowed runtime failures through the Typed onError callback", async () => {
    const runtimeFailure = { _tag: "RuntimeFailure" as const };
    const runtime = ManagedRuntime.make(Layer.effectDiscard(Effect.fail(runtimeFailure)));
    const Bound = createTypedComponent(runtime);
    const value = Effect.succeed("content");
    const failures: Cause.Cause<typeof runtimeFailure>[] = [];
    try {
      await renderToString(
        createSSRApp({
          render: () =>
            h(Bound<typeof value>, {
              value,
              onError: (cause) => failures.push(cause),
            }),
        }),
      );
      expect(failures.map(Cause.squash)).toEqual([runtimeFailure]);
    } finally {
      await runtime.dispose();
    }
  });
});
