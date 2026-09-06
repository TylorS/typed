import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import { Navigation } from "@typed/navigation";
import { CurrentRoute } from "../CurrentRoute.js";
import { runWithBrowserRouter } from "../test-utils/matcherBrowserHarness.js";

describe("typed/router/Router (browser)", () => {
  it("constructs BrowserRouter with an absolute document base URL", async () => {
    const base = document.createElement("base");
    base.href = "/app/";
    document.head.prepend(base);

    try {
      const result = await runWithBrowserRouter(
        Effect.all({
          base: Navigation.base,
          route: CurrentRoute.useSync((current) => current.route.path),
        }),
      );

      assert.deepStrictEqual(result, {
        base: "/app/",
        route: "/app",
      });
    } finally {
      base.remove();
    }
  });
});
