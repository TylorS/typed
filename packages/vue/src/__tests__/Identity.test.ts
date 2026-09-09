import * as Layer from "effect/Layer";
import { RandomValues } from "@typed/id/RandomValues";
import { html } from "@typed/template/RenderTemplate";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { defineComponent, h, useId } from "vue";
import { view } from "../view.js";

const Identified = defineComponent({
  setup() {
    const id = useId();
    return () => h("button", { id }, "identified");
  },
});

const hostIds = (output: string) =>
  Array.from(output.matchAll(/<div\b[^>]*\bid="([^"]+)"/g), (match) => match[1]!);
const childIds = (output: string) =>
  Array.from(output.matchAll(/<button\b[^>]*\bid="([^"]+)"/g), (match) => match[1]!);

const toHTML = (value: ReturnType<typeof view<typeof Identified>>) =>
  renderToHtmlString(value).pipe(
    Effect.provide(Layer.merge(HtmlRenderTemplate, RandomValues.Default)),
    Effect.scoped,
    Effect.runPromise,
  );

describe("Vue automatic root identity", () => {
  it("allocates unique host IDs and Vue useId prefixes for each reuse of a view", async () => {
    const shared = view(Identified, {});
    const output = await renderToHtmlString(html`<main>${shared}${shared}</main>`).pipe(
      Effect.provide(Layer.merge(HtmlRenderTemplate, RandomValues.Default)),
      Effect.scoped,
      Effect.runPromise,
    );
    const hosts = hostIds(output);
    const children = childIds(output);
    expect(hosts).toHaveLength(2);
    expect(new Set(hosts).size).toBe(2);
    expect(new Set(children).size).toBe(2);
    for (const [index, host] of hosts.entries())
      expect(children[index]).toMatch(new RegExp(`^${host}-`));

    const subsequent = await toHTML(shared);
    expect(hosts).not.toContain(hostIds(subsequent)[0]);
  });

  it("retains explicit host IDs and applies them to Vue useId", async () => {
    const output = await toHTML(view(Identified, {}, { id: "chosen-vue-root" }));
    expect(hostIds(output)).toEqual(["chosen-vue-root"]);
    expect(childIds(output)[0]).toMatch(/^chosen-vue-root-/);
  });
});
