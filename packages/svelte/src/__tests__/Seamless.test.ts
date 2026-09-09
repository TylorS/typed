import { describe, expect, it } from "vitest";
import { Context, Effect, Layer, ManagedRuntime } from "effect";
import { html, HtmlRenderTemplate, renderToHtmlString } from "@typed/template";
import { render } from "svelte/server";
import Typed from "@typed/svelte/Typed.svelte";
import { view } from "@typed/svelte";
import Stateful from "./fixtures/Stateful.svelte";
import NativePage from "./fixtures/NativePage.svelte";

describe("native rendering APIs", () => {
  it("embeds the canonical value prop through native Svelte SSR", async () => {
    const output = await render(Typed, { props: { value: html`<strong>canonical</strong>` } });
    expect(output.body).toContain("canonical");
  });

  it("renders a Svelte view using only Typed's ordinary HTML API", async () => {
    const result = await Effect.runPromise(
      renderToHtmlString(
        html`<main>${view(Stateful, Effect.succeed({ label: "native" }), { id: "native" })}</main>`,
      ).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );
    expect(result).toContain("native:0");
  });

  it("SSR and SSG await Typed effects through native Svelte render without a runtime", async () => {
    let acquired = 0;
    let released = 0;
    const value = Effect.acquireRelease(
      Effect.sync(() => {
        acquired++;
        return '<script>alert("escaped")</script>';
      }),
      () =>
        Effect.sync(() => {
          released++;
        }),
    ).pipe(
      Effect.andThen((label) => Effect.promise(async () => html`<p data-native>${label}</p>`)),
    );
    const first = await render(NativePage, { props: { value } });
    const second = await render(NativePage, { props: { value } });
    expect(first.body).toContain("data-native-page");
    expect(first.body).toContain("&lt;script&gt;");
    expect(first.body).not.toContain('<script>alert("escaped")</script>');
    expect(second.body).toBe(first.body);
    expect(first.head).toBe("");
    expect(acquired).toBe(2);
    expect(released).toBe(2);
  });

  it("native Svelte SSR borrows application services and propagates failures", async () => {
    class Greeting extends Context.Service<Greeting, string>()("SvelteSeamlessGreeting") {}
    const runtime = ManagedRuntime.make(Layer.succeed(Greeting, "provided"));
    try {
      const output = await render(Typed, {
        props: { runtime, value: Effect.map(Greeting, (value) => html`<strong>${value}</strong>`) },
      });
      expect(output.body).toContain("provided");
      expect(await runtime.runPromise(Greeting)).toBe("provided");
      await expect(
        Promise.resolve(render(Typed, { props: { value: Effect.fail("SSR failed") } })),
      ).rejects.toBeDefined();
    } finally {
      await runtime.dispose();
    }
  });
});
