import { NodeHttpServer } from "@effect/platform-node";
import { assert, describe, it } from "vitest";
import { Effect, Layer } from "effect";
import type { Scope } from "effect/Scope";
import { Fx } from "@typed/fx";
import { IdsTest } from "@typed/id/IdsTest";
import { Navigation, type Navigation as NavigationService } from "@typed/navigation";
import { CurrentRoute } from "@typed/router/CurrentRoute";
import * as Matcher from "@typed/router/Matcher";
import * as Route from "@typed/router/Route";
import {
  html,
  StaticHtmlRenderTemplate,
  type RenderEvent,
  type RenderTemplate,
} from "@typed/template";
import { handleHttpServerError, ssrForHttp, streamingSsrForHttp } from "../HttpRouter.js";
import { HttpClient, HttpRouter as EffectHttpRouter } from "effect/unstable/http";
import * as HttpServerError from "effect/unstable/http/HttpServerError";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import type { Matcher as RouterMatcher } from "@typed/router";

const testServer = Layer.mergeAll(IdsTest(), NodeHttpServer.layerTest);

function bufferedSsrLive(
  matcher: RouterMatcher<RenderEvent, never, RenderTemplate | Scope>,
  options?: { withIds?: boolean },
) {
  const serverLayer = options?.withIds === false ? NodeHttpServer.layerTest : testServer;
  return EffectHttpRouter.use(ssrForHttp(matcher)).pipe(
    Layer.provide(StaticHtmlRenderTemplate),
    EffectHttpRouter.serve,
    Layer.provideMerge(serverLayer),
  );
}

function bufferedSsrLiveWithNavigation(
  matcher: RouterMatcher<RenderEvent, never, RenderTemplate | Scope | NavigationService>,
) {
  return EffectHttpRouter.use(ssrForHttp(matcher)).pipe(
    Layer.provide(StaticHtmlRenderTemplate),
    EffectHttpRouter.serve,
    Layer.provideMerge(testServer),
  );
}

function bufferedSsrLiveWithRoute(
  matcher: RouterMatcher<RenderEvent, never, RenderTemplate | Scope | CurrentRoute>,
) {
  return EffectHttpRouter.use(ssrForHttp(matcher)).pipe(
    Layer.provide(StaticHtmlRenderTemplate),
    EffectHttpRouter.serve,
    Layer.provideMerge(testServer),
  );
}

function streamingSsrLive(matcher: RouterMatcher<RenderEvent, never, RenderTemplate | Scope>) {
  return EffectHttpRouter.use(streamingSsrForHttp(matcher)).pipe(
    Layer.provide(StaticHtmlRenderTemplate),
    EffectHttpRouter.serve,
    Layer.provideMerge(testServer),
  );
}

