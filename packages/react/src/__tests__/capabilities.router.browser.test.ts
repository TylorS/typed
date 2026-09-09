import { RandomValues } from "@typed/id/RandomValues";
import { act, createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Cause, Layer, ManagedRuntime, Option } from "effect";
import * as Router from "@typed/router";
import { TestRouter } from "@typed/router/RouterTest";
import { Navigation } from "@typed/navigation/Navigation";
import type { NavigationError } from "@typed/navigation/model";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Typed } from "../Typed.browser.js";
import {
  CurrentRouteProvider,
  routeComponent,
  useCurrentRoute,
  useLocation,
  useNavigation,
  useRoute,
  useCurrentPath,
} from "../Router.js";
import { useAction } from "../Hooks.js";
import { Provider } from "../Runtime.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let host: HTMLDivElement;
afterEach(async () => {
  if (root) await act(() => root?.unmount());
  root = undefined;
  host?.remove();
});

describe("React routing with Typed", () => {
  it("retains React route identity on parameter updates and shares real Navigation events", async () => {
    let mounts = 0;
    function Profile({ id }: { id: string }) {
      const [identity] = useState(() => ++mounts);
      const route = useCurrentRoute();
      const navigation = useNavigation();
      const location = useLocation();
      const navigate = useAction(navigation.navigate);
      return createElement(
        "button",
        {
          onClick: () => {
            void navigate.run("/users/bob");
          },
        },
        `${identity}:${id}:${route.route.path}:${Option.map(location.value, (entry) => entry.url.pathname).pipe(Option.getOrElse(() => "pending"))}`,
      );
    }
    const matcher = Router.match(
      Router.Parse("/users/:id"),
      routeComponent(Profile, { id: "profile" }),
    );
    const runtime = ManagedRuntime.make(
      Layer.merge(TestRouter({ url: "https://example.com/users/alice" }), RandomValues.Default),
    );
    const errors: unknown[] = [];
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    try {
      await act(() =>
        root!.render(
          createElement(Typed<typeof matcher, NavigationError | Cause.IllegalArgumentError>, {
            value: matcher,
            runtime,
            onError: (error) => {
              errors.push(error);
            },
          }),
        ),
      );
      await vi.waitFor(async () => {
        await act(async () => {});
        expect(host.textContent).toBe("1:alice:/:/users/alice");
      });
      const button = host.querySelector("button")!;
      await act(() => button.click());
      await vi.waitFor(async () => {
        await act(async () => {});
        expect(host.textContent).toBe("1:bob:/:/users/bob");
      });
      expect(host.querySelector("button")).toBe(button);
      expect((await runtime.runPromise(Navigation.currentEntry)).url.pathname).toBe("/users/bob");
      expect(errors).toEqual([]);
    } finally {
      await act(() => root!.unmount());
      root = undefined;
      await runtime.dispose();
    }
  });
  it("matches decoded params across leaving and reentering an explicitly provided mount", async () => {
    const runtime = ManagedRuntime.make(
      TestRouter({ url: "https://example.com/app/users/alice?tab=one" }),
    );
    const context = await runtime.context();
    const route = Router.Parse("/users/:id");
    const mountRoute = Router.Parse("/app");
    function App() {
      const params = useRoute(route);
      const path = useCurrentPath();
      const owner = useCurrentRoute();
      return createElement(
        "p",
        null,
        `${params.value.pipe(
          Option.flatMap((value) => value),
          Option.map((value) => value.id),
          Option.getOrElse(() => "none"),
        )}:${path.value.pipe(Option.getOrElse(() => "pending"))}:${owner.route.path}:${owner.parent?.route.path}`,
      );
    }
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    try {
      await act(() =>
        root!.render(
          createElement(
            Provider<never, never, Router.Router>,
            { context },
            createElement(CurrentRouteProvider, { route: mountRoute }, createElement(App)),
          ),
        ),
      );
      await act(() =>
        vi.waitFor(() => expect(host.textContent).toBe("alice:/app/users/alice?tab=one:/app:/")),
      );
      await act(() => runtime.runPromise(Navigation.navigate("/outside")));
      await act(() => vi.waitFor(() => expect(host.textContent).toBe("none:/outside:/app:/")));
      await act(() => runtime.runPromise(Navigation.navigate("/app/users/bob")));
      await act(() => vi.waitFor(() => expect(host.textContent).toBe("bob:/app/users/bob:/app:/")));
    } finally {
      await act(() => root!.unmount());
      root = undefined;
      await runtime.dispose();
    }
  });
  it("replaces the ambient mount once and updates when currentRoute changes", async () => {
    const runtime = ManagedRuntime.make(
      TestRouter({ url: "https://example.com/explicit/users/alice" }),
    );
    const context = await runtime.context();
    const route = Router.Parse("/users/:id");
    const ambient = Router.Parse("/ambient");
    const explicit = { route: Router.Parse("/explicit"), parent: { route: Router.Slash } };
    const changed = { route: Router.Parse("/changed") };
    function App({ currentRoute }: { currentRoute: typeof explicit | typeof changed }) {
      const params = useRoute(route, { currentRoute });
      return createElement(
        "p",
        null,
        params.error.pipe(
          Option.map((error) => error._tag),
          Option.getOrElse(() =>
            params.value.pipe(
              Option.flatMap((value) => value),
              Option.map((value) => value.id),
              Option.getOrElse(() => "none"),
            ),
          ),
        ),
      );
    }
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    const tree = (currentRoute: typeof explicit | typeof changed) =>
      createElement(
        Provider<never, never, Router.Router>,
        { context },
        createElement(
          CurrentRouteProvider,
          { route: ambient },
          createElement(App, { currentRoute }),
        ),
      );
    try {
      await act(() => root!.render(tree(explicit)));
      await act(() => vi.waitFor(() => expect(host.textContent).toBe("alice")));
      await act(() => runtime.runPromise(Navigation.navigate("/explicit/other")));
      await act(() => vi.waitFor(() => expect(host.textContent).toBe("none")));
      await act(() => runtime.runPromise(Navigation.navigate("/outside")));
      await act(() => vi.waitFor(() => expect(host.textContent).toBe("RouteNotFound")));
      await act(() => runtime.runPromise(Navigation.navigate("/changed/users/bob")));
      await act(() => root!.render(tree(changed)));
      await act(() => vi.waitFor(() => expect(host.textContent).toBe("bob")));
    } finally {
      await act(() => root!.unmount());
      root = undefined;
      await runtime.dispose();
    }
  });
});
