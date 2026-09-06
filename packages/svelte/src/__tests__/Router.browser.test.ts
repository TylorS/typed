import { describe, expect, it } from "vitest";
import { Navigation } from "@typed/navigation/Navigation";
import { TestRouter } from "@typed/router/RouterTest";
import * as Route from "@typed/router/Route";
import type { CurrentRouteTree } from "@typed/router/CurrentRoute";
import { ManagedRuntime } from "effect";
import { mount, unmount } from "svelte";
import { writable } from "svelte/store";
import RouteContext from "./fixtures/RouteContext.svelte";

const text = (root: HTMLElement, selector: string) => root.querySelector(selector)?.textContent;

describe("explicit Svelte route context", () => {
  it("prefixes once when the explicit root equals the ambient mount", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const runtime = ManagedRuntime.make(TestRouter({ url: "https://example.test/app/users/1" }));
    const instance = mount(RouteContext, {
      target: root,
      props: { runtime, currentRoute: { route: Route.Parse("/app") } },
    });
    try {
      await expect.poll(() => text(root, "[data-value]")).toBe("1");
      await runtime.runPromise(Navigation.navigate("/app/unknown"));
      await expect.poll(() => text(root, "[data-value]")).toBe("none");
      expect(text(root, "[data-state]")).toBe("Success");
    } finally {
      await unmount(instance);
      await runtime.dispose();
      root.remove();
    }
  });

  it("replaces the ambient root, confines its wildcard, and follows a root store", async () => {
    const root = document.createElement("div");
    document.body.append(root);
    const runtime = ManagedRuntime.make(TestRouter({ url: "https://example.test/custom/users/1" }));
    const currentRoute = writable<CurrentRouteTree>({ route: Route.Parse("/custom") });
    const instance = mount(RouteContext, { target: root, props: { runtime, currentRoute } });
    try {
      await expect.poll(() => text(root, "[data-value]")).toBe("1");
      await runtime.runPromise(Navigation.navigate("/custom/unknown"));
      await expect.poll(() => text(root, "[data-value]")).toBe("none");
      expect(text(root, "[data-state]")).toBe("Success");
      await runtime.runPromise(Navigation.navigate("/app/users/9"));
      await expect.poll(() => text(root, "[data-error]")).toBe("RouteNotFound");
      expect(text(root, "[data-state]")).toBe("Failure");
      currentRoute.set({ route: Route.Parse("/app") });
      await expect.poll(() => text(root, "[data-value]")).toBe("9");
      await runtime.runPromise(Navigation.navigate("/app/users/10"));
      await expect.poll(() => text(root, "[data-value]")).toBe("10");
    } finally {
      await unmount(instance);
      await runtime.dispose();
      root.remove();
    }
  });
});
