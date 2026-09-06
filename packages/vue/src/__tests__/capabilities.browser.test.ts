import * as Data from "@typed/async-data";
import * as RefSubject from "@typed/fx/RefSubject";
import { Navigation } from "@typed/navigation/Navigation";
import { CurrentRoute } from "@typed/router/CurrentRoute";
import { match } from "@typed/router/Matcher";
import { Parse } from "@typed/router/Route";
import { TestRouter } from "@typed/router/RouterTest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Deferred from "effect/Deferred";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Option from "effect/Option";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, createSSRApp, defineComponent, h, onMounted, ref, shallowRef } from "vue";
import { renderToString } from "vue/server-renderer";
import { Typed } from "../Typed.js";
import { fromContext, installRuntime, provideServices } from "../Runtime.js";
import { prefetch, useAsyncDataSource, useEffect, useRefSubject, useService } from "../Reactive.js";
import {
  routeComponent,
  useCurrentRoute,
  useCurrentPath,
  useNavigation,
  useRoute,
} from "../Router.js";

class Name extends Context.Service<Name, string>()("vue-browser/Name") {}
afterEach(() => document.body.replaceChildren());

describe("Vue capability scopes", () => {
  it("cancels pending RefSubject writes when their Vue component unmounts", async () => {
    await Effect.gen(function* () {
      const subject = yield* RefSubject.make(0);
      const acquired = yield* Deferred.make<void>();
      const lock = yield* RefSubject.runUpdates(subject, () =>
        Deferred.succeed(acquired, undefined).pipe(Effect.andThen(Effect.never)),
      ).pipe(Effect.forkScoped);
      yield* Deferred.await(acquired);
      let state!: ReturnType<typeof useRefSubject<number, never, never>>;
      const app = createApp(
        defineComponent({
          setup() {
            state = useRefSubject(subject, { immediate: false });
            return () => h("p", "writes");
          },
        }),
      );
      app.mount(document.body);
      const writes = [state.set(1), state.update((n) => n + 1)];
      app.unmount();
      const exits = yield* Effect.promise(() => Promise.all(writes));
      expect(exits.every(Exit.isFailure)).toBe(true);
      yield* Fiber.interrupt(lock);
      expect(yield* subject).toBe(0);
      expect(Exit.isFailure(yield* Effect.promise(() => state.set(99)))).toBe(true);
      expect(yield* subject).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("updates native refs, AsyncData states, and RefSubject writes", async () => {
    await Effect.gen(function* () {
      const subject = yield* RefSubject.make(1);
      const asyncData = yield* RefSubject.make<Data.AsyncData<string, string>>(Data.NoData);
      let state!: ReturnType<typeof useAsyncDataSource<string, string, never, never>>;
      const Component = defineComponent({
        setup() {
          const number = useRefSubject(subject);
          state = useAsyncDataSource(asyncData);
          return () =>
            h(
              "button",
              { onClick: () => number.update((n) => n + 1) },
              `${number.current.value}:${Option.getOrUndefined(state.latest.value) ?? "empty"}:${state.pending.value}:${state.failure.value}`,
            );
        },
      });
      const app = createApp(Component);
      installRuntime(app, fromContext(Context.empty()));
      app.mount(document.body);
      try {
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(document.body.textContent).toBe("1:empty:false:false")),
        );
        document.querySelector("button")!.click();
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(document.body.textContent).toBe("2:empty:false:false")),
        );
        yield* RefSubject.set(asyncData, Data.loading());
        yield* Effect.promise(() => vi.waitFor(() => expect(state.loading.value).toBe(true)));
        yield* RefSubject.set(asyncData, Data.success("ready"));
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(document.body.textContent).toBe("2:ready:false:false")),
        );
        yield* RefSubject.set(asyncData, Data.startLoading(Data.success("ready")));
        yield* Effect.promise(() => vi.waitFor(() => expect(state.refreshing.value).toBe(true)));
        yield* RefSubject.set(asyncData, Data.optimistic(Data.success("ready"), "draft"));
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(Option.getOrUndefined(state.value.value)).toBe("draft")),
        );
        yield* RefSubject.set(asyncData, yield* prefetch(Effect.fail("failed")));
        yield* Effect.promise(() =>
          vi.waitFor(() => expect(document.body.textContent).toBe("2:draft:false:true")),
        );
      } finally {
        app.unmount();
      }
      expect(yield* subject).toBe(2);
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("replaces reactive runtimes and service overrides and finalizes every running Effect", async () => {
    const runtimes = [
      fromContext(Context.make(Name, "one")),
      fromContext(Context.make(Name, "two")),
    ];
    const runtime = shallowRef(runtimes[0]!);
    const override = shallowRef(Context.make(Name, "child"));
    let acquired = 0;
    let released = 0;
    const effect = Effect.acquireUseRelease(
      Effect.sync(() => {
        acquired++;
      }),
      () => Effect.never,
      () =>
        Effect.sync(() => {
          released++;
        }),
    );
    const Child = defineComponent({
      setup() {
        provideServices(override);
        const name = useService(Name);
        return () => h("b", Option.getOrUndefined(name.value.value));
      },
    });
    const Component = defineComponent({
      setup() {
        const name = useService(Name);
        useEffect(effect);
        return () => h("div", [h("i", Option.getOrUndefined(name.value.value)), h(Child)]);
      },
    });
    const app = createApp(Component);
    installRuntime(app, runtime);
    app.mount(document.body);
    try {
      await vi.waitFor(() => expect(document.body.textContent).toBe("onechild"));
      runtime.value = runtimes[1]!;
      override.value = Context.make(Name, "overridden");
      await vi.waitFor(() => expect(document.body.textContent).toBe("twooverridden"));
      await vi.waitFor(() => expect(released).toBe(1));
      expect(acquired).toBe(2);
    } finally {
      app.unmount();
    }
    await vi.waitFor(() => expect(released).toBe(2));
  });

  it("hydrates from a request-local prefetch snapshot without replacing server nodes", async () => {
    let runs = 0;
    const source = Effect.sync(() => String(++runs));
    const initial = await Effect.runPromise(prefetch(source));
    const Component = defineComponent({
      setup() {
        const state = useEffect(source, { initial });
        return () => h("p", Option.getOrUndefined(state.value.value));
      },
    });
    const server = createSSRApp(Component);
    installRuntime(server, fromContext(Context.empty()));
    document.body.innerHTML = await renderToString(server);
    expect(document.body.textContent).toBe("1");
    expect(runs).toBe(1);
    const original = document.querySelector("p");
    const client = createSSRApp(Component);
    installRuntime(client, fromContext(Context.empty()));
    client.mount(document.body);
    try {
      expect(document.body.textContent).toBe("1");
      await vi.waitFor(() => expect(document.body.textContent).toBe("2"));
      expect(document.querySelector("p")).toBe(original);
    } finally {
      client.unmount();
    }
  });

  it("renders matcher route components with route services and retains Vue state across params", async () => {
    const runtime = ManagedRuntime.make(
      Layer.mergeAll(
        TestRouter({ url: "https://example.com/users/1" }),
        Layer.succeed(Name, "app"),
      ),
    );
    let mounts = 0;
    const Page = defineComponent({
      props: { id: { type: String, required: true } },
      setup(props) {
        const name = useService(Name);
        const route = useCurrentRoute();
        const count = ref(0);
        onMounted(() => {
          mounts++;
        });
        return () =>
          h(
            "button",
            { onClick: () => count.value++ },
            `${props.id}:${count.value}:${Option.getOrUndefined(name.value.value)}:${Option.getOrUndefined(route.value.value)?.route.path}`,
          );
      },
    });
    const routes = match(Parse("/users/:id"), {
      dependencies: [
        Context.make(Name, "route"),
        Context.make(CurrentRoute, { route: Parse("/users/:id"), parent: { route: Parse("/") } }),
      ],
      handler: routeComponent(Page, { id: "capabilities-user-route" }),
    });
    let navigation!: ReturnType<typeof useNavigation>;
    const Component = defineComponent({
      setup() {
        const location = useCurrentPath();
        navigation = useNavigation();
        return () =>
          h("main", [
            h(Typed, { value: routes }),
            h("span", Option.getOrUndefined(location.value.value)),
          ]);
      },
    });
    const app = createApp(Component);
    installRuntime(app, runtime);
    app.mount(document.body);
    try {
      await vi.waitFor(() =>
        expect(document.querySelector("button")?.textContent).toBe("1:0:route:/users/:id"),
      );
      const button = document.querySelector("button")!;
      button.click();
      expect(Exit.isSuccess(await navigation.navigate("/users/2"))).toBe(true);
      await vi.waitFor(() => expect(button.textContent).toBe("2:1:route:/users/:id"));
      expect(document.querySelector("button")).toBe(button);
      expect(mounts).toBe(1);
      expect(document.querySelector("span")?.textContent).toBe("/users/2");
      expect(Option.getOrUndefined(navigation.value.value)?.canGoBack).toBe(true);
      await navigation.back();
      await vi.waitFor(() => expect(button.textContent).toBe("1:1:route:/users/:id"));
    } finally {
      app.unmount();
      await runtime.dispose();
    }
  });

  it("decodes route parameters and keeps observing outside the route and after re-entry", async () => {
    const runtime = ManagedRuntime.make(TestRouter({ url: "https://example.com/users/1" }));
    const Component = defineComponent({
      setup() {
        const params = useRoute(Parse("/users/:id"));
        return () =>
          h("p", Option.getOrUndefined(Option.flatten(params.value.value))?.id ?? "none");
      },
    });
    const app = createApp(Component);
    installRuntime(app, runtime);
    app.mount(document.body);
    try {
      await vi.waitFor(() => expect(document.body.textContent).toBe("1"));
      await runtime.runPromise(Navigation.navigate("/elsewhere"));
      await vi.waitFor(() => expect(document.body.textContent).toBe("none"));
      await runtime.runPromise(Navigation.navigate("/users/2"));
      await vi.waitFor(() => expect(document.body.textContent).toBe("2"));
    } finally {
      app.unmount();
      await runtime.dispose();
    }
  });
});
