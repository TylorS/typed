import * as Fx from "@typed/fx/Fx";
import * as AsyncData from "@typed/async-data";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Option from "effect/Option";
import * as Stream from "effect/Stream";
import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, effectScope, h, shallowRef } from "vue";
import { renderToString } from "vue/server-renderer";
import { fromContext, installRuntime, provideServices, withServices } from "../Runtime.js";
import { prefetch, useEffect, useFx, useService, useStream } from "../Reactive.js";
import { ServerRouter } from "@typed/router/Router";
import { TestRouter } from "@typed/router/RouterTest";
import {
  routeComponent,
  useCurrentRoute,
  useCurrentPath,
  useNavigation,
  useRoute,
} from "../Router.js";
import { match } from "@typed/router/Matcher";
import { Parse } from "@typed/router/Route";
import { CurrentRoute, type CurrentRouteTree } from "@typed/router/CurrentRoute";
import { Navigation } from "@typed/navigation/Navigation";
import { Typed } from "../Typed.js";

class Name extends Context.Service<Name, string>()("vue-test/Name") {}

describe("Vue Typed capabilities", () => {
  it("keeps scoped route services alive through nested Vue server rendering", async () => {
    class Connection extends Context.Service<Connection, { readonly read: () => string }>()(
      "vue-test/Connection",
    ) {}
    let closed = false;
    const connection = Layer.effect(
      Connection,
      Effect.acquireRelease(
        Effect.succeed({
          read() {
            if (closed) throw new Error("connection already closed");
            return "open";
          },
        }),
        () =>
          Effect.sync(() => {
            closed = true;
          }),
      ),
    );
    const Page = defineComponent({
      props: { id: { type: String, required: true } },
      setup(props) {
        const resource = useEffect(Effect.map(Connection, (connection) => connection.read()));
        return () => h("p", `${props.id}:${Option.getOrUndefined(resource.value.value)}`);
      },
    });
    const routes = match(Parse("/users/:id"), {
      dependencies: [connection],
      handler: routeComponent(Page, { id: "scoped-server-route" }),
    });
    const runtime = ManagedRuntime.make(ServerRouter({ url: "https://example.com/users/1" }));
    const app = createSSRApp(defineComponent({ setup: () => () => h(Typed, { value: routes }) }));
    installRuntime(app, runtime);
    try {
      expect(await renderToString(app)).toContain("<p>1:open</p>");
      expect(closed).toBe(true);
    } finally {
      await runtime.dispose();
    }
  });
  it("prefetches first values, empty sources, and failures while closing source scopes", async () => {
    let released = 0;
    const source = Fx.succeed(1).pipe(
      Fx.ensuring(
        Effect.sync(() => {
          released++;
        }),
      ),
    );
    expect(await Effect.runPromise(prefetch(source))).toEqual(AsyncData.success(1));
    expect(released).toBe(1);
    expect(await Effect.runPromise(prefetch(Stream.empty))).toEqual(AsyncData.NoData);
    expect(AsyncData.getError(await Effect.runPromise(prefetch(Effect.fail("denied"))))).toEqual(
      Option.some("denied"),
    );
  });

  it("reads and overrides Context.Reference keys", async () => {
    const Locale = Context.Reference<string>("vue-test/Locale", { defaultValue: () => "en" });
    const Component = defineComponent({
      setup() {
        provideServices(Context.make(Locale, "fr"));
        const locale = useService(Locale);
        return () => h("p", Option.getOrUndefined(locale.value.value));
      },
    });
    const app = createSSRApp(Component);
    installRuntime(app, fromContext(Context.empty()));
    expect(await renderToString(app)).toBe("<p>fr</p>");
  });

  it.each([ServerRouter, TestRouter])(
    "reads navigation and CurrentRoute with memory-backed SSR/test providers",
    async (router) => {
      const runtime = ManagedRuntime.make(router({ url: "https://example.com/users/1?tab=info" }));
      const Component = defineComponent({
        setup() {
          const location = useCurrentPath();
          const current = useCurrentRoute();
          const navigation = useNavigation();
          return () =>
            h(
              "p",
              [
                Option.getOrUndefined(location.value.value),
                Option.getOrUndefined(current.value.value)?.route.path,
                Option.getOrUndefined(navigation.value.value)?.canGoBack,
              ].join(":"),
            );
        },
      });
      const app = createSSRApp(Component);
      installRuntime(app, runtime);
      try {
        expect(await renderToString(app)).toBe("<p>/users/1?tab=info:/:false</p>");
      } finally {
        await runtime.dispose();
      }
    },
  );
  it("reads deterministic Effect, Stream, and Fx SSR snapshots without a DOM", async () => {
    const Component = defineComponent({
      setup() {
        const a = useEffect(Effect.succeed("effect"));
        const b = useStream(Stream.fromIterable(["stream", "later"]));
        const c = useFx(Fx.fromIterable(["fx", "later"]));
        return () =>
          h(
            "p",
            [a.value.value, b.value.value, c.value.value].map(Option.getOrUndefined).join(":"),
          );
      },
    });
    const app = createSSRApp(Component);
    installRuntime(app, fromContext(Context.empty()));
    expect(typeof document).toBe("undefined");
    expect(await renderToString(app)).toBe("<p>effect:stream:fx</p>");
  });

  it("borrows ManagedRuntime and allows request-local service overrides", async () => {
    const runtime = ManagedRuntime.make(Layer.succeed(Name, "root"));
    const Child = defineComponent({
      setup() {
        provideServices(Context.make(Name, "child"));
        const name = useService(Name);
        return () => h("b", Option.getOrUndefined(name.value.value));
      },
    });
    const app = createSSRApp(Child);
    installRuntime(app, runtime);
    expect(await renderToString(app)).toBe("<b>child</b>");
    expect(await runtime.runPromise(Name)).toBe("root");
    await runtime.dispose();
  });

  it("keeps typed failures as AsyncData during SSR", async () => {
    const Component = defineComponent({
      setup() {
        const state = useEffect(Effect.fail({ _tag: "Denied", reason: "private" } as const));
        return () => h("p", Option.getOrUndefined(state.error.value)?.reason);
      },
    });
    const app = createSSRApp(Component);
    installRuntime(app, fromContext(Context.empty()));
    expect(await renderToString(app)).toBe("<p>private</p>");
  });

  it("cancels old sources, preserves latest success across failure, and disposes subscriptions", async () => {
    let released = 0;
    const runtime = fromContext(Context.empty());
    const source = shallowRef<Effect.Effect<number, string>>(Effect.succeed(1));
    const scope = effectScope();
    const state = scope.run(() => useEffect(source, { runtime }))!;
    await expect.poll(() => state.data.value).toEqual(AsyncData.success(1));
    source.value = Effect.fail("failed");
    await expect.poll(() => Option.getOrUndefined(state.error.value)).toBe("failed");
    expect(Option.getOrUndefined(state.latest.value)).toBe(1);
    source.value = Effect.acquireUseRelease(
      Effect.void,
      () => Effect.never,
      () =>
        Effect.sync(() => {
          released++;
        }),
    );
    await expect.poll(() => state.refreshing.value).toBe(true);
    scope.stop();
    await expect.poll(() => released).toBe(1);
  });

  it("cancels manually started sources on replacement while automatic execution is disabled", async () => {
    let acquired = 0;
    let released = 0;
    const never = Effect.acquireUseRelease(
      Effect.sync(() => {
        acquired++;
      }),
      () => Effect.never,
      () =>
        Effect.sync(() => {
          released++;
        }),
    );
    const source = shallowRef<Effect.Effect<number>>(never);
    const runtime = shallowRef(fromContext(Context.empty()));
    const scope = effectScope();
    const state = scope.run(() => useEffect(source, { runtime, immediate: false }))!;
    expect(acquired).toBe(0);
    void state.refresh();
    await expect.poll(() => acquired).toBe(1);
    source.value = Effect.succeed(1);
    await expect.poll(() => released).toBe(1);
    expect(state.data.value).toEqual(AsyncData.NoData);
    source.value = never;
    void state.refresh();
    await expect.poll(() => acquired).toBe(2);
    runtime.value = fromContext(Context.empty());
    await expect.poll(() => released).toBe(2);
    expect(acquired).toBe(2);
    scope.stop();
  });
});

