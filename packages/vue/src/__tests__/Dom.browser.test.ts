import { RandomValues } from "@typed/id/RandomValues";
import * as Fx from "@typed/fx/Fx";
import * as RefSubject from "@typed/fx/RefSubject";
import { html } from "@typed/template/RenderTemplate";
import { HtmlRenderTemplate, renderToHtmlString } from "@typed/template/Html";
import { CurrentRootEvents } from "@typed/template/RootEvents";
import { DomRenderTemplate, render } from "@typed/template/Render";
import * as Effect from "effect/Effect";
import * as Cause from "effect/Cause";
import * as Exit from "effect/Exit";
import * as Deferred from "effect/Deferred";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  inject,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  useId,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { createTypedComponent } from "../Typed.js";
import { view } from "../view.js";

afterEach(() => document.body.replaceChildren());

const counter = (mounted: () => void, unmounted: () => void) =>
  defineComponent({
    props: { label: { type: String, required: true } },
    setup(props) {
      const count = ref(0);
      onMounted(mounted);
      onUnmounted(unmounted);
      return () => h("button", { onClick: () => count.value++ }, `${props.label}:${count.value}`);
    },
  });

describe("Vue in Typed", () => {
  it("mounts once when concurrent props arrive before the first commit", async () => {
    let mounted = 0;
    let unmounted = 0;
    const Component = counter(
      () => mounted++,
      () => unmounted++,
    );
    await Effect.gen(function* () {
      const props = Fx.mergeAll(Fx.succeed({ label: "first" }), Fx.succeed({ label: "second" }));
      yield* render(view(Component, props, { id: "concurrent-props" }), document.body).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.take(1),
        Fx.drain,
      );
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("second:0")),
      );
      expect(mounted).toBe(1);
      expect(unmounted).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise);
    expect(unmounted).toBe(1);
  });
  it("unmounts and releases a published island when its props later fail", async () => {
    let released = 0;
    let unmounted = 0;
    const Component = counter(
      () => {},
      () => unmounted++,
    );
    await Effect.gen(function* () {
      const fail = yield* Deferred.make<void>();
      const source = Fx.make<{ label: string }, "broken">((sink) =>
        Effect.gen(function* () {
          yield* sink.onSuccess({ label: "mounted" });
          yield* Deferred.await(fail);
          yield* sink.onFailure(Cause.fail("broken"));
        }),
      ).pipe(Fx.ensuring(Effect.sync(() => released++)));
      yield* render(view(Component, source, { id: "later-failure" }), document.body).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.take(1),
        Fx.collectAll,
      );
      expect(document.querySelector("button")?.textContent).toBe("mounted:0");
      yield* Deferred.succeed(fail, undefined);
      yield* Effect.promise(() => vi.waitFor(() => expect(unmounted).toBe(1)));
      expect(released).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise);
    expect(unmounted).toBe(1);
  });
  it("keeps generated IDs unique across sibling islands and stable during hydration", async () => {
    const Field = defineComponent({
      setup() {
        const id = useId();
        return () => h("section", [h("label", { for: id }, "Name"), h("input", { id })]);
      },
    });
    const page = html`<main>
      ${view(Field, {}, { id: "first-field" })}${view(Field, {}, { id: "second-field" })}
    </main>`;
    document.body.innerHTML = await renderToHtmlString(page).pipe(
      Effect.provide(Layer.merge(HtmlRenderTemplate, RandomValues.Default)),
      Effect.scoped,
      Effect.scoped,
      Effect.runPromise,
    );
    const inputs = Array.from(document.querySelectorAll("input"));
    const ids = inputs.map((input) => input.id);
    expect(new Set(ids).size).toBe(2);
    await Effect.gen(function* () {
      yield* render(page, document.body).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.take(1),
        Fx.collectAll,
      );
      expect(Array.from(document.querySelectorAll("input"))).toEqual(inputs);
      expect(Array.from(document.querySelectorAll("input")).map((input) => input.id)).toEqual(ids);
      expect(Array.from(document.querySelectorAll("label")).map((label) => label.htmlFor)).toEqual(
        ids,
      );
    }).pipe(Effect.scoped, Effect.runPromise);
  });
  it("releases pending acquisition when only its render fiber is interrupted", async () => {
    let released = 0;
    const Component = counter(
      () => {},
      () => {},
    );
    await Effect.gen(function* () {
      const started = yield* Deferred.make<void>();
      const source = Effect.gen(function* () {
        yield* Effect.acquireRelease(Deferred.succeed(started, undefined), () =>
          Effect.sync(() => released++),
        );
        return yield* Effect.never;
      });
      const running = yield* render(
        view(Component, source, { id: "vue-dom-1" }),
        document.body,
      ).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.drain,
        Effect.forkScoped,
      );
      yield* Deferred.await(started);
      yield* Fiber.interrupt(running);
      expect(released).toBe(1);
      expect(document.querySelector("button")).toBeNull();
    }).pipe(Effect.scoped, Effect.runPromise);
    expect(released).toBe(1);
  });
  it("retains reactive props after a consumer takes the first render event", async () => {
    const Component = counter(
      () => {},
      () => {},
    );
    await Effect.gen(function* () {
      const props = yield* RefSubject.make({ label: "first" });
      yield* render(view(Component, props, { id: "vue-dom-2" }), document.body).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.take(1),
        Fx.collectAll,
      );
      const button = document.querySelector("button")!;
      button.click();
      yield* RefSubject.set(props, { label: "updated" });
      yield* Effect.promise(() => vi.waitFor(() => expect(button.textContent).toBe("updated:1")));
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("publishes an empty native host when the props source is empty", async () => {
    const Component = counter(
      () => {},
      () => {},
    );
    const root = document.createElement("div");
    document.body.append(root);
    const output = await render(view(Component, Fx.empty, { id: "vue-dom-3" }), root).pipe(
      Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
      Fx.take(1),
      Fx.collectAll,

      Effect.scoped,
      Effect.runPromise,
    );
    expect(output).toHaveLength(1);
    expect(root.querySelector("#vue-dom-3")?.textContent).toBe("");
    expect(root.querySelector("#vue-dom-3")?.children).toHaveLength(0);
  });

  it("isolates selected bubbling events while preserving target handlers, defaults, and cleanup", async () => {
    let targetClicks = 0;
    let outerClicks = 0;
    let outerInputs = 0;
    const outerClick = () => outerClicks++;
    const outerInput = () => outerInputs++;
    document.body.addEventListener("click", outerClick);
    document.body.addEventListener("input", outerInput);
    const Component = defineComponent({
      setup: () => () => h("button", { onClick: () => targetClicks++ }, "event"),
    });
    let host: Element | null = null;
    try {
      await Effect.gen(function* () {
        yield* render(
          view(Component, {}, { id: "vue-dom-4", stopPropagation: { click: true, input: false } }),
          document.body,
        ).pipe(
          Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
          Fx.take(1),
          Fx.collectAll,
        );
        host = document.querySelector("#vue-dom-4");
        const button = document.querySelector("button")!;
        const click = new MouseEvent("click", { bubbles: true, cancelable: true });
        button.dispatchEvent(click);
        button.dispatchEvent(new Event("input", { bubbles: true }));
        expect(targetClicks).toBe(1);
        expect(outerClicks).toBe(0);
        expect(outerInputs).toBe(1);
        expect(click.defaultPrevented).toBe(false);
      }).pipe(
        Effect.provideService(CurrentRootEvents, { click: true, input: true }),
        Effect.scoped,
        Effect.runPromise,
      );
      host!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(outerClicks).toBe(1);
    } finally {
      document.body.removeEventListener("click", outerClick);
      document.body.removeEventListener("input", outerInput);
    }
  });
  it("mounts once, retains local state across props updates, and unmounts with its scope", async () => {
    let mounts = 0;
    let unmounts = 0;
    const Component = counter(
      () => mounts++,
      () => unmounts++,
    );
    await Effect.gen(function* () {
      const props = yield* RefSubject.make({ label: "first" });
      yield* render(
        html`<main>${view(Component, props, { id: "vue-dom-5" })}</main>`,
        document.body,
      ).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.drain,
        Effect.forkScoped,
      );
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(document.querySelector("button")).not.toBeNull()),
      );
      const button = document.querySelector("button")!;
      button.click();
      yield* Effect.promise(() => nextTick());
      expect(button.textContent).toBe("first:1");
      yield* RefSubject.set(props, { label: "second" });
      yield* Effect.promise(() => vi.waitFor(() => expect(button.textContent).toBe("second:1")));
      expect(document.querySelector("button")).toBe(button);
      expect(mounts).toBe(1);
      expect(unmounts).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise);
    expect(unmounts).toBe(1);
  });

  it("keeps a finite props source mounted and applies configureApp before mount", async () => {
    let unmounts = 0;
    const Component = defineComponent({
      setup() {
        const value = inject("value");
        const n = ref(0);
        onUnmounted(() => unmounts++);
        return () => h("button", { onClick: () => n.value++ }, `${value}:${n.value}`);
      },
    });
    await Effect.gen(function* () {
      yield* render(
        view(Component, Effect.succeed({}), {
          id: "vue-dom-6",
          configureApp: (app) => app.provide("value", "configured"),
        }),
        document.body,
      ).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.drain,
        Effect.forkScoped,
      );
      yield* Effect.promise(() =>
        vi.waitFor(() => expect(document.querySelector("button")).not.toBeNull()),
      );
      const button = document.querySelector("button")!;
      button.click();
      yield* Effect.promise(nextTick);
      expect(button.textContent).toBe("configured:1");
      expect(unmounts).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise);
    expect(unmounts).toBe(1);
  });

  it("hydrates sibling islands without replacing or duplicating server DOM", async () => {
    let mounts = 0;
    const Component = counter(
      () => mounts++,
      () => {},
    );
    const page = html`<main>
      ${view(Component, { label: "one" }, { id: "vue-dom-7" })}${view(Component, { label: "two" }, { id: "vue-dom-8" })}
    </main>`;
    document.body.innerHTML = await renderToHtmlString(page).pipe(
      Effect.provide(Layer.merge(HtmlRenderTemplate, RandomValues.Default)),
      Effect.scoped,
      Effect.scoped,
      Effect.runPromise,
    );
    const hostIds = ["vue-dom-7", "vue-dom-8"];
    const hosts = hostIds.map((id) => document.getElementById(id));
    const buttons = Array.from(document.querySelectorAll("button"));
    await Effect.gen(function* () {
      yield* render(page, document.body).pipe(
        Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
        Fx.drain,
        Effect.forkScoped,
      );
      yield* Effect.promise(() => vi.waitFor(() => expect(mounts).toBe(2)));
      expect(hostIds.map((id) => document.getElementById(id))).toEqual(hosts);
      expect(Array.from(document.querySelectorAll("button"))).toEqual(buttons);
      buttons[1]!.click();
      yield* Effect.promise(nextTick);
      expect(buttons[0]!.textContent).toBe("one:0");
      expect(buttons[1]!.textContent).toBe("two:1");
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("reports Vue lifecycle errors through the typed error channel", async () => {
    const error = new Error("mounted failure");
    const configured = vi.fn();
    const Broken = defineComponent({
      setup() {
        onMounted(() => {
          throw error;
        });
        return () => h("div");
      },
    });
    const exit = await render(
      view(
        Broken,
        {},
        {
          id: "vue-dom-9",
          configureApp: (app) => {
            app.config.errorHandler = configured;
          },
        },
      ),
      document.body,
    ).pipe(
      Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
      Fx.drain,
      Effect.scoped,
      Effect.runPromiseExit,
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) expect(String(exit.cause)).toContain("Vue mount failed");
    expect(configured).toHaveBeenCalledWith(error, expect.anything(), expect.any(String));
  });

  it("cancels a props producer before its first value without mounting", async () => {
    let finalized = false;
    let started = false;
    let mounts = 0;
    const Component = counter(
      () => mounts++,
      () => {},
    );
    const controller = new AbortController();
    const running = render(
      view(
        Component,
        Effect.andThen(
          Effect.sync(() => {
            started = true;
          }),
          Effect.never,
        ).pipe(
          Effect.ensuring(
            Effect.sync(() => {
              finalized = true;
            }),
          ),
        ),
        { id: "vue-dom-10" },
      ),
      document.body,
    ).pipe(
      Fx.provide(Layer.merge(DomRenderTemplate, RandomValues.Default)),
      Fx.drain,
      Effect.scoped,
      (effect) => Effect.runPromiseExit(effect, { signal: controller.signal }),
    );
    await vi.waitFor(() => expect(started).toBe(true));
    controller.abort();
    expect(Exit.isFailure(await running)).toBe(true);
    expect(finalized).toBe(true);
    expect(mounts).toBe(0);
  });
});

describe("Typed in Vue", () => {
  it("releases failed Typed work before reporting it and keeps the borrowed runtime usable", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    const Typed = createTypedComponent(runtime);
    const errors: unknown[] = [];
    let released = 0;
    const value = Effect.addFinalizer(() => Effect.sync(() => released++)).pipe(
      Effect.andThen(Effect.fail("source failed")),
    );

    const app = createApp({
      render: () => h(Typed, { value, onError: (cause) => errors.push(cause) }),
    });

    try {
      app.mount(document.body);
      await vi.waitFor(() => expect(errors).toHaveLength(1));
      expect(released).toBe(1);
      expect(await runtime.runPromise(Effect.succeed("still alive"))).toBe("still alive");
    } finally {
      app.unmount();
      await runtime.dispose();
    }

    expect(released).toBe(1);
  });

  it("inherits event defaults and changes boundary policy without replacing Typed nodes", async () => {
    const runtime = ManagedRuntime.make(Layer.succeed(CurrentRootEvents, { click: true }));
    const Typed = createTypedComponent(runtime);
    const stopPropagation = shallowRef<false | undefined>(undefined);
    let targetClicks = 0;
    let outerClicks = 0;
    const outerClick = () => outerClicks++;
    document.body.addEventListener("click", outerClick);
    const value = html`<button onclick=${Effect.sync(() => targetClicks++)}>boundary</button>`;
    const app = createApp({
      render: () => h(Typed, { value, stopPropagation: stopPropagation.value }),
    });
    try {
      app.mount(document.body);
      await vi.waitFor(() => expect(document.querySelector("button")).not.toBeNull());
      const button = document.querySelector("button")!;
      button.click();
      await vi.waitFor(() => expect(targetClicks).toBe(1));
      expect(outerClicks).toBe(0);
      stopPropagation.value = false;
      await nextTick();
      button.click();
      await vi.waitFor(() => expect(targetClicks).toBe(2));
      expect(outerClicks).toBe(1);
      expect(document.querySelector("button")).toBe(button);
      const host = button.parentElement!;
      app.unmount();
      document.body.append(host);
      host.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(outerClicks).toBe(2);
    } finally {
      document.body.removeEventListener("click", outerClick);
      await runtime.dispose();
    }
  });
  it("replaces values with cleanup and keeps the caller runtime alive after unmount", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    let released = 0;
    const value = shallowRef(
      html`<button>${"first"}</button>`.pipe(Fx.ensuring(Effect.sync(() => released++))),
    );
    const Typed = createTypedComponent(runtime);
    const app = createApp({ render: () => h(Typed, { value: value.value }) });
    try {
      app.mount(document.body);
      await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("first"));
      value.value = html`<button>${"second"}</button>`.pipe(
        Fx.ensuring(Effect.sync(() => released++)),
      );
      await vi.waitFor(() => expect(document.querySelector("button")?.textContent).toBe("second"));
      expect(released).toBe(1);
      app.unmount();
      await vi.waitFor(() => expect(released).toBe(2));
      expect(await runtime.runPromise(Effect.succeed(1))).toBe(1);
    } finally {
      await runtime.dispose();
    }
  });

  it("hydrates Typed markup in Vue without replacing server nodes, and binds handlers", async () => {
    const runtime = ManagedRuntime.make(Layer.empty);
    let clicks = 0;
    const Typed = createTypedComponent(runtime);
    const value = html`<button onclick=${Effect.sync(() => clicks++)}>Typed</button>`;
    const makeApp = () =>
      createSSRApp({ render: () => h("main", [h(Typed, { value }), h("p", "sibling")]) });
    try {
      document.body.innerHTML = await renderToString(makeApp());
      const button = document.querySelector("button")!;
      const sibling = document.querySelector("p")!;
      const app = makeApp();
      app.mount(document.body);
      await vi.waitFor(() => {
        button.click();
        expect(clicks).toBeGreaterThan(0);
      });
      expect(document.querySelector("button")).toBe(button);
      expect(document.querySelector("p")).toBe(sibling);
      expect(document.querySelectorAll("button")).toHaveLength(1);
      app.unmount();
    } finally {
      await runtime.dispose();
    }
  });
});