describe("typed/ui/HttpRouter", () => {
  it("renders simple html template", () => {
    const matcher = Matcher.empty.match(Route.Parse("home"), html` <div>Hello, world!</div> `);
    const Live = bufferedSsrLive(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/home").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(response, "<div>Hello, world!</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("renders html template with route params", () => {
    const users = Route.Join(Route.Parse("users"), Route.Param("id"));
    const matcher = Matcher.empty.match(
      users,
      (params) => html`<div>User ${params.pipe(Fx.map((p) => p.id))}</div>`,
    );
    const Live = bufferedSsrLive(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/users/123").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(response, "<div>User 123</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("keeps path params authoritative when query keys collide", () => {
    const route = Route.Join(Route.Parse("users"), Route.Param("id"));
    const matcher = Matcher.empty.match(
      route,
      (params) => html`<div>${params.pipe(Fx.map(({ id }) => id))}</div>`,
    );
    const Live = bufferedSsrLive(matcher);

    return Effect.gen(function* () {
      const body = yield* HttpClient.get("/users/path-value?id=query-value").pipe(
        Effect.flatMap((response) => response.text),
      );
      assert.strictEqual(body, "<div>path-value</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("decodes authoritative path params when query keys collide", () => {
    const route = Route.Join(Route.Parse("users"), Route.Int("id"));
    const matcher = Matcher.empty.match(
      route,
      (params) => html`<div>${params.pipe(Fx.map(({ id }) => id))}</div>`,
    );
    const Live = bufferedSsrLive(matcher);

    return Effect.gen(function* () {
      const body = yield* HttpClient.get("/users/123?id=999").pipe(
        Effect.flatMap((response) => response.text),
      );
      assert.strictEqual(body, "<div>123</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("renders html template with search params", () => {
    const route = Route.Parse("search");
    const matcher = Matcher.empty.match(route, html` <div>Search results</div> `);
    const Live = bufferedSsrLive(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/search?q=test").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(response, "<div>Search results</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("renders declared query parameters from a pathname-only registration", () => {
    const route = Route.Parse("/search?q=:term&mode=all");
    const matcher = Matcher.empty.match(
      route,
      (params) => html`<div>${params.pipe(Fx.map(({ term }) => term))}</div>`,
    );
    const Live = bufferedSsrLive(matcher);

    return Effect.gen(function* () {
      const body = yield* HttpClient.get("/search?q=typed&mode=all").pipe(
        Effect.flatMap((response) => response.text),
      );
      assert.strictEqual(body, "<div>typed</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("handles multiple routes", () => {
    const home = Route.Parse("home");
    const about = Route.Parse("about");
    const matcher = Matcher.empty
      .match(home, html` <div>Home</div> `)
      .match(about, html` <div>About</div> `);
    const Live = bufferedSsrLive(matcher);
    return Effect.gen(function* () {
      const homeResponse = yield* HttpClient.get("/home").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(homeResponse, "<div>Home</div>");
      const aboutResponse = yield* HttpClient.get("/about").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(aboutResponse, "<div>About</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("falls through guarded alternatives registered for the same path", () => {
    const route = Route.Parse("guarded");
    const matcher = Matcher.empty
      .match(
        route,
        Effect.fn(() => Effect.succeedNone),
        html`<p>first</p>`,
      )
      .match(
        route,
        Effect.fn(() => Effect.succeedSome("allowed")),
        html`<p>second</p>`,
      );
    const Live = bufferedSsrLive(matcher);

    return Effect.gen(function* () {
      const body = yield* HttpClient.get("/guarded").pipe(
        Effect.flatMap((response) => response.text),
      );
      assert.strictEqual(body, "<p>second</p>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("maps exhausted guards to Effect's route-not-found response", () => {
    const matcher = Matcher.empty.match(
      Route.Parse("guarded"),
      Effect.fn(() => Effect.succeedNone),
      html`<p>unreachable</p>`,
    );
    const Live = EffectHttpRouter.use(
      Effect.fn(function* (router) {
        yield* ssrForHttp(router, matcher);
        yield* handleHttpServerError(router);
      }),
    ).pipe(
      Layer.provide(StaticHtmlRenderTemplate),
      EffectHttpRouter.serve,
      Layer.provideMerge(testServer),
    );

    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/guarded");
      assert.strictEqual(response.status, 404);
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("maps route Schema failures to Effect's request-parse response", () => {
    const matcher = Matcher.empty.match(Route.Int("id"), html`<p>integer</p>`);
    const Live = EffectHttpRouter.use(
      Effect.fn(function* (router) {
        yield* ssrForHttp(router, matcher);
        yield* handleHttpServerError(router);
      }),
    ).pipe(
      Layer.provide(StaticHtmlRenderTemplate),
      EffectHttpRouter.serve,
      Layer.provideMerge(testServer),
    );

    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/not-an-integer");
      assert.strictEqual(response.status, 400);
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("returns 404 for unmatched routes", () => {
    const matcher = Matcher.empty.match(Route.Parse("home"), html` <div>Home</div> `);
    const Live = EffectHttpRouter.use(
      Effect.fn(function* (router) {
        yield* ssrForHttp(router, matcher);
        yield* handleHttpServerError(router);
      }),
    ).pipe(
      Layer.provide(StaticHtmlRenderTemplate),
      EffectHttpRouter.serve,
      Layer.provideMerge(testServer),
    );
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/notfound");
      assert.strictEqual(response.status, 404);
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  for (const [reason, expectedStatus] of [
    ["RequestParseError", 400],
    ["RouteNotFound", 404],
    ["InternalError", 500],
    ["ResponseError", 500],
  ] as const) {
    it(`does not expose ${reason} details`, () => {
      const Live = EffectHttpRouter.use(
        Effect.fn(function* (router) {
          yield* router.add(
            "GET",
            "/error",
            Effect.gen(function* () {
              const request = yield* HttpServerRequest.HttpServerRequest;
              const errorReason = (() => {
                switch (reason) {
                  case "RequestParseError":
                    return new HttpServerError.RequestParseError({
                      request,
                      description: "db-password=secret",
                    });
                  case "RouteNotFound":
                    return new HttpServerError.RouteNotFound({
                      request,
                      description: "db-password=secret",
                    });
                  case "InternalError":
                    return new HttpServerError.InternalError({
                      request,
                      description: "db-password=secret",
                    });
                  case "ResponseError":
                    return new HttpServerError.ResponseError({
                      request,
                      response: HttpServerResponse.text("private upstream response"),
                      description: "db-password=secret",
                    });
                }
              })();
              return yield* new HttpServerError.HttpServerError({ reason: errorReason });
            }),
          );
          yield* handleHttpServerError(router);
        }),
      ).pipe(
        EffectHttpRouter.serve,
        Layer.provideMerge(Layer.mergeAll(IdsTest(), NodeHttpServer.layerTest)),
      );

      return Effect.gen(function* () {
        const response = yield* HttpClient.get("/error");
        const body = yield* response.text;

        assert.strictEqual(response.status, expectedStatus);
        assert.strictEqual(body, "");
        assert.ok(!body.includes("db-password=secret"));
      }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
    });
  }

  it("renders dynamic content from Effect", () => {
    const matcher = Matcher.empty.match(
      Route.Parse("dynamic"),
      html`<div>Value: ${Effect.succeed("42")}</div>`,
    );
    const Live = bufferedSsrLive(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/dynamic").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(response, "<div>Value: 42</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("renders an HTTP request without requiring an external Ids layer", () => {
    const matcher = Matcher.empty.match(Route.Slash, html`<main>ready</main>`);
    const Live = bufferedSsrLive(matcher, { withIds: false });

    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/");
      assert.strictEqual(response.status, 200);
      assert.strictEqual(yield* response.text, "<main>ready</main>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("keeps render failures visible to global middleware", () => {
    const failure = { _tag: "RenderFailure", message: "render failed" } as const;
    const matcher = Matcher.empty.match(
      Route.Parse("failure"),
      html`<main>${Effect.fail(failure)}</main>`,
    );
    const Live = EffectHttpRouter.use(
      Effect.fn(function* (router) {
        yield* ssrForHttp(router, matcher);
        yield* router.addGlobalMiddleware(
          Effect.catch((error: unknown) =>
            error === failure
              ? Effect.succeed(HttpServerResponse.text("handled", { status: 503 }))
              : Effect.fail(error),
          ),
        );
      }),
    ).pipe(
      Layer.provide(StaticHtmlRenderTemplate),
      EffectHttpRouter.serve,
      Layer.provideMerge(testServer),
    );

    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/failure");
      assert.strictEqual(response.status, 503);
      assert.strictEqual(yield* response.text, "handled");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  for (const [mode, makeLive] of [
    ["buffered", bufferedSsrLive],
    ["streaming", streamingSsrLive],
  ] as const) {
    it(`sets correct content-type header for ${mode} responses`, () => {
      const matcher = Matcher.empty.match(Route.Parse("home"), html` <div>Hello</div> `);
      const Live = makeLive(matcher);
      return Effect.gen(function* () {
        const response = yield* HttpClient.get("/home");
        assert.strictEqual(response.headers["content-type"], "text/html; charset=utf-8");
      }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
    });
  }

  it("streams html with the same body as buffered rendering", () => {
    const matcher = Matcher.empty.match(Route.Parse("home"), html` <div>Hello, stream!</div> `);
    const Live = streamingSsrLive(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/home").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(response, "<div>Hello, stream!</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("streams route params with the same body as buffered rendering", () => {
    const users = Route.Join(Route.Parse("users"), Route.Param("id"));
    const matcher = Matcher.empty.match(
      users,
      (params) => html`<div>User ${params.pipe(Fx.map((p) => p.id))}</div>`,
    );
    const Live = streamingSsrLive(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/users/789").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(response, "<div>User 789</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("returns 404 for unmatched streaming routes", () => {
    const matcher = Matcher.empty.match(Route.Parse("home"), html` <div>Home</div> `);
    const Live = EffectHttpRouter.use(
      Effect.fn(function* (router) {
        yield* streamingSsrForHttp(router, matcher);
        yield* handleHttpServerError(router);
      }),
    ).pipe(
      Layer.provide(StaticHtmlRenderTemplate),
      EffectHttpRouter.serve,
      Layer.provideMerge(testServer),
    );

    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/notfound");
      assert.strictEqual(response.status, 404);
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("handles nested routes", () => {
    const users = Route.Join(Route.Parse("api"), Route.Parse("users"));
    const user = Route.Join(users, Route.Param("id"));
    const matcher = Matcher.empty
      .match(users, html` <div>Users list</div> `)
      .match(user, (params) => html`<div>User ${params.pipe(Fx.map((p) => p.id))}</div>`);
    const Live = bufferedSsrLive(matcher);
    return Effect.gen(function* () {
      const listResponse = yield* HttpClient.get("/api/users").pipe(Effect.flatMap((r) => r.text));
      assert.strictEqual(listResponse, "<div>Users list</div>");
      const userResponse = yield* HttpClient.get("/api/users/456").pipe(
        Effect.flatMap((r) => r.text),
      );
      assert.strictEqual(userResponse, "<div>User 456</div>");
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("derives Navigation origin and current URL from the current HTTP request", () => {
    const matcher = Matcher.empty.match(
      Route.Parse("test"),
      Fx.gen(function* () {
        const origin = yield* Navigation.origin;
        const base = yield* Navigation.base;
        const currentEntry = yield* Navigation.currentEntry;
        return html`<div
          data-origin="${origin}"
          data-base="${base}"
          data-url="${currentEntry.url.href}"
        ></div>`;
      }),
    );
    const Live = bufferedSsrLiveWithNavigation(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/test", {
        headers: {
          "x-forwarded-proto": "https",
        },
      }).pipe(Effect.flatMap((r) => r.text));
      const origin = response.match(/data-origin="([^"]+)"/)?.[1];
      const url = response.match(/data-url="([^"]+)"/)?.[1];

      assert.match(origin ?? "", /^https:\/\/127\.0\.0\.1:\d+$/);
      assert.ok(response.includes('data-base="/"'), response);
      assert.strictEqual(url, `${origin}/test`);
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("provides CurrentRoute with correct route path", () => {
    const matcher = Matcher.empty.match(
      Route.Parse("users"),
      Fx.gen(function* () {
        const currentRoute = yield* CurrentRoute;
        return html`<div data-path="${currentRoute.route.path}"></div>`;
      }),
    );
    const Live = bufferedSsrLiveWithRoute(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/users").pipe(Effect.flatMap((r) => r.text));
      assert.ok(response.includes('data-path="/users"'));
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("provides CurrentRoute with no parent for root routes", () => {
    const matcher = Matcher.empty.match(
      Route.Parse("home"),
      Fx.gen(function* () {
        const currentRoute = yield* CurrentRoute;
        const hasParent = currentRoute.parent !== undefined;
        return html`<div data-has-parent="${hasParent}"></div>`;
      }),
    );
    const Live = bufferedSsrLiveWithRoute(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/home").pipe(Effect.flatMap((r) => r.text));
      assert.ok(response.includes('data-has-parent="false"'));
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("provides CurrentRoute with parent for nested routes", () => {
    const api = Route.Parse("api");
    const users = Route.Parse("users");
    const matcher = Matcher.empty.match(Route.Slash, html` <div>API</div> `).match(
      users,
      Fx.gen(function* () {
        const currentRoute = yield* CurrentRoute;
        const hasParent = currentRoute.parent !== undefined;
        const parentPath = currentRoute.parent?.route.path ?? "none";
        return html`<div data-has-parent="${hasParent}" data-parent-path="${parentPath}"></div>`;
      }),
    );
    const Live = bufferedSsrLiveWithRoute(matcher).pipe(Layer.provide(CurrentRoute.extend(api)));
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/api/users").pipe(Effect.flatMap((r) => r.text));
      assert.ok(response.includes('data-has-parent="true"'));
      assert.ok(response.includes('data-parent-path="/api"'));
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });

  it("provides Navigation with correct currentEntry for different paths", () => {
    const matcher = Matcher.empty.match(
      Route.Parse("about"),
      Fx.gen(function* () {
        const currentEntry = yield* Navigation.currentEntry;
        return html`<div data-pathname="${currentEntry.url.pathname}"></div>`;
      }),
    );
    const Live = bufferedSsrLiveWithNavigation(matcher);
    return Effect.gen(function* () {
      const response = yield* HttpClient.get("/about").pipe(Effect.flatMap((r) => r.text));
      assert.ok(response.includes('data-pathname="/about"'));
    }).pipe(Effect.provide(Live), Effect.scoped, Effect.runPromise);
  });
});
