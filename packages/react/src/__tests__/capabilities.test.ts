import { createElement } from "react";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { Context, Effect, Layer, ManagedRuntime } from "effect";
import * as Data from "@typed/async-data";
import { describe, expect, it } from "vitest";
import { Provider, useService, useRuntime, fromContext, serviceContext } from "../Runtime.js";
import { useEffect } from "../Hooks.js";

class Greeting extends Context.Service<Greeting, { readonly text: string }>()(
  "test/ReactGreeting",
) {}

describe("React capabilities on the server", () => {
  it("renders deterministic initial data without running Effect producers", () => {
    let executions = 0;
    const source = Effect.sync(() => ++executions);
    function App() {
      const state = useEffect(source, { initial: Data.success(42) });
      return createElement("p", null, state.data._tag === "Success" ? state.data.value : "pending");
    }
    expect(renderToString(createElement(App))).toBe("<p>42</p>");
    expect(executions).toBe(0);
  });

  it("preserves nested service types and overrides through captured Context", () => {
    const GreetingContext = serviceContext(Greeting);
    const Seen = () => createElement("p", null, GreetingContext.use().text);
    const tree = createElement(
      Provider<never, never, Greeting>,
      { context: Context.make(Greeting, { text: "outer" }) },
      createElement(Seen),
      createElement(GreetingContext.Provider, { value: { text: "inner" } }, createElement(Seen)),
      createElement(Seen),
    );
    expect(renderToStaticMarkup(tree)).toBe("<p>outer</p><p>inner</p><p>outer</p>");
  });

  it("uses prepared ManagedRuntime services for server rendering without disposing borrowed runtime", async () => {
    const runtime = ManagedRuntime.make(Layer.succeed(Greeting, { text: "prepared" }));
    await runtime.context();
    const App = () => createElement("p", null, useService(Greeting).text);
    expect(
      renderToStaticMarkup(createElement(Provider<Greeting>, { runtime }, createElement(App))),
    ).toBe("<p>prepared</p>");
    expect(await runtime.runPromise(Greeting)).toEqual({ text: "prepared" });
    await runtime.dispose();
  });

  it("does not acquire owned Layers during SSR", () => {
    let acquired = 0;
    const layer = Layer.effect(
      Greeting,
      Effect.sync(() => {
        acquired++;
        return { text: "live" };
      }),
    );
    const App = () => createElement("p", null, useService(Greeting).text);
    expect(
      renderToString(
        createElement(Provider<Greeting>, { layer, fallback: "loading" }, createElement(App)),
      ),
    ).toBe("loading");
    expect(acquired).toBe(0);
  });

  it("executes with captured service context and preserves explicit runtime override", async () => {
    const contextRuntime = fromContext(Context.make(Greeting, { text: "context" }));
    expect(await contextRuntime.runPromise(Greeting)).toEqual({ text: "context" });
    const App = () =>
      createElement(
        "p",
        null,
        useRuntime(contextRuntime).cachedContext === contextRuntime.cachedContext
          ? "explicit"
          : "wrong",
      );
    expect(renderToString(createElement(App))).toBe("<p>explicit</p>");
  });
});

import { Fx } from "@typed/fx";
import { Cause, Option, Stream } from "effect";
import { prefetch } from "../Hooks.js";
import * as Router from "@typed/router";
import { TestRouter } from "@typed/router/RouterTest";
import { renderToHtmlString } from "./native.js";
import { routeComponent, useCurrentRoute, useNavigation } from "../Router.js";

describe("React request-local prefetch and routing", () => {
  it.each([
    { name: "Some", value: Option.some(1) },
    { name: "None", value: Option.none() },
    { name: "undefined", value: undefined },
    { name: "null", value: null },
    { name: "array", value: [1, undefined, Option.some(2)] },
    {
      name: "callback props",
      value: { onClick: () => {}, child: createElement("b", null, "child") },
    },
  ])("prefetches $name without interpreting the value as a template", async ({ value }) => {
    for (const source of [Effect.succeed(value), Stream.succeed(value), Fx.succeed(value)]) {
      const result = await Effect.runPromise(prefetch(source));

      expect(Data.isSuccess(result)).toBe(true);
      if (Data.isSuccess(result)) expect(result.value).toBe(value);
    }
  });

  it("prefetches serviceful Effects, empty streams and source failures without throwing", async () => {
    const runtime = fromContext(Context.make(Greeting, { text: "server" }));
    expect(await runtime.runPromise(prefetch(Effect.map(Greeting, ({ text }) => text)))).toEqual(
      Data.success("server"),
    );
    expect(await Effect.runPromise(prefetch(Stream.empty))).toEqual(Data.NoData);
    const failed = await Effect.runPromise(prefetch(Fx.fail("offline")));
    expect(Data.getError(failed)).toEqual(Option.some("offline"));
  });

  it("renders route params and route-local Effect services with the server interpreter", async () => {
    const Profile = ({ id }: { id: string }) =>
      createElement(
        "p",
        null,
        `${id}:${useCurrentRoute().route.path}:${useNavigation().base}:${useService(Greeting).text}`,
      );
    const matcher = Router.match(Router.Parse("/users/:id"), {
      dependencies: [
        Layer.succeed(Greeting, { text: "route-owned" }),
        Router.CurrentRoute.extend(Router.Parse("/users/:id")),
      ],
      handler: routeComponent(Profile, { id: "profile" }),
    });
    const output = await Effect.runPromise(
      Effect.scoped(renderToHtmlString(matcher)).pipe(
        Effect.provide(TestRouter({ url: "https://example.com/users/alice" })),
      ),
    );
    expect(output).toContain("alice:/users/:id:/:route-owned");
  });
});

import { AsyncData } from "../AsyncData.js";

describe("React AsyncData rendering", () => {
  it("renders pending, refreshing, optimistic and failure states without dropping the cause", () => {
    const render = (data: Data.AsyncData<number, string>) =>
      renderToString(
        createElement(AsyncData<number, string>, {
          data,
          loading: "loading",
          noData: "empty",
          children: (value, state) => `${value}:${state.refreshing}`,
          failure: (cause) => Cause.pretty(cause),
        }),
      );
    expect(render(Data.NoData)).toBe("empty");
    expect(render(Data.loading())).toBe("loading");
    expect(render(Data.startLoading(Data.success(3)))).toBe("3:true");
    expect(render(Data.optimistic(Data.success(3), 4))).toBe("4:false");
    expect(render(Data.failure(Cause.fail("offline")))).toContain("offline");
  });
});
