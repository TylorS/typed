import * as Fx from "@typed/fx/Fx";
import { html } from "@typed/template/RenderTemplate";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import * as Effect from "effect/Effect";
import { afterEach, describe, expect, it } from "vitest";
import { defineComponent, h, nextTick, ref, useId } from "vue";
import { view } from "../view.js";

const Counter = defineComponent({
  setup() {
    const id = useId();
    const count = ref(0);
    return () => h("button", { id, onClick: () => count.value++ }, String(count.value));
  },
});
afterEach(() => document.body.replaceChildren());

const page = (explicit: boolean) => {
  const shared = view(Counter, {});
  return html`<main>
    ${shared}${shared}${view(Counter, {}, explicit ? { id: "explicit-vue" } : undefined)}
  </main>`;
};

describe("Vue root identity in the browser", () => {
  it("mounts reused client-only views without options with distinct host and component IDs", async () => {
    await Effect.gen(function* () {
      yield* render(page(false), document.body).pipe(
        Fx.provide(DomRenderTemplate),
        Fx.take(1),
        Fx.drain,
      );
      const hosts = Array.from(document.querySelectorAll("main > div"));
      const buttons = Array.from(document.querySelectorAll("button"));
      expect(hosts).toHaveLength(3);
      expect(new Set(hosts.map((host) => host.id)).size).toBe(3);
      expect(new Set(buttons.map((button) => button.id)).size).toBe(3);
      for (const [index, host] of hosts.entries())
        expect(buttons[index]!.id.startsWith(`${host.id}-`)).toBe(true);
      buttons[0]!.click();
      yield* Effect.promise(nextTick);
      expect(buttons.map((button) => button.textContent)).toEqual(["1", "0", "0"]);
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("restores generated and explicit identities and exact server nodes for fresh client views", async () => {
    document.body.innerHTML = await renderToHtmlString(page(true)).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.runPromise,
    );
    const hosts = Array.from(document.querySelectorAll("main > div"));
    const buttons = Array.from(document.querySelectorAll("button"));
    const ids = hosts.map((host) => host.id);
    const childIds = buttons.map((button) => button.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids[2]).toBe("explicit-vue");
    await Effect.gen(function* () {
      yield* render(page(true), document.body).pipe(
        Fx.provide(DomRenderTemplate),
        Fx.take(1),
        Fx.drain,
      );
      const hydratedHosts = Array.from(document.querySelectorAll("main > div"));
      const hydratedButtons = Array.from(document.querySelectorAll("button"));
      for (let index = 0; index < hosts.length; index++) {
        expect(hydratedHosts[index]).toBe(hosts[index]);
        expect(hydratedButtons[index]).toBe(buttons[index]);
      }
      expect(hydratedHosts.map((host) => host.id)).toEqual(ids);
      expect(hydratedButtons.map((button) => button.id)).toEqual(childIds);
      for (const button of hydratedButtons) button.click();
      yield* Effect.promise(nextTick);
      expect(hydratedButtons.map((button) => button.textContent)).toEqual(["1", "1", "1"]);
    }).pipe(Effect.scoped, Effect.runPromise);
  });
});