describe("Vue route roots", () => {
  it("keeps the inherited mount and global None fallback when no root is selected", async () => {
    const owner = ManagedRuntime.make(TestRouter({ url: "https://example.com/app/users/1" }));
    const runtime = withServices(owner, Context.make(CurrentRoute, { route: Parse("/app") }));
    const scope = effectScope();
    try {
      const state = scope.run(() => useRoute(Parse("/users/:id"), { runtime }))!;
      await expect
        .poll(() => Option.getOrUndefined(Option.flatten(state.value.value))?.id)
        .toBe("1");
      await owner.runPromise(Navigation.navigate("/elsewhere"));
      await expect.poll(() => state.value.value).toEqual(Option.some(Option.none()));
      await owner.runPromise(Navigation.navigate("/app/users/2"));
      await expect
        .poll(() => Option.getOrUndefined(Option.flatten(state.value.value))?.id)
        .toBe("2");
    } finally {
      scope.stop();
      await owner.dispose();
    }
  });

  it("replaces a nested owner and applies the explicit root once, including its local fallback", async () => {
    const owner = ManagedRuntime.make(TestRouter({ url: "https://example.com/app/users/1" }));
    const ambient: CurrentRouteTree = {
      route: Parse("/ignored"),
      parent: { route: Parse("/parent") },
    };
    const runtime = withServices(owner, Context.make(CurrentRoute, ambient));
    const scope = effectScope();
    try {
      const state = scope.run(() =>
        useRoute(Parse("/users/:id"), {
          runtime,
          currentRoute: { route: Parse("/app"), parent: ambient },
        }),
      )!;
      await expect
        .poll(() => Option.getOrUndefined(Option.flatten(state.value.value))?.id)
        .toBe("1");
      await owner.runPromise(Navigation.navigate("/app/missing"));
      await expect.poll(() => state.value.value).toEqual(Option.some(Option.none()));
      await owner.runPromise(Navigation.navigate("/outside"));
      await expect
        .poll(() => Option.getOrUndefined(state.error.value))
        .toMatchObject({ _tag: "RouteNotFound" });
    } finally {
      scope.stop();
      await owner.dispose();
    }
  });

  it.each(["ref", "getter"] as const)(
    "reacts to %s root replacement and releases the previous matcher",
    async (kind) => {
      const owner = ManagedRuntime.make(TestRouter({ url: "https://example.com/app/users/1" }));
      const selected = shallowRef<CurrentRouteTree>({ route: Parse("/app") });
      const scope = effectScope();
      try {
        const state = scope.run(() =>
          useRoute(Parse("/users/:id"), {
            runtime: owner,
            currentRoute: kind === "ref" ? selected : () => selected.value,
          }),
        )!;
        await expect
          .poll(() => Option.getOrUndefined(Option.flatten(state.value.value))?.id)
          .toBe("1");
        selected.value = { route: Parse("/elsewhere") };
        await expect
          .poll(() => Option.getOrUndefined(state.error.value))
          .toMatchObject({ _tag: "RouteNotFound" });
        selected.value = { route: Parse("/app") };
        await expect
          .poll(() => Option.getOrUndefined(Option.flatten(state.value.value))?.id)
          .toBe("1");
        await owner.runPromise(Navigation.navigate("/app/users/2"));
        await expect
          .poll(() => Option.getOrUndefined(Option.flatten(state.value.value))?.id)
          .toBe("2");
      } finally {
        scope.stop();
        await owner.dispose();
      }
    },
  );
});
