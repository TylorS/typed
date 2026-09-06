import { assert, describe, expectTypeOf, it } from "vitest";
import { Context, Data, Effect, Scope } from "effect";
import { Fx } from "@typed/fx";
import { Navigation } from "@typed/navigation";
import * as Router from "../index.js";

class LookupFailed extends Data.TaggedError("LookupFailed")<{}> {}
class Catalog extends Context.Service<Catalog, {
  readonly title: (id: number) => Effect.Effect<string, LookupFailed>;
}>()("test/RouterErgonomics/Catalog") {}

describe("Router namespace and fluent application composition", () => {
  it("preserves decoded parameters, output, errors, and remaining services through fluent methods", () => {
    const Issue = Router.Join(Router.Parse("/issues"), Router.Int("issueId"));
    const pages = Router.match(Issue, (params) => Fx.mapEffect(params, ({ issueId }) => {
      expectTypeOf(issueId).toEqualTypeOf<number>();
      return Effect.flatMap(Catalog, (catalog) => catalog.title(issueId));
    }));
    const redirected = pages.redirectTo("/not-found");
    expectTypeOf<Fx.Fx.Success<typeof redirected>>().toEqualTypeOf<string>();
    expectTypeOf<Fx.Fx.Error<typeof redirected>>().toEqualTypeOf<
      LookupFailed | Router.RouteDecodeError | Router.RouteGuardError
    >();
    expectTypeOf<Fx.Fx.Services<typeof redirected>>().toEqualTypeOf<
      Catalog | Router.Router | Scope.Scope
    >();

    const application = pages
      .provideService(Catalog, { title: (id) => Effect.succeed(`Issue ${id}`) })
      .catchTag("LookupFailed", () => Fx.succeed("Unavailable"))
      .merge(Router.match(Router.Parse("/not-found"), "Not found"))
      .redirectTo("/not-found");
    expectTypeOf<Fx.Fx.Services<typeof application>>().toEqualTypeOf<Router.Router | Scope.Scope>();
    expectTypeOf<Fx.Fx.Error<typeof application>>().toEqualTypeOf<
      Router.RouteDecodeError | Router.RouteGuardError
    >();
  });

  it("redirects only unmatched locations and retains the bound terminal method", () =>
    Effect.gen(function* () {
      const pages = Router.match(Router.Slash, "queue")
        .match(Router.Parse("/issues/:issueId"), "issue");
      const redirect = pages.redirectTo;
      const values = yield* Fx.collectAll(Fx.take(redirect("/"), 1));
      assert.deepStrictEqual(values, ["queue"]);
      assert.strictEqual((yield* Navigation.currentEntry).url.pathname, "/");
    }).pipe(
      Effect.provide(Router.ServerRouter({ url: "https://test.local/missing" })),
      Effect.scoped,
      Effect.runPromise,
    ));

  it("leaves matched handler failures and the committed URL intact", () =>
    Effect.gen(function* () {
      const pages = Router.match(Router.Parse("/issues/42"), Fx.fail(new LookupFailed()))
        .redirectTo("/");
      const failed = yield* Fx.collectAll(Fx.take(pages, 1)).pipe(
        Effect.as(false),
        Effect.catchTag("LookupFailed", () => Effect.succeed(true)),
      );
      assert.isTrue(failed);
      assert.strictEqual((yield* Navigation.currentEntry).url.pathname, "/issues/42");
    }).pipe(
      Effect.provide(Router.ServerRouter({ url: "https://test.local/issues/42" })),
      Effect.scoped,
      Effect.runPromise,
    ));
});
