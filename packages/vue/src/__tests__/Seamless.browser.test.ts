import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template/RenderTemplate";
import { DomRenderTemplate, render } from "@typed/template/Render";
import { HtmlRenderTemplate, renderToHtml, renderToHtmlString } from "@typed/template/Html";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  onServerPrefetch,
  onUnmounted,
  ref,
  useId,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { Typed } from "../Typed.js";
import { view } from "../view.js";

afterEach(() => document.body.replaceChildren());

const Counter = defineComponent({
  props: { label: { type: String, required: true } },
  setup(props) {
    const count = ref(0);
    return () => h("button", { onClick: () => count.value++ }, `${props.label}:${count.value}`);
  },
});

describe("minimal Vue browser integration", () => {
  it("mounts and updates through the native DOM renderer", async () => {
    await Effect.gen(function* () {
      const props = yield* RefSubject.make({ label: "first" });
      yield* render(view(Counter, props, { id: "native-dom" }), document.body).pipe(
        Fx.provide(DomRenderTemplate),
        Fx.take(1),
        Fx.collectAll,
      );
      const button = document.querySelector("button")!;
      button.click();
      yield* RefSubject.set(props, { label: "second" });
      yield* Effect.promise(() => vi.waitFor(() => expect(button.textContent).toBe("second:1")));
      expect(document.querySelector("button")).toBe(button);
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("automatically switches from native SSR to DOM hydration and preserves nodes", async () => {
    const page = html`<main>
      ${view(Counter, { label: "hydrate" }, { id: "native-hydrate" })}
    </main>`;
    document.body.innerHTML = await Effect.runPromise(
      renderToHtmlString(page).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );
    const button = document.querySelector("button")!;
    await Effect.gen(function* () {
      yield* render(page, document.body).pipe(
        Fx.provide(DomRenderTemplate),
        Fx.take(1),
        Fx.collectAll,
      );
      expect(document.querySelector("button")).toBe(button);
      button.click();
      yield* Effect.promise(nextTick);
      expect(button.textContent).toBe("hydrate:1");
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("can render again into a previously hydrated host after teardown", async () => {
    const page = view(Counter, { label: "again" }, { id: "remount" });
    document.body.innerHTML = await renderToHtmlString(page).pipe(
      Effect.provide(HtmlRenderTemplate),
      Effect.scoped,
      Effect.runPromise,
    );

    for (let index = 0; index < 2; index++) {
      await Effect.gen(function* () {
        yield* render(page, document.body).pipe(
          Fx.provide(DomRenderTemplate),
          Fx.take(1),
          Fx.drain,
        );
        const button = document.querySelector("button")!;
        button.click();
        yield* Effect.promise(nextTick);
        expect(button.textContent).toBe("again:1");
      }).pipe(Effect.scoped, Effect.runPromise);
    }
  });

  it("hydrates streamed async descendants and neighboring islands without replacing nodes or IDs", async () => {
    const pending = Promise.withResolvers<void>();
    const Child = defineComponent({
      setup() {
        const id = useId();
        const count = ref(0);
        onServerPrefetch(() => pending.promise);

        return () => h("button", { id, onClick: () => count.value++ }, `streamed:${count.value}`);
      },
    });
    const Component = defineComponent({
      setup: () => () => h("section", [h("h1", "shell"), h(Child)]),
    });
    const page = html`<main>
      ${view(Component, {}, { id: "streamed-hydration" })}${view(Counter, { label: "neighbor" }, { id: "streamed-neighbor" })}
    </main>`;
    const chunks: string[] = [];
    const server = Effect.runFork(
      Fx.observe(renderToHtml(page), (chunk) => {
        chunks.push(chunk);
      }).pipe(Effect.provide(HtmlRenderTemplate), Effect.scoped),
    );

    try {
      await vi.waitFor(() => expect(chunks.join("")).toContain("<h1>shell</h1>"));
      expect(chunks.join("")).not.toContain("streamed:0");
      pending.resolve();
      await Effect.runPromise(Fiber.join(server));
    } finally {
      pending.resolve();
      await Effect.runPromise(Fiber.interrupt(server));
    }

    document.body.innerHTML = chunks.join("");
    const hostIds = ["streamed-hydration", "streamed-neighbor"];
    const hosts = hostIds.map((id) => document.getElementById(id));
    const buttons = Array.from(document.querySelectorAll("button"));
    const id = buttons[0]!.id;

    await Effect.gen(function* () {
      yield* render(page, document.body).pipe(Fx.provide(DomRenderTemplate), Fx.take(1), Fx.drain);

      expect(hostIds.map((id) => document.getElementById(id))).toEqual(hosts);
      expect(Array.from(document.querySelectorAll("button"))).toEqual(buttons);
      expect(buttons[0]!.id).toBe(id);
      expect(id).toContain("streamed-hydration");
      buttons[0]!.click();
      buttons[1]!.click();
      yield* Effect.promise(nextTick);
      expect(buttons.map((button) => button.textContent)).toEqual(["streamed:1", "neighbor:1"]);
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("mounts Typed in native Vue with no runtime setup", async () => {
    let clicked = 0;
    const value = html`<button onclick=${Effect.sync(() => clicked++)}>native Typed</button>`;
    const app = createApp({ render: () => h(Typed, { value }) });
    app.mount(document.body);
    try {
      await vi.waitFor(() => expect(document.querySelector("button")).not.toBeNull());
      document.querySelector("button")!.click();
      await vi.waitFor(() => expect(clicked).toBe(1));
    } finally {
      app.unmount();
    }
  });

  it("hydrates nested Vue and Typed using only Vue SSR and createSSRApp", async () => {
    let unmounted = 0;
    let typedClicks = 0;
    const leaf = html`<button data-leaf onclick=${Effect.sync(() => typedClicks++)}>
      Typed leaf
    </button>`;
    const Inner = defineComponent({
      setup() {
        const count = ref(0);
        onUnmounted(() => unmounted++);
        return () =>
          h("section", [
            h("button", { "data-vue": "", onClick: () => count.value++ }, `Vue:${count.value}`),
            h(Typed, { value: leaf }),
          ]);
      },
    });
    const value = html`<article>${view(Inner, {}, { id: "native-nested" })}</article>`;
    const makeApp = () => createSSRApp({ render: () => h(Typed, { value }) });
    document.body.innerHTML = await renderToString(makeApp());
    const vueButton = document.querySelector<HTMLButtonElement>("[data-vue]")!;
    const typedButton = document.querySelector<HTMLButtonElement>("[data-leaf]")!;
    const app = makeApp();
    app.mount(document.body);
    try {
      await vi.waitFor(() => {
        typedButton.click();
        expect(typedClicks).toBeGreaterThan(0);
      });
      expect(document.querySelector("[data-vue]")).toBe(vueButton);
      expect(document.querySelector("[data-leaf]")).toBe(typedButton);
      vueButton.click();
      await nextTick();
      expect(vueButton.textContent).toBe("Vue:1");
    } finally {
      app.unmount();
    }
    await vi.waitFor(() => expect(unmounted).toBe(1));
  });
});
