import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { Navigation } from "@typed/navigation";
import * as Matcher from "../Matcher.js";
import * as Route from "../Route.js";
import { absoluteUrl, runWithBrowserRouter } from "../test-utils/matcherBrowserHarness.js";

describe("typed/router/Matcher (browser)", () => {
  it("matches routes under BrowserRouter (fromWindow integration smoke)", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        yield* Navigation.navigate(absoluteUrl("/about"));
        const fx = Matcher.empty.match(Route.Parse("about"), "about-page");
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["about-page"]);
      }),
    ));

  it("decodes percent-encoded path params through browser URL resolution", () =>
    runWithBrowserRouter(
      Effect.gen(function* () {
        const route = Route.Join(Route.Parse("tag"), Route.Param("label"));
        yield* Navigation.navigate(absoluteUrl("/tag/hello%20world"));
        const fx = Matcher.empty.match(route, (params) => Fx.map(params, ({ label }) => label));
        const values = yield* Fx.collectAll(Fx.take(fx, 1));
        assert.deepStrictEqual(values, ["hello world"]);
      }),
    ));
});
