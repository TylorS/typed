// oxlint-disable require-yield
import { describe, expect, it, vi } from "vitest";
import * as Effect from "effect/Effect";
import { html } from "@typed/template";
import * as RefSubject from "@typed/fx/RefSubject";
import { component, type Slots } from "../Component.js";
import server from "../server.js";

describe("Typed Astro server renderer", () => {
  it("recognizes branded components without executing foreign functions", async () => {
    const foreign = vi.fn(() => {
      throw new Error("must not execute");
    });
    expect(await server.check(foreign)).toBe(false);
    expect(foreign).not.toHaveBeenCalled();
    expect(
      await server.check(
        component(function* () {
          return html`<p>Hello</p>`;
        }),
      ),
    ).toBe(true);
    expect(await server.check({})).toBe(false);
  });

  it("escapes props and preserves Typed hydration markers", async () => {
    const View = component(function* (props: { value: string }) {
      return html`<p title=${props.value}>${props.value}</p>`;
    });
    const result = await server.renderToStaticMarkup(View, { value: '<script>"&' });
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).toContain("<!--t_");
  });

  it("owns acquisition and cleanup separately for every SSR render", async () => {
    let finalized = 0;
    const View = component(function* () {
      const count = yield* RefSubject.make(1);
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          finalized++;
        }),
      );
      return html`<p>${count}</p>`;
    });
    const first = await server.renderToStaticMarkup(View, {});
    const second = await server.renderToStaticMarkup(View, {});
    expect(first.html).toEqual(second.html);
    expect(finalized).toBe(2);
  });

  it("transports trusted default/named slots and escapes names", async () => {
    const View = component(function* (_props: {}, slots: Slots) {
      return html`<main>${slots.default}${slots['a"b']}${slots["apostrophe's"]}</main>`;
    });
    const { html: output } = await server.renderToStaticMarkup(
      View,
      {},
      {
        default: "<strong>Default</strong>",
        'a"b': "<em>Named</em>",
        "apostrophe's": "<i>Quoted</i>",
      },
    );
    expect(output).toContain("<astro-static-slot><strong>Default</strong></astro-static-slot>");
    expect(output).toContain(
      '<astro-static-slot name="apostrophe&#39;s"><i>Quoted</i></astro-static-slot>',
    );
    expect(output).toContain(
      '<astro-static-slot name="a&quot;b"><em>Named</em></astro-static-slot>',
    );
  });

  it("uses live slot markers only for hydrated components and leaves the default unnamed", async () => {
    const View = component(function* (_props: {}, slots: Slots) {
      return html`<main>${slots.default}${slots.heading}</main>`;
    });
    const { html: output } = await server.renderToStaticMarkup(
      View,
      {},
      {
        default: "<p>Default</p>",
        heading: "<h2>Heading</h2>",
      },
      { displayName: "View", hydrate: "load", astroStaticSlot: true },
    );
    expect(output).toContain("<astro-slot><p>Default</p></astro-slot>");
    expect(output).toContain('<astro-slot name="heading"><h2>Heading</h2></astro-slot>');
    expect(output).not.toContain('name="default"');
    expect(output).not.toContain("astro-static-slot");
  });

  it("propagates typed failures and finalizes resources", async () => {
    let finalized = false;
    const View = component(function* () {
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          finalized = true;
        }),
      );
      return yield* Effect.fail("render failed");
    });
    await expect(server.renderToStaticMarkup(View, {})).rejects.toBeDefined();
    expect(finalized).toBe(true);
  });
});

it("escapes primitive generator output and renders arrays without comma separators", async () => {
  const Primitive = component(function* () {
    return '<script>"&';
  });
  expect((await server.renderToStaticMarkup(Primitive, {})).html).toContain("&lt;script&gt;");
  const ArrayView = component(function* () {
    return ["Hello ", 42, "!"];
  });
  const output = (await server.renderToStaticMarkup(ArrayView, {})).html;
  expect(output.replace(/<!--.*?-->/g, "")).toBe("Hello 42!");
});
